import { vec, Vector } from './Math/vector';
import { Text } from './Graphics/Text';
import { GraphicsComponent } from './Graphics';
import { Font } from './Graphics/Font';
import { Actor } from './Actor';
/**
 * Labels are the way to draw small amounts of text to the screen. They are
 * actors and inherit all of the benefits and capabilities.
 */
export class Label extends Actor {
    /**
     * Build a new label
     * @param options
     */
    constructor(options) {
        super(options);
        this._font = new Font();
        this._text = new Text({ text: '', font: this._font });
        const { text, pos, x, y, spriteFont, font, color } = options;
        this.pos = pos !== null && pos !== void 0 ? pos : (x && y ? vec(x, y) : this.pos);
        this.text = text !== null && text !== void 0 ? text : this.text;
        this.font = font !== null && font !== void 0 ? font : this.font;
        this.spriteFont = spriteFont !== null && spriteFont !== void 0 ? spriteFont : this.spriteFont;
        this._text.color = color !== null && color !== void 0 ? color : this.color;
        const gfx = this.get(GraphicsComponent);
        gfx.anchor = Vector.Zero;
        gfx.use(this._text);
    }
    get font() {
        return this._font;
    }
    set font(newFont) {
        this._font = newFont;
        this._text.font = newFont;
    }
    /**
     * The text to draw.
     */
    get text() {
        return this._text.text;
    }
    set text(text) {
        this._text.text = text;
    }
    get color() {
        return this._text.color;
    }
    set color(color) {
        if (this._text) {
            this._text.color = color;
        }
    }
    get opacity() {
        return this._text.opacity;
    }
    set opacity(opacity) {
        this._text.opacity = opacity;
    }
    /**
     * The [[SpriteFont]] to use, if any. Overrides [[Font|font]] if present.
     */
    get spriteFont() {
        return this._spriteFont;
    }
    set spriteFont(sf) {
        if (sf) {
            this._spriteFont = sf;
            this._text.font = this._spriteFont;
        }
    }
    _initialize(engine) {
        super._initialize(engine);
    }
    /**
     * Returns the width of the text in the label (in pixels);
     */
    getTextWidth() {
        return this._text.width;
    }
}
//# sourceMappingURL=Label.js.map