import { Physics } from '../Physics';
import { CollisionType } from '../CollisionType';
import { Pair } from './Pair';
import { BodyComponent } from '../BodyComponent';
/**
 * Collision contacts are used internally by Excalibur to resolve collision between colliders. This
 * Pair prevents collisions from being evaluated more than one time
 */
export class CollisionContact {
    constructor(colliderA, colliderB, mtv, normal, tangent, points, localPoints, info) {
        var _a, _b;
        this._canceled = false;
        this.colliderA = colliderA;
        this.colliderB = colliderB;
        this.mtv = mtv;
        this.normal = normal;
        this.tangent = tangent;
        this.points = points;
        this.localPoints = localPoints;
        this.info = info;
        this.id = Pair.calculatePairHash(colliderA.id, colliderB.id);
        if (colliderA.__compositeColliderId || colliderB.__compositeColliderId) {
            // Add on the parent composite pair for start/end contact
            this.id += '|' + Pair.calculatePairHash((_a = colliderA.__compositeColliderId) !== null && _a !== void 0 ? _a : colliderA.id, (_b = colliderB.__compositeColliderId) !== null && _b !== void 0 ? _b : colliderB.id);
        }
    }
    /**
     * Match contact awake state, except if body's are Fixed
     */
    matchAwake() {
        const bodyA = this.colliderA.owner.get(BodyComponent);
        const bodyB = this.colliderB.owner.get(BodyComponent);
        if (bodyA && bodyB) {
            if (bodyA.sleeping !== bodyB.sleeping) {
                if (bodyA.sleeping && bodyA.collisionType !== CollisionType.Fixed && bodyB.sleepMotion >= Physics.wakeThreshold) {
                    bodyA.setSleeping(false);
                }
                if (bodyB.sleeping && bodyB.collisionType !== CollisionType.Fixed && bodyA.sleepMotion >= Physics.wakeThreshold) {
                    bodyB.setSleeping(false);
                }
            }
        }
    }
    isCanceled() {
        return this._canceled;
    }
    cancel() {
        this._canceled = true;
    }
}
//# sourceMappingURL=CollisionContact.js.map