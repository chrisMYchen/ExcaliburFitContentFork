import { Component, ComponentCtor } from './Component';
import { Observable, Message } from '../Util/Observable';
import { Class } from '../Class';
import { OnInitialize, OnPreUpdate, OnPostUpdate } from '../Interfaces/LifecycleEvents';
import { Engine } from '../Engine';
import { EventDispatcher } from '../EventDispatcher';
import { Scene } from '..';
/**
 * Interface holding an entity component pair
 */
export interface EntityComponent {
    component: Component;
    entity: Entity;
}
/**
 * AddedComponent message
 */
export declare class AddedComponent implements Message<EntityComponent> {
    data: EntityComponent;
    readonly type: 'Component Added';
    constructor(data: EntityComponent);
}
/**
 * Type guard to know if message is f an Added Component
 */
export declare function isAddedComponent(x: Message<EntityComponent>): x is AddedComponent;
/**
 * RemovedComponent message
 */
export declare class RemovedComponent implements Message<EntityComponent> {
    data: EntityComponent;
    readonly type: 'Component Removed';
    constructor(data: EntityComponent);
}
/**
 * Type guard to know if message is for a Removed Component
 */
export declare function isRemovedComponent(x: Message<EntityComponent>): x is RemovedComponent;
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
export declare class Entity extends Class implements OnInitialize, OnPreUpdate, OnPostUpdate {
    private static _ID;
    constructor(components?: Component[], name?: string);
    /**
     * The unique identifier for the entity
     */
    id: number;
    /**
     * The scene that the entity is in, if any
     */
    scene: Scene;
    private _name;
    protected _setName(name: string): void;
    get name(): string;
    get events(): EventDispatcher;
    /**
     * Whether this entity is active, if set to false it will be reclaimed
     */
    active: boolean;
    /**
     * Kill the entity, means it will no longer be updated. Kills are deferred to the end of the update.
     * If parented it will be removed from the parent when killed.
     */
    kill(): void;
    isKilled(): boolean;
    /**
     * Specifically get the tags on the entity from [[TagComponent]]
     */
    get tags(): readonly string[];
    /**
     * Check if a tag exists on the entity
     * @param tag name to check for
     */
    hasTag(tag: string): boolean;
    /**
     * Adds a tag to an entity
     * @param tag
     * @returns Entity
     */
    addTag(tag: string): Entity;
    /**
     * Removes a tag on the entity
     *
     * Removals are deferred until the end of update
     * @param tag
     * @param force Remove component immediately, no deferred
     */
    removeTag(tag: string, force?: boolean): Entity;
    /**
     * The types of the components on the Entity
     */
    get types(): string[];
    /**
     * Bucket to hold on to deferred removals
     */
    private _componentsToRemove;
    private _componentTypeToInstance;
    private _componentStringToInstance;
    private _tagsMemo;
    private _typesMemo;
    private _rebuildMemos;
    getComponents(): Component[];
    /**
     * Observable that keeps track of component add or remove changes on the entity
     */
    componentAdded$: Observable<AddedComponent>;
    private _notifyAddComponent;
    componentRemoved$: Observable<RemovedComponent>;
    private _notifyRemoveComponent;
    private _parent;
    get parent(): Entity;
    childrenAdded$: Observable<Entity>;
    childrenRemoved$: Observable<Entity>;
    private _children;
    /**
     * Get the direct children of this entity
     */
    get children(): readonly Entity[];
    /**
     * Unparents this entity, if there is a parent. Otherwise it does nothing.
     */
    unparent(): void;
    /**
     * Adds an entity to be a child of this entity
     * @param entity
     */
    addChild(entity: Entity): Entity;
    /**
     * Remove an entity from children if it exists
     * @param entity
     */
    removeChild(entity: Entity): Entity;
    /**
     * Removes all children from this entity
     */
    removeAllChildren(): Entity;
    /**
     * Returns a list of parent entities starting with the topmost parent. Includes the current entity.
     */
    getAncestors(): Entity[];
    /**
     * Returns a list of all the entities that descend from this entity. Includes the current entity.
     */
    getDescendants(): Entity[];
    /**
     * Creates a deep copy of the entity and a copy of all its components
     */
    clone(): Entity;
    /**
     * Adds a copy of all the components from another template entity as a "prefab"
     * @param templateEntity Entity to use as a template
     * @param force Force component replacement if it already exists on the target entity
     */
    addTemplate(templateEntity: Entity, force?: boolean): Entity;
    /**
     * Adds a component to the entity
     * @param component Component or Entity to add copy of components from
     * @param force Optionally overwrite any existing components of the same type
     */
    addComponent<T extends Component>(component: T, force?: boolean): Entity;
    /**
     * Removes a component from the entity, by default removals are deferred to the end of entity update to avoid consistency issues
     *
     * Components can be force removed with the `force` flag, the removal is not deferred and happens immediately
     * @param componentOrType
     * @param force
     */
    removeComponent<ComponentOrType extends string | Component>(componentOrType: ComponentOrType, force?: boolean): Entity;
    private _removeComponentByType;
    /**
     * @hidden
     * @internal
     */
    processComponentRemoval(): void;
    /**
     * Check if a component type exists
     * @param type
     */
    has<T extends Component>(type: ComponentCtor<T>): boolean;
    has(type: string): boolean;
    /**
     * Get a component by type with typecheck
     *
     * (Does not work on tag components, use .hasTag("mytag") instead)
     * @param type
     */
    get<T extends Component>(type: ComponentCtor<T>): T | null;
    get<T extends Component>(type: string): T | null;
    private _isInitialized;
    /**
     * Gets whether the actor is Initialized
     */
    get isInitialized(): boolean;
    /**
     * Initializes this entity, meant to be called by the Scene before first update not by users of Excalibur.
     *
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * @internal
     */
    _initialize(engine: Engine): void;
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPreUpdate]] lifecycle event
     * @internal
     */
    _preupdate(engine: Engine, delta: number): void;
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPostUpdate]] lifecycle event
     * @internal
     */
    _postupdate(engine: Engine, delta: number): void;
    /**
     * `onInitialize` is called before the first update of the entity. This method is meant to be
     * overridden.
     *
     * Synonymous with the event handler `.on('initialize', (evt) => {...})`
     */
    onInitialize(_engine: Engine): void;
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before an entity is updated.
     */
    onPreUpdate(_engine: Engine, _delta: number): void;
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('postupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after an entity is updated.
     */
    onPostUpdate(_engine: Engine, _delta: number): void;
    /**
     *
     * Entity update lifecycle, called internally
     *
     * @internal
     * @param engine
     * @param delta
     */
    update(engine: Engine, delta: number): void;
}
