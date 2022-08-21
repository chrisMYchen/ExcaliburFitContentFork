import { Component, TagComponent } from './Component';
import { Observable } from '../Util/Observable';
import { Class } from '../Class';
import { InitializeEvent, PreUpdateEvent, PostUpdateEvent } from '../Events';
import { Util } from '..';
/**
 * AddedComponent message
 */
export class AddedComponent {
    constructor(data) {
        this.data = data;
        this.type = 'Component Added';
    }
}
/**
 * Type guard to know if message is f an Added Component
 */
export function isAddedComponent(x) {
    return !!x && x.type === 'Component Added';
}
/**
 * RemovedComponent message
 */
export class RemovedComponent {
    constructor(data) {
        this.data = data;
        this.type = 'Component Removed';
    }
}
/**
 * Type guard to know if message is for a Removed Component
 */
export function isRemovedComponent(x) {
    return !!x && x.type === 'Component Removed';
}
/**
 * An Entity is the base type of anything that can have behavior in Excalibur, they are part of the built in entity component system
 *
 * Entities can be strongly typed with the components they contain
 *
 * ```typescript
 * const entity = new Entity<ComponentA | ComponentB>();
 * entity.components.a; // Type ComponentA
 * entity.components.b; // Type ComponentB
 * ```
 */
