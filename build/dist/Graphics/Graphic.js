import { Vector, vec } from '../Math/vector';
import { BoundingBox } from '../Collision/BoundingBox';
import { watch } from '../Util/Watch';
import { AffineMatrix } from '../Math/affine-matrix';
/**
 * A Graphic is the base Excalibur primitive for something that can be drawn to the [[ExcaliburGraphicsContext]].
 * [[Sprite]], [[Animation]], [[GraphicsGroup]], [[Canvas]], [[Rectangle]], [[Circle]], and [[Polygon]] all derive from the
 * [[Graphic]] abstract class.
 *
 * Implementors of a Graphic must override the abstract [[Graphic._drawImage]] method to render an image to the graphics context. Graphic
 * handles all the position, rotation, and scale transformations in [[Graphic._preDraw]] and [[Graphic._postDraw]]
 */
export class Graphic {
    constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        this.id = Graphic._ID++;
        this.transform = AffineMatrix.identity();
        this.tint = null;
        this._transformStale = true;
        /**
         * Gets or sets wether to show debug information about the graphic
         */
        this.showDebug = false;
        this._flipHorizontal = false;
        this._flipVertical = false;
        this._rotation = 0;
        /**
         * Gets or sets the opacity of the graphic, 0 is transparent, 1 is solid (opaque).
         */
        this.opacity = 1;
        this._scale = Vector.One;
        this._origin = null;
        this._width = 0;
        this._height = 0;
        if (options) {
            this.origin = (_a = options.origin) !== null && _a !== void 0 ? _a : this.origin;
            this.flipHorizontal = (_b = options.flipHorizontal) !== null && _b !== void 0 ? _b : this.flipHorizontal;
            this.flipVertical = (_c = options.flipVertical) !== null && _c !== void 0 ? _c : this.flipVertical;
            this.rotation = (_d = options.rotation) !== null && _d !== void 0 ? _d : this.rotation;
            this.opacity = (_e = options.opacity) !== null && _e !== void 0 ? _e : this.opacity;
            this.scale = (_f = options.scale) !== null && _f !== void 0 ? _f : this.scale;
        }
    }
    isStale() {
        return this._transformStale;
    }
    /**
     * Gets or sets the flipHorizontal, which will flip the graphic horizontally (across the y axis)
     */
    get flipHorizontal() {
        return this._flipHorizontal;
    }
    set flipHorizontal(value) {
        this._flipHorizontal = value;
        this._transformStale = true;
    }
    /**
     * Gets or sets the flipVertical, which will flip the graphic vertically (across the x axis)
     */
    get flipVertical() {
        return this._flipVertical;
    }
    set flipVertical(value) {
        this._flipVertical = value;
        this._transformStale = true;
    }
    /**
     * Gets or sets the rotation of the graphic
     */
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._rotation = value;
        this._transformStale = true;
    }
    /**
     * Gets or sets the scale of the graphic, this affects the width and
     */
    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale = watch(value, () => {
            this._transformStale = true;
        });
        this._transformStale = true;
    }
    /**
     * Gets or sets the origin of the graphic, if not set the center of the graphic is the origin
     */
    get origin() {
        return this._origin;
    }
    set origin(value) {
        this._origin = watch(value, () => {
            this._transformStale = true;
        });
        this._transformStale = true;
    }
    cloneGraphicOptions() {
        return {
            origin: this.origin ? this.origin.clone() : null,
            flipHorizontal: this.flipHorizontal,
            flipVertical: this.flipVertical,
            rotation: this.rotation,
            opacity: this.opacity,
            scale: this.scale ? this.scale.clone() : null
        };
    }
    /**
     * Gets or sets the width of the graphic (always positive)
     */
    get width() {
        return Math.abs(this._width * this.scale.x);
    }
    /**
     * Gets or sets the height of the graphic (always positive)
     */
    get height() {
        return Math.abs(this._height * this.scale.y);
    }
    set width(value) {
        this._width = value;
        this._transformStale = true;
    }
    set height(value) {
        this._height = value;
        this._transformStale = true;
    }
    /**
     * Gets a copy of the bounds in pixels occupied by the graphic on the the screen. This includes scale.
     */
    get localBounds() {
        return BoundingBox.fromDimension(this.width, this.height, Vector.Zero);
    }
    /**
     * Draw the whole graphic to the context including transform
     * @param ex The excalibur graphics context
     * @param x
     * @param y
     */
    draw(ex, x, y) {
        this._preDraw(ex, x, y);
        this._drawImage(ex, 0, 0);
        this._postDraw(ex);
    }
    /**
     * Apply affine transformations to the graphics context to manipulate the graphic before [[Graphic._drawImage]]
     * @param ex
     * @param x
     * @param y
     */
    _preDraw(ex, x, y) {
        ex.save();
        ex.translate(x, y);
        if (this._transformStale) {
            this.transform.reset();
            this.transform.scale(Math.abs(this.scale.x), Math.abs(this.scale.y));
            this._rotate(this.transform);
            this._flip(this.transform);
            this._transformStale = false;
        }
        ex.multiply(this.transform);
        // it is important to multiply alphas so graphics respect the current context
        ex.opacity = ex.opacity * this.opacity;
        if (this.tint) {
            ex.tint = this.tint;
        }
    }
    _rotate(ex) {
        var _a;
        const scaleDirX = this.scale.x > 0 ? 1 : -1;
        const scaleDirY = this.scale.y > 0 ? 1 : -1;
        const origin = (_a = this.origin) !== null && _a !== void 0 ? _a : vec(this.width / 2, this.height / 2);
        ex.translate(origin.x, origin.y);
        ex.rotate(this.rotation);
        // This is for handling direction changes 1 or -1, that way we don't have mismatched translates()
        ex.scale(scaleDirX, scaleDirY);
        ex.translate(-origin.x, -origin.y);
    }
    _flip(ex) {
        if (this.flipHorizontal) {
            ex.translate(this.width / this.scale.x, 0);
            ex.scale(-1, 1);
        }
        if (this.flipVertical) {
            ex.translate(0, this.height / this.scale.y);
            ex.scale(1, -1);
        }
    }
    /**
     * Apply any additional work after [[Graphic._drawImage]] and restore the context state.
     * @param ex
     */
    _postDraw(ex) {
        if (this.showDebug) {
            ex.debug.drawRect(0, 0, this.width, this.height);
        }
        ex.restore();
    }
}
Graphic._ID = 0;
//# sourceMappingURL=Graphic.js.map