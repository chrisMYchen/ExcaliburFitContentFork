import { Logger } from './Util/Log';
import { Random } from './Math/Random';
/**
 * The Excalibur timer hooks into the internal timer and fires callbacks,
 * after a certain interval, optionally repeating.
 */
export class Timer {
    constructor(fcn, interval, repeats, numberOfRepeats, randomRange, random) {
        this._logger = Logger.getInstance();
        this.id = 0;
        this._elapsedTime = 0;
        this._totalTimeAlive = 0;
        this._running = false;
        this._numberOfTicks = 0;
        this.interval = 10;
        this.repeats = false;
        this.maxNumberOfRepeats = -1;
        this.randomRange = [0, 0];
        this._baseInterval = 10;
        this._generateRandomInterval = () => {
            return this._baseInterval + this.random.integer(this.randomRange[0], this.randomRange[1]);
        };
        this._complete = false;
        this.scene = null;
        if (typeof fcn !== 'function') {
            const options = fcn;
            fcn = options.fcn;
            interval = options.interval;
            repeats = options.repeats;
            numberOfRepeats = options.numberOfRepeats;
            randomRange = options.randomRange;
            random = options.random;
        }
        if (!!numberOfRepeats && numberOfRepeats >= 0) {
            this.maxNumberOfRepeats = numberOfRepeats;
            if (!repeats) {
                throw new Error('repeats must be set to true if numberOfRepeats is set');
            }
        }
        this.id = Timer._MAX_ID++;
        this._callbacks = [];
        this._baseInterval = this.interval = interval;
        if (!!randomRange) {
            if (randomRange[0] > randomRange[1]) {
                throw new Error('min value must be lower than max value for range');
            }
            //We use the instance of ex.Random to generate the range
            this.random = random !== null && random !== void 0 ? random : new Random();
            this.randomRange = randomRange;
            this.interval = this._generateRandomInterval();
            this.on(() => {
                this.interval = this._generateRandomInterval();
            });
        }
        ;
        this.repeats = repeats || this.repeats;
        if (fcn) {
            this.on(fcn);
        }
    }
    get complete() {
        return this._complete;
    }
    /**
     * Adds a new callback to be fired after the interval is complete
     * @param fcn The callback to be added to the callback list, to be fired after the interval is complete.
     */
    on(fcn) {
        this._callbacks.push(fcn);
    }
    /**
     * Removes a callback from the callback list to be fired after the interval is complete.
     * @param fcn The callback to be removed from the callback list, to be fired after the interval is complete.
     */
    off(fcn) {
        const index = this._callbacks.indexOf(fcn);
        this._callbacks.splice(index, 1);
    }
    /**
     * Updates the timer after a certain number of milliseconds have elapsed. This is used internally by the engine.
     * @param delta  Number of elapsed milliseconds since the last update.
     */
    update(delta) {
        if (this._running) {
            this._totalTimeAlive += delta;
            this._elapsedTime += delta;
            if (this.maxNumberOfRepeats > -1 && this._numberOfTicks >= this.maxNumberOfRepeats) {
                this._complete = true;
                this._running = false;
                this._elapsedTime = 0;
            }
            if (!this.complete && this._elapsedTime >= this.interval) {
                this._callbacks.forEach((c) => {
                    c.call(this);
                });
                this._numberOfTicks++;
                if (this.repeats) {
                    this._elapsedTime = 0;
                }
                else {
                    this._complete = true;
                    this._running = false;
                    this._elapsedTime = 0;
                }
            }
        }
    }
    /**
     * Resets the timer so that it can be reused, and optionally reconfigure the timers interval.
     *
     * Warning** you may need to call `timer.start()` again if the timer had completed
     * @param newInterval If specified, sets a new non-negative interval in milliseconds to refire the callback
     * @param newNumberOfRepeats If specified, sets a new non-negative upper limit to the number of time this timer executes
     */
    reset(newInterval, newNumberOfRepeats) {
        if (!!newInterval && newInterval >= 0) {
            this._baseInterval = this.interval = newInterval;
        }
        if (!!this.maxNumberOfRepeats && this.maxNumberOfRepeats >= 0) {
            this.maxNumberOfRepeats = newNumberOfRepeats;
            if (!this.repeats) {
                throw new Error('repeats must be set to true if numberOfRepeats is set');
            }
        }
        this._complete = false;
        this._elapsedTime = 0;
        this._numberOfTicks = 0;
    }
    get timesRepeated() {
        return this._numberOfTicks;
    }
    getTimeRunning() {
        return this._totalTimeAlive;
    }
    /**
     * @returns milliseconds until the next action callback, if complete will return 0
     */
    get timeToNextAction() {
        if (this.complete) {
            return 0;
        }
        return this.interval - this._elapsedTime;
    }
    /**
     * @returns milliseconds elapsed toward the next action
     */
    get timeElapsedTowardNextAction() {
        return this._elapsedTime;
    }
    get isRunning() {
        return this._running;
    }
    /**
     * Pauses the timer, time will no longer increment towards the next call
     */
    pause() {
        this._running = false;
        return this;
    }
    /**
     * Resumes the timer, time will now increment towards the next call.
     */
    resume() {
        this._running = true;
        return this;
    }
    /**
     * Starts the timer, if the timer was complete it will restart the timer and reset the elapsed time counter
     */
    start() {
        if (!this.scene) {
            this._logger.warn('Cannot start a timer not part of a scene, timer wont start until added');
        }
        this._running = true;
        if (this.complete) {
            this._complete = false;
            this._elapsedTime = 0;
            this._numberOfTicks = 0;
        }
        return this;
    }
    /**
     * Stops the timer and resets the elapsed time counter towards the next action invocation
     */
    stop() {
        this._running = false;
        this._elapsedTime = 0;
        this._numberOfTicks = 0;
        return this;
    }
    /**
     * Cancels the timer, preventing any further executions.
     */
    cancel() {
        this.pause();
        if (this.scene) {
            this.scene.cancelTimer(this);
        }
    }
}
Timer._MAX_ID = 0;
//# sourceMappingURL=Timer.js.map