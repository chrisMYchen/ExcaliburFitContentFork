import { Future } from './Future';
class AsyncWaitQueue {
    constructor() {
        // Code from StephenCleary https://gist.github.com/StephenCleary/ba50b2da419c03b9cba1d20cb4654d5e
        this._queue = [];
    }
    get length() {
        return this._queue.length;
    }
    enqueue() {
        const future = new Future();
        this._queue.push(future);
        return future.promise;
    }
    dequeue(value) {
        const future = this._queue.shift();
        future.resolve(value);
    }
}
/**
 * Semaphore allows you to limit the amount of async calls happening between `enter()` and `exit()`
 *
 * This can be useful when limiting the number of http calls, browser api calls, etc either for performance or to work
 * around browser limitations like max Image.decode() calls in chromium being 256.
 */
export class Semaphore {
    constructor(_count) {
        this._count = _count;
        this._waitQueue = new AsyncWaitQueue();
    }
    get count() {
        return this._count;
    }
    get waiting() {
        return this._waitQueue.length;
    }
    async enter() {
        if (this._count !== 0) {
            this._count--;
            return Promise.resolve();
        }
        return this._waitQueue.enqueue();
    }
    exit(count = 1) {
        if (count === 0) {
            return;
        }
        while (count !== 0 && this._waitQueue.length !== 0) {
            this._waitQueue.dequeue(null);
            count--;
        }
        this._count += count;
    }
}
//# sourceMappingURL=Semaphore.js.map