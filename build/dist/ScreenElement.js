import { Vector, vec } from './Math/vector';
import { Actor } from './Actor';
import { TransformComponent } from './EntityComponentSystem/Components/TransformComponent';
import { CollisionType } from './Collision/CollisionType';
import { CoordPlane } from './Math/coord-plane';
/**
 * Type guard to detect a screen element
 */
export function isScreenElement(actor) {
    return actor instanceof ScreenElement;
}
/**
 * Helper [[Actor]] primitive for drawing UI's, optimized for UI drawing. Does
 * not participate in collisions. Drawn on top of all other actors.
 */
export class ScreenElement extends Actor {
    constructor(config) {
        super({ ...config });
        this.get(TransformComponent).coordPlane = CoordPlane.Screen;
        this.anchor = vec(0, 0);
        this.body.collisionType = CollisionType.PreventCollision;
        this.collider.useBoxCollider(this.width, this.height, this.anchor);
    }
    _initialize(engine) {
        this._engine = engine;
        super._initialize(engine);
    }
    contains(x, y, useWorld = true) {
        if (useWorld) {
            return super.contains(x, y);
        }
        const coords = this._engine.worldToScreenCoordinates(new Vector(x, y));
        return super.contains(coords.x, coords.y);
    }
}
//# sourceMappingURL=ScreenElement.js.map