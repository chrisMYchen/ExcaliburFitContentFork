import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { System, SystemType } from '../EntityComponentSystem/System';
import { Physics } from './Physics';
import { BodyComponent } from './BodyComponent';
import { CollisionType } from './CollisionType';
import { EulerIntegrator } from './Integrator';
export class MotionSystem extends System {
    constructor() {
        super(...arguments);
        this.types = ['ex.transform', 'ex.motion'];
        this.systemType = SystemType.Update;
        this.priority = -1;
    }
    update(entities, elapsedMs) {
        let transform;
        let motion;
        for (let i = 0; i < entities.length; i++) {
            transform = entities[i].get(TransformComponent);
            motion = entities[i].get(MotionComponent);
            const optionalBody = entities[i].get(BodyComponent);
            if (optionalBody === null || optionalBody === void 0 ? void 0 : optionalBody.sleeping) {
                continue;
            }
            const totalAcc = motion.acc.clone();
            if ((optionalBody === null || optionalBody === void 0 ? void 0 : optionalBody.collisionType) === CollisionType.Active && (optionalBody === null || optionalBody === void 0 ? void 0 : optionalBody.useGravity)) {
                totalAcc.addEqual(Physics.gravity);
            }
            optionalBody === null || optionalBody === void 0 ? void 0 : optionalBody.captureOldTransform();
            // Update transform and motion based on Euler linear algebra
            EulerIntegrator.integrate(transform, motion, totalAcc, elapsedMs);
        }
    }
}
//# sourceMappingURL=MotionSystem.js.map