import { ActionContext } from './ActionContext';
import { Component } from '../EntityComponentSystem/Component';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
;
export class ActionsComponent extends Component {
    constructor() {
        super(...arguments);
        this.type = 'ex.actions';
        this.dependencies = [TransformComponent, MotionComponent];
    }
    onAdd(entity) {
        this._ctx = new ActionContext(entity);
    }
    onRemove() {
        this._ctx = null;
    }
    /**
     * Returns the internal action queue
     * @returns action queue
     */
    getQueue() {
        var _a;
        return (_a = this._ctx) === null || _a === void 0 ? void 0 : _a.getQueue();
    }
    runAction(action) {
        var _a;
        return (_a = this._ctx) === null || _a === void 0 ? void 0 : _a.runAction(action);
    }
    /**
     * Updates the internal action context, performing action and moving through the internal queue
     * @param elapsedMs
     */
    update(elapsedMs) {
        var _a;
        return (_a = this._ctx) === null || _a === void 0 ? void 0 : _a.update(elapsedMs);
    }
    /**
     * Clears all queued actions from the Actor
     */
    clearActions() {
        var _a;
        (_a = this._ctx) === null || _a === void 0 ? void 0 : _a.clearActions();
    }
    easeTo(...args) {
        return this._ctx.easeTo.apply(this._ctx, args);
    }
    easeBy(...args) {
        return this._ctx.easeBy.apply(this._ctx, args);
    }
    moveTo(xOrPos, yOrSpeed, speedOrUndefined) {
        return this._ctx.moveTo.apply(this._ctx, [xOrPos, yOrSpeed, speedOrUndefined]);
    }
    moveBy(xOffsetOrVector, yOffsetOrSpeed, speedOrUndefined) {
        return this._ctx.moveBy.apply(this._ctx, [xOffsetOrVector, yOffsetOrSpeed, speedOrUndefined]);
    }
    /**
     * This method will rotate an actor to the specified angle at the speed
     * specified (in radians per second) and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param angleRadians  The angle to rotate to in radians
     * @param speed         The angular velocity of the rotation specified in radians per second
     * @param rotationType  The [[RotationType]] to use for this rotation
     */
    rotateTo(angleRadians, speed, rotationType) {
        return this._ctx.rotateTo(angleRadians, speed, rotationType);
    }
    /**
     * This method will rotate an actor by the specified angle offset, from it's current rotation given a certain speed
     * in radians/sec and return back the actor. This method is part
     * of the actor 'Action' fluent API allowing action chaining.
     * @param angleRadiansOffset  The angle to rotate to in radians relative to the current rotation
     * @param speed          The speed in radians/sec the actor should rotate at
     * @param rotationType  The [[RotationType]] to use for this rotation, default is shortest path
     */
    rotateBy(angleRadiansOffset, speed, rotationType) {
        return this._ctx.rotateBy(angleRadiansOffset, speed, rotationType);
    }
    scaleTo(sizeXOrVector, sizeYOrSpeed, speedXOrUndefined, speedYOrUndefined) {
        return this._ctx.scaleTo.apply(this._ctx, [sizeXOrVector, sizeYOrSpeed, speedXOrUndefined, speedYOrUndefined]);
    }
    scaleBy(sizeOffsetXOrVector, sizeOffsetYOrSpeed, speed) {
        return this._ctx.scaleBy.apply(this._ctx, [sizeOffsetXOrVector, sizeOffsetYOrSpeed, speed]);
    }
    /**
     * This method will cause an actor to blink (become visible and not
     * visible). Optionally, you may specify the number of blinks. Specify the amount of time
     * the actor should be visible per blink, and the amount of time not visible.
     * This method is part of the actor 'Action' fluent API allowing action chaining.
     * @param timeVisible     The amount of time to stay visible per blink in milliseconds
     * @param timeNotVisible  The amount of time to stay not visible per blink in milliseconds
     * @param numBlinks       The number of times to blink
     */
    blink(timeVisible, timeNotVisible, numBlinks) {
        return this._ctx.blink(timeVisible, timeNotVisible, numBlinks);
    }
    /**
     * This method will cause an actor's opacity to change from its current value
     * to the provided value by a specified time (in milliseconds). This method is
     * part of the actor 'Action' fluent API allowing action chaining.
     * @param opacity  The ending opacity
     * @param time     The time it should take to fade the actor (in milliseconds)
     */
    fade(opacity, time) {
        return this._ctx.fade(opacity, time);
    }
    /**
     * This method will delay the next action from executing for a certain
     * amount of time (in milliseconds). This method is part of the actor
     * 'Action' fluent API allowing action chaining.
     * @param time  The amount of time to delay the next action in the queue from executing in milliseconds
     */
    delay(time) {
        return this._ctx.delay(time);
    }
    /**
     * This method will add an action to the queue that will remove the actor from the
     * scene once it has completed its previous  Any actions on the
     * action queue after this action will not be executed.
     */
    die() {
        return this._ctx.die();
    }
    /**
     * This method allows you to call an arbitrary method as the next action in the
     * action queue. This is useful if you want to execute code in after a specific
     * action, i.e An actor arrives at a destination after traversing a path
     */
    callMethod(method) {
        return this._ctx.callMethod(method);
    }
    /**
     * This method will cause the actor to repeat all of the actions built in
     * the `repeatBuilder` callback. If the number of repeats
     * is not specified it will repeat forever. This method is part of
     * the actor 'Action' fluent API allowing action chaining
     *
     * ```typescript
     * // Move up in a zig-zag by repeated moveBy's
     * actor.actions.repeat(repeatCtx => {
     *  repeatCtx.moveBy(10, 0, 10);
     *  repeatCtx.moveBy(0, 10, 10);
     * }, 5);
     * ```
     *
     * @param repeatBuilder The builder to specify the repeatable list of actions
     * @param times  The number of times to repeat all the previous actions in the action queue. If nothing is specified the actions
     * will repeat forever
     */
    repeat(repeatBuilder, times) {
        return this._ctx.repeat(repeatBuilder, times);
    }
    /**
     * This method will cause the actor to repeat all of the actions built in
     * the `repeatBuilder` callback. If the number of repeats
     * is not specified it will repeat forever. This method is part of
     * the actor 'Action' fluent API allowing action chaining
     *
     * ```typescript
     * // Move up in a zig-zag by repeated moveBy's
     * actor.actions.repeat(repeatCtx => {
     *  repeatCtx.moveBy(10, 0, 10);
     *  repeatCtx.moveBy(0, 10, 10);
     * }, 5);
     * ```
     *
     * @param repeatBuilder The builder to specify the repeatable list of actions
     */
    repeatForever(repeatBuilder) {
        return this._ctx.repeatForever(repeatBuilder);
    }
    /**
     * This method will cause the entity to follow another at a specified distance
     * @param entity           The entity to follow
     * @param followDistance  The distance to maintain when following, if not specified the actor will follow at the current distance.
     */
    follow(entity, followDistance) {
        return this._ctx.follow(entity, followDistance);
    }
    /**
     * This method will cause the entity to move towards another until they
     * collide "meet" at a specified speed.
     * @param entity  The entity to meet
     * @param speed  The speed in pixels per second to move, if not specified it will match the speed of the other actor
     */
    meet(entity, speed) {
        return this._ctx.meet(entity, speed);
    }
    /**
     * Returns a promise that resolves when the current action queue up to now
     * is finished.
     */
    toPromise() {
        return this._ctx.toPromise();
    }
}
//# sourceMappingURL=ActionsComponent.js.map