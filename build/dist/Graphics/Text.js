import { Graphic } from './Graphic';
import { Color } from '../Color';
import { Font } from './Font';
/**
 * Represent Text graphics in excalibur
 *
 * Useful for in game labels, ui, or overlays
 */
export class Text extends Graphic {
    constructor(options) {
        var _a, _b;
        super(options);
        this._text = '';
        this._textWidth = 0;
        this._textHeight = 0;
        // This order is important font, color, then text
        this.font = (_a = options.font) !== null && _a !== void 0 ? _a : new Font();
        this.color = (_b = options.color) !== null && _b !== void 0 ? _b : this.color;
        this.text = options.text;
    }
    clone() {
        var _a, _b;
        return new Text({
            text: this.text.slice(),
            color: (_b = (_a = this.color) === null || _a === void 0 ? void 0 : _a.clone()) !== null && _b !== void 0 ? _b : Color.Black,
            font: this.font.clone()
        });
    }
    get text() {
        return this._text;
    }
    set text(value) {
        this._text = value;
        const bounds = this.font.measureText(this._text);
        this._textWidth = bounds.width;
        this._textHeight = bounds.height;
    }
    get font() {
        return this._font;
    }
    set font(font) {
        this._font = font;
    }
    get width() {
        if (this._textWidth === 0) {
            this._calculateDimension();
        }
        return this._textWidth * this.scale.x;
    }
    get height() {
        if (this._textHeight === 0) {
            this._calculateDimension();
        }
        return this._textHeight * this.scale.y;
    }
    _calculateDimension() {
        const { width, height } = this.font.measureText(this._text);
        this._textWidth = width;
        this._textHeight = height;
    }
    get localBounds() {
        return this.font.measureText(this._text).scale(this.scale);
    }
    _rotate(_ex) {
        // None this is delegated to font
        // This override erases the default behavior
    }
    _flip(_ex) {
        // None this is delegated to font
        // This override erases the default behavior
    }
    _drawImage(ex, x, y) {
        var _a;
        let color = Color.Black;
        if (this.font instanceof Font) {
            color = (_a = this.color) !== null && _a !== void 0 ? _a : this.font.color;
        }
        if (this.isStale() || this.font.isStale()) {
            this.font.flipHorizontal = this.flipHorizontal;
            this.font.flipVertical = this.flipVertical;
            this.font.rotation = this.rotation;
            this.font.origin = this.origin;
            this.font.opacity = this.opacity;
        }
        this.font.tint = this.tint;
        const { width, height } = this.font.measureText(this._text);
        this._textWidth = width;
        this._textHeight = height;
        this.font.render(ex, this._text, color, x, y);
        if (this.font.showDebug) {
            ex.debug.drawRect(x - width, y - height, width * 2, height * 2);
        }
    }
}
//# sourceMappingURL=Text.js.map