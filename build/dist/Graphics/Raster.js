import { Graphic } from './Graphic';
import { Color } from '../Color';
import { Vector } from '../Math/vector';
import { BoundingBox } from '../Collision/BoundingBox';
import { watch } from '../Util/Watch';
import { TextureLoader } from './Context/texture-loader';
/**
 * A Raster is a Graphic that needs to be first painted to a HTMLCanvasElement before it can be drawn to the
 * [[ExcaliburGraphicsContext]]. This is useful for generating custom images using the 2D canvas api.
 *
 * Implementors must implement the [[Raster.execute]] method to rasterize their drawing.
 */
export class Raster extends Graphic {
    constructor(options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        super(options);
        this.filtering = null;
        this.lineCap = 'butt';
        this.quality = 1;
        this._dirty = true;
        this._smoothing = false;
        this._color = watch(Color.Black, () => this.flagDirty());
        this._lineWidth = 1;
        this._lineDash = [];
        this._padding = 0;
        if (options) {
            this.quality = (_a = options.quality) !== null && _a !== void 0 ? _a : this.quality;
            this.color = (_b = options.color) !== null && _b !== void 0 ? _b : Color.Black;
            this.strokeColor = options === null || options === void 0 ? void 0 : options.strokeColor;
            this.smoothing = (_c = options.smoothing) !== null && _c !== void 0 ? _c : this.smoothing;
            this.lineWidth = (_d = options.lineWidth) !== null && _d !== void 0 ? _d : this.lineWidth;
            this.lineDash = (_e = options.lineDash) !== null && _e !== void 0 ? _e : this.lineDash;
            this.lineCap = (_f = options.lineCap) !== null && _f !== void 0 ? _f : this.lineCap;
            this.padding = (_g = options.padding) !== null && _g !== void 0 ? _g : this.padding;
            this.filtering = (_h = options.filtering) !== null && _h !== void 0 ? _h : this.filtering;
        }
        this._bitmap = document.createElement('canvas');
        // get the default canvas width/height as a fallback
        const bitmapWidth = (_j = options === null || options === void 0 ? void 0 : options.width) !== null && _j !== void 0 ? _j : this._bitmap.width;
        const bitmapHeight = (_k = options === null || options === void 0 ? void 0 : options.height) !== null && _k !== void 0 ? _k : this._bitmap.height;
        this.width = bitmapWidth;
        this.height = bitmapHeight;
        const maybeCtx = this._bitmap.getContext('2d');
        if (!maybeCtx) {
            /* istanbul ignore next */
            throw new Error('Browser does not support 2d canvas drawing, cannot create Raster graphic');
        }
        else {
            this._ctx = maybeCtx;
        }
    }
    cloneRasterOptions() {
        return {
            color: this.color ? this.color.clone() : null,
            strokeColor: this.strokeColor ? this.strokeColor.clone() : null,
            smoothing: this.smoothing,
            lineWidth: this.lineWidth,
            lineDash: this.lineDash,
            lineCap: this.lineCap,
            quality: this.quality,
            padding: this.padding
        };
    }
    /**
     * Gets whether the graphic is dirty, this means there are changes that haven't been re-rasterized
     */
    get dirty() {
        return this._dirty;
    }
    /**
     * Flags the graphic as dirty, meaning it must be re-rasterized before draw.
     * This should be called any time the graphics state changes such that it affects the outputted drawing
     */
    flagDirty() {
        this._dirty = true;
    }
    /**
     * Gets or sets the current width of the Raster graphic. Setting the width will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     *
     * Any `padding`s or `quality` set will be factored into the width
     */
    get width() {
        return Math.abs(this._getTotalWidth() * this.scale.x);
    }
    set width(value) {
        value /= Math.abs(this.scale.x);
        this._bitmap.width = value;
        this._originalWidth = value;
        this.flagDirty();
    }
    /**
     * Gets or sets the current height of the Raster graphic. Setting the height will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     *
     * Any `padding` or `quality` set will be factored into the height
     */
    get height() {
        return Math.abs(this._getTotalHeight() * this.scale.y);
    }
    set height(value) {
        value /= Math.abs(this.scale.y);
        this._bitmap.height = value;
        this._originalHeight = value;
        this.flagDirty();
    }
    _getTotalWidth() {
        var _a;
        return (((_a = this._originalWidth) !== null && _a !== void 0 ? _a : this._bitmap.width) + this.padding * 2) * 1;
    }
    _getTotalHeight() {
        var _a;
        return (((_a = this._originalHeight) !== null && _a !== void 0 ? _a : this._bitmap.height) + this.padding * 2) * 1;
    }
    /**
     * Returns the local bounds of the Raster including the padding
     */
    get localBounds() {
        return BoundingBox.fromDimension(this._getTotalWidth() * this.scale.x, this._getTotalHeight() * this.scale.y, Vector.Zero);
    }
    /**
     * Gets or sets the smoothing (anti-aliasing of the graphic). Setting the height will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     */
    get smoothing() {
        return this._smoothing;
    }
    set smoothing(value) {
        this._smoothing = value;
        this.flagDirty();
    }
    /**
     * Gets or sets the fillStyle of the Raster graphic. Setting the fillStyle will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get color() {
        return this._color;
    }
    set color(value) {
        this.flagDirty();
        this._color = watch(value, () => this.flagDirty());
    }
    /**
     * Gets or sets the strokeStyle of the Raster graphic. Setting the strokeStyle will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get strokeColor() {
        return this._strokeColor;
    }
    set strokeColor(value) {
        this.flagDirty();
        this._strokeColor = watch(value, () => this.flagDirty());
    }
    /**
     * Gets or sets the line width of the Raster graphic. Setting the lineWidth will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get lineWidth() {
        return this._lineWidth;
    }
    set lineWidth(value) {
        this._lineWidth = value;
        this.flagDirty();
    }
    get lineDash() {
        return this._lineDash;
    }
    set lineDash(value) {
        this._lineDash = value;
        this.flagDirty();
    }
    get padding() {
        return this._padding;
    }
    set padding(value) {
        this._padding = value;
        this.flagDirty();
    }
    /**
     * Rasterize the graphic to a bitmap making it usable as in excalibur. Rasterize is called automatically if
     * the graphic is [[Raster.dirty]] on the next [[Graphic.draw]] call
     */
    rasterize() {
        this._dirty = false;
        this._ctx.clearRect(0, 0, this._getTotalWidth(), this._getTotalHeight());
        this._ctx.save();
        this._applyRasterProperties(this._ctx);
        this.execute(this._ctx);
        this._ctx.restore();
        // The webgl texture needs to be updated if it exists after a raster cycle
        TextureLoader.load(this._bitmap, this.filtering, true);
    }
    _applyRasterProperties(ctx) {
        var _a, _b, _c;
        this._bitmap.width = this._getTotalWidth() * this.quality;
        this._bitmap.height = this._getTotalHeight() * this.quality;
        ctx.scale(this.quality, this.quality);
        ctx.translate(this.padding, this.padding);
        ctx.imageSmoothingEnabled = this.smoothing;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash((_a = this.lineDash) !== null && _a !== void 0 ? _a : ctx.getLineDash());
        ctx.lineCap = this.lineCap;
        ctx.strokeStyle = (_b = this.strokeColor) === null || _b === void 0 ? void 0 : _b.toString();
        ctx.fillStyle = (_c = this.color) === null || _c === void 0 ? void 0 : _c.toString();
    }
    _drawImage(ex, x, y) {
        if (this._dirty) {
            this.rasterize();
        }
        ex.scale(1 / this.quality, 1 / this.quality);
        ex.drawImage(this._bitmap, x, y);
    }
}
//# sourceMappingURL=Raster.js.map