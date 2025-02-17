import { BoundingBox } from '../Collision/Index';
import { Color } from '../Color';
import { BaseAlign, Direction, FontStyle, FontUnit, TextAlign } from './FontCommon';
import { Graphic } from './Graphic';
import { ImageFiltering } from './Filtering';
import { FontTextInstance } from './FontTextInstance';
import { FontCache } from './FontCache';
/**
 * Represents a system or web font in Excalibur
 *
 * If no options specified, the system sans-serif 10 pixel is used
 *
 * If loading a custom web font be sure to have the font loaded before you use it https://erikonarheim.com/posts/dont-test-fonts/
 */
export class Font extends Graphic {
    constructor(options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        super(options); // <- Graphics properties
        /**
         * Set the font filtering mode, by default set to [[ImageFiltering.Blended]] regardless of the engine default smoothing
         *
         * If you have a pixel style font that may be a reason to switch this to [[ImageFiltering.Pixel]]
         */
        this.filtering = ImageFiltering.Blended;
        /**
         * Font quality determines the size of the underlying raster text, higher quality means less jagged edges.
         * If quality is set to 1, then just enough raster bitmap is generated to render the text.
         *
         * You can think of quality as how zoomed in to the text you can get before seeing jagged edges.
         *
         * (Default 2)
         */
        this.quality = 2;
        // Raster properties for fonts
        this.padding = 2;
        this.smoothing = false;
        this.lineWidth = 1;
        this.lineDash = [];
        this.color = Color.Black;
        this.family = 'sans-serif';
        this.style = FontStyle.Normal;
        this.bold = false;
        this.unit = FontUnit.Px;
        this.textAlign = TextAlign.Left;
        this.baseAlign = BaseAlign.Alphabetic;
        this.direction = Direction.LeftToRight;
        this.size = 10;
        this.shadow = null;
        this._textBounds = new BoundingBox();
        this._textMeasurement = new FontTextInstance(this, '', Color.Black);
        // Raster properties
        this.smoothing = (_a = options === null || options === void 0 ? void 0 : options.smoothing) !== null && _a !== void 0 ? _a : this.smoothing;
        this.padding = (_b = options === null || options === void 0 ? void 0 : options.padding) !== null && _b !== void 0 ? _b : this.padding;
        this.color = (_c = options === null || options === void 0 ? void 0 : options.color) !== null && _c !== void 0 ? _c : this.color;
        this.strokeColor = (_d = options === null || options === void 0 ? void 0 : options.strokeColor) !== null && _d !== void 0 ? _d : this.strokeColor;
        this.lineDash = (_e = options === null || options === void 0 ? void 0 : options.lineDash) !== null && _e !== void 0 ? _e : this.lineDash;
        this.lineWidth = (_f = options === null || options === void 0 ? void 0 : options.lineWidth) !== null && _f !== void 0 ? _f : this.lineWidth;
        this.filtering = (_g = options === null || options === void 0 ? void 0 : options.filtering) !== null && _g !== void 0 ? _g : this.filtering;
        // Font specific properties
        this.family = (_h = options === null || options === void 0 ? void 0 : options.family) !== null && _h !== void 0 ? _h : this.family;
        this.style = (_j = options === null || options === void 0 ? void 0 : options.style) !== null && _j !== void 0 ? _j : this.style;
        this.bold = (_k = options === null || options === void 0 ? void 0 : options.bold) !== null && _k !== void 0 ? _k : this.bold;
        this.size = (_l = options === null || options === void 0 ? void 0 : options.size) !== null && _l !== void 0 ? _l : this.size;
        this.unit = (_m = options === null || options === void 0 ? void 0 : options.unit) !== null && _m !== void 0 ? _m : this.unit;
        this.textAlign = (_o = options === null || options === void 0 ? void 0 : options.textAlign) !== null && _o !== void 0 ? _o : this.textAlign;
        this.baseAlign = (_p = options === null || options === void 0 ? void 0 : options.baseAlign) !== null && _p !== void 0 ? _p : this.baseAlign;
        this.direction = (_q = options === null || options === void 0 ? void 0 : options.direction) !== null && _q !== void 0 ? _q : this.direction;
        this.quality = (_r = options === null || options === void 0 ? void 0 : options.quality) !== null && _r !== void 0 ? _r : this.quality;
        if (options === null || options === void 0 ? void 0 : options.shadow) {
            this.shadow = {};
            this.shadow.blur = (_s = options.shadow.blur) !== null && _s !== void 0 ? _s : this.shadow.blur;
            this.shadow.offset = (_t = options.shadow.offset) !== null && _t !== void 0 ? _t : this.shadow.offset;
            this.shadow.color = (_u = options.shadow.color) !== null && _u !== void 0 ? _u : this.shadow.color;
        }
    }
    clone() {
        return new Font({
            ...this.cloneGraphicOptions(),
            size: this.size,
            unit: this.unit,
            family: this.family,
            style: this.style,
            bold: this.bold,
            textAlign: this.textAlign,
            baseAlign: this.baseAlign,
            direction: this.direction,
            shadow: this.shadow
                ? {
                    blur: this.shadow.blur,
                    offset: this.shadow.offset,
                    color: this.shadow.color
                }
                : null
        });
    }
    get fontString() {
        return `${this.style} ${this.bold ? 'bold' : ''} ${this.size}${this.unit} ${this.family}`;
    }
    get localBounds() {
        return this._textBounds;
    }
    _drawImage(_ex, _x, _y) {
        // TODO weird vestigial drawimage
    }
    _rotate(ex) {
        var _a;
        // TODO this needs to change depending on the bounding box...
        const origin = (_a = this.origin) !== null && _a !== void 0 ? _a : this._textBounds.center;
        ex.translate(origin.x, origin.y);
        ex.rotate(this.rotation);
        ex.translate(-origin.x, -origin.y);
    }
    _flip(ex) {
        if (this.flipHorizontal) {
            ex.translate(this._textBounds.width / this.scale.x, 0);
            ex.scale(-1, 1);
        }
        if (this.flipVertical) {
            ex.translate(0, -this._textBounds.height / 2 / this.scale.y);
            ex.scale(1, -1);
        }
    }
    measureTextWithoutCache(text) {
        return this._textMeasurement.measureText(text);
    }
    /**
     * Returns a BoundingBox that is the total size of the text including multiple lines
     *
     * Does not include any padding or adjustment
     * @param text
     * @returns BoundingBox
     */
    measureText(text) {
        return FontCache.measureText(text, this);
    }
    _postDraw(ex) {
        ex.restore();
    }
    render(ex, text, colorOverride, x, y) {
        const textInstance = FontCache.getTextInstance(text, this, colorOverride);
        // Apply affine transformations
        this._textBounds = textInstance.dimensions;
        this._preDraw(ex, x, y);
        textInstance.render(ex, x, y);
        this._postDraw(ex);
    }
}
//# sourceMappingURL=Font.js.map