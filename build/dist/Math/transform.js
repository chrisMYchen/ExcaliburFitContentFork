import { AffineMatrix } from './affine-matrix';
import { canonicalizeAngle } from './util';
import { vec } from './vector';
import { VectorView } from './vector-view';
import { WatchVector } from './watch-vector';
export class Transform {
    constructor() {
        this._parent = null;
        this._children = [];
        this._pos = vec(0, 0);
        this._rotation = 0;
        this._scale = vec(1, 1);
        this._isDirty = false;
        this._isInverseDirty = false;
        this._matrix = AffineMatrix.identity();
        this._inverse = AffineMatrix.identity();
    }
    get parent() {
        return this._parent;
    }
    set parent(transform) {
        if (this._parent) {
            const index = this._parent._children.indexOf(this);
            if (index > -1) {
                this._parent._children.splice(index, 1);
            }
        }
        this._parent = transform;
        if (this._parent) {
            this._parent._children.push(this);
        }
        this.flagDirty();
    }
    get children() {
        return this._children;
    }
    set pos(v) {
        if (!v.equals(this._pos)) {
            this._pos.x = v.x;
            this._pos.y = v.y;
            this.flagDirty();
        }
    }
    get pos() {
        return new WatchVector(this._pos, (x, y) => {
            if (x !== this._pos.x || y !== this._pos.y) {
                this.flagDirty();
            }
        });
    }
    set globalPos(v) {
        let localPos = v.clone();
        if (this.parent) {
            localPos = this.parent.inverse.multiply(v);
        }
        if (!localPos.equals(this._pos)) {
            this._pos = localPos;
            this.flagDirty();
        }
    }
    get globalPos() {
        return new VectorView({
            getX: () => this.matrix.data[4],
            getY: () => this.matrix.data[5],
            setX: (x) => {
                if (this.parent) {
                    const { x: newX } = this.parent.inverse.multiply(vec(x, this.pos.y));
                    this.pos.x = newX;
                }
                else {
                    this.pos.x = x;
                }
                if (x !== this.matrix.data[4]) {
                    this.flagDirty();
                }
            },
            setY: (y) => {
                if (this.parent) {
                    const { y: newY } = this.parent.inverse.multiply(vec(this.pos.x, y));
                    this.pos.y = newY;
                }
                else {
                    this.pos.y = y;
                }
                if (y !== this.matrix.data[5]) {
                    this.flagDirty();
                }
            }
        });
    }
    set rotation(rotation) {
        const canonRotation = canonicalizeAngle(rotation);
        if (canonRotation !== this._rotation) {
            this.flagDirty();
        }
        this._rotation = canonRotation;
    }
    get rotation() {
        return this._rotation;
    }
    set globalRotation(rotation) {
        let inverseRotation = 0;
        if (this.parent) {
            inverseRotation = this.parent.globalRotation;
        }
        const canonRotation = canonicalizeAngle(rotation + inverseRotation);
        if (canonRotation !== this._rotation) {
            this.flagDirty();
        }
        this._rotation = canonRotation;
    }
    get globalRotation() {
        if (this.parent) {
            return this.matrix.getRotation();
        }
        return this.rotation;
    }
    set scale(v) {
        if (!v.equals(this._scale)) {
            this._scale.x = v.x;
            this._scale.y = v.y;
            this.flagDirty();
        }
    }
    get scale() {
        return new WatchVector(this._scale, (x, y) => {
            if (x !== this._scale.x || y !== this._scale.y) {
                this.flagDirty();
            }
        });
    }
    set globalScale(v) {
        let inverseScale = vec(1, 1);
        if (this.parent) {
            inverseScale = this.parent.globalScale;
        }
        this.scale = v.scale(vec(1 / inverseScale.x, 1 / inverseScale.y));
    }
    get globalScale() {
        return new VectorView({
            getX: () => this.parent ? this.matrix.getScaleX() : this.scale.x,
            getY: () => this.parent ? this.matrix.getScaleY() : this.scale.y,
            setX: (x) => {
                if (this.parent) {
                    const globalScaleX = this.parent.globalScale.x;
                    this.scale.x = x / globalScaleX;
                }
                else {
                    this.scale.x = x;
                }
            },
            setY: (y) => {
                if (this.parent) {
                    const globalScaleY = this.parent.globalScale.y;
                    this.scale.y = y / globalScaleY;
                }
                else {
                    this.scale.y = y;
                }
            }
        });
    }
    get matrix() {
        if (this._isDirty) {
            if (this.parent === null) {
                this._matrix = this._calculateMatrix();
            }
            else {
                this._matrix = this.parent.matrix.multiply(this._calculateMatrix());
            }
            this._isDirty = false;
        }
        return this._matrix;
    }
    get inverse() {
        if (this._isInverseDirty) {
            this._inverse = this.matrix.inverse();
            this._isInverseDirty = false;
        }
        return this._inverse;
    }
    _calculateMatrix() {
        const matrix = AffineMatrix.identity()
            .translate(this.pos.x, this.pos.y)
            .rotate(this.rotation)
            .scale(this.scale.x, this.scale.y);
        return matrix;
    }
    flagDirty() {
        this._isDirty = true;
        this._isInverseDirty = true;
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].flagDirty();
        }
    }
    apply(point) {
        return this.matrix.multiply(point);
    }
    applyInverse(point) {
        return this.inverse.multiply(point);
    }
    setTransform(pos, rotation, scale) {
        this._pos.x = pos.x;
        this._pos.y = pos.y;
        this._rotation = canonicalizeAngle(rotation);
        this._scale.x = scale.x;
        this._scale.y = scale.y;
        this.flagDirty();
    }
    clone(dest) {
        const target = dest !== null && dest !== void 0 ? dest : new Transform();
        this._pos.clone(target._pos);
        target._rotation = this._rotation;
        this._scale.clone(target._scale);
        target.flagDirty();
    }
}
//# sourceMappingURL=transform.js.map