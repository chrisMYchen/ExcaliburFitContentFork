import { Vector } from '../Math/vector';
import { CollisionType } from './CollisionType';
import { Physics } from './Physics';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { Component } from '../EntityComponentSystem/Component';
import { CollisionGroup } from './Group/CollisionGroup';
import { EventDispatcher } from '../EventDispatcher';
import { createId } from '../Id';
import { clamp } from '../Math/util';
import { ColliderComponent } from './ColliderComponent';
import { Transform } from '../Math/transform';
export var DegreeOfFreedom;
(function (DegreeOfFreedom) {
    DegreeOfFreedom["Rotation"] = "rotation";
    DegreeOfFreedom["X"] = "x";
    DegreeOfFreedom["Y"] = "y";
})(DegreeOfFreedom || (DegreeOfFreedom = {}));
/**
 * Body describes all the physical properties pos, vel, acc, rotation, angular velocity for the purpose of
 * of physics simulation.
 */
export class BodyComponent extends Component {
    constructor(options) {
        var _a, _b, _c;
        super();
        this.type = 'ex.body';
        this.dependencies = [TransformComponent, MotionComponent];
        this.id = createId('body', BodyComponent._ID++);
        this.events = new EventDispatcher();
        this._oldTransform = new Transform();
        /**
         * Indicates whether the old transform has been captured at least once for interpolation
         * @internal
         */
        this.__oldTransformCaptured = false;
        /**
         * Enable or disabled the fixed update interpolation, by default interpolation is on.
         */
        this.enableFixedUpdateInterpolate = true;
        /**
         * Collision type for the rigidbody physics simulation, by default [[CollisionType.PreventCollision]]
         */
        this.collisionType = CollisionType.PreventCollision;
        /**
         * The collision group for the body's colliders, by default body colliders collide with everything
         */
        this.group = CollisionGroup.All;
        /**
         * The amount of mass the body has
         */
        this._mass = Physics.defaultMass;
        /**
         * Amount of "motion" the body has before sleeping. If below [[Physics.sleepEpsilon]] it goes to "sleep"
         */
        this.sleepMotion = Physics.sleepEpsilon * 5;
        /**
         * Can this body sleep, by default bodies do not sleep
         */
        this.canSleep = Physics.bodiesCanSleepByDefault;
        this._sleeping = false;
        /**
         * The also known as coefficient of restitution of this actor, represents the amount of energy preserved after collision or the
         * bounciness. If 1, it is 100% bouncy, 0 it completely absorbs.
         */
        this.bounciness = 0.2;
        /**
         * The coefficient of friction on this actor
         */
        this.friction = 0.99;
        /**
         * Should use global gravity [[Physics.gravity]] in it's physics simulation, default is true
         */
        this.useGravity = true;
        /**
         * Degrees of freedom to limit
         *
         * Note: this only limits responses in the realistic solver, if velocity/angularVelocity is set the actor will still respond
         */
        this.limitDegreeOfFreedom = [];
        /**
         * The velocity of the actor last frame (vx, vy) in pixels/second
         */
        this.oldVel = new Vector(0, 0);
        /**
         * Gets/sets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
         */
        this.oldAcc = Vector.Zero;
        if (options) {
            this.collisionType = (_a = options.type) !== null && _a !== void 0 ? _a : this.collisionType;
            this.group = (_b = options.group) !== null && _b !== void 0 ? _b : this.group;
            this.useGravity = (_c = options.useGravity) !== null && _c !== void 0 ? _c : this.useGravity;
        }
    }
    get matrix() {
        return this.transform.get().matrix;
    }
    get mass() {
        return this._mass;
    }
    set mass(newMass) {
        this._mass = newMass;
        this._cachedInertia = undefined;
        this._cachedInverseInertia = undefined;
    }
    /**
     * The inverse mass (1/mass) of the body. If [[CollisionType.Fixed]] this is 0, meaning "infinite" mass
     */
    get inverseMass() {
        return this.collisionType === CollisionType.Fixed ? 0 : 1 / this.mass;
    }
    /**
     * Whether this body is sleeping or not
     */
    get sleeping() {
        return this._sleeping;
    }
    /**
     * Set the sleep state of the body
     * @param sleeping
     */
    setSleeping(sleeping) {
        this._sleeping = sleeping;
        if (!sleeping) {
            // Give it a kick to keep it from falling asleep immediately
            this.sleepMotion = Physics.sleepEpsilon * 5;
        }
        else {
            this.vel = Vector.Zero;
            this.acc = Vector.Zero;
            this.angularVelocity = 0;
            this.sleepMotion = 0;
        }
    }
    /**
     * Update body's [[BodyComponent.sleepMotion]] for the purpose of sleeping
     */
    updateMotion() {
        if (this._sleeping) {
            this.setSleeping(true);
        }
        const currentMotion = this.vel.size * this.vel.size + Math.abs(this.angularVelocity * this.angularVelocity);
        const bias = Physics.sleepBias;
        this.sleepMotion = bias * this.sleepMotion + (1 - bias) * currentMotion;
        this.sleepMotion = clamp(this.sleepMotion, 0, 10 * Physics.sleepEpsilon);
        if (this.canSleep && this.sleepMotion < Physics.sleepEpsilon) {
            this.setSleeping(true);
        }
    }
    /**
     * Get the moment of inertia from the [[ColliderComponent]]
     */
    get inertia() {
        if (this._cachedInertia) {
            return this._cachedInertia;
        }
        // Inertia is a property of the geometry, so this is a little goofy but seems to be okay?
        const collider = this.owner.get(ColliderComponent);
        if (collider) {
            collider.$colliderAdded.subscribe(() => {
                this._cachedInertia = null;
            });
            collider.$colliderRemoved.subscribe(() => {
                this._cachedInertia = null;
            });
            const maybeCollider = collider.get();
            if (maybeCollider) {
                return this._cachedInertia = maybeCollider.getInertia(this.mass);
            }
        }
        return 0;
    }
    /**
     * Get the inverse moment of inertial from the [[ColliderComponent]]. If [[CollisionType.Fixed]] this is 0, meaning "infinite" mass
     */
    get inverseInertia() {
        if (this._cachedInverseInertia) {
            return this._cachedInverseInertia;
        }
        return this._cachedInverseInertia = this.collisionType === CollisionType.Fixed ? 0 : 1 / this.inertia;
    }
    /**
     * Returns if the owner is active
     */
    get active() {
        var _a;
        return !!((_a = this.owner) === null || _a === void 0 ? void 0 : _a.active);
    }
    /**
     * @deprecated Use globalP0s
     */
    get center() {
        return this.globalPos;
    }
    get transform() {
        var _a;
        return (_a = this.owner) === null || _a === void 0 ? void 0 : _a.get(TransformComponent);
    }
    get motion() {
        var _a;
        return (_a = this.owner) === null || _a === void 0 ? void 0 : _a.get(MotionComponent);
    }
    get pos() {
        return this.transform.pos;
    }
    set pos(val) {
        this.transform.pos = val;
    }
    /**
     * The (x, y) position of the actor this will be in the middle of the actor if the
     * [[Actor.anchor]] is set to (0.5, 0.5) which is default.
     * If you want the (x, y) position to be the top left of the actor specify an anchor of (0, 0).
     */
    get globalPos() {
        return this.transform.globalPos;
    }
    set globalPos(val) {
        this.transform.globalPos = val;
    }
    /**
     * The position of the actor last frame (x, y) in pixels
     */
    get oldPos() {
        return this._oldTransform.pos;
    }
    /**
     * The current velocity vector (vx, vy) of the actor in pixels/second
     */
    get vel() {
        return this.motion.vel;
    }
    set vel(val) {
        this.motion.vel = val;
    }
    /**
     * The current acceleration vector (ax, ay) of the actor in pixels/second/second. An acceleration pointing down such as (0, 100) may
     * be useful to simulate a gravitational effect.
     */
    get acc() {
        return this.motion.acc;
    }
    set acc(val) {
        this.motion.acc = val;
    }
    /**
     * The current torque applied to the actor
     */
    get torque() {
        return this.motion.torque;
    }
    set torque(val) {
        this.motion.torque = val;
    }
    /**
     * Gets/sets the rotation of the body from the last frame.
     */
    get oldRotation() {
        return this._oldTransform.rotation;
    }
    /**
     * The rotation of the body in radians
     */
    get rotation() {
        return this.transform.globalRotation;
    }
    set rotation(val) {
        this.transform.globalRotation = val;
    }
    /**
     * The scale vector of the actor
     */
    get scale() {
        return this.transform.globalScale;
    }
    set scale(val) {
        this.transform.globalScale = val;
    }
    /**
     * The scale of the actor last frame
     */
    get oldScale() {
        return this._oldTransform.scale;
    }
    /**
     * The scale rate of change of the actor in scale/second
     */
    get scaleFactor() {
        return this.motion.scaleFactor;
    }
    set scaleFactor(scaleFactor) {
        this.motion.scaleFactor = scaleFactor;
    }
    /**
     * Get the angular velocity in radians/second
     */
    get angularVelocity() {
        return this.motion.angularVelocity;
    }
    /**
     * Set the angular velocity in radians/second
     */
    set angularVelocity(value) {
        this.motion.angularVelocity = value;
    }
    /**
     * Apply a specific impulse to the body
     * @param point
     * @param impulse
     */
    applyImpulse(point, impulse) {
        if (this.collisionType !== CollisionType.Active) {
            return; // only active objects participate in the simulation
        }
        const finalImpulse = impulse.scale(this.inverseMass);
        if (this.limitDegreeOfFreedom.includes(DegreeOfFreedom.X)) {
            finalImpulse.x = 0;
        }
        if (this.limitDegreeOfFreedom.includes(DegreeOfFreedom.Y)) {
            finalImpulse.y = 0;
        }
        this.vel.addEqual(finalImpulse);
        if (!this.limitDegreeOfFreedom.includes(DegreeOfFreedom.Rotation)) {
            const distanceFromCenter = point.sub(this.globalPos);
            this.angularVelocity += this.inverseInertia * distanceFromCenter.cross(impulse);
        }
    }
    /**
     * Apply only linear impulse to the body
     * @param impulse
     */
    applyLinearImpulse(impulse) {
        if (this.collisionType !== CollisionType.Active) {
            return; // only active objects participate in the simulation
        }
        const finalImpulse = impulse.scale(this.inverseMass);
        if (this.limitDegreeOfFreedom.includes(DegreeOfFreedom.X)) {
            finalImpulse.x = 0;
        }
        if (this.limitDegreeOfFreedom.includes(DegreeOfFreedom.Y)) {
            finalImpulse.y = 0;
        }
        this.vel = this.vel.add(finalImpulse);
    }
    /**
     * Apply only angular impulse to the body
     * @param point
     * @param impulse
     */
    applyAngularImpulse(point, impulse) {
        if (this.collisionType !== CollisionType.Active) {
            return; // only active objects participate in the simulation
        }
        if (!this.limitDegreeOfFreedom.includes(DegreeOfFreedom.Rotation)) {
            const distanceFromCenter = point.sub(this.globalPos);
            this.angularVelocity += this.inverseInertia * distanceFromCenter.cross(impulse);
        }
    }
    /**
     * Sets the old versions of pos, vel, acc, and scale.
     */
    captureOldTransform() {
        // Capture old values before integration step updates them
        this.__oldTransformCaptured = true;
        this.transform.get().clone(this._oldTransform);
        this.oldVel.setTo(this.vel.x, this.vel.y);
        this.oldAcc.setTo(this.acc.x, this.acc.y);
    }
}
BodyComponent._ID = 0;
//# sourceMappingURL=BodyComponent.js.map