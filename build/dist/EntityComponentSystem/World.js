import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { QueryManager } from './QueryManager';
import { System, SystemType } from './System';
import { SystemManager } from './SystemManager';
/**
 * The World is a self-contained entity component system for a particular context.
 */
export class World {
    /**
     * The context type is passed to the system updates
     * @param context
     */
    constructor(context) {
        this.context = context;
        this.queryManager = new QueryManager(this);
        this.entityManager = new EntityManager(this);
        this.systemManager = new SystemManager(this);
    }
    /**
     * Update systems by type and time elapsed in milliseconds
     */
    update(type, delta) {
        if (type === SystemType.Update) {
            this.entityManager.updateEntities(this.context, delta);
        }
        this.systemManager.updateSystems(type, this.context, delta);
        this.entityManager.findEntitiesForRemoval();
        this.entityManager.processComponentRemovals();
        this.entityManager.processEntityRemovals();
    }
    add(entityOrSystem) {
        if (entityOrSystem instanceof Entity) {
            this.entityManager.addEntity(entityOrSystem);
        }
        if (entityOrSystem instanceof System) {
            this.systemManager.addSystem(entityOrSystem);
        }
    }
    remove(entityOrSystem, deferred = true) {
        if (entityOrSystem instanceof Entity) {
            this.entityManager.removeEntity(entityOrSystem, deferred);
        }
        if (entityOrSystem instanceof System) {
            this.systemManager.removeSystem(entityOrSystem);
        }
    }
    clearEntities() {
        this.entityManager.clear();
    }
    clearSystems() {
        this.systemManager.clear();
    }
}
//# sourceMappingURL=World.js.map