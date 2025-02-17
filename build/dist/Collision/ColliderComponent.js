import { Vector } from '../Math/vector';
import { TransformComponent } from '../EntityComponentSystem';
import { Component } from '../EntityComponentSystem/Component';
import { EventDispatcher } from '../EventDispatcher';
import { CollisionEndEvent, CollisionStartEvent, PostCollisionEvent, PreCollisionEvent } from '../Events';
import { Observable } from '../Util/Observable';
import { BoundingBox } from './BoundingBox';
import { CompositeCollider } from './Colliders/CompositeCollider';
import { Shape } from './Colliders/Shape';
export class ColliderComponent extends Component {
    constructor(collider) {
        super();
        this.type = 'ex.collider';
        this.events = new EventDispatcher();
        /**
         * Observable that notifies when a collider is added to the body
         */
        this.$colliderAdded = new Observable();
        /**
         * Observable that notifies when a collider is removed from the body
         */
        this.$colliderRemoved = new Observable();
        this.set(collider);
    }
    /**
     * Get the current collider geometry
     */
    get() {
        return this._collider;
    }
    /**
     * Set the collider geometry
     * @param collider
     * @returns the collider you set
     */
    set(collider) {
        this.clear();
        if (collider) {
            this._collider = collider;
            this._collider.owner = this.owner;
            this.events.wire(collider.events);
            this.$colliderAdded.notifyAll(collider);
            this.update();
        }
        return collider;
    }
    /**
     * Remove collider geometry from collider component
     */
    clear() {
        if (this._collider) {
            this.events.unwire(this._collider.events);
            this.$colliderRemoved.notifyAll(this._collider);
            this._collider.owner = null;
            this._collider = null;
        }
    }
    /**
     * Return world space bounds
     */
    get bounds() {
        var _a, _b;
        return (_b = (_a = this._collider) === null || _a === void 0 ? void 0 : _a.bounds) !== null && _b !== void 0 ? _b : new BoundingBox();
    }
    /**
     * Return local space bounds
     */
    get localBounds() {
        var _a, _b;
        return (_b = (_a = this._collider) === null || _a === void 0 ? void 0 : _a.localBounds) !== null && _b !== void 0 ? _b : new BoundingBox();
    }
    /**
     * Update the collider's transformed geometry
     */
    update() {
        var _a;
        const tx = (_a = this.owner) === null || _a === void 0 ? void 0 : _a.get(TransformComponent);
        if (this._collider) {
            this._collider.owner = this.owner;
            if (tx) {
                this._collider.update(tx.get());
            }
        }
    }
    /**
     * Collide component with another
     * @param other
     */
    collide(other) {
        let colliderA = this._collider;
        let colliderB = other._collider;
        if (!colliderA || !colliderB) {
            return [];
        }
        // If we have a composite lefthand side :(
        // Might bite us, but to avoid updating all the handlers make composite always left side
        let flipped = false;
        if (colliderB instanceof CompositeCollider) {
            colliderA = colliderB;
            colliderB = this._collider;
            flipped = true;
        }
        if (this._collider) {
            const contacts = colliderA.collide(colliderB);
            if (contacts) {
                if (flipped) {
                    contacts.forEach((contact) => {
                        contact.mtv = contact.mtv.negate();
                        contact.normal = contact.normal.negate();
                        contact.tangent = contact.normal.perpendicular();
                        contact.colliderA = this._collider;
                        contact.colliderB = other._collider;
                    });
                }
                return contacts;
            }
            return [];
        }
        return [];
    }
    onAdd(entity) {
        if (this._collider) {
            this.update();
        }
        // Wire up the collider events to the owning entity
        this.events.on('precollision', (evt) => {
            const precollision = evt;
            entity.events.emit('precollision', new PreCollisionEvent(precollision.target.owner, precollision.other.owner, precollision.side, precollision.intersection));
        });
        this.events.on('postcollision', (evt) => {
            const postcollision = evt;
            entity.events.emit('postcollision', new PostCollisionEvent(postcollision.target.owner, postcollision.other.owner, postcollision.side, postcollision.intersection));
        });
        this.events.on('collisionstart', (evt) => {
            const start = evt;
            entity.events.emit('collisionstart', new CollisionStartEvent(start.target.owner, start.other.owner, start.contact));
        });
        this.events.on('collisionend', (evt) => {
            const end = evt;
            entity.events.emit('collisionend', new CollisionEndEvent(end.target.owner, end.other.owner));
        });
    }
    onRemove() {
        this.events.clear();
        this.$colliderRemoved.notifyAll(this._collider);
    }
    /**
     * Sets up a box geometry based on the current bounds of the associated actor of this physics body.
     *
     * If no width/height are specified the body will attempt to use the associated actor's width/height.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useBoxCollider(width, height, anchor = Vector.Half, center = Vector.Zero) {
        const collider = Shape.Box(width, height, anchor, center);
        return (this.set(collider));
    }
    /**
     * Sets up a [[PolygonCollider|polygon]] collision geometry based on a list of of points relative
     *  to the anchor of the associated actor
     * of this physics body.
     *
     * Only [convex polygon](https://en.wikipedia.org/wiki/Convex_polygon) definitions are supported.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    usePolygonCollider(points, center = Vector.Zero) {
        const poly = Shape.Polygon(points, center);
        return (this.set(poly));
    }
    /**
     * Sets up a [[Circle|circle collision geometry]] as the only collider with a specified radius in pixels.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useCircleCollider(radius, center = Vector.Zero) {
        const collider = Shape.Circle(radius, center);
        return (this.set(collider));
    }
    /**
     * Sets up an [[Edge|edge collision geometry]] with a start point and an end point relative to the anchor of the associated actor
     * of this physics body.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useEdgeCollider(begin, end) {
        const collider = Shape.Edge(begin, end);
        return (this.set(collider));
    }
    /**
     * Setups up a [[CompositeCollider]] which can define any arbitrary set of excalibur colliders
     * @param colliders
     */
    useCompositeCollider(colliders) {
        return (this.set(new CompositeCollider(colliders)));
    }
}
//# sourceMappingURL=ColliderComponent.js.map