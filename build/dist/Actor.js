import { KillEvent, PreUpdateEvent, PostUpdateEvent, PostKillEvent, PreKillEvent } from './Events';
import { Logger } from './Util/Log';
import { Vector, vec } from './Math/vector';
import { BodyComponent } from './Collision/BodyComponent';
import { CollisionType } from './Collision/CollisionType';
import { Entity } from './EntityComponentSystem/Entity';
import { TransformComponent } from './EntityComponentSystem/Components/TransformComponent';
import { MotionComponent } from './EntityComponentSystem/Components/MotionComponent';
import { GraphicsComponent } from './Graphics/GraphicsComponent';
import { Rectangle } from './Graphics/Rectangle';
import { ColliderComponent } from './Collision/ColliderComponent';
import { Shape } from './Collision/Colliders/Shape';
import { watch } from './Util/Watch';
import { Circle } from './Graphics/Circle';
import { PointerComponent } from './Input/PointerComponent';
import { ActionsComponent } from './Actions/ActionsComponent';
import { Raster } from './Graphics/Raster';
import { Text } from './Graphics/Text';
import { CoordPlane } from './Math/coord-plane';
/**
 * Type guard for checking if something is an Actor
 * @param x
 */
export function isActor(x) {
    return x instanceof Actor;
}
/**
 * The most important primitive in Excalibur is an `Actor`. Anything that
 * can move on the screen, collide with another `Actor`, respond to events,
 * or interact with the current scene, must be an actor. An `Actor` **must**
 * be part of a [[Scene]] for it to be drawn to the screen.
 */
