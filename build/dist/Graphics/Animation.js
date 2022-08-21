import { Graphic } from './Graphic';
import { EventDispatcher } from '../EventDispatcher';
import { Logger } from '../Util/Log';
import { clamp } from '../Math/util';
export var AnimationDirection;
(function (AnimationDirection) {
    /**
     * Animation is playing forwards
     */
    AnimationDirection["Forward"] = "forward";
    /**
     * Animation is play backwards
     */
    AnimationDirection["Backward"] = "backward";
})(AnimationDirection || (AnimationDirection = {}));
export var AnimationStrategy;
(function (AnimationStrategy) {
    /**
     * Animation ends without displaying anything
     */
    AnimationStrategy["End"] = "end";
    /**
     * Animation loops to the first frame after the last frame
     */
    AnimationStrategy["Loop"] = "loop";
    /**
     * Animation plays to the last frame, then backwards to the first frame, then repeats
     */
    AnimationStrategy["PingPong"] = "pingpong";
    /**
     * Animation ends stopping on the last frame
     */
    AnimationStrategy["Freeze"] = "freeze";
})(AnimationStrategy || (AnimationStrategy = {}));
/**
 * Create an Animation given a list of [[Frame|frames]] in [[AnimationOptions]]
 *
 * To create an Animation from a [[SpriteSheet]], use [[Animation.fromSpriteSheet]]
 */
