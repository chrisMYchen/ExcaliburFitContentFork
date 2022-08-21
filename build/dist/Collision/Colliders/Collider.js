import { createId } from '../../Id';
import { EventDispatcher } from '../../EventDispatcher';
/**
 * A collision collider specifies the geometry that can detect when other collision colliders intersect
 * for the purposes of colliding 2 objects in excalibur.
 */
export class Collider {
    constructor() {
        this.id = createId('collider', Collider._ID++);
        /**
         * Excalibur uses this to signal to the [[CollisionSystem]] this is part of a composite collider
         * @internal
         * @hidden
         */
        this.__compositeColliderId = null;
        this.events = new EventDispatcher();
    }
    /**
     * Returns a boolean indicating whether this body collided with
     * or was in stationary contact with
     * the body of the other [[Collider]]
     */
    touching(other) {
        const contact = this.collide(other);
        if (contact) {
            return true;
        }
        return false;
    }
}
Collider._ID = 0;
//# sourceMappingURL=Collider.js.map