export class Actor extends Entity {
    // #endregion
    /**
     *
     * @param config
     */
    constructor(config) {
        super();
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
        this._anchor = watch(Vector.Half, (v) => this._handleAnchorChange(v));
        /**
         * Convenience reference to the global logger
         */
        this.logger = Logger.getInstance();
        /**
         * Draggable helper
         */
        this._draggable = false;
        this._dragging = false;
        this._pointerDragStartHandler = () => {
            this._dragging = true;
        };
        this._pointerDragEndHandler = () => {
            this._dragging = false;
        };
        this._pointerDragMoveHandler = (pe) => {
            if (this._dragging) {
                this.pos = pe.worldPos;
            }
        };
        this._pointerDragLeaveHandler = (pe) => {
            if (this._dragging) {
                this.pos = pe.worldPos;
            }
        };
        const { name, x, y, pos, coordPlane, scale, width, height, radius, collider, vel, acc, rotation, angularVelocity, z, color, visible, anchor, collisionType, collisionGroup } = {
            ...config
        };
        this._setName(name);
        this.anchor = anchor !== null && anchor !== void 0 ? anchor : Actor.defaults.anchor.clone();
        const tx = new TransformComponent();
        this.addComponent(tx);
        this.pos = pos !== null && pos !== void 0 ? pos : vec(x !== null && x !== void 0 ? x : 0, y !== null && y !== void 0 ? y : 0);
        this.rotation = rotation !== null && rotation !== void 0 ? rotation : 0;
        this.scale = scale !== null && scale !== void 0 ? scale : vec(1, 1);
        this.z = z !== null && z !== void 0 ? z : 0;
        tx.coordPlane = coordPlane !== null && coordPlane !== void 0 ? coordPlane : CoordPlane.World;
        this.addComponent(new PointerComponent);
        this.addComponent(new GraphicsComponent({
            anchor: this.anchor
        }));
        this.addComponent(new MotionComponent());
        this.vel = vel !== null && vel !== void 0 ? vel : Vector.Zero;
        this.acc = acc !== null && acc !== void 0 ? acc : Vector.Zero;
        this.angularVelocity = angularVelocity !== null && angularVelocity !== void 0 ? angularVelocity : 0;
        this.addComponent(new ActionsComponent());
        this.addComponent(new BodyComponent());
        this.body.collisionType = collisionType !== null && collisionType !== void 0 ? collisionType : CollisionType.Passive;
        if (collisionGroup) {
            this.body.group = collisionGroup;
        }
        if (collider) {
            this.addComponent(new ColliderComponent(collider));
        }
        else if (radius) {
            this.addComponent(new ColliderComponent(Shape.Circle(radius)));
        }
        else {
            if (width > 0 && height > 0) {
                this.addComponent(new ColliderComponent(Shape.Box(width, height, this.anchor)));
            }
            else {
                this.addComponent(new ColliderComponent()); // no collider
            }
        }
        this.graphics.visible = visible !== null && visible !== void 0 ? visible : true;
        if (color) {
            this.color = color;
            if (width && height) {
                this.graphics.add(new Rectangle({
                    color: color,
                    width,
                    height
                }));
            }
            else if (radius) {
                this.graphics.add(new Circle({
                    color: color,
                    radius
                }));
            }
        }
    }
    /**
     * The physics body the is associated with this actor. The body is the container for all physical properties, like position, velocity,
     * acceleration, mass, inertia, etc.
     */
    get body() {
        return this.get(BodyComponent);
    }
    /**
     * Access the Actor's built in [[TransformComponent]]
     */
    get transform() {
        return this.get(TransformComponent);
    }
    /**
     * Access the Actor's built in [[MotionComponent]]
     */
    get motion() {
        return this.get(MotionComponent);
    }
    /**
     * Access to the Actor's built in [[GraphicsComponent]]
     */
    get graphics() {
        return this.get(GraphicsComponent);
    }
    /**
     * Access to the Actor's built in [[ColliderComponent]]
     */
    get collider() {
        return this.get(ColliderComponent);
    }
    /**
     * Access to the Actor's built in [[PointerComponent]] config
     */
    get pointer() {
        return this.get(PointerComponent);
    }
    /**
     * Useful for quickly scripting actor behavior, like moving to a place, patrolling back and forth, blinking, etc.
     *
     *  Access to the Actor's built in [[ActionsComponent]] which forwards to the
     * [[ActionContext|Action context]] of the actor.
     */
    get actions() {
        return this.get(ActionsComponent);
    }
    /**
     * Gets the position vector of the actor in pixels
     */
    get pos() {
        return this.transform.pos;
    }
    /**
     * Sets the position vector of the actor in pixels
     */
    set pos(thePos) {
        this.transform.pos = thePos.clone();
    }
    /**
     * Gets the position vector of the actor from the last frame
     */
    get oldPos() {
        return this.body.oldPos;
    }
    /**
     * Sets the position vector of the actor in the last frame
     */
    set oldPos(thePos) {
        this.body.oldPos.setTo(thePos.x, thePos.y);
    }
    /**
     * Gets the velocity vector of the actor in pixels/sec
     */
    get vel() {
        return this.motion.vel;
    }
    /**
     * Sets the velocity vector of the actor in pixels/sec
     */
    set vel(theVel) {
        this.motion.vel = theVel.clone();
    }
    /**
     * Gets the velocity vector of the actor from the last frame
     */
    get oldVel() {
        return this.body.oldVel;
    }
    /**
     * Sets the velocity vector of the actor from the last frame
     */
    set oldVel(theVel) {
        this.body.oldVel.setTo(theVel.x, theVel.y);
    }
    /**
     * Gets the acceleration vector of the actor in pixels/second/second. An acceleration pointing down such as (0, 100) may be
     * useful to simulate a gravitational effect.
     */
    get acc() {
        return this.motion.acc;
    }
    /**
     * Sets the acceleration vector of teh actor in pixels/second/second
     */
    set acc(theAcc) {
        this.motion.acc = theAcc.clone();
    }
    /**
     * Sets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
     */
    set oldAcc(theAcc) {
        this.body.oldAcc.setTo(theAcc.x, theAcc.y);
    }
    /**
     * Gets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
     */
    get oldAcc() {
        return this.body.oldAcc;
    }
    /**
     * Gets the rotation of the actor in radians. 1 radian = 180/PI Degrees.
     */
    get rotation() {
        return this.transform.rotation;
    }
    /**
     * Sets the rotation of the actor in radians. 1 radian = 180/PI Degrees.
     */
    set rotation(theAngle) {
        this.transform.rotation = theAngle;
    }
    /**
     * Gets the rotational velocity of the actor in radians/second
     */
    get angularVelocity() {
        return this.motion.angularVelocity;
    }
    /**
     * Sets the rotational velocity of the actor in radians/sec
     */
    set angularVelocity(angularVelocity) {
        this.motion.angularVelocity = angularVelocity;
    }
    get scale() {
        return this.get(TransformComponent).scale;
    }
    set scale(scale) {
        this.get(TransformComponent).scale = scale;
    }
    get anchor() {
        return this._anchor;
    }
    set anchor(vec) {
        this._anchor = watch(vec, (v) => this._handleAnchorChange(v));
        this._handleAnchorChange(vec);
    }
    _handleAnchorChange(v) {
        if (this.graphics) {
            this.graphics.anchor = v;
        }
    }
    /**
     * Indicates whether the actor is physically in the viewport
     */
    get isOffScreen() {
        return this.hasTag('ex.offscreen');
    }
    get draggable() {
        return this._draggable;
    }
    set draggable(isDraggable) {
        if (isDraggable) {
            if (isDraggable && !this._draggable) {
                this.on('pointerdragstart', this._pointerDragStartHandler);
                this.on('pointerdragend', this._pointerDragEndHandler);
                this.on('pointerdragmove', this._pointerDragMoveHandler);
                this.on('pointerdragleave', this._pointerDragLeaveHandler);
            }
            else if (!isDraggable && this._draggable) {
                this.off('pointerdragstart', this._pointerDragStartHandler);
                this.off('pointerdragend', this._pointerDragEndHandler);
                this.off('pointerdragmove', this._pointerDragMoveHandler);
                this.off('pointerdragleave', this._pointerDragLeaveHandler);
            }
            this._draggable = isDraggable;
        }
    }
    /**
     * Sets the color of the actor's current graphic
     */
    get color() {
        return this._color;
    }
    set color(v) {
        var _a;
        this._color = v.clone();
        const defaultLayer = this.graphics.layers.default;
        const currentGraphic = (_a = defaultLayer.graphics[0]) === null || _a === void 0 ? void 0 : _a.graphic;
        if (currentGraphic instanceof Raster || currentGraphic instanceof Text) {
            currentGraphic.color = this._color;
        }
    }
    /**
     * `onInitialize` is called before the first update of the actor. This method is meant to be
     * overridden. This is where initialization of child actors should take place.
     *
     * Synonymous with the event handler `.on('initialize', (evt) => {...})`
     */
    onInitialize(_engine) {
        // Override me
    }
    /**
     * Initializes this actor and all it's child actors, meant to be called by the Scene before first update not by users of Excalibur.
     *
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * @internal
     */
    _initialize(engine) {
        super._initialize(engine);
        for (const child of this.children) {
            child._initialize(engine);
        }
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
    // #endregion
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _prekill handler for [[onPreKill]] lifecycle event
     * @internal
     */
    _prekill(_scene) {
        super.emit('prekill', new PreKillEvent(this));
        this.onPreKill(_scene);
    }
    /**
     * Safe to override onPreKill lifecycle event handler. Synonymous with `.on('prekill', (evt) =>{...})`
     *
     * `onPreKill` is called directly before an actor is killed and removed from its current [[Scene]].
     */
    onPreKill(_scene) {
        // Override me
    }
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _prekill handler for [[onPostKill]] lifecycle event
     * @internal
     */
    _postkill(_scene) {
        super.emit('postkill', new PostKillEvent(this));
        this.onPostKill(_scene);
    }
    /**
     * Safe to override onPostKill lifecycle event handler. Synonymous with `.on('postkill', (evt) => {...})`
     *
     * `onPostKill` is called directly after an actor is killed and remove from its current [[Scene]].
     */
    onPostKill(_scene) {
        // Override me
    }
    /**
     * If the current actor is a member of the scene, this will remove
     * it from the scene graph. It will no longer be drawn or updated.
     */
    kill() {
        if (this.scene) {
            this._prekill(this.scene);
            this.emit('kill', new KillEvent(this));
            super.kill();
            this._postkill(this.scene);
        }
        else {
            this.logger.warn(`Cannot kill actor named "${this.name}", it was never added to the Scene`);
        }
    }
    /**
     * If the current actor is killed, it will now not be killed.
     */
    unkill() {
        this.active = true;
    }
    /**
     * Indicates wether the actor has been killed.
     */
    isKilled() {
        return !this.active;
    }
    /**
     * Gets the z-index of an actor. The z-index determines the relative order an actor is drawn in.
     * Actors with a higher z-index are drawn on top of actors with a lower z-index
     */
    get z() {
        return this.get(TransformComponent).z;
    }
    /**
     * Sets the z-index of an actor and updates it in the drawing list for the scene.
     * The z-index determines the relative order an actor is drawn in.
     * Actors with a higher z-index are drawn on top of actors with a lower z-index
     * @param newZ new z-index to assign
     */
    set z(newZ) {
        this.get(TransformComponent).z = newZ;
    }
    /**
     * Get the center point of an actor (global position)
     */
    get center() {
        const globalPos = this.getGlobalPos();
        return new Vector(globalPos.x + this.width / 2 - this.anchor.x * this.width, globalPos.y + this.height / 2 - this.anchor.y * this.height);
    }
    /**
     * Get the local center point of an actor
     */
    get localCenter() {
        return new Vector(this.pos.x + this.width / 2 - this.anchor.x * this.width, this.pos.y + this.height / 2 - this.anchor.y * this.height);
    }
    get width() {
        return this.collider.localBounds.width * this.getGlobalScale().x;
    }
    get height() {
        return this.collider.localBounds.height * this.getGlobalScale().y;
    }
    /**
     * Gets this actor's rotation taking into account any parent relationships
     *
     * @returns Rotation angle in radians
     */
    getGlobalRotation() {
        return this.get(TransformComponent).globalRotation;
    }
    /**
     * Gets an actor's world position taking into account parent relationships, scaling, rotation, and translation
     *
     * @returns Position in world coordinates
     */
    getGlobalPos() {
        return this.get(TransformComponent).globalPos;
    }
    /**
     * Gets the global scale of the Actor
     */
    getGlobalScale() {
        return this.get(TransformComponent).globalScale;
    }
    // #region Collision
    /**
     * Tests whether the x/y specified are contained in the actor
     * @param x  X coordinate to test (in world coordinates)
     * @param y  Y coordinate to test (in world coordinates)
     * @param recurse checks whether the x/y are contained in any child actors (if they exist).
     */
    contains(x, y, recurse = false) {
        const point = vec(x, y);
        const collider = this.get(ColliderComponent);
        collider.update();
        const geom = collider.get();
        if (!geom) {
            return false;
        }
        const containment = geom.contains(point);
        if (recurse) {
            return (containment ||
                this.children.some((child) => {
                    return child.contains(x, y, true);
                }));
        }
        return containment;
    }
    /**
     * Returns true if the two actor.collider's surfaces are less than or equal to the distance specified from each other
     * @param actor     Actor to test
     * @param distance  Distance in pixels to test
     */
    within(actor, distance) {
        const collider = this.get(ColliderComponent);
        const otherCollider = actor.get(ColliderComponent);
        const me = collider.get();
        const other = otherCollider.get();
        if (me && other) {
            return me.getClosestLineBetween(other).getLength() <= distance;
        }
        return false;
    }
    // #endregion
    // #region Update
    /**
     * Called by the Engine, updates the state of the actor
     * @internal
     * @param engine The reference to the current game engine
     * @param delta  The time elapsed since the last update in milliseconds
     */
    update(engine, delta) {
        this._initialize(engine);
        this._preupdate(engine, delta);
        this._postupdate(engine, delta);
    }
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before an actor is updated.
     */
    onPreUpdate(_engine, _delta) {
        // Override me
    }
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('postupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after an actor is updated.
     */
    onPostUpdate(_engine, _delta) {
        // Override me
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
}
// #region Properties
/**
 * Set defaults for all Actors
 */
Actor.defaults = {
    anchor: Vector.Half
};
//# sourceMappingURL=Actor.js.map