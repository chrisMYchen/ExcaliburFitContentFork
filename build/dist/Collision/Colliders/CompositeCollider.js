import { Util } from '../..';
import { Pair } from '../Detection/Pair';
import { Projection } from '../../Math/projection';
import { Vector } from '../../Math/vector';
import { BoundingBox } from '../BoundingBox';
import { DynamicTree } from '../Detection/DynamicTree';
import { DynamicTreeCollisionProcessor } from '../Detection/DynamicTreeCollisionProcessor';
import { Collider } from './Collider';
export class CompositeCollider extends Collider {
    constructor(colliders) {
        super();
        this._collisionProcessor = new DynamicTreeCollisionProcessor();
        this._dynamicAABBTree = new DynamicTree();
        this._colliders = [];
        for (const c of colliders) {
            this.addCollider(c);
        }
    }
    clearColliders() {
        this._colliders = [];
    }
    addCollider(collider) {
        this.events.wire(collider.events);
        collider.__compositeColliderId = this.id;
        this._colliders.push(collider);
        this._collisionProcessor.track(collider);
        this._dynamicAABBTree.trackCollider(collider);
    }
    removeCollider(collider) {
        this.events.unwire(collider.events);
        collider.__compositeColliderId = null;
        Util.removeItemFromArray(collider, this._colliders);
        this._collisionProcessor.untrack(collider);
        this._dynamicAABBTree.untrackCollider(collider);
    }
    getColliders() {
        return this._colliders;
    }
    get worldPos() {
        var _a, _b;
        // TODO transform component world pos
        return (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos) !== null && _b !== void 0 ? _b : Vector.Zero;
    }
    get center() {
        var _a, _b;
        return (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos) !== null && _b !== void 0 ? _b : Vector.Zero;
    }
    get bounds() {
        var _a, _b;
        // TODO cache this
        const colliders = this.getColliders();
        const results = colliders.reduce((acc, collider) => acc.combine(collider.bounds), (_b = (_a = colliders[0]) === null || _a === void 0 ? void 0 : _a.bounds) !== null && _b !== void 0 ? _b : new BoundingBox().translate(this.worldPos));
        return results;
    }
    get localBounds() {
        var _a, _b;
        // TODO cache this
        const colliders = this.getColliders();
        const results = colliders.reduce((acc, collider) => acc.combine(collider.localBounds), (_b = (_a = colliders[0]) === null || _a === void 0 ? void 0 : _a.localBounds) !== null && _b !== void 0 ? _b : new BoundingBox());
        return results;
    }
    get axes() {
        // TODO cache this
        const colliders = this.getColliders();
        let axes = [];
        for (const collider of colliders) {
            axes = axes.concat(collider.axes);
        }
        return axes;
    }
    getFurthestPoint(direction) {
        const colliders = this.getColliders();
        const furthestPoints = [];
        for (const collider of colliders) {
            furthestPoints.push(collider.getFurthestPoint(direction));
        }
        // Pick best point from all colliders
        let bestPoint = furthestPoints[0];
        let maxDistance = -Number.MAX_VALUE;
        for (const point of furthestPoints) {
            const distance = point.dot(direction);
            if (distance > maxDistance) {
                bestPoint = point;
                maxDistance = distance;
            }
        }
        return bestPoint;
    }
    getInertia(mass) {
        const colliders = this.getColliders();
        let totalInertia = 0;
        for (const collider of colliders) {
            totalInertia += collider.getInertia(mass);
        }
        return totalInertia;
    }
    collide(other) {
        let otherColliders = [other];
        if (other instanceof CompositeCollider) {
            otherColliders = other.getColliders();
        }
        const pairs = [];
        for (const c of otherColliders) {
            this._dynamicAABBTree.query(c, (potentialCollider) => {
                pairs.push(new Pair(c, potentialCollider));
                return false;
            });
        }
        let contacts = [];
        for (const p of pairs) {
            contacts = contacts.concat(p.collide());
        }
        return contacts;
    }
    getClosestLineBetween(other) {
        const colliders = this.getColliders();
        const lines = [];
        if (other instanceof CompositeCollider) {
            const otherColliders = other.getColliders();
            for (const colliderA of colliders) {
                for (const colliderB of otherColliders) {
                    const maybeLine = colliderA.getClosestLineBetween(colliderB);
                    if (maybeLine) {
                        lines.push(maybeLine);
                    }
                }
            }
        }
        else {
            for (const collider of colliders) {
                const maybeLine = other.getClosestLineBetween(collider);
                if (maybeLine) {
                    lines.push(maybeLine);
                }
            }
        }
        if (lines.length) {
            let minLength = lines[0].getLength();
            let minLine = lines[0];
            for (const line of lines) {
                const length = line.getLength();
                if (length < minLength) {
                    minLength = length;
                    minLine = line;
                }
            }
            return minLine;
        }
        return null;
    }
    contains(point) {
        const colliders = this.getColliders();
        for (const collider of colliders) {
            if (collider.contains(point)) {
                return true;
            }
        }
        return false;
    }
    rayCast(ray, max) {
        const colliders = this.getColliders();
        const points = [];
        for (const collider of colliders) {
            const vec = collider.rayCast(ray, max);
            if (vec) {
                points.push(vec);
            }
        }
        if (points.length) {
            let minPoint = points[0];
            let minDistance = minPoint.dot(ray.dir);
            for (const point of points) {
                const distance = ray.dir.dot(point);
                if (distance < minDistance) {
                    minPoint = point;
                    minDistance = distance;
                }
            }
            return minPoint;
        }
        return null;
    }
    project(axis) {
        const colliders = this.getColliders();
        const projs = [];
        for (const collider of colliders) {
            const proj = collider.project(axis);
            if (proj) {
                projs.push(proj);
            }
        }
        // Merge all proj's on the same axis
        if (projs.length) {
            const newProjection = new Projection(projs[0].min, projs[0].max);
            for (const proj of projs) {
                newProjection.min = Math.min(proj.min, newProjection.min);
                newProjection.max = Math.max(proj.max, newProjection.max);
            }
            return newProjection;
        }
        return null;
    }
    update(transform) {
        if (transform) {
            const colliders = this.getColliders();
            for (const collider of colliders) {
                collider.owner = this.owner;
                collider.update(transform);
            }
        }
    }
    debug(ex, color) {
        const colliders = this.getColliders();
        for (const collider of colliders) {
            collider.debug(ex, color);
        }
    }
    clone() {
        return new CompositeCollider(this._colliders.map((c) => c.clone()));
    }
}
//# sourceMappingURL=CompositeCollider.js.map