import { Logger } from '..';
export class Pool {
    constructor(builder, recycler, maxObjects = 100) {
        this.builder = builder;
        this.recycler = recycler;
        this.maxObjects = maxObjects;
        this.totalAllocations = 0;
        this.index = 0;
        this.objects = [];
        this.disableWarnings = false;
        this._logger = Logger.getInstance();
    }
    preallocate() {
        for (let i = 0; i < this.maxObjects; i++) {
            this.objects[i] = this.builder();
        }
    }
    /**
     * Use many instances out of the in the context and return all to the pool.
     *
     * By returning values out of the context they will be un-hooked from the pool and are free to be passed to consumers
     * @param context
     */
    using(context) {
        const result = context(this);
        if (result) {
            return this.done(...result);
        }
        return this.done();
    }
    /**
     * Use a single instance out of th pool and immediately return it to the pool
     * @param context
     */
    borrow(context) {
        const object = this.get();
        context(object);
        this.index--;
    }
    /**
     * Retrieve a value from the pool, will allocate a new instance if necessary or recycle from the pool
     * @param args
     */
    get(...args) {
        if (this.index === this.maxObjects) {
            if (!this.disableWarnings) {
                this._logger.warn('Max pooled objects reached, possible memory leak? Doubling');
            }
            this.maxObjects = this.maxObjects * 2;
        }
        if (this.objects[this.index]) {
            // Pool has an available object already constructed
            return this.recycler(this.objects[this.index++], ...args);
        }
        else {
            // New allocation
            this.totalAllocations++;
            const object = (this.objects[this.index++] = this.builder(...args));
            return object;
        }
    }
    done(...objects) {
        // All objects in pool now considered "free"
        this.index = 0;
        for (const object of objects) {
            const poolIndex = this.objects.indexOf(object);
            // Build a new object to take the pool place
            this.objects[poolIndex] = this.builder(); // TODO problematic 0-arg only support
            this.totalAllocations++;
        }
        return objects;
    }
}
//# sourceMappingURL=Pool.js.map