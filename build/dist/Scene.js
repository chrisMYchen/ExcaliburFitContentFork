import { isScreenElement, ScreenElement } from './ScreenElement';
import { InitializeEvent, PreUpdateEvent, PostUpdateEvent, PreDrawEvent, PostDrawEvent, PreDebugDrawEvent, PostDebugDrawEvent } from './Events';
import { Logger } from './Util/Log';
import { Timer } from './Timer';
import { TileMap } from './TileMap';
import { Camera } from './Camera';
import { Actor } from './Actor';
import { Class } from './Class';
import * as Util from './Util/Util';
import { Trigger } from './Trigger';
import { SystemType } from './EntityComponentSystem/System';
import { World } from './EntityComponentSystem/World';
import { MotionSystem } from './Collision/MotionSystem';
import { CollisionSystem } from './Collision/CollisionSystem';
import { Entity } from './EntityComponentSystem/Entity';
import { GraphicsSystem } from './Graphics/GraphicsSystem';
import { DebugSystem } from './Debug/DebugSystem';
import { PointerSystem } from './Input/PointerSystem';
import { ActionsSystem } from './Actions/ActionsSystem';
import { IsometricEntitySystem } from './TileMap/IsometricEntitySystem';
import { OffscreenSystem } from './Graphics/OffscreenSystem';
/**
 * [[Actor|Actors]] are composed together into groupings called Scenes in
 * Excalibur. The metaphor models the same idea behind real world
 * actors in a scene. Only actors in scenes will be updated and drawn.
 *
 * Typical usages of a scene include: levels, menus, loading screens, etc.
 */
