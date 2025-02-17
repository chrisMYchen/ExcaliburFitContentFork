import { BoundingBox } from '../BoundingBox';
import { CollisionJumpTable } from './CollisionJumpTable';
import { PolygonCollider } from './PolygonCollider';
import { EdgeCollider } from './EdgeCollider';
import { Projection } from '../../Math/projection';
import { Vector } from '../../Math/vector';
import { Color } from '../../Color';
import { Collider } from './Collider';
import { ClosestLineJumpTable } from './ClosestLineJumpTable';
import { AffineMatrix } from '../../Math/affine-matrix';
/**
 * This is a circle collider for the excalibur rigid body physics simulation
 */
export class CircleCollider extends Collider {
    constructor(options) {
        super();
        /**
         * Position of the circle relative to the collider, by default (0, 0).
         */
        this.offset = Vector.Zero;
        this._globalMatrix = AffineMatrix.identity();
        this.offset = options.offset || Vector.Zero;
        this.radius = options.radius || 0;
        this._globalMatrix.translate(this.offset.x, this.offset.y);
    }
    get worldPos() {
        return this._globalMatrix.getPosition();
    }
    /**
     * Get the radius of the circle
     */
    get radius() {
        var _a;
        const tx = this._transform;
        const scale = (_a = tx === null || tx === void 0 ? void 0 : tx.globalScale) !== null && _a !== void 0 ? _a : Vector.One;
        // This is a trade off, the alternative is retooling circles to support ellipse collisions
        return this._naturalRadius * Math.min(scale.x, scale.y);
    }
    /**
     * Set the radius of the circle
     */
    set radius(val) {
        var _a;
        const tx = this._transform;
        const scale = (_a = tx === null || tx === void 0 ? void 0 : tx.globalScale) !== null && _a !== void 0 ? _a : Vector.One;
        // This is a trade off, the alternative is retooling circles to support ellipse collisions
        this._naturalRadius = val / Math.min(scale.x, scale.y);
    }
    /**
     * Returns a clone of this shape, not associated with any collider
     */
    clone() {
        return new CircleCollider({
            offset: this.offset.clone(),
            radius: this.radius
        });
    }
    /**
     * Get the center of the collider in world coordinates
     */
    get center() {
        return this._globalMatrix.getPosition();
    }
    /**
     * Tests if a point is contained in this collider
     */
    contains(point) {
        var _a, _b;
        const pos = (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos) !== null && _b !== void 0 ? _b : this.offset;
        const distance = pos.distance(point);
        if (distance <= this.radius) {
            return true;
        }
        return false;
    }
    /**
     * Casts a ray at the Circle collider and returns the nearest point of collision
     * @param ray
     */
    rayCast(ray, max = Infinity) {
        //https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
        const c = this.center;
        const dir = ray.dir;
        const orig = ray.pos;
        const discriminant = Math.sqrt(Math.pow(dir.dot(orig.sub(c)), 2) - Math.pow(orig.sub(c).distance(), 2) + Math.pow(this.radius, 2));
        if (discriminant < 0) {
            // no intersection
            return null;
        }
        else {
            let toi = 0;
            if (discriminant === 0) {
                toi = -dir.dot(orig.sub(c));
                if (toi > 0 && toi < max) {
                    return ray.getPoint(toi);
                }
                return null;
            }
            else {
                const toi1 = -dir.dot(orig.sub(c)) + discriminant;
                const toi2 = -dir.dot(orig.sub(c)) - discriminant;
                const positiveToi = [];
                if (toi1 >= 0) {
                    positiveToi.push(toi1);
                }
                if (toi2 >= 0) {
                    positiveToi.push(toi2);
                }
                const mintoi = Math.min(...positiveToi);
                if (mintoi <= max) {
                    return ray.getPoint(mintoi);
                }
                return null;
            }
        }
    }
    getClosestLineBetween(shape) {
        if (shape instanceof CircleCollider) {
            return ClosestLineJumpTable.CircleCircleClosestLine(this, shape);
        }
        else if (shape instanceof PolygonCollider) {
            return ClosestLineJumpTable.PolygonCircleClosestLine(shape, this).flip();
        }
        else if (shape instanceof EdgeCollider) {
            return ClosestLineJumpTable.CircleEdgeClosestLine(this, shape).flip();
        }
        else {
            throw new Error(`Polygon could not collide with unknown CollisionShape ${typeof shape}`);
        }
    }
    /**
     * @inheritdoc
     */
    collide(collider) {
        if (collider instanceof CircleCollider) {
            return CollisionJumpTable.CollideCircleCircle(this, collider);
        }
        else if (collider instanceof PolygonCollider) {
            return CollisionJumpTable.CollideCirclePolygon(this, collider);
        }
        else if (collider instanceof EdgeCollider) {
            return CollisionJumpTable.CollideCircleEdge(this, collider);
        }
        else {
            throw new Error(`Circle could not collide with unknown CollisionShape ${typeof collider}`);
        }
    }
    /**
     * Find the point on the collider furthest in the direction specified
     */
    getFurthestPoint(direction) {
        return this.center.add(direction.normalize().scale(this.radius));
    }
    /**
     * Find the local point on the shape in the direction specified
     * @param direction
     */
    getFurthestLocalPoint(direction) {
        const dir = direction.normalize();
        return dir.scale(this.radius);
    }
    /**
     * Get the axis aligned bounding box for the circle collider in world coordinates
     */
    get bounds() {
        var _a, _b, _c;
        const tx = this._transform;
        const scale = (_a = tx === null || tx === void 0 ? void 0 : tx.globalScale) !== null && _a !== void 0 ? _a : Vector.One;
        const rotation = (_b = tx === null || tx === void 0 ? void 0 : tx.globalRotation) !== null && _b !== void 0 ? _b : 0;
        const pos = ((_c = tx === null || tx === void 0 ? void 0 : tx.globalPos) !== null && _c !== void 0 ? _c : Vector.Zero);
        return new BoundingBox(this.offset.x - this._naturalRadius, this.offset.y - this._naturalRadius, this.offset.x + this._naturalRadius, this.offset.y + this._naturalRadius).rotate(rotation).scale(scale).translate(pos);
    }
    /**
     * Get the axis aligned bounding box for the circle collider in local coordinates
     */
    get localBounds() {
        return new BoundingBox(this.offset.x - this._naturalRadius, this.offset.y - this._naturalRadius, this.offset.x + this._naturalRadius, this.offset.y + this._naturalRadius);
    }
    /**
     * Get axis not implemented on circles, since there are infinite axis in a circle
     */
    get axes() {
        return [];
    }
    /**
     * Returns the moment of inertia of a circle given it's mass
     * https://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    getInertia(mass) {
        return (mass * this.radius * this.radius) / 2;
    }
    /* istanbul ignore next */
    update(transform) {
        var _a;
        this._transform = transform;
        const globalMat = (_a = transform.matrix) !== null && _a !== void 0 ? _a : this._globalMatrix;
        globalMat.clone(this._globalMatrix);
        this._globalMatrix.translate(this.offset.x, this.offset.y);
    }
    /**
     * Project the circle along a specified axis
     */
    project(axis) {
        const scalars = [];
        const point = this.center;
        const dotProduct = point.dot(axis);
        scalars.push(dotProduct);
        scalars.push(dotProduct + this.radius);
        scalars.push(dotProduct - this.radius);
        return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars));
    }
    debug(ex, color) {
        var _a, _b, _c, _d;
        const tx = this._transform;
        const scale = (_a = tx === null || tx === void 0 ? void 0 : tx.globalScale) !== null && _a !== void 0 ? _a : Vector.One;
        const rotation = (_b = tx === null || tx === void 0 ? void 0 : tx.globalRotation) !== null && _b !== void 0 ? _b : 0;
        const pos = ((_c = tx === null || tx === void 0 ? void 0 : tx.globalPos) !== null && _c !== void 0 ? _c : Vector.Zero);
        ex.save();
        ex.translate(pos.x, pos.y);
        ex.rotate(rotation);
        ex.scale(scale.x, scale.y);
        ex.drawCircle(((_d = this.offset) !== null && _d !== void 0 ? _d : Vector.Zero), this._naturalRadius, Color.Transparent, color, 2);
        ex.restore();
    }
}
//# sourceMappingURL=CircleCollider.js.map