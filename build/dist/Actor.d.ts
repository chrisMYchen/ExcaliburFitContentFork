import { InitializeEvent, KillEvent, PreUpdateEvent, PostUpdateEvent, PostCollisionEvent, PreCollisionEvent, CollisionStartEvent, CollisionEndEvent, PostKillEvent, PreKillEvent, GameEvent, ExitTriggerEvent, EnterTriggerEvent, EnterViewPortEvent, ExitViewPortEvent } from './Events';
import { Engine } from './Engine';
import { Color } from './Color';
import { CanInitialize, CanUpdate, CanBeKilled } from './Interfaces/LifecycleEvents';
import { Scene } from './Scene';
import { Logger } from './Util/Log';
import { Vector } from './Math/vector';
import { BodyComponent } from './Collision/BodyComponent';
import { Eventable } from './Interfaces/Evented';
import * as Events from './Events';
import { PointerEvents } from './Interfaces/PointerEventHandlers';
import { CollisionType } from './Collision/CollisionType';
import { Entity } from './EntityComponentSystem/Entity';
import { TransformComponent } from './EntityComponentSystem/Components/TransformComponent';
import { MotionComponent } from './EntityComponentSystem/Components/MotionComponent';
import { GraphicsComponent } from './Graphics/GraphicsComponent';
import { ColliderComponent } from './Collision/ColliderComponent';
import { Collider, CollisionGroup } from './Collision/Index';
import { PointerEvent } from './Input/PointerEvent';
import { WheelEvent } from './Input/WheelEvent';
import { PointerComponent } from './Input/PointerComponent';
import { ActionsComponent } from './Actions/ActionsComponent';
import { CoordPlane } from './Math/coord-plane';
/**
 * Type guard for checking if something is an Actor
 * @param x
 */
export declare function isActor(x: any): x is Actor;
/**
 * Actor contructor options
 */
export interface ActorArgs {
    /**
     * Optionally set the name of the actor, default is 'anonymous'
     */
    name?: string;
    /**
     * Optionally set the x position of the actor, default is 0
     */
    x?: number;
    /**
     * Optionally set the y position of the actor, default is 0
     */
    y?: number;
    /**
     * Optionally set the (x, y) position of the actor as a vector, default is (0, 0)
     */
    pos?: Vector;
    /**
     * Optionally set the coordinate plane of the actor, default is [[CoordPlane.World]] meaning actor is subject to camera positioning
     */
    coordPlane?: CoordPlane;
    /**
     * Optionally set the width of a box collider for the actor
     */
    width?: number;
    /**
     * Optionally set the height of a box collider for the actor
     */
    height?: number;
    /**
     * Optionally set the radius of the circle collider for the actor
     */
    radius?: number;
    /**
     * Optionally set the velocity of the actor in pixels/sec
     */
    vel?: Vector;
    /**
     * Optionally set the acceleration of the actor in pixels/sec^2
     */
    acc?: Vector;
    /**
     * Optionally se the rotation in radians (180 degrees = Math.PI radians)
     */
    rotation?: number;
    /**
     * Optionally set the angular velocity of the actor in radians/sec (180 degrees = Math.PI radians)
     */
    angularVelocity?: number;
    /**
     * Optionally set the scale of the actor's transform
     */
    scale?: Vector;
    /**
     * Optionally set the z index of the actor, default is 0
     */
    z?: number;
    /**
     * Optionally set the color of an actor, only used if no graphics are present
     * If a width/height or a radius was set a default graphic will be added
     */
    color?: Color;
    /**
     * Optionally set the visibility of the actor
     */
    visible?: boolean;
    /**
     * Optionally set the anchor for graphics in the actor
     */
    anchor?: Vector;
    /**
     * Optionally set the collision type
     */
    collisionType?: CollisionType;
    /**
     * Optionally supply a collider for an actor, if supplied ignores any supplied width/height
     */
    collider?: Collider;
    /**
     * Optionally suppy a [[CollisionGroup]]
     */
    collisionGroup?: CollisionGroup;
}
/**
 * The most important primitive in Excalibur is an `Actor`. Anything that
 * can move on the screen, collide with another `Actor`, respond to events,
 * or interact with the current scene, must be an actor. An `Actor` **must**
 * be part of a [[Scene]] for it to be drawn to the screen.
 */
