import { EasingFunctions } from '../Util/EasingFunctions';
import { ActionQueue } from './ActionQueue';
import { Repeat } from './Action/Repeat';
import { RepeatForever } from './Action/RepeatForever';
import { MoveBy } from './Action/MoveBy';
import { MoveTo } from './Action/MoveTo';
import { RotateTo } from './Action/RotateTo';
import { RotateBy } from './Action/RotateBy';
import { ScaleTo } from './Action/ScaleTo';
import { ScaleBy } from './Action/ScaleBy';
import { CallMethod } from './Action/CallMethod';
import { EaseTo } from './Action/EaseTo';
import { EaseBy } from './Action/EaseBy';
import { Blink } from './Action/Blink';
import { Fade } from './Action/Fade';
import { Delay } from './Action/Delay';
import { Die } from './Action/Die';
import { Follow } from './Action/Follow';
import { Meet } from './Action/Meet';
import { Vector } from '../Math/vector';
/**
 * The fluent Action API allows you to perform "actions" on
 * [[Actor|Actors]] such as following, moving, rotating, and
 * more. You can implement your own actions by implementing
 * the [[Action]] interface.
 */
export class ActionContext {
    constructor(entity) {
        this._entity = entity;
        this._queue = new ActionQueue(entity);
    }
    getQueue() {
        return this._queue;
    }
    update(elapsedMs) {
        this._queue.update(elapsedMs);
    }
    /**
     * Clears all queued actions from the Actor
     */
    clearActions() {
        this._queue.clearActions();
    }
    runAction(action) {
        action.reset();
        this._queue.add(action);
        return this;
    }
    easeTo(...args) {
        var _a, _b;
        let x = 0;
        let y = 0;
        let duration = 0;
        let easingFcn = EasingFunctions.Linear;
        if (args[0] instanceof Vector) {
            x = args[0].x;
            y = args[0].y;
            duration = args[1];
            easingFcn = (_a = args[2]) !== null && _a !== void 0 ? _a : easingFcn;
        }
        else {
            x = args[0];
            y = args[1];
            duration = args[2];
            easingFcn = (_b = args[3]) !== null && _b !== void 0 ? _b : easingFcn;
        }
        this._queue.add(new EaseTo(this._entity, x, y, duration, easingFcn));
        return this;
    }
    easeBy(...args) {
        var _a, _b;
        let offsetX = 0;
        let offsetY = 0;
        let duration = 0;
        let easingFcn = EasingFunctions.Linear;
        if (args[0] instanceof Vector) {
            offsetX = args[0].x;
            offsetY = args[0].y;
            duration = args[1];
            easingFcn = (_a = args[2]) !== null && _a !== void 0 ? _a : easingFcn;
        }
        else {
            offsetX = args[0];
            offsetY = args[1];
            duration = args[2];
            easingFcn = (_b = args[3]) !== null && _b !== void 0 ? _b : easingFcn;
        }
        this._queue.add(new EaseBy(this._entity, offsetX, offsetY, duration, easingFcn));
        return this;
    }
    moveTo(xOrPos, yOrSpeed, speedOrUndefined) {
        let x = 0;
        let y = 0;
        let speed = 0;
        if (xOrPos instanceof Vector) {
            x = xOrPos.x;
            y = xOrPos.y;
            speed = yOrSpeed;
        }
        else {
            x = xOrPos;
            y = yOrSpeed;
            speed = speedOrUndefined;
        }
        this._queue.add(new MoveTo(this._entity, x, y, speed));
        return this;
    }
    moveBy(xOffsetOrVector, yOffsetOrSpeed, speedOrUndefined) {
        let xOffset = 0;
        let yOffset = 0;
        let speed = 0;
        if (xOffsetOrVector instanceof Vector) {
            xOffset = xOffsetOrVector.x;
            yOffset = xOffsetOrVector.y;
            speed = yOffsetOrSpeed;
        }
        else {
            xOffset = xOffsetOrVector;
            yOffset = yOffsetOrSpeed;
            speed = speedOrUndefined;
        }
        this._queue.add(new MoveBy(this._entity, xOffset, yOffset, speed));
        return this;
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
        this._queue.add(new RotateTo(this._entity, angleRadians, speed, rotationType));
        return this;
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
        this._queue.add(new RotateBy(this._entity, angleRadiansOffset, speed, rotationType));
        return this;
    }
    scaleTo(sizeXOrVector, sizeYOrSpeed, speedXOrUndefined, speedYOrUndefined) {
        let sizeX = 1;
        let sizeY = 1;
        let speedX = 0;
        let speedY = 0;
        if (sizeXOrVector instanceof Vector && sizeYOrSpeed instanceof Vector) {
            sizeX = sizeXOrVector.x;
            sizeY = sizeXOrVector.y;
            speedX = sizeYOrSpeed.x;
            speedY = sizeYOrSpeed.y;
        }
        if (typeof sizeXOrVector === 'number' && typeof sizeYOrSpeed === 'number') {
            sizeX = sizeXOrVector;
            sizeY = sizeYOrSpeed;
            speedX = speedXOrUndefined;
            speedY = speedYOrUndefined;
        }
        this._queue.add(new ScaleTo(this._entity, sizeX, sizeY, speedX, speedY));
        return this;
    }
    scaleBy(sizeOffsetXOrVector, sizeOffsetYOrSpeed, speed) {
        let sizeOffsetX = 1;
        let sizeOffsetY = 1;
        if (sizeOffsetXOrVector instanceof Vector) {
            sizeOffsetX = sizeOffsetXOrVector.x;
            sizeOffsetY = sizeOffsetXOrVector.y;
            speed = sizeOffsetYOrSpeed;
        }
        if (typeof sizeOffsetXOrVector === 'number' && typeof sizeOffsetYOrSpeed === 'number') {
            sizeOffsetX = sizeOffsetXOrVector;
            sizeOffsetY = sizeOffsetYOrSpeed;
        }
        this._queue.add(new ScaleBy(this._entity, sizeOffsetX, sizeOffsetY, speed));
        return this;
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
    blink(timeVisible, timeNotVisible, numBlinks = 1) {
        this._queue.add(new Blink(this._entity, timeVisible, timeNotVisible, numBlinks));
        return this;
    }
    /**
     * This method will cause an actor's opacity to change from its current value
     * to the provided value by a specified time (in milliseconds). This method is
     * part of the actor 'Action' fluent API allowing action chaining.
     * @param opacity  The ending opacity
     * @param time     The time it should take to fade the actor (in milliseconds)
     */
    fade(opacity, time) {
        this._queue.add(new Fade(this._entity, opacity, time));
        return this;
    }
    /**
     * This method will delay the next action from executing for a certain
     * amount of time (in milliseconds). This method is part of the actor
     * 'Action' fluent API allowing action chaining.
     * @param time  The amount of time to delay the next action in the queue from executing in milliseconds
     */
    delay(time) {
        this._queue.add(new Delay(time));
        return this;
    }
    /**
     * This method will add an action to the queue that will remove the actor from the
     * scene once it has completed its previous  Any actions on the
     * action queue after this action will not be executed.
     */
    die() {
        this._queue.add(new Die(this._entity));
        return this;
    }
    /**
     * This method allows you to call an arbitrary method as the next action in the
     * action queue. This is useful if you want to execute code in after a specific
     * action, i.e An actor arrives at a destination after traversing a path
     */
    callMethod(method) {
        this._queue.add(new CallMethod(method));
        return this;
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
        if (!times) {
            this.repeatForever(repeatBuilder);
            return this;
        }
        this._queue.add(new Repeat(this._entity, repeatBuilder, times));
        return this;
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
        this._queue.add(new RepeatForever(this._entity, repeatBuilder));
        return this;
    }
    /**
     * This method will cause the entity to follow another at a specified distance
     * @param entity           The entity to follow
     * @param followDistance  The distance to maintain when following, if not specified the actor will follow at the current distance.
     */
    follow(entity, followDistance) {
        if (followDistance === undefined) {
            this._queue.add(new Follow(this._entity, entity));
        }
        else {
            this._queue.add(new Follow(this._entity, entity, followDistance));
        }
        return this;
    }
    /**
     * This method will cause the entity to move towards another until they
     * collide "meet" at a specified speed.
     * @param entity  The entity to meet
     * @param speed  The speed in pixels per second to move, if not specified it will match the speed of the other actor
     */
    meet(entity, speed) {
        if (speed === undefined) {
            this._queue.add(new Meet(this._entity, entity));
        }
        else {
            this._queue.add(new Meet(this._entity, entity, speed));
        }
        return this;
    }
    /**
     * Returns a promise that resolves when the current action queue up to now
     * is finished.
     */
    toPromise() {
        const temp = new Promise((resolve) => {
            this._queue.add(new CallMethod(() => {
                resolve();
            }));
        });
        return temp;
    }
}
//# sourceMappingURL=ActionContext.js.map