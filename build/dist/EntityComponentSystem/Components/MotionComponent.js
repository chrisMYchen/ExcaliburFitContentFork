import { Vector } from '../../Math/vector';
import { Component } from '../Component';
export class MotionComponent extends Component {
    constructor() {
        super(...arguments);
        this.type = 'ex.motion';
        /**
         * The velocity of an entity in pixels per second
         */
        this.vel = Vector.Zero;
        /**
         * The acceleration of entity in pixels per second^2
         */
        this.acc = Vector.Zero;
        /**
         * The scale rate of change in scale units per second
         */
        this.scaleFactor = Vector.Zero;
        /**
         * The angular velocity which is how quickly the entity is rotating in radians per second
         */
        this.angularVelocity = 0;
        /**
         * The amount of torque applied to the entity, angular acceleration is torque * inertia
         */
        this.torque = 0;
        /**
         * Inertia can be thought of as the resistance to motion
         */
        this.inertia = 1;
    }
}
//# sourceMappingURL=MotionComponent.js.map