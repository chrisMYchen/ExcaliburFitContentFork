import { Scene, Util } from '..';
/**
 * The SystemManager is responsible for keeping track of all systems in a scene.
 * Systems are scene specific
 */
export class SystemManager {
    constructor(_world) {
        this._world = _world;
        /**
         * List of systems, to add a new system call [[SystemManager.addSystem]]
         */
        this.systems = [];
        this.initialized = false;
    }
    /**
     * Get a system registered in the manager by type
     * @param systemType
     */
    get(systemType) {
        return this.systems.find((s) => s instanceof systemType);
    }
    /**
     * Adds a system to the manager, it will now be updated every frame
     * @param system
     */
    addSystem(system) {
        // validate system has types
        if (!system.types || system.types.length === 0) {
            throw new Error(`Attempted to add a System without any types`);
        }
        const query = this._world.queryManager.createQuery(system.types);
        this.systems.push(system);
        this.systems.sort((a, b) => a.priority - b.priority);
        query.register(system);
        if (this.initialized && system.initialize) {
            system.initialize(this._world.context);
        }
    }
    /**
     * Removes a system from the manager, it will no longer be updated
     * @param system
     */
    removeSystem(system) {
        Util.removeItemFromArray(system, this.systems);
        const query = this._world.queryManager.getQuery(system.types);
        if (query) {
            query.unregister(system);
            this._world.queryManager.maybeRemoveQuery(query);
        }
    }
    /**
     * Initialize all systems in the manager
     *
     * Systems added after initialize() will be initialized on add
     */
    initialize() {
        if (!this.initialized) {
            this.initialized = true;
            for (const s of this.systems) {
                if (s.initialize) {
                    s.initialize(this._world.context);
                }
            }
        }
    }
    /**
     * Updates all systems
     * @param type whether this is an update or draw system
     * @param context context reference
     * @param delta time in milliseconds
     */
    updateSystems(type, context, delta) {
        const systems = this.systems.filter((s) => s.systemType === type);
        for (const s of systems) {
            if (s.preupdate) {
                s.preupdate(context, delta);
            }
        }
        for (const s of systems) {
            // Get entities that match the system types, pre-sort
            const entities = this._world.queryManager.getQuery(s.types).getEntities(s.sort);
            // Initialize entities if needed
            if (context instanceof Scene) {
                for (const entity of entities) {
                    entity._initialize(context === null || context === void 0 ? void 0 : context.engine);
                }
            }
            s.update(entities, delta);
        }
        for (const s of systems) {
            if (s.postupdate) {
                s.postupdate(context, delta);
            }
        }
    }
    clear() {
        for (const system of this.systems) {
            this.removeSystem(system);
        }
    }
}
//# sourceMappingURL=SystemManager.js.map