export class Animation extends Graphic {
    constructor(options) {
        var _a, _b;
        super(options);
        this.events = new EventDispatcher(); // TODO replace with new Emitter
        this.frames = [];
        this.strategy = AnimationStrategy.Loop;
        this.frameDuration = 100;
        this.timeScale = 1;
        this._idempotencyToken = -1;
        this._firstTick = true;
        this._currentFrame = 0;
        this._timeLeftInFrame = 0;
        this._direction = 1; // TODO only used in ping-pong
        this._done = false;
        this._playing = true;
        this._reversed = false;
        this.frames = options.frames;
        this.strategy = (_a = options.strategy) !== null && _a !== void 0 ? _a : this.strategy;
        this.frameDuration = options.totalDuration ? options.totalDuration / this.frames.length : (_b = options.frameDuration) !== null && _b !== void 0 ? _b : this.frameDuration;
        if (options.reverse) {
            this.reverse();
        }
        this.goToFrame(0);
    }
    clone() {
        return new Animation({
            frames: this.frames.map((f) => ({ ...f })),
            frameDuration: this.frameDuration,
            reverse: this._reversed,
            strategy: this.strategy,
            ...this.cloneGraphicOptions()
        });
    }
    get width() {
        const maybeFrame = this.currentFrame;
        if (maybeFrame) {
            return Math.abs(maybeFrame.graphic.width * this.scale.x);
        }
        return 0;
    }
    get height() {
        const maybeFrame = this.currentFrame;
        if (maybeFrame) {
            return Math.abs(maybeFrame.graphic.height * this.scale.y);
        }
        return 0;
    }
    /**
     * Create an Animation from a [[SpriteSheet]], a list of indices into the sprite sheet, a duration per frame
     * and optional [[AnimationStrategy]]
     *
     * Example:
     * ```typescript
     * const spriteSheet = SpriteSheet.fromImageSource({...});
     *
     * const anim = Animation.fromSpriteSheet(spriteSheet, range(0, 5), 200, AnimationStrategy.Loop);
     * ```
     *
     * @param spriteSheet
     * @param frameIndices
     * @param durationPerFrameMs
     * @param strategy
     */
    static fromSpriteSheet(spriteSheet, frameIndices, durationPerFrameMs, strategy = AnimationStrategy.Loop) {
        const maxIndex = spriteSheet.sprites.length - 1;
        const invalidIndices = frameIndices.filter((index) => index < 0 || index > maxIndex);
        if (invalidIndices.length) {
            Animation._LOGGER.warn(`Indices into SpriteSheet were provided that don\'t exist: ${invalidIndices.join(',')} no frame will be shown`);
        }
        return new Animation({
            frames: spriteSheet.sprites
                .filter((_, index) => frameIndices.indexOf(index) > -1)
                .map((f) => ({
                graphic: f,
                duration: durationPerFrameMs
            })),
            strategy: strategy
        });
    }
    /**
     * Returns the current Frame of the animation
     */
    get currentFrame() {
        if (this._currentFrame >= 0 && this._currentFrame < this.frames.length) {
            return this.frames[this._currentFrame];
        }
        return null;
    }
    /**
     * Returns the current frame index of the animation
     */
    get currentFrameIndex() {
        return this._currentFrame;
    }
    /**
     * Returns `true` if the animation is playing
     */
    get isPlaying() {
        return this._playing;
    }
    /**
     * Reverses the play direction of the Animation, this preserves the current frame
     */
    reverse() {
        // Don't mutate with the original frame list, create a copy
        this.frames = this.frames.slice().reverse();
        this._reversed = !this._reversed;
    }
    /**
     * Returns the current play direction of the animation
     */
    get direction() {
        // Keep logically consistent with ping-pong direction
        // If ping-pong is forward = 1 and reversed is true then we are logically reversed
        const reversed = (this._reversed && this._direction === 1) ? true : false;
        return reversed ? AnimationDirection.Backward : AnimationDirection.Forward;
    }
    /**
     * Plays or resumes the animation from the current frame
     */
    play() {
        this._playing = true;
    }
    /**
     * Pauses the animation on the current frame
     */
    pause() {
        this._playing = false;
        this._firstTick = true; // firstTick must be set to emit the proper frame event
    }
    /**
     * Reset the animation back to the beginning, including if the animation were done
     */
    reset() {
        this._done = false;
        this._firstTick = true;
        this._currentFrame = 0;
    }
    /**
     * Returns `true` if the animation can end
     */
    get canFinish() {
        switch (this.strategy) {
            case AnimationStrategy.End:
            case AnimationStrategy.Freeze: {
                return true;
            }
            default: {
                return false;
            }
        }
    }
    /**
     * Returns `true` if the animation is done, for looping type animations
     * `ex.AnimationStrategy.PingPong` and `ex.AnimationStrategy.Loop` this will always return `false`
     *
     * See the `ex.Animation.canFinish()` method to know if an animation type can end
     */
    get done() {
        return this._done;
    }
    /**
     * Jump the animation immediately to a specific frame if it exists
     * @param frameNumber
     */
    goToFrame(frameNumber) {
        this._currentFrame = frameNumber;
        this._timeLeftInFrame = this.frameDuration;
        const maybeFrame = this.frames[this._currentFrame];
        if (maybeFrame && !this._done) {
            this._timeLeftInFrame = (maybeFrame === null || maybeFrame === void 0 ? void 0 : maybeFrame.duration) || this.frameDuration;
            this.events.emit('frame', maybeFrame);
        }
    }
    _nextFrame() {
        const currentFrame = this._currentFrame;
        if (this._done) {
            return currentFrame;
        }
        let next = -1;
        switch (this.strategy) {
            case AnimationStrategy.Loop: {
                next = (currentFrame + 1) % this.frames.length;
                if (next === 0) {
                    this.events.emit('loop', this);
                }
                break;
            }
            case AnimationStrategy.End: {
                next = currentFrame + 1;
                if (next >= this.frames.length) {
                    this._done = true;
                    this._currentFrame = this.frames.length;
                    this.events.emit('end', this);
                }
                break;
            }
            case AnimationStrategy.Freeze: {
                next = clamp(currentFrame + 1, 0, this.frames.length - 1);
                if (next >= this.frames.length - 1) {
                    this._done = true;
                    this.events.emit('end', this);
                }
                break;
            }
            case AnimationStrategy.PingPong: {
                if (currentFrame + this._direction >= this.frames.length) {
                    this._direction = -1;
                    this.events.emit('loop', this);
                }
                if (currentFrame + this._direction < 0) {
                    this._direction = 1;
                    this.events.emit('loop', this);
                }
                next = currentFrame + (this._direction % this.frames.length);
                break;
            }
        }
        return next;
    }
    /**
     * Called internally by Excalibur to update the state of the animation potential update the current frame
     * @param elapsedMilliseconds Milliseconds elapsed
     * @param idempotencyToken Prevents double ticking in a frame by passing a unique token to the frame
     */
    tick(elapsedMilliseconds, idempotencyToken = 0) {
        if (this._idempotencyToken === idempotencyToken) {
            return;
        }
        this._idempotencyToken = idempotencyToken;
        if (!this._playing) {
            return;
        }
        // if it's the first frame emit frame event
        if (this._firstTick) {
            this._firstTick = false;
            this.events.emit('frame', this.currentFrame);
        }
        this._timeLeftInFrame -= elapsedMilliseconds * this.timeScale;
        if (this._timeLeftInFrame <= 0) {
            this.goToFrame(this._nextFrame());
        }
    }
    _drawImage(ctx, x, y) {
        if (this.currentFrame) {
            this.currentFrame.graphic.draw(ctx, x, y);
        }
    }
}
Animation._LOGGER = Logger.getInstance();
//# sourceMappingURL=Animation.js.map