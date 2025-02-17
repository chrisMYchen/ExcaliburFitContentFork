import { Logger } from '..';
import { FpsSampler } from './Fps';
/**
 * Abstract Clock is the base type of all Clocks
 *
 * It has a few opinions
 * 1. It manages the calculation of what "elapsed" time means and thus maximum fps
 * 2. The default timing api is implemented in now()
 *
 * To implement your own clock, extend Clock and override start/stop to start and stop the clock, then call update() with whatever
 * method is unique to your clock implementation.
 */
export class Clock {
    constructor(options) {
        var _a, _b, _c;
        this._onFatalException = () => { };
        this._maxFps = Infinity;
        this._lastTime = 0;
        this._elapsed = 1;
        this._scheduledCbs = [];
        this._totalElapsed = 0;
        this._options = options;
        this.tick = options.tick;
        this._lastTime = (_a = this.now()) !== null && _a !== void 0 ? _a : 0;
        this._maxFps = (_b = options.maxFps) !== null && _b !== void 0 ? _b : this._maxFps;
        this._onFatalException = (_c = options.onFatalException) !== null && _c !== void 0 ? _c : this._onFatalException;
        this.fpsSampler = new FpsSampler({
            initialFps: 60,
            nowFn: () => this.now()
        });
    }
    /**
     * Get the elapsed time for the last completed frame
     */
    elapsed() {
        return this._elapsed;
    }
    /**
     * Get the current time in milliseconds
     */
    now() {
        return performance.now();
    }
    toTestClock() {
        const testClock = new TestClock({
            ...this._options,
            defaultUpdateMs: 16.6
        });
        return testClock;
    }
    toStandardClock() {
        const clock = new StandardClock({
            ...this._options
        });
        return clock;
    }
    setFatalExceptionHandler(handler) {
        this._onFatalException = handler;
    }
    /**
     * Schedule a callback to fire given a timeout in milliseconds using the excalibur [[Clock]]
     *
     * This is useful to use over the built in browser `setTimeout` because callbacks will be tied to the
     * excalibur update clock, instead of browser time, this means that callbacks wont fire if the game is
     * stopped or paused.
     *
     * @param cb callback to fire
     * @param timeoutMs Optionally specify a timeout in milliseconds from now, default is 0ms which means the next possible tick
     */
    schedule(cb, timeoutMs = 0) {
        // Scheduled based on internal elapsed time
        const scheduledTime = this._totalElapsed + timeoutMs;
        this._scheduledCbs.push([cb, scheduledTime]);
    }
    _runScheduledCbs() {
        // walk backwards to delete items as we loop
        for (let i = this._scheduledCbs.length - 1; i > -1; i--) {
            if (this._scheduledCbs[i][1] <= this._totalElapsed) {
                this._scheduledCbs[i][0]();
                this._scheduledCbs.splice(i, 1);
            }
        }
    }
    update(overrideUpdateMs) {
        try {
            this.fpsSampler.start();
            // Get the time to calculate time-elapsed
            const now = this.now();
            let elapsed = now - this._lastTime || 1; // first frame
            // Constrain fps
            const fpsInterval = (1000 / this._maxFps);
            // only run frame if enough time has elapsed
            if (elapsed >= fpsInterval) {
                let leftover = 0;
                if (fpsInterval !== 0) {
                    leftover = (elapsed % fpsInterval);
                    elapsed = elapsed - leftover; // shift elapsed to be "in phase" with the current loop fps
                }
                // Resolves issue #138 if the game has been paused, or blurred for
                // more than a 200 milliseconds, reset elapsed time to 1. This improves reliability
                // and provides more expected behavior when the engine comes back
                // into focus
                if (elapsed > 200) {
                    elapsed = 1;
                }
                // tick the mainloop and run scheduled callbacks
                this._elapsed = overrideUpdateMs || elapsed;
                this._totalElapsed += this._elapsed;
                this._runScheduledCbs();
                this.tick(overrideUpdateMs || elapsed);
                if (fpsInterval !== 0) {
                    this._lastTime = now - leftover;
                }
                else {
                    this._lastTime = now;
                }
                this.fpsSampler.end();
            }
        }
        catch (e) {
            this._onFatalException(e);
            this.stop();
        }
    }
}
/**
 * The [[StandardClock]] implements the requestAnimationFrame browser api to run the tick()
 */
export class StandardClock extends Clock {
    constructor(options) {
        super(options);
        this._running = false;
    }
    isRunning() {
        return this._running;
    }
    start() {
        if (this._running) {
            return;
        }
        this._running = true;
        const mainloop = () => {
            // stop the loop
            if (!this._running) {
                return;
            }
            try {
                // request next loop
                this._requestId = window.requestAnimationFrame(mainloop);
                this.update();
            }
            catch (e) {
                window.cancelAnimationFrame(this._requestId);
                throw e;
            }
        };
        // begin the first frame
        mainloop();
    }
    stop() {
        this._running = false;
    }
}
/**
 * The TestClock is meant for debugging interactions in excalibur that require precise timing to replicate or test
 */
export class TestClock extends Clock {
    constructor(options) {
        super({
            ...options
        });
        this._logger = Logger.getInstance();
        this._running = false;
        this._currentTime = 0;
        this._updateMs = options.defaultUpdateMs;
    }
    /**
     * Get the current time in milliseconds
     */
    now() {
        var _a;
        return (_a = this._currentTime) !== null && _a !== void 0 ? _a : 0;
    }
    isRunning() {
        return this._running;
    }
    start() {
        this._running = true;
    }
    stop() {
        this._running = false;
    }
    /**
     * Manually step the clock forward 1 tick, optionally specify an elapsed time in milliseconds
     * @param overrideUpdateMs
     */
    step(overrideUpdateMs) {
        const time = overrideUpdateMs !== null && overrideUpdateMs !== void 0 ? overrideUpdateMs : this._updateMs;
        if (this._running) {
            // to be comparable to RAF this needs to be a full blown Task
            // For example, images cannot decode synchronously in a single step
            this.update(time);
            this._currentTime += time;
        }
        else {
            this._logger.warn('The clock is not running, no step will be performed');
        }
    }
    /**
     * Run a number of steps that tick the clock, optionally specify an elapsed time in milliseconds
     * @param numberOfSteps
     * @param overrideUpdateMs
     */
    run(numberOfSteps, overrideUpdateMs) {
        for (let i = 0; i < numberOfSteps; i++) {
            this.step(overrideUpdateMs !== null && overrideUpdateMs !== void 0 ? overrideUpdateMs : this._updateMs);
        }
    }
}
//# sourceMappingURL=Clock.js.map