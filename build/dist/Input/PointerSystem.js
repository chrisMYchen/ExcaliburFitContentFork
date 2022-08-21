import { ColliderComponent } from '../Collision/ColliderComponent';
import { System, TransformComponent, SystemType, isAddedSystemEntity } from '../EntityComponentSystem';
import { GraphicsComponent } from '../Graphics/GraphicsComponent';
import { PointerComponent } from './PointerComponent';
import { CoordPlane } from '../Math/coord-plane';
/**
 * The PointerSystem is responsible for dispatching pointer events to entities
 * that need them.
 *
 * The PointerSystem can be optionally configured by the [[PointerComponent]], by default Entities use
 * the [[Collider]]'s shape for pointer events.
 */
export class PointerSystem extends System {
    constructor() {
        super(...arguments);
        this.types = ['ex.transform', 'ex.pointer'];
        this.systemType = SystemType.Update;
        this.priority = -1;
        /**
         * Optionally override component configuration for all entities
         */
        this.overrideUseColliderShape = false;
        /**
         * Optionally override component configuration for all entities
         */
        this.overrideUseGraphicsBounds = false;
        this.lastFrameEntityToPointers = new Map();
        this.currentFrameEntityToPointers = new Map();
        this._sortedTransforms = [];
        this._sortedEntities = [];
        this._zHasChanged = false;
        this._zIndexUpdate = () => {
            this._zHasChanged = true;
        };
    }
    initialize(scene) {
        this._engine = scene.engine;
    }
    preupdate() {
        // event receiver might change per frame
        this._receiver = this._engine.input.pointers;
        if (this._zHasChanged) {
            this._sortedTransforms.sort((a, b) => {
                return b.z - a.z;
            });
            this._sortedEntities = this._sortedTransforms.map(t => t.owner);
            this._zHasChanged = false;
        }
    }
    notify(entityAddedOrRemoved) {
        if (isAddedSystemEntity(entityAddedOrRemoved)) {
            const tx = entityAddedOrRemoved.data.get(TransformComponent);
            this._sortedTransforms.push(tx);
            this._sortedEntities.push(tx.owner);
            tx.zIndexChanged$.subscribe(this._zIndexUpdate);
            this._zHasChanged = true;
        }
        else {
            const tx = entityAddedOrRemoved.data.get(TransformComponent);
            tx.zIndexChanged$.unsubscribe(this._zIndexUpdate);
            const index = this._sortedTransforms.indexOf(tx);
            if (index > -1) {
                this._sortedTransforms.splice(index, 1);
                this._sortedEntities.splice(index, 1);
            }
        }
    }
    entityCurrentlyUnderPointer(entity, pointerId) {
        return this.currentFrameEntityToPointers.has(entity.id) &&
            this.currentFrameEntityToPointers.get(entity.id).includes(pointerId);
    }
    entityWasUnderPointer(entity, pointerId) {
        return this.lastFrameEntityToPointers.has(entity.id) &&
            this.lastFrameEntityToPointers.get(entity.id).includes(pointerId);
    }
    entered(entity, pointerId) {
        return this.entityCurrentlyUnderPointer(entity, pointerId) &&
            !this.lastFrameEntityToPointers.has(entity.id);
    }
    left(entity, pointerId) {
        return !this.currentFrameEntityToPointers.has(entity.id) &&
            this.entityWasUnderPointer(entity, pointerId);
    }
    addPointerToEntity(entity, pointerId) {
        if (!this.currentFrameEntityToPointers.has(entity.id)) {
            this.currentFrameEntityToPointers.set(entity.id, [pointerId]);
            return;
        }
        const pointers = this.currentFrameEntityToPointers.get(entity.id);
        this.currentFrameEntityToPointers.set(entity.id, pointers.concat(pointerId));
    }
    update(_entities) {
        // Locate all the pointer/entity mappings
        this._processPointerToEntity(this._sortedEntities);
        // Dispatch pointer events on entities
        this._dispatchEvents(this._sortedEntities);
        // Clear last frame's events
        this._receiver.update();
        this.lastFrameEntityToPointers.clear();
        this.lastFrameEntityToPointers = new Map(this.currentFrameEntityToPointers);
        this.currentFrameEntityToPointers.clear();
        this._receiver.clear();
    }
    _processPointerToEntity(entities) {
        var _a;
        let transform;
        let collider;
        let graphics;
        let pointer;
        // TODO probably a spatial partition optimization here to quickly query bounds for pointer
        // doesn't seem to cause issues tho for perf
        // Pre-process find entities under pointers
        for (const entity of entities) {
            transform = entity.get(TransformComponent);
            pointer = (_a = entity.get(PointerComponent)) !== null && _a !== void 0 ? _a : new PointerComponent;
            // Check collider contains pointer
            collider = entity.get(ColliderComponent);
            if (collider && (pointer.useColliderShape || this.overrideUseColliderShape)) {
                collider.update();
                const geom = collider.get();
                if (geom) {
                    for (const [pointerId, pos] of this._receiver.currentFramePointerCoords.entries()) {
                        if (geom.contains(transform.coordPlane === CoordPlane.World ? pos.worldPos : pos.screenPos)) {
                            this.addPointerToEntity(entity, pointerId);
                        }
                    }
                }
            }
            // Check graphics contains pointer
            graphics = entity.get(GraphicsComponent);
            if (graphics && (pointer.useGraphicsBounds || this.overrideUseGraphicsBounds)) {
                const graphicBounds = graphics.localBounds.transform(transform.get().matrix);
                for (const [pointerId, pos] of this._receiver.currentFramePointerCoords.entries()) {
                    if (graphicBounds.contains(transform.coordPlane === CoordPlane.World ? pos.worldPos : pos.screenPos)) {
                        this.addPointerToEntity(entity, pointerId);
                    }
                }
            }
        }
    }
    _processDownAndEmit(entity) {
        const lastDownPerPointer = new Map();
        // Loop through down and dispatch to entities
        for (const event of this._receiver.currentFrameDown) {
            if (event.active && entity.active && this.entityCurrentlyUnderPointer(entity, event.pointerId)) {
                entity.events.emit('pointerdown', event);
                if (this._receiver.isDragStart(event.pointerId)) {
                    entity.events.emit('pointerdragstart', event);
                }
            }
            lastDownPerPointer.set(event.pointerId, event);
        }
        return lastDownPerPointer;
    }
    _processUpAndEmit(entity) {
        const lastUpPerPointer = new Map();
        // Loop through up and dispatch to entities
        for (const event of this._receiver.currentFrameUp) {
            if (event.active && entity.active && this.entityCurrentlyUnderPointer(entity, event.pointerId)) {
                entity.events.emit('pointerup', event);
                if (this._receiver.isDragEnd(event.pointerId)) {
                    entity.events.emit('pointerdragend', event);
                }
            }
            lastUpPerPointer.set(event.pointerId, event);
        }
        return lastUpPerPointer;
    }
    _processMoveAndEmit(entity) {
        const lastMovePerPointer = new Map();
        // Loop through move and dispatch to entities
        for (const event of this._receiver.currentFrameMove) {
            if (event.active && entity.active && this.entityCurrentlyUnderPointer(entity, event.pointerId)) {
                // move
                entity.events.emit('pointermove', event);
                if (this._receiver.isDragging(event.pointerId)) {
                    entity.events.emit('pointerdragmove', event);
                }
            }
            lastMovePerPointer.set(event.pointerId, event);
        }
        return lastMovePerPointer;
    }
    _processEnterLeaveAndEmit(entity, lastUpDownMoveEvents) {
        // up, down, and move are considered for enter and leave
        for (const event of lastUpDownMoveEvents) {
            // enter
            if (event.active && entity.active && this.entered(entity, event.pointerId)) {
                entity.events.emit('pointerenter', event);
                if (this._receiver.isDragging(event.pointerId)) {
                    entity.events.emit('pointerdragenter', event);
                }
                break;
            }
            if (event.active && entity.active &&
                // leave can happen on move
                (this.left(entity, event.pointerId) ||
                    // or leave can happen on pointer up
                    (this.entityCurrentlyUnderPointer(entity, event.pointerId) && event.type === 'up'))) {
                entity.events.emit('pointerleave', event);
                if (this._receiver.isDragging(event.pointerId)) {
                    entity.events.emit('pointerdragleave', event);
                }
                break;
            }
        }
    }
    _processCancelAndEmit(entity) {
        // cancel
        for (const event of this._receiver.currentFrameCancel) {
            if (event.active && entity.active && this.entityCurrentlyUnderPointer(entity, event.pointerId)) {
                entity.events.emit('pointercancel', event);
            }
        }
    }
    _processWheelAndEmit(entity) {
        // wheel
        for (const event of this._receiver.currentFrameWheel) {
            // Currently the wheel only fires under the primary pointer '0'
            if (event.active && entity.active && this.entityCurrentlyUnderPointer(entity, 0)) {
                entity.events.emit('pointerwheel', event);
            }
        }
    }
    _dispatchEvents(entities) {
        const lastFrameEntities = new Set(this.lastFrameEntityToPointers.keys());
        const currentFrameEntities = new Set(this.currentFrameEntityToPointers.keys());
        // Filter preserves z order
        const entitiesWithEvents = entities.filter(e => lastFrameEntities.has(e.id) || currentFrameEntities.has(e.id));
        let lastMovePerPointer;
        let lastUpPerPointer;
        let lastDownPerPointer;
        // Dispatch events in entity z order
        for (const entity of entitiesWithEvents) {
            lastDownPerPointer = this._processDownAndEmit(entity);
            lastUpPerPointer = this._processUpAndEmit(entity);
            lastMovePerPointer = this._processMoveAndEmit(entity);
            const lastUpDownMoveEvents = [
                ...lastMovePerPointer.values(),
                ...lastDownPerPointer.values(),
                ...lastUpPerPointer.values()
            ];
            this._processEnterLeaveAndEmit(entity, lastUpDownMoveEvents);
            this._processCancelAndEmit(entity);
            this._processWheelAndEmit(entity);
        }
    }
}
//# sourceMappingURL=PointerSystem.js.map