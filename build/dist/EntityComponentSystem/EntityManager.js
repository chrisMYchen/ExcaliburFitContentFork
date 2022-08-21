import { Entity, isAddedComponent, isRemovedComponent } from './Entity';
import { Util } from '..';
// Add/Remove entities and components
export class EntityManager {
    constructor(_world) {
        this._world = _world;
        this.entities = [];
        this._entityIndex = {};
        this._entitiesToRemove = [];
    }
    /**
     * Runs the entity lifecycle
     * @param _context
     */
    updateEntities(_context, elapsed) {
        for (const entity of this.entities) {
            // TODO is this right?
            entity.update(_context.engine, elapsed);
            if (!entity.active) {
                this.removeEntity(entity);
            }
        }
    }
    findEntitiesForRemoval() {
        for (const entity of this.entities) {
            if (!entity.active) {
                this.removeEntity(entity);
            }
        }
    }
    /**
     * EntityManager observes changes on entities
     * @param message
     */
    notify(message) {
        if (isAddedComponent(message)) {
            // we don't need the component, it's already on the entity
            this._world.queryManager.addEntity(message.data.entity);
        }
        if (isRemovedComponent(message)) {
            this._world.queryManager.removeComponent(message.data.entity, message.data.component);
        }
    }
    /**
     * Adds an entity to be tracked by the EntityManager
     * @param entity
     */
    addEntity(entity) {
        entity.active = true;
        entity.scene = this._world.context;
        if (entity && !this._entityIndex[entity.id]) {
            this._entityIndex[entity.id] = entity;
            this.entities.push(entity);
            this._world.queryManager.addEntity(entity);
            entity.componentAdded$.register(this);
            entity.componentRemoved$.register(this);
            // if entity has children
            entity.children.forEach((c) => {
                c.scene = entity.scene;
                this.addEntity(c);
            });
            entity.childrenAdded$.register({
                notify: (e) => {
                    this.addEntity(e);
                }
            });
            entity.childrenRemoved$.register({
                notify: (e) => {
                    this.removeEntity(e, false);
                }
            });
        }
    }
    removeEntity(idOrEntity, deferred = true) {
        var _a;
        let id = 0;
        if (idOrEntity instanceof Entity) {
            id = idOrEntity.id;
        }
        else {
            id = idOrEntity;
        }
        const entity = this._entityIndex[id];
        if (entity && entity.active) {
            entity.active = false;
        }
        if (entity && deferred) {
            this._entitiesToRemove.push(entity);
            return;
        }
        delete this._entityIndex[id];
        if (entity) {
            entity.scene = null;
            Util.removeItemFromArray(entity, this.entities);
            this._world.queryManager.removeEntity(entity);
            entity.componentAdded$.unregister(this);
            entity.componentRemoved$.unregister(this);
            // if entity has children
            entity.children.forEach((c) => {
                c.scene = null;
                this.removeEntity(c, deferred);
            });
            entity.childrenAdded$.clear();
            entity.childrenRemoved$.clear();
            // stats
            if ((_a = this._world.context) === null || _a === void 0 ? void 0 : _a.engine) {
                this._world.context.engine.stats.currFrame.actors.killed++;
            }
        }
    }
    processEntityRemovals() {
        for (const entity of this._entitiesToRemove) {
            if (entity.active) {
                continue;
            }
            this.removeEntity(entity, false);
        }
    }
    processComponentRemovals() {
        for (const entity of this.entities) {
            entity.processComponentRemoval();
        }
    }
    getById(id) {
        return this._entityIndex[id];
    }
    getByName(name) {
        return this.entities.filter(e => e.name === name);
    }
    clear() {
        for (const entity of this.entities) {
            this.removeEntity(entity);
        }
    }
}
//# sourceMappingURL=EntityManager.js.map