export class Entity extends Class {
    constructor(components, name) {
        super();
        /**
         * The unique identifier for the entity
         */
        this.id = Entity._ID++;
        /**
         * The scene that the entity is in, if any
         */
        this.scene = null;
        this._name = 'anonymous';
        /**
         * Whether this entity is active, if set to false it will be reclaimed
         */
        this.active = true;
        /**
         * Bucket to hold on to deferred removals
         */
        this._componentsToRemove = [];
        this._componentTypeToInstance = new Map();
        this._componentStringToInstance = new Map();
        this._tagsMemo = [];
        this._typesMemo = [];
        /**
         * Observable that keeps track of component add or remove changes on the entity
         */
        this.componentAdded$ = new Observable();
        this.componentRemoved$ = new Observable();
        this._parent = null;
        this.childrenAdded$ = new Observable();
        this.childrenRemoved$ = new Observable();
        this._children = [];
        this._isInitialized = false;
        this._setName(name);
        if (components) {
            for (const component of components) {
                this.addComponent(component);
            }
        }
    }
    _setName(name) {
        if (name) {
            this._name = name;
        }
    }
    get name() {
        return this._name;
    }
    get events() {
        return this.eventDispatcher;
    }
    /**
     * Kill the entity, means it will no longer be updated. Kills are deferred to the end of the update.
     * If parented it will be removed from the parent when killed.
     */
    kill() {
        if (this.active) {
            this.active = false;
            this.unparent();
        }
    }
    isKilled() {
        return !this.active;
    }
    /**
     * Specifically get the tags on the entity from [[TagComponent]]
     */
    get tags() {
        return this._tagsMemo;
    }
    /**
     * Check if a tag exists on the entity
     * @param tag name to check for
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }
    /**
     * Adds a tag to an entity
     * @param tag
     * @returns Entity
     */
    addTag(tag) {
        return this.addComponent(new TagComponent(tag));
    }
    /**
     * Removes a tag on the entity
     *
     * Removals are deferred until the end of update
     * @param tag
     * @param force Remove component immediately, no deferred
     */
    removeTag(tag, force = false) {
        return this.removeComponent(tag, force);
    }
    /**
     * The types of the components on the Entity
     */
    get types() {
        return this._typesMemo;
    }
    _rebuildMemos() {
        this._tagsMemo = Array.from(this._componentStringToInstance.values())
            .filter((c) => c instanceof TagComponent)
            .map((c) => c.type);
        this._typesMemo = Array.from(this._componentStringToInstance.keys());
    }
    getComponents() {
        return Array.from(this._componentStringToInstance.values());
    }
    _notifyAddComponent(component) {
        this._rebuildMemos();
        const added = new AddedComponent({
            component,
            entity: this
        });
        this.componentAdded$.notifyAll(added);
    }
    _notifyRemoveComponent(component) {
        const removed = new RemovedComponent({
            component,
            entity: this
        });
        this.componentRemoved$.notifyAll(removed);
        this._rebuildMemos();
    }
    get parent() {
        return this._parent;
    }
    /**
     * Get the direct children of this entity
     */
    get children() {
        return this._children;
    }
    /**
     * Unparents this entity, if there is a parent. Otherwise it does nothing.
     */
    unparent() {
        if (this._parent) {
            this._parent.removeChild(this);
            this._parent = null;
        }
    }
    /**
     * Adds an entity to be a child of this entity
     * @param entity
     */
    addChild(entity) {
        if (entity.parent === null) {
            if (this.getAncestors().includes(entity)) {
                throw new Error('Cycle detected, cannot add entity');
            }
            this._children.push(entity);
            entity._parent = this;
            this.childrenAdded$.notifyAll(entity);
        }
        else {
            throw new Error('Entity already has a parent, cannot add without unparenting');
        }
        return this;
    }
    /**
     * Remove an entity from children if it exists
     * @param entity
     */
    removeChild(entity) {
        if (entity.parent === this) {
            Util.removeItemFromArray(entity, this._children);
            entity._parent = null;
            this.childrenRemoved$.notifyAll(entity);
        }
        return this;
    }
    /**
     * Removes all children from this entity
     */
    removeAllChildren() {
        // Avoid modifying the array issue by walking backwards
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.removeChild(this.children[i]);
        }
        return this;
    }
    /**
     * Returns a list of parent entities starting with the topmost parent. Includes the current entity.
     */
    getAncestors() {
        const result = [this];
        let current = this.parent;
        while (current) {
            result.push(current);
            current = current.parent;
        }
        return result.reverse();
    }
    /**
     * Returns a list of all the entities that descend from this entity. Includes the current entity.
     */
    getDescendants() {
        let result = [this];
        let queue = [this];
        while (queue.length > 0) {
            const curr = queue.pop();
            queue = queue.concat(curr.children);
            result = result.concat(curr.children);
        }
        return result;
    }
    /**
     * Creates a deep copy of the entity and a copy of all its components
     */
    clone() {
        const newEntity = new Entity();
        for (const c of this.types) {
            newEntity.addComponent(this.get(c).clone());
        }
        for (const child of this.children) {
            newEntity.addChild(child.clone());
        }
        return newEntity;
    }
    /**
     * Adds a copy of all the components from another template entity as a "prefab"
     * @param templateEntity Entity to use as a template
     * @param force Force component replacement if it already exists on the target entity
     */
    addTemplate(templateEntity, force = false) {
        for (const c of templateEntity.getComponents()) {
            this.addComponent(c.clone(), force);
        }
        for (const child of templateEntity.children) {
            this.addChild(child.clone().addTemplate(child));
        }
        return this;
    }
    /**
     * Adds a component to the entity
     * @param component Component or Entity to add copy of components from
     * @param force Optionally overwrite any existing components of the same type
     */
    addComponent(component, force = false) {
        // if component already exists, skip if not forced
        if (this.has(component.type)) {
            if (force) {
                // Remove existing component type if exists when forced
                this.removeComponent(component);
            }
            else {
                // early exit component exits
                return this;
            }
        }
        // TODO circular dependencies will be a problem
        if (component.dependencies && component.dependencies.length) {
            for (const ctor of component.dependencies) {
                this.addComponent(new ctor());
            }
        }
        component.owner = this;
        const constuctorType = component.constructor;
        this._componentTypeToInstance.set(constuctorType, component);
        this._componentStringToInstance.set(component.type, component);
        if (component.onAdd) {
            component.onAdd(this);
        }
        this._notifyAddComponent(component);
        return this;
    }
    /**
     * Removes a component from the entity, by default removals are deferred to the end of entity update to avoid consistency issues
     *
     * Components can be force removed with the `force` flag, the removal is not deferred and happens immediately
     * @param componentOrType
     * @param force
     */
    removeComponent(componentOrType, force = false) {
        if (force) {
            if (typeof componentOrType === 'string') {
                this._removeComponentByType(componentOrType);
            }
            else if (componentOrType instanceof Component) {
                this._removeComponentByType(componentOrType.type);
            }
        }
        else {
            this._componentsToRemove.push(componentOrType);
        }
        return this;
    }
    _removeComponentByType(type) {
        if (this.has(type)) {
            const component = this.get(type);
            component.owner = null;
            if (component.onRemove) {
                component.onRemove(this);
            }
            const ctor = component.constructor;
            this._componentTypeToInstance.delete(ctor);
            this._componentStringToInstance.delete(component.type);
            this._notifyRemoveComponent(component);
        }
    }
    /**
     * @hidden
     * @internal
     */
    processComponentRemoval() {
        for (const componentOrType of this._componentsToRemove) {
            const type = typeof componentOrType === 'string' ? componentOrType : componentOrType.type;
            this._removeComponentByType(type);
        }
        this._componentsToRemove.length = 0;
    }
    has(type) {
        if (typeof type === 'string') {
            return this._componentStringToInstance.has(type);
        }
        else {
            return this._componentTypeToInstance.has(type);
        }
    }
    get(type) {
        if (typeof type === 'string') {
            return this._componentStringToInstance.get(type);
        }
        else {
            return this._componentTypeToInstance.get(type);
        }
    }
    /**
     * Gets whether the actor is Initialized
     */
    get isInitialized() {
        return this._isInitialized;
    }
    /**
     * Initializes this entity, meant to be called by the Scene before first update not by users of Excalibur.
     *
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * @internal
     */
    _initialize(engine) {
        if (!this.isInitialized) {
            this.onInitialize(engine);
            super.emit('initialize', new InitializeEvent(engine, this));
            this._isInitialized = true;
        }
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPreUpdate]] lifecycle event
     * @internal
     */
    _preupdate(engine, delta) {
        this.emit('preupdate', new PreUpdateEvent(engine, delta, this));
        this.onPreUpdate(engine, delta);
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPostUpdate]] lifecycle event
     * @internal
     */
    _postupdate(engine, delta) {
        this.emit('postupdate', new PostUpdateEvent(engine, delta, this));
        this.onPostUpdate(engine, delta);
    }
    /**
     * `onInitialize` is called before the first update of the entity. This method is meant to be
     * overridden.
     *
     * Synonymous with the event handler `.on('initialize', (evt) => {...})`
     */
    onInitialize(_engine) {
        // Override me
    }
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before an entity is updated.
     */
    onPreUpdate(_engine, _delta) {
        // Override me
    }
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('postupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after an entity is updated.
     */
    onPostUpdate(_engine, _delta) {
        // Override me
    }
    /**
     *
     * Entity update lifecycle, called internally
     *
     * @internal
     * @param engine
     * @param delta
     */
    update(engine, delta) {
        this._initialize(engine);
        this._preupdate(engine, delta);
        for (const child of this.children) {
            child.update(engine, delta);
        }
        this._postupdate(engine, delta);
    }
}
Entity._ID = 0;
//# sourceMappingURL=Entity.js.map