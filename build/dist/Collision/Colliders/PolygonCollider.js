import { BoundingBox } from '../BoundingBox';
import { EdgeCollider } from './EdgeCollider';
import { CollisionJumpTable } from './CollisionJumpTable';
import { CircleCollider } from './CircleCollider';
import { Projection } from '../../Math/projection';
import { LineSegment } from '../../Math/line-segment';
import { Vector } from '../../Math/vector';
import { AffineMatrix } from '../../Math/affine-matrix';
import { Ray } from '../../Math/ray';
import { ClosestLineJumpTable } from './ClosestLineJumpTable';
import { Collider } from './Collider';
import { Logger, range } from '../..';
import { CompositeCollider } from './CompositeCollider';
import { Shape } from './Shape';
/**
 * Polygon collider for detecting collisions
 */
export class PolygonCollider extends Collider {
    constructor(options) {
        var _a, _b;
        super();
        this._logger = Logger.getInstance();
        this._transformedPoints = [];
        this._sides = [];
        this._localSides = [];
        this._globalMatrix = AffineMatrix.identity();
        this._transformedPointsDirty = true;
        this._sidesDirty = true;
        this._localSidesDirty = true;
        this._localBoundsDirty = true;
        this.offset = (_a = options.offset) !== null && _a !== void 0 ? _a : Vector.Zero;
        this._globalMatrix.translate(this.offset.x, this.offset.y);
        this.points = (_b = options.points) !== null && _b !== void 0 ? _b : [];
        const counterClockwise = this._isCounterClockwiseWinding(this.points);
        if (!counterClockwise) {
            this.points.reverse();
        }
        if (!this.isConvex()) {
            this._logger.warn('Excalibur only supports convex polygon colliders and will not behave properly.' +
                'Call PolygonCollider.triangulate() to build a new collider composed of smaller convex triangles');
        }
        // calculate initial transformation
        this._calculateTransformation();
    }
    /**
     * Points in the polygon in order around the perimeter in local coordinates. These are relative from the body transform position.
     * Excalibur stores these in counter-clockwise order
     */
    set points(points) {
        this._localBoundsDirty = true;
        this._localSidesDirty = true;
        this._sidesDirty = true;
        this._points = points;
    }
    /**
     * Points in the polygon in order around the perimeter in local coordinates. These are relative from the body transform position.
     * Excalibur stores these in counter-clockwise order
     */
    get points() {
        return this._points;
    }
    _isCounterClockwiseWinding(points) {
        // https://stackoverflow.com/a/1165943
        let sum = 0;
        for (let i = 0; i < points.length; i++) {
            sum += (points[(i + 1) % points.length].x - points[i].x) * (points[(i + 1) % points.length].y + points[i].y);
        }
        return sum < 0;
    }
    /**
     * Returns if the polygon collider is convex, Excalibur does not handle non-convex collision shapes.
     * Call [[Polygon.triangulate]] to generate a [[CompositeCollider]] from this non-convex shape
     */
    isConvex() {
        // From SO: https://stackoverflow.com/a/45372025
        if (this.points.length < 3) {
            return false;
        }
        let oldPoint = this.points[this.points.length - 2];
        let newPoint = this.points[this.points.length - 1];
        let direction = Math.atan2(newPoint.y - oldPoint.y, newPoint.x - oldPoint.x);
        let oldDirection = 0;
        let orientation = 0;
        let angleSum = 0;
        for (const [i, point] of this.points.entries()) {
            oldPoint = newPoint;
            oldDirection = direction;
            newPoint = point;
            direction = Math.atan2(newPoint.y - oldPoint.y, newPoint.x - oldPoint.x);
            if (oldPoint.equals(newPoint)) {
                return false; // repeat point
            }
            let angle = direction - oldDirection;
            if (angle <= -Math.PI) {
                angle += Math.PI * 2;
            }
            else if (angle > Math.PI) {
                angle -= Math.PI * 2;
            }
            if (i === 0) {
                if (angle === 0.0) {
                    return false;
                }
                orientation = angle > 0 ? 1 : -1;
            }
            else {
                if (orientation * angle <= 0) {
                    return false;
                }
            }
            angleSum += angle;
        }
        return Math.abs(Math.round(angleSum / (Math.PI * 2))) === 1;
    }
    /**
     * Tessellates the polygon into a triangle fan as a [[CompositeCollider]] of triangle polygons
     */
    tessellate() {
        const polygons = [];
        for (let i = 1; i < this.points.length - 2; i++) {
            polygons.push([this.points[0], this.points[i + 1], this.points[i + 2]]);
        }
        polygons.push([this.points[0], this.points[1], this.points[2]]);
        return new CompositeCollider(polygons.map(points => Shape.Polygon(points)));
    }
    /**
     * Triangulate the polygon collider using the "Ear Clipping" algorithm.
     * Returns a new [[CompositeCollider]] made up of smaller triangles.
     */
    triangulate() {
        // https://www.youtube.com/watch?v=hTJFcHutls8
        if (this.points.length < 3) {
            throw Error('Invalid polygon');
        }
        /**
         * Helper to get a vertex in the list
         */
        function getItem(index, list) {
            if (index >= list.length) {
                return list[index % list.length];
            }
            else if (index < 0) {
                return list[index % list.length + list.length];
            }
            else {
                return list[index];
            }
        }
        /**
         * Quick test for point in triangle
         */
        function isPointInTriangle(point, a, b, c) {
            const ab = b.sub(a);
            const bc = c.sub(b);
            const ca = a.sub(c);
            const ap = point.sub(a);
            const bp = point.sub(b);
            const cp = point.sub(c);
            const cross1 = ab.cross(ap);
            const cross2 = bc.cross(bp);
            const cross3 = ca.cross(cp);
            if (cross1 > 0 || cross2 > 0 || cross3 > 0) {
                return false;
            }
            return true;
        }
        const triangles = [];
        const vertices = [...this.points];
        const indices = range(0, this.points.length - 1);
        // 1. Loop through vertices clockwise
        //    if the vertex is convex (interior angle is < 180) (cross product positive)
        //    if the polygon formed by it's edges doesn't contain the points
        //         it's an ear add it to our list of triangles, and restart
        while (indices.length > 3) {
            for (let i = 0; i < indices.length; i++) {
                const a = indices[i];
                const b = getItem(i - 1, indices);
                const c = getItem(i + 1, indices);
                const va = vertices[a];
                const vb = vertices[b];
                const vc = vertices[c];
                // Check convexity
                const leftArm = vb.sub(va);
                const rightArm = vc.sub(va);
                const isConvex = rightArm.cross(leftArm) > 0; // positive cross means convex
                if (!isConvex) {
                    continue;
                }
                let isEar = true;
                // Check that if any vertices are in the triangle a, b, c
                for (let j = 0; j < indices.length; j++) {
                    const vertIndex = indices[j];
                    // We can skip these
                    if (vertIndex === a || vertIndex === b || vertIndex === c) {
                        continue;
                    }
                    const point = vertices[vertIndex];
                    if (isPointInTriangle(point, vb, va, vc)) {
                        isEar = false;
                        break;
                    }
                }
                // Add ear to polygon list and remove from list
                if (isEar) {
                    triangles.push([vb, va, vc]);
                    indices.splice(i, 1);
                    break;
                }
            }
        }
        triangles.push([vertices[indices[0]], vertices[indices[1]], vertices[indices[2]]]);
        return new CompositeCollider(triangles.map(points => Shape.Polygon(points)));
    }
    /**
     * Returns a clone of this ConvexPolygon, not associated with any collider
     */
    clone() {
        return new PolygonCollider({
            offset: this.offset.clone(),
            points: this.points.map((p) => p.clone())
        });
    }
    /**
     * Returns the world position of the collider, which is the current body transform plus any defined offset
     */
    get worldPos() {
        if (this._transform) {
            return this._transform.pos.add(this.offset);
        }
        return this.offset;
    }
    /**
     * Get the center of the collider in world coordinates
     */
    get center() {
        return this.bounds.center;
    }
    /**
     * Calculates the underlying transformation from the body relative space to world space
     */
    _calculateTransformation() {
        const points = this.points;
        const len = points.length;
        this._transformedPoints.length = 0; // clear out old transform
        for (let i = 0; i < len; i++) {
            this._transformedPoints[i] = this._globalMatrix.multiply(points[i].clone());
        }
    }
    /**
     * Gets the points that make up the polygon in world space, from actor relative space (if specified)
     */
    getTransformedPoints() {
        if (this._transformedPointsDirty) {
            this._calculateTransformation();
            this._transformedPointsDirty = false;
        }
        return this._transformedPoints;
    }
    /**
     * Gets the sides of the polygon in world space
     */
    getSides() {
        if (this._sidesDirty) {
            const lines = [];
            const points = this.getTransformedPoints();
            const len = points.length;
            for (let i = 0; i < len; i++) {
                // This winding is important
                lines.push(new LineSegment(points[i], points[(i + 1) % len]));
            }
            this._sides = lines;
            this._sidesDirty = false;
        }
        return this._sides;
    }
    /**
     * Returns the local coordinate space sides
     */
    getLocalSides() {
        if (this._localSidesDirty) {
            const lines = [];
            const points = this.points;
            const len = points.length;
            for (let i = 0; i < len; i++) {
                // This winding is important
                lines.push(new LineSegment(points[i], points[(i + 1) % len]));
            }
            this._localSides = lines;
            this._localSidesDirty = false;
        }
        return this._localSides;
    }
    /**
     * Given a direction vector find the world space side that is most in that direction
     * @param direction
     */
    findSide(direction) {
        const sides = this.getSides();
        let bestSide = sides[0];
        let maxDistance = -Number.MAX_VALUE;
        for (let side = 0; side < sides.length; side++) {
            const currentSide = sides[side];
            const sideNormal = currentSide.normal();
            const mostDirection = sideNormal.dot(direction);
            if (mostDirection > maxDistance) {
                bestSide = currentSide;
                maxDistance = mostDirection;
            }
        }
        return bestSide;
    }
    /**
     * Given a direction vector find the local space side that is most in that direction
     * @param direction
     */
    findLocalSide(direction) {
        const sides = this.getLocalSides();
        let bestSide = sides[0];
        let maxDistance = -Number.MAX_VALUE;
        for (let side = 0; side < sides.length; side++) {
            const currentSide = sides[side];
            const sideNormal = currentSide.normal();
            const mostDirection = sideNormal.dot(direction);
            if (mostDirection > maxDistance) {
                bestSide = currentSide;
                maxDistance = mostDirection;
            }
        }
        return bestSide;
    }
    /**
     * Get the axis associated with the convex polygon
     */
    get axes() {
        const axes = [];
        const sides = this.getSides();
        for (let i = 0; i < sides.length; i++) {
            axes.push(sides[i].normal());
        }
        return axes;
    }
    /**
     * Updates the transform for the collision geometry
     *
     * Collision geometry (points/bounds) will not change until this is called.
     * @param transform
     */
    update(transform) {
        var _a;
        this._transform = transform;
        this._transformedPointsDirty = true;
        this._sidesDirty = true;
        // This change means an update must be performed in order for geometry to update
        const globalMat = (_a = transform.matrix) !== null && _a !== void 0 ? _a : this._globalMatrix;
        globalMat.clone(this._globalMatrix);
        this._globalMatrix.translate(this.offset.x, this.offset.y);
    }
    /**
     * Tests if a point is contained in this collider in world space
     */
    contains(point) {
        // Always cast to the right, as long as we cast in a consistent fixed direction we
        // will be fine
        const testRay = new Ray(point, new Vector(1, 0));
        const intersectCount = this.getSides().reduce(function (accum, side) {
            if (testRay.intersect(side) >= 0) {
                return accum + 1;
            }
            return accum;
        }, 0);
        if (intersectCount % 2 === 0) {
            return false;
        }
        return true;
    }
    getClosestLineBetween(collider) {
        if (collider instanceof CircleCollider) {
            return ClosestLineJumpTable.PolygonCircleClosestLine(this, collider);
        }
        else if (collider instanceof PolygonCollider) {
            return ClosestLineJumpTable.PolygonPolygonClosestLine(this, collider);
        }
        else if (collider instanceof EdgeCollider) {
            return ClosestLineJumpTable.PolygonEdgeClosestLine(this, collider);
        }
        else {
            throw new Error(`Polygon could not collide with unknown CollisionShape ${typeof collider}`);
        }
    }
    /**
     * Returns a collision contact if the 2 colliders collide, otherwise collide will
     * return null.
     * @param collider
     */
    collide(collider) {
        if (collider instanceof CircleCollider) {
            return CollisionJumpTable.CollideCirclePolygon(collider, this);
        }
        else if (collider instanceof PolygonCollider) {
            return CollisionJumpTable.CollidePolygonPolygon(this, collider);
        }
        else if (collider instanceof EdgeCollider) {
            return CollisionJumpTable.CollidePolygonEdge(this, collider);
        }
        else {
            throw new Error(`Polygon could not collide with unknown CollisionShape ${typeof collider}`);
        }
    }
    /**
     * Find the point on the collider furthest in the direction specified
     */
    getFurthestPoint(direction) {
        const pts = this.getTransformedPoints();
        let furthestPoint = null;
        let maxDistance = -Number.MAX_VALUE;
        for (let i = 0; i < pts.length; i++) {
            const distance = direction.dot(pts[i]);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = pts[i];
            }
        }
        return furthestPoint;
    }
    /**
     * Find the local point on the collider furthest in the direction specified
     * @param direction
     */
    getFurthestLocalPoint(direction) {
        const pts = this.points;
        let furthestPoint = pts[0];
        let maxDistance = -Number.MAX_VALUE;
        for (let i = 0; i < pts.length; i++) {
            const distance = direction.dot(pts[i]);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = pts[i];
            }
        }
        return furthestPoint;
    }
    /**
     * Finds the closes face to the point using perpendicular distance
     * @param point point to test against polygon
     */
    getClosestFace(point) {
        const sides = this.getSides();
        let min = Number.POSITIVE_INFINITY;
        let faceIndex = -1;
        let distance = -1;
        for (let i = 0; i < sides.length; i++) {
            const dist = sides[i].distanceToPoint(point);
            if (dist < min) {
                min = dist;
                faceIndex = i;
                distance = dist;
            }
        }
        if (faceIndex !== -1) {
            return {
                distance: sides[faceIndex].normal().scale(distance),
                face: sides[faceIndex]
            };
        }
        return null;
    }
    /**
     * Get the axis aligned bounding box for the polygon collider in world coordinates
     */
    get bounds() {
        return this.localBounds.transform(this._globalMatrix);
    }
    /**
     * Get the axis aligned bounding box for the polygon collider in local coordinates
     */
    get localBounds() {
        if (this._localBoundsDirty) {
            this._localBounds = BoundingBox.fromPoints(this.points);
            this._localBoundsDirty = false;
        }
        return this._localBounds;
    }
    /**
     * Get the moment of inertia for an arbitrary polygon
     * https://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    getInertia(mass) {
        if (this._cachedMass === mass && this._cachedInertia) {
            return this._cachedInertia;
        }
        let numerator = 0;
        let denominator = 0;
        const points = this.points;
        for (let i = 0; i < points.length; i++) {
            const iplusone = (i + 1) % points.length;
            const crossTerm = points[iplusone].cross(points[i]);
            numerator +=
                crossTerm *
                    (points[i].dot(points[i]) + points[i].dot(points[iplusone]) + points[iplusone].dot(points[iplusone]));
            denominator += crossTerm;
        }
        this._cachedMass = mass;
        return this._cachedInertia = (mass / 6) * (numerator / denominator);
    }
    /**
     * Casts a ray into the polygon and returns a vector representing the point of contact (in world space) or null if no collision.
     */
    rayCast(ray, max = Infinity) {
        // find the minimum contact time greater than 0
        // contact times less than 0 are behind the ray and we don't want those
        const sides = this.getSides();
        const len = sides.length;
        let minContactTime = Number.MAX_VALUE;
        let contactIndex = -1;
        for (let i = 0; i < len; i++) {
            const contactTime = ray.intersect(sides[i]);
            if (contactTime >= 0 && contactTime < minContactTime && contactTime <= max) {
                minContactTime = contactTime;
                contactIndex = i;
            }
        }
        // contact was found
        if (contactIndex >= 0) {
            return ray.getPoint(minContactTime);
        }
        // no contact found
        return null;
    }
    /**
     * Project the edges of the polygon along a specified axis
     */
    project(axis) {
        const points = this.getTransformedPoints();
        const len = points.length;
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        for (let i = 0; i < len; i++) {
            const scalar = points[i].dot(axis);
            min = Math.min(min, scalar);
            max = Math.max(max, scalar);
        }
        return new Projection(min, max);
    }
    debug(ex, color) {
        const firstPoint = this.getTransformedPoints()[0];
        const points = [firstPoint, ...this.getTransformedPoints(), firstPoint];
        for (let i = 0; i < points.length - 1; i++) {
            ex.drawLine(points[i], points[i + 1], color, 2);
            ex.drawCircle(points[i], 2, color);
            ex.drawCircle(points[i + 1], 2, color);
        }
    }
}
//# sourceMappingURL=PolygonCollider.js.map