export class Scene extends Class {
    constructor() {
        super();
        this._logger = Logger.getInstance();
        /**
         * Gets or sets the current camera for the scene
         */
        this.camera = new Camera();
        /**
         * The ECS world for the scene
         */
        this.world = new World(this);
        this._isInitialized = false;
        this._timers = [];
        this._cancelQueue = [];
        // Initialize systems
        // Update
        this.world.add(new ActionsSystem());
        this.world.add(new MotionSystem());
        this.world.add(new CollisionSystem());
        this.world.add(new PointerSystem());
        this.world.add(new IsometricEntitySystem());
        // Draw
        this.world.add(new OffscreenSystem());
        this.world.add(new GraphicsSystem());
        this.world.add(new DebugSystem());
    }
    /**
     * The actors in the current scene
     */
    get actors() {
        return this.world.entityManager.entities.filter((e) => {
            return e instanceof Actor;
        });
    }
    /**
     * The entities in the current scene
     */
    get entities() {
        return this.world.entityManager.entities;
    }
    /**
     * The triggers in the current scene
     */
    get triggers() {
        return this.world.entityManager.entities.filter((e) => {
            return e instanceof Trigger;
        });
    }
    /**
     * The [[TileMap]]s in the scene, if any
     */
    get tileMaps() {
        return this.world.entityManager.entities.filter((e) => {
            return e instanceof TileMap;
        });
    }
    get timers() {
        return this._timers;
    }
    on(eventName, handler) {
        super.on(eventName, handler);
    }
    once(eventName, handler) {
        super.once(eventName, handler);
    }
    off(eventName, handler) {
        super.off(eventName, handler);
    }
    /**
     * This is called before the first update of the [[Scene]]. Initializes scene members like the camera. This method is meant to be
     * overridden. This is where initialization of child actors should take place.
     */
    onInitialize(_engine) {
        // will be overridden
    }
    /**
     * This is called when the scene is made active and started. It is meant to be overridden,
     * this is where you should setup any DOM UI or event handlers needed for the scene.
     */
    onActivate(_context) {
        // will be overridden
    }
    /**
     * This is called when the scene is made transitioned away from and stopped. It is meant to be overridden,
     * this is where you should cleanup any DOM UI or event handlers needed for the scene.
     */
    onDeactivate(_context) {
        // will be overridden
    }
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before a scene is updated.
     */
    onPreUpdate(_engine, _delta) {
        // will be overridden
    }
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after a scene is updated.
     */
    onPostUpdate(_engine, _delta) {
        // will be overridden
    }
    /**
     * Safe to override onPreDraw lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreDraw` is called directly before a scene is drawn.
     *
     */
    onPreDraw(_ctx, _delta) {
        // will be overridden
    }
    /**
     * Safe to override onPostDraw lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPostDraw` is called directly after a scene is drawn.
     *
     */
    onPostDraw(_ctx, _delta) {
        // will be overridden
    }
    /**
     * Initializes actors in the scene
     */
    _initializeChildren() {
        for (const child of this.entities) {
            child._initialize(this.engine);
        }
    }
    /**
     * Gets whether or not the [[Scene]] has been initialized
     */
    get isInitialized() {
        return this._isInitialized;
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Initializes the scene before the first update, meant to be called by engine not by users of
     * Excalibur
     * @internal
     */
    _initialize(engine) {
        if (!this.isInitialized) {
            this.engine = engine;
            // Initialize camera first
            this.camera._initialize(engine);
            this.world.systemManager.initialize();
            // This order is important! we want to be sure any custom init that add actors
            // fire before the actor init
            this.onInitialize.call(this, engine);
            this._initializeChildren();
            this._logger.debug('Scene.onInitialize', this, engine);
            this.eventDispatcher.emit('initialize', new InitializeEvent(engine, this));
            this._isInitialized = true;
        }
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Activates the scene with the base behavior, then calls the overridable `onActivate` implementation.
     * @internal
     */
    _activate(context) {
        this._logger.debug('Scene.onActivate', this);
        this.onActivate(context);
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Deactivates the scene with the base behavior, then calls the overridable `onDeactivate` implementation.
     * @internal
     */
    _deactivate(context) {
        this._logger.debug('Scene.onDeactivate', this);
        this.onDeactivate(context);
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPreUpdate]] lifecycle event
     * @internal
     */
    _preupdate(_engine, delta) {
        this.emit('preupdate', new PreUpdateEvent(_engine, delta, this));
        this.onPreUpdate(_engine, delta);
    }
    /**
     *  It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPostUpdate]] lifecycle event
     * @internal
     */
    _postupdate(_engine, delta) {
        this.emit('postupdate', new PostUpdateEvent(_engine, delta, this));
        this.onPostUpdate(_engine, delta);
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _predraw handler for [[onPreDraw]] lifecycle event
     *
     * @internal
     */
    _predraw(_ctx, _delta) {
        this.emit('predraw', new PreDrawEvent(_ctx, _delta, this));
        this.onPreDraw(_ctx, _delta);
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _postdraw handler for [[onPostDraw]] lifecycle event
     *
     * @internal
     */
    _postdraw(_ctx, _delta) {
        this.emit('postdraw', new PostDrawEvent(_ctx, _delta, this));
        this.onPostDraw(_ctx, _delta);
    }
    /**
     * Updates all the actors and timers in the scene. Called by the [[Engine]].
     * @param engine  Reference to the current Engine
     * @param delta   The number of milliseconds since the last update
     */
    update(engine, delta) {
        this._preupdate(engine, delta);
        // TODO differed entity removal for timers
        let i, len;
        // Remove timers in the cancel queue before updating them
        for (i = 0, len = this._cancelQueue.length; i < len; i++) {
            this.removeTimer(this._cancelQueue[i]);
        }
        this._cancelQueue.length = 0;
        // Cycle through timers updating timers
        for (const timer of this._timers) {
            timer.update(delta);
        }
        this.world.update(SystemType.Update, delta);
        // Camera last keeps renders smooth that are based on entity/actor
        if (this.camera) {
            this.camera.update(engine, delta);
        }
        this._collectActorStats(engine);
        this._postupdate(engine, delta);
    }
    /**
     * Draws all the actors in the Scene. Called by the [[Engine]].
     *
     * @param ctx    The current rendering context
     * @param delta  The number of milliseconds since the last draw
     */
    draw(ctx, delta) {
        var _a;
        this._predraw(ctx, delta);
        this.world.update(SystemType.Draw, delta);
        if ((_a = this.engine) === null || _a === void 0 ? void 0 : _a.isDebug) {
            this.debugDraw(ctx);
        }
        this._postdraw(ctx, delta);
    }
    /**
     * Draws all the actors' debug information in the Scene. Called by the [[Engine]].
     * @param ctx  The current rendering context
     */
    /* istanbul ignore next */
    debugDraw(ctx) {
        this.emit('predebugdraw', new PreDebugDrawEvent(ctx, this));
        // pass
        this.emit('postdebugdraw', new PostDebugDrawEvent(ctx, this));
    }
    /**
     * Checks whether an actor is contained in this scene or not
     */
    contains(actor) {
        return this.actors.indexOf(actor) > -1;
    }
    add(entity) {
        this.emit('entityadded', { target: entity });
        this.world.add(entity);
        entity.scene = this;
        if (entity instanceof Timer) {
            if (!Util.contains(this._timers, entity)) {
                this.addTimer(entity);
            }
            return;
        }
    }
    remove(entity) {
        if (entity instanceof Entity) {
            this.emit('entityremoved', { target: entity });
            if (entity.active) {
                entity.kill();
            }
            this.world.remove(entity);
        }
        if (entity instanceof Timer) {
            this.removeTimer(entity);
        }
    }
    /**
     * Removes all entities and timers from the scene, optionally indicate whether deferred should or shouldn't be used.
     *
     * By default entities use deferred removal
     * @param deferred
     */
    clear(deferred = true) {
        for (const entity of this.entities) {
            this.world.remove(entity, deferred);
        }
        for (const timer of this.timers) {
            this.removeTimer(timer);
        }
    }
    /**
     * Adds a [[Timer]] to the scene
     * @param timer  The timer to add
     */
    addTimer(timer) {
        this._timers.push(timer);
        timer.scene = this;
        return timer;
    }
    /**
     * Removes a [[Timer]] from the scene.
     * @warning Can be dangerous, use [[cancelTimer]] instead
     * @param timer  The timer to remove
     */
    removeTimer(timer) {
        const i = this._timers.indexOf(timer);
        if (i !== -1) {
            this._timers.splice(i, 1);
        }
        return timer;
    }
    /**
     * Cancels a [[Timer]], removing it from the scene nicely
     * @param timer  The timer to cancel
     */
    cancelTimer(timer) {
        this._cancelQueue.push(timer);
        return timer;
    }
    /**
     * Tests whether a [[Timer]] is active in the scene
     */
    isTimerActive(timer) {
        return this._timers.indexOf(timer) > -1 && !timer.complete;
    }
    isCurrentScene() {
        if (this.engine) {
            return this.engine.currentScene === this;
        }
        return false;
    }
    _collectActorStats(engine) {
        const screenElements = this.actors.filter((a) => a instanceof ScreenElement);
        for (const _ui of screenElements) {
            engine.stats.currFrame.actors.ui++;
        }
        for (const actor of this.actors) {
            engine.stats.currFrame.actors.alive++;
            for (const child of actor.children) {
                if (isScreenElement(child)) {
                    // TODO not true
                    engine.stats.currFrame.actors.ui++;
                }
                else {
                    engine.stats.currFrame.actors.alive++;
                }
            }
        }
    }
}
//# sourceMappingURL=Scene.js.map