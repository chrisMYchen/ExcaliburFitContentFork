import { Vector } from '../Math/vector';
export class EulerIntegrator {
    static integrate(transform, motion, totalAcc, elapsedMs) {
        const seconds = elapsedMs / 1000;
        // This code looks a little wild, but it's to avoid creating any new Vector instances
        // integration is done in a tight loop so this is key to avoid GC'ing
        motion.vel.addEqual(totalAcc.scale(seconds, EulerIntegrator._ACC));
        transform.pos
            .add(motion.vel.scale(seconds, EulerIntegrator._VEL), EulerIntegrator._POS)
            .addEqual(totalAcc.scale(0.5 * seconds * seconds, EulerIntegrator._VEL_ACC));
        motion.angularVelocity += motion.torque * (1.0 / motion.inertia) * seconds;
        const rotation = transform.rotation + motion.angularVelocity * seconds;
        transform.scale.add(motion.scaleFactor.scale(seconds, this._SCALE_FACTOR), EulerIntegrator._SCALE);
        const tx = transform.get();
        tx.setTransform(EulerIntegrator._POS, rotation, EulerIntegrator._SCALE);
    }
}
// Scratch vectors to avoid allocation
EulerIntegrator._POS = new Vector(0, 0);
EulerIntegrator._SCALE = new Vector(1, 1);
EulerIntegrator._ACC = new Vector(0, 0);
EulerIntegrator._VEL = new Vector(0, 0);
EulerIntegrator._VEL_ACC = new Vector(0, 0);
EulerIntegrator._SCALE_FACTOR = new Vector(0, 0);
//# sourceMappingURL=Integrator.js.map