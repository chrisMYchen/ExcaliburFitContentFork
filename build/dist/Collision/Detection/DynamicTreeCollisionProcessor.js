import { Physics } from '../Physics';
import { DynamicTree } from './DynamicTree';
import { Pair } from './Pair';
import { Vector } from '../../Math/vector';
import { Ray } from '../../Math/ray';
import { Logger } from '../../Util/Log';
import { CollisionType } from '../CollisionType';
import { BodyComponent } from '../BodyComponent';
import { CompositeCollider } from '../Colliders/CompositeCollider';
/**
 * Responsible for performing the collision broadphase (locating potential collisions) and
 * the narrowphase (actual collision contacts)
 */
export class DynamicTreeCollisionProcessor {
    constructor() {
        this._dynamicCollisionTree = new DynamicTree();
        this._pairs = new Set();
        this._collisionPairCache = [];
        this._colliders = [];
    }
    getColliders() {
        return this._colliders;
    }
    /**
     * Tracks a physics body for collisions
     */
    track(target) {
        if (!target) {
            Logger.getInstance().warn('Cannot track null collider');
            return;
        }
        if (target instanceof CompositeCollider) {
            const colliders = target.getColliders();
            for (const c of colliders) {
                c.owner = target.owner;
                this._colliders.push(c);
                this._dynamicCollisionTree.trackCollider(c);
            }
        }
        else {
            this._colliders.push(target);
            this._dynamicCollisionTree.trackCollider(target);
        }
    }
    /**
     * Untracks a physics body
     */
    untrack(target) {
        if (!target) {
            Logger.getInstance().warn('Cannot untrack a null collider');
            return;
        }
        if (target instanceof CompositeCollider) {
            const colliders = target.getColliders();
            for (const c of colliders) {
                const index = this._colliders.indexOf(c);
                if (index !== -1) {
                    this._colliders.splice(index, 1);
                }
                this._dynamicCollisionTree.untrackCollider(c);
            }
        }
        else {
            const index = this._colliders.indexOf(target);
            if (index !== -1) {
                this._colliders.splice(index, 1);
            }
            this._dynamicCollisionTree.untrackCollider(target);
        }
    }
    _pairExists(colliderA, colliderB) {
        // if the collision pair has been calculated already short circuit
        const hash = Pair.calculatePairHash(colliderA.id, colliderB.id);
        return this._pairs.has(hash);
    }
    /**
     * Detects potential collision pairs in a broadphase approach with the dynamic AABB tree strategy
     */
    broadphase(targets, delta, stats) {
        const seconds = delta / 1000;
        // Retrieve the list of potential colliders, exclude killed, prevented, and self
        const potentialColliders = targets.filter((other) => {
            var _a, _b;
            const body = (_a = other.owner) === null || _a === void 0 ? void 0 : _a.get(BodyComponent);
            return ((_b = other.owner) === null || _b === void 0 ? void 0 : _b.active) && body.collisionType !== CollisionType.PreventCollision;
        });
        // clear old list of collision pairs
        this._collisionPairCache = [];
        this._pairs.clear();
        // check for normal collision pairs
        let collider;
        for (let j = 0, l = potentialColliders.length; j < l; j++) {
            collider = potentialColliders[j];
            // Query the collision tree for potential colliders
            this._dynamicCollisionTree.query(collider, (other) => {
                if (!this._pairExists(collider, other) && Pair.canCollide(collider, other)) {
                    const pair = new Pair(collider, other);
                    this._pairs.add(pair.id);
                    this._collisionPairCache.push(pair);
                }
                // Always return false, to query whole tree. Returning true in the query method stops searching
                return false;
            });
        }
        if (stats) {
            stats.physics.pairs = this._collisionPairCache.length;
        }
        // Check dynamic tree for fast moving objects
        // Fast moving objects are those moving at least there smallest bound per frame
        if (Physics.checkForFastBodies) {
            for (const collider of potentialColliders) {
                const body = collider.owner.get(BodyComponent);
                // Skip non-active objects. Does not make sense on other collision types
                if (body.collisionType !== CollisionType.Active) {
                    continue;
                }
                // Maximum travel distance next frame
                const updateDistance = body.vel.size * seconds + // velocity term
                    body.acc.size * 0.5 * seconds * seconds; // acc term
                // Find the minimum dimension
                const minDimension = Math.min(collider.bounds.height, collider.bounds.width);
                if (Physics.disableMinimumSpeedForFastBody || updateDistance > minDimension / 2) {
                    if (stats) {
                        stats.physics.fastBodies++;
                    }
                    // start with the oldPos because the integration for actors has already happened
                    // objects resting on a surface may be slightly penetrating in the current position
                    const updateVec = body.globalPos.sub(body.oldPos);
                    const centerPoint = collider.center;
                    const furthestPoint = collider.getFurthestPoint(body.vel);
                    const origin = furthestPoint.sub(updateVec);
                    const ray = new Ray(origin, body.vel);
                    // back the ray up by -2x surfaceEpsilon to account for fast moving objects starting on the surface
                    ray.pos = ray.pos.add(ray.dir.scale(-2 * Physics.surfaceEpsilon));
                    let minCollider;
                    let minTranslate = new Vector(Infinity, Infinity);
                    this._dynamicCollisionTree.rayCastQuery(ray, updateDistance + Physics.surfaceEpsilon * 2, (other) => {
                        if (!this._pairExists(collider, other) && Pair.canCollide(collider, other)) {
                            const hitPoint = other.rayCast(ray, updateDistance + Physics.surfaceEpsilon * 10);
                            if (hitPoint) {
                                const translate = hitPoint.sub(origin);
                                if (translate.size < minTranslate.size) {
                                    minTranslate = translate;
                                    minCollider = other;
                                }
                            }
                        }
                        return false;
                    });
                    if (minCollider && Vector.isValid(minTranslate)) {
                        const pair = new Pair(collider, minCollider);
                        if (!this._pairs.has(pair.id)) {
                            this._pairs.add(pair.id);
                            this._collisionPairCache.push(pair);
                        }
                        // move the fast moving object to the other body
                        // need to push into the surface by ex.Physics.surfaceEpsilon
                        const shift = centerPoint.sub(furthestPoint);
                        body.globalPos = origin
                            .add(shift)
                            .add(minTranslate)
                            .add(ray.dir.scale(10 * Physics.surfaceEpsilon)); // needed to push the shape slightly into contact
                        collider.update(body.transform.get());
                        if (stats) {
                            stats.physics.fastBodyCollisions++;
                        }
                    }
                }
            }
        }
        // return cache
        return this._collisionPairCache;
    }
    /**
     * Applies narrow phase on collision pairs to find actual area intersections
     * Adds actual colliding pairs to stats' Frame data
     */
    narrowphase(pairs, stats) {
        let contacts = [];
        for (let i = 0; i < pairs.length; i++) {
            const newContacts = pairs[i].collide();
            contacts = contacts.concat(newContacts);
            if (stats && newContacts.length > 0) {
                for (const c of newContacts) {
                    stats.physics.contacts.set(c.id, c);
                }
            }
        }
        if (stats) {
            stats.physics.collisions += contacts.length;
        }
        return contacts;
    }
    /**
     * Update the dynamic tree positions
     */
    update(targets) {
        let updated = 0;
        const len = targets.length;
        for (let i = 0; i < len; i++) {
            if (this._dynamicCollisionTree.updateCollider(targets[i])) {
                updated++;
            }
        }
        return updated;
    }
    debug(ex) {
        this._dynamicCollisionTree.debug(ex);
    }
}
//# sourceMappingURL=DynamicTreeCollisionProcessor.js.map