export declare class Actor extends Entity implements Eventable, PointerEvents, CanInitialize, CanUpdate, CanBeKilled {
    /**
     * Set defaults for all Actors
     */
    static defaults: {
        anchor: Vector;
    };
    /**
     * The physics body the is associated with this actor. The body is the container for all physical properties, like position, velocity,
     * acceleration, mass, inertia, etc.
     */
    get body(): BodyComponent;
    /**
     * Access the Actor's built in [[TransformComponent]]
     */
    get transform(): TransformComponent;
    /**
     * Access the Actor's built in [[MotionComponent]]
     */
    get motion(): MotionComponent;
    /**
     * Access to the Actor's built in [[GraphicsComponent]]
     */
    get graphics(): GraphicsComponent;
    /**
     * Access to the Actor's built in [[ColliderComponent]]
     */
    get collider(): ColliderComponent;
    /**
     * Access to the Actor's built in [[PointerComponent]] config
     */
    get pointer(): PointerComponent;
    /**
     * Useful for quickly scripting actor behavior, like moving to a place, patrolling back and forth, blinking, etc.
     *
     *  Access to the Actor's built in [[ActionsComponent]] which forwards to the
     * [[ActionContext|Action context]] of the actor.
     */
    get actions(): ActionsComponent;
    /**
     * Gets the position vector of the actor in pixels
     */
    get pos(): Vector;
    /**
     * Sets the position vector of the actor in pixels
     */
    set pos(thePos: Vector);
    /**
     * Gets the position vector of the actor from the last frame
     */
    get oldPos(): Vector;
    /**
     * Sets the position vector of the actor in the last frame
     */
    set oldPos(thePos: Vector);
    /**
     * Gets the velocity vector of the actor in pixels/sec
     */
    get vel(): Vector;
    /**
     * Sets the velocity vector of the actor in pixels/sec
     */
    set vel(theVel: Vector);
    /**
     * Gets the velocity vector of the actor from the last frame
     */
    get oldVel(): Vector;
    /**
     * Sets the velocity vector of the actor from the last frame
     */
    set oldVel(theVel: Vector);
    /**
     * Gets the acceleration vector of the actor in pixels/second/second. An acceleration pointing down such as (0, 100) may be
     * useful to simulate a gravitational effect.
     */
    get acc(): Vector;
    /**
     * Sets the acceleration vector of teh actor in pixels/second/second
     */
    set acc(theAcc: Vector);
    /**
     * Sets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
     */
    set oldAcc(theAcc: Vector);
    /**
     * Gets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
     */
    get oldAcc(): Vector;
    /**
     * Gets the rotation of the actor in radians. 1 radian = 180/PI Degrees.
     */
    get rotation(): number;
    /**
     * Sets the rotation of the actor in radians. 1 radian = 180/PI Degrees.
     */
    set rotation(theAngle: number);
    /**
     * Gets the rotational velocity of the actor in radians/second
     */
    get angularVelocity(): number;
    /**
     * Sets the rotational velocity of the actor in radians/sec
     */
    set angularVelocity(angularVelocity: number);
    get scale(): Vector;
    set scale(scale: Vector);
    /**
     * The anchor to apply all actor related transformations like rotation,
     * translation, and scaling. By default the anchor is in the center of
     * the actor. By default it is set to the center of the actor (.5, .5)
     *
     * An anchor of (.5, .5) will ensure that drawings are centered.
     *
     * Use `anchor.setTo` to set the anchor to a different point using
     * values between 0 and 1. For example, anchoring to the top-left would be
     * `Actor.anchor.setTo(0, 0)` and top-right would be `Actor.anchor.setTo(0, 1)`.
     */
    private _anchor;
    get anchor(): Vector;
    set anchor(vec: Vector);
    private _handleAnchorChange;
    /**
     * Indicates whether the actor is physically in the viewport
     */
    get isOffScreen(): boolean;
    /**
     * Convenience reference to the global logger
     */
    logger: Logger;
    /**
     * Draggable helper
     */
    private _draggable;
    private _dragging;
    private _pointerDragStartHandler;
    private _pointerDragEndHandler;
    private _pointerDragMoveHandler;
    private _pointerDragLeaveHandler;
    get draggable(): boolean;
    set draggable(isDraggable: boolean);
    /**
     * Sets the color of the actor's current graphic
     */
    get color(): Color;
    set color(v: Color);
    private _color;
    /**
     *
     * @param config
     */
    constructor(config?: ActorArgs);
    /**
     * `onInitialize` is called before the first update of the actor. This method is meant to be
     * overridden. This is where initialization of child actors should take place.
     *
     * Synonymous with the event handler `.on('initialize', (evt) => {...})`
     */
    onInitialize(_engine: Engine): void;
    /**
     * Initializes this actor and all it's child actors, meant to be called by the Scene before first update not by users of Excalibur.
     *
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * @internal
     */
    _initialize(engine: Engine): void;
    on(eventName: Events.exittrigger, handler: (event: ExitTriggerEvent) => void): void;
    on(eventName: Events.entertrigger, handler: (event: EnterTriggerEvent) => void): void;
    /**
     * The **collisionstart** event is fired when a [[BodyComponent|physics body]], usually attached to an actor,
     *  first starts colliding with another [[BodyComponent|body]], and will not fire again while in contact until
     *  the the pair separates and collides again.
     * Use cases for the **collisionstart** event may be detecting when an actor has touched a surface
     * (like landing) or if a item has been touched and needs to be picked up.
     */
    on(eventName: Events.collisionstart, handler: (event: CollisionStartEvent) => void): void;
    /**
     * The **collisionend** event is fired when two [[BodyComponent|physics bodies]] are no longer in contact.
     * This event will not fire again until another collision and separation.
     *
     * Use cases for the **collisionend** event might be to detect when an actor has left a surface
     * (like jumping) or has left an area.
     */
    on(eventName: Events.collisionend, handler: (event: CollisionEndEvent) => void): void;
    /**
     * The **precollision** event is fired **every frame** where a collision pair is found and two
     * bodies are intersecting.
     *
     * This event is useful for building in custom collision resolution logic in Passive-Passive or
     * Active-Passive scenarios. For example in a breakout game you may want to tweak the angle of
     * ricochet of the ball depending on which side of the paddle you hit.
     */
    on(eventName: Events.precollision, handler: (event: PreCollisionEvent) => void): void;
    /**
     * The **postcollision** event is fired for **every frame** where collision resolution was performed.
     * Collision resolution is when two bodies influence each other and cause a response like bouncing
     * off one another. It is only possible to have *postcollision* event in Active-Active and Active-Fixed
     * type collision pairs.
     *
     * Post collision would be useful if you need to know that collision resolution is happening or need to
     * tweak the default resolution.
     */
    on(eventName: Events.postcollision, handler: (event: PostCollisionEvent) => void): void;
    on(eventName: Events.kill, handler: (event: KillEvent) => void): void;
    on(eventName: Events.prekill, handler: (event: PreKillEvent) => void): void;
    on(eventName: Events.postkill, handler: (event: PostKillEvent) => void): void;
    on(eventName: Events.initialize, handler: (event: InitializeEvent<Actor>) => void): void;
    on(eventName: Events.preupdate, handler: (event: PreUpdateEvent<Actor>) => void): void;
    on(eventName: Events.postupdate, handler: (event: PostUpdateEvent<Actor>) => void): void;
    on(eventName: Events.pointerup, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerdown, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerenter, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerleave, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointermove, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointercancel, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerwheel, handler: (event: WheelEvent) => void): void;
    on(eventName: Events.pointerdragstart, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerdragend, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerdragenter, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerdragleave, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.pointerdragmove, handler: (event: PointerEvent) => void): void;
    on(eventName: Events.enterviewport, handler: (event: EnterViewPortEvent) => void): void;
    on(eventName: Events.exitviewport, handler: (event: ExitViewPortEvent) => void): void;
    on(eventName: string, handler: (event: GameEvent<Actor>) => void): void;
    once(eventName: Events.exittrigger, handler: (event: ExitTriggerEvent) => void): void;
    once(eventName: Events.entertrigger, handler: (event: EnterTriggerEvent) => void): void;
    /**
     * The **collisionstart** event is fired when a [[BodyComponent|physics body]], usually attached to an actor,
     *  first starts colliding with another [[BodyComponent|body]], and will not fire again while in contact until
     *  the the pair separates and collides again.
     * Use cases for the **collisionstart** event may be detecting when an actor has touch a surface
     * (like landing) or if a item has been touched and needs to be picked up.
     */
    once(eventName: Events.collisionstart, handler: (event: CollisionStartEvent) => void): void;
    /**
     * The **collisionend** event is fired when two [[BodyComponent|physics bodies]] are no longer in contact.
     * This event will not fire again until another collision and separation.
     *
     * Use cases for the **collisionend** event might be to detect when an actor has left a surface
     * (like jumping) or has left an area.
     */
    once(eventName: Events.collisionend, handler: (event: CollisionEndEvent) => void): void;
    /**
     * The **precollision** event is fired **every frame** where a collision pair is found and two
     * bodies are intersecting.
     *
     * This event is useful for building in custom collision resolution logic in Passive-Passive or
     * Active-Passive scenarios. For example in a breakout game you may want to tweak the angle of
     * ricochet of the ball depending on which side of the paddle you hit.
     */
    once(eventName: Events.precollision, handler: (event: PreCollisionEvent) => void): void;
    /**
     * The **postcollision** event is fired for **every frame** where collision resolution was performed.
     * Collision resolution is when two bodies influence each other and cause a response like bouncing
     * off one another. It is only possible to have *postcollision* event in Active-Active and Active-Fixed
     * type collision pairs.
     *
     * Post collision would be useful if you need to know that collision resolution is happening or need to
     * tweak the default resolution.
     */
    once(eventName: Events.postcollision, handler: (event: PostCollisionEvent) => void): void;
    once(eventName: Events.kill, handler: (event: KillEvent) => void): void;
    once(eventName: Events.postkill, handler: (event: PostKillEvent) => void): void;
    once(eventName: Events.prekill, handler: (event: PreKillEvent) => void): void;
    once(eventName: Events.initialize, handler: (event: InitializeEvent<Actor>) => void): void;
    once(eventName: Events.preupdate, handler: (event: PreUpdateEvent<Actor>) => void): void;
    once(eventName: Events.postupdate, handler: (event: PostUpdateEvent<Actor>) => void): void;
    once(eventName: Events.pointerup, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerdown, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerenter, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerleave, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointermove, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointercancel, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerwheel, handler: (event: WheelEvent) => void): void;
    once(eventName: Events.pointerdragstart, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerdragend, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerdragenter, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerdragleave, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.pointerdragmove, handler: (event: PointerEvent) => void): void;
    once(eventName: Events.enterviewport, handler: (event: EnterViewPortEvent) => void): void;
    once(eventName: Events.exitviewport, handler: (event: ExitViewPortEvent) => void): void;
    once(eventName: string, handler: (event: GameEvent<Actor>) => void): void;
    off(eventName: Events.exittrigger, handler?: (event: ExitTriggerEvent) => void): void;
    off(eventName: Events.entertrigger, handler?: (event: EnterTriggerEvent) => void): void;
    /**
     * The **collisionstart** event is fired when a [[BodyComponent|physics body]], usually attached to an actor,
     *  first starts colliding with another [[BodyComponent|body]], and will not fire again while in contact until
     *  the the pair separates and collides again.
     * Use cases for the **collisionstart** event may be detecting when an actor has touch a surface
     * (like landing) or if a item has been touched and needs to be picked up.
     */
    off(eventName: Events.collisionstart, handler?: (event: CollisionStartEvent) => void): void;
    /**
     * The **collisionend** event is fired when two [[BodyComponent|physics bodies]] are no longer in contact.
     * This event will not fire again until another collision and separation.
     *
     * Use cases for the **collisionend** event might be to detect when an actor has left a surface
     * (like jumping) or has left an area.
     */
    off(eventName: Events.collisionend, handler?: (event: CollisionEndEvent) => void): void;
    /**
     * The **precollision** event is fired **every frame** where a collision pair is found and two
     * bodies are intersecting.
     *
     * This event is useful for building in custom collision resolution logic in Passive-Passive or
     * Active-Passive scenarios. For example in a breakout game you may want to tweak the angle of
     * ricochet of the ball depending on which side of the paddle you hit.
     */
    off(eventName: Events.precollision, handler?: (event: PreCollisionEvent) => void): void;
    /**
     * The **postcollision** event is fired for **every frame** where collision resolution was performed.
     * Collision resolution is when two bodies influence each other and cause a response like bouncing
     * off one another. It is only possible to have *postcollision* event in Active-Active and Active-Fixed
     * type collision pairs.
     *
     * Post collision would be useful if you need to know that collision resolution is happening or need to
     * tweak the default resolution.
     */
    off(eventName: Events.postcollision, handler: (event: PostCollisionEvent) => void): void;
    off(eventName: Events.pointerup, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerdown, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerenter, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerleave, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointermove, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointercancel, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerwheel, handler?: (event: WheelEvent) => void): void;
    off(eventName: Events.pointerdragstart, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerdragend, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerdragenter, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerdragleave, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.pointerdragmove, handler?: (event: PointerEvent) => void): void;
    off(eventName: Events.prekill, handler?: (event: PreKillEvent) => void): void;
    off(eventName: Events.postkill, handler?: (event: PostKillEvent) => void): void;
    off(eventName: Events.initialize, handler?: (event: Events.InitializeEvent<Actor>) => void): void;
    off(eventName: Events.postupdate, handler?: (event: Events.PostUpdateEvent<Actor>) => void): void;
    off(eventName: Events.preupdate, handler?: (event: Events.PreUpdateEvent<Actor>) => void): void;
    off(eventName: Events.enterviewport, handler?: (event: EnterViewPortEvent) => void): void;
    off(eventName: Events.exitviewport, handler?: (event: ExitViewPortEvent) => void): void;
    off(eventName: string, handler?: (event: GameEvent<Actor>) => void): void;
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _prekill handler for [[onPreKill]] lifecycle event
     * @internal
     */
    _prekill(_scene: Scene): void;
    /**
     * Safe to override onPreKill lifecycle event handler. Synonymous with `.on('prekill', (evt) =>{...})`
     *
     * `onPreKill` is called directly before an actor is killed and removed from its current [[Scene]].
     */
    onPreKill(_scene: Scene): void;
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _prekill handler for [[onPostKill]] lifecycle event
     * @internal
     */
    _postkill(_scene: Scene): void;
    /**
     * Safe to override onPostKill lifecycle event handler. Synonymous with `.on('postkill', (evt) => {...})`
     *
     * `onPostKill` is called directly after an actor is killed and remove from its current [[Scene]].
     */
    onPostKill(_scene: Scene): void;
    /**
     * If the current actor is a member of the scene, this will remove
     * it from the scene graph. It will no longer be drawn or updated.
     */
    kill(): void;
    /**
     * If the current actor is killed, it will now not be killed.
     */
    unkill(): void;
    /**
     * Indicates wether the actor has been killed.
     */
    isKilled(): boolean;
    /**
     * Gets the z-index of an actor. The z-index determines the relative order an actor is drawn in.
     * Actors with a higher z-index are drawn on top of actors with a lower z-index
     */
    get z(): number;
    /**
     * Sets the z-index of an actor and updates it in the drawing list for the scene.
     * The z-index determines the relative order an actor is drawn in.
     * Actors with a higher z-index are drawn on top of actors with a lower z-index
     * @param newZ new z-index to assign
     */
    set z(newZ: number);
    /**
     * Get the center point of an actor (global position)
     */
    get center(): Vector;
    /**
     * Get the local center point of an actor
     */
    get localCenter(): Vector;
    get width(): number;
    get height(): number;
    /**
     * Gets this actor's rotation taking into account any parent relationships
     *
     * @returns Rotation angle in radians
     */
    getGlobalRotation(): number;
    /**
     * Gets an actor's world position taking into account parent relationships, scaling, rotation, and translation
     *
     * @returns Position in world coordinates
     */
    getGlobalPos(): Vector;
    /**
     * Gets the global scale of the Actor
     */
    getGlobalScale(): Vector;
    /**
     * Tests whether the x/y specified are contained in the actor
     * @param x  X coordinate to test (in world coordinates)
     * @param y  Y coordinate to test (in world coordinates)
     * @param recurse checks whether the x/y are contained in any child actors (if they exist).
     */
    contains(x: number, y: number, recurse?: boolean): boolean;
    /**
     * Returns true if the two actor.collider's surfaces are less than or equal to the distance specified from each other
     * @param actor     Actor to test
     * @param distance  Distance in pixels to test
     */
    within(actor: Actor, distance: number): boolean;
    /**
     * Called by the Engine, updates the state of the actor
     * @internal
     * @param engine The reference to the current game engine
     * @param delta  The time elapsed since the last update in milliseconds
     */
    update(engine: Engine, delta: number): void;
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before an actor is updated.
     */
    onPreUpdate(_engine: Engine, _delta: number): void;
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('postupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after an actor is updated.
     */
    onPostUpdate(_engine: Engine, _delta: number): void;
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
}
