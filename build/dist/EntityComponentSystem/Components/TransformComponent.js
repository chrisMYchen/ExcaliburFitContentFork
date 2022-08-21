import { CoordPlane } from '../../Math/coord-plane';
import { Transform } from '../../Math/transform';
import { Component } from '../Component';
import { Observable } from '../../Util/Observable';
export class TransformComponent extends Component {
    constructor() {
        super(...arguments);
        this.type = 'ex.transform';
        this._transform = new Transform();
        this._addChildTransform = (child) => {
            const childTxComponent = child.get(TransformComponent);
            if (childTxComponent) {
                childTxComponent._transform.parent = this._transform;
            }
        };
        /**
         * Observable that emits when the z index changes on this component
         */
        this.zIndexChanged$ = new Observable();
        this._z = 0;
        /**
         * The [[CoordPlane|coordinate plane|]] for this transform for the entity.
         */
        this.coordPlane = CoordPlane.World;
    }
    get() {
        return this._transform;
    }
    onAdd(owner) {
        for (const child of owner.children) {
            this._addChildTransform(child);
        }
        owner.childrenAdded$.subscribe(child => this._addChildTransform(child));
        owner.childrenRemoved$.subscribe(child => {
            const childTxComponent = child.get(TransformComponent);
            if (childTxComponent) {
                childTxComponent._transform.parent = null;
            }
        });
    }
    onRemove(_previousOwner) {
        this._transform.parent = null;
    }
    /**
     * The z-index ordering of the entity, a higher values are drawn on top of lower values.
     * For example z=99 would be drawn on top of z=0.
     */
    get z() {
        return this._z;
    }
    set z(val) {
        const oldz = this._z;
        this._z = val;
        if (oldz !== val) {
            this.zIndexChanged$.notifyAll(val);
        }
    }
    get pos() {
        return this._transform.pos;
    }
    set pos(v) {
        this._transform.pos = v;
    }
    get globalPos() {
        return this._transform.globalPos;
    }
    set globalPos(v) {
        this._transform.globalPos = v;
    }
    get rotation() {
        return this._transform.rotation;
    }
    set rotation(rotation) {
        this._transform.rotation = rotation;
    }
    get globalRotation() {
        return this._transform.globalRotation;
    }
    set globalRotation(rotation) {
        this._transform.globalRotation = rotation;
    }
    get scale() {
        return this._transform.scale;
    }
    set scale(v) {
        this._transform.scale = v;
    }
    get globalScale() {
        return this._transform.globalScale;
    }
    set globalScale(v) {
        this._transform.globalScale = v;
    }
    applyInverse(v) {
        return this._transform.applyInverse(v);
    }
    apply(v) {
        return this._transform.apply(v);
    }
}
//# sourceMappingURL=TransformComponent.js.map