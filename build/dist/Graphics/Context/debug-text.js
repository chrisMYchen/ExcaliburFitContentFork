import { ImageSource, SpriteFont, SpriteSheet } from '..';
import debugFont from './debug-font.png';
/**
 * Internal debugtext helper
 */
export class DebugText {
    constructor() {
        /**
         * base64 font
         */
        this.fontSheet = debugFont;
        this.size = 16;
        this.load();
    }
    load() {
        this._imageSource = new ImageSource(this.fontSheet);
        return this._imageSource.load().then(() => {
            this._spriteSheet = SpriteSheet.fromImageSource({
                image: this._imageSource,
                grid: {
                    rows: 3,
                    columns: 16,
                    spriteWidth: 16,
                    spriteHeight: 16
                }
            });
            this._spriteFont = new SpriteFont({
                alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ,!\'&."?-()+ ',
                caseInsensitive: true,
                spriteSheet: this._spriteSheet,
                spacing: -6
            });
        });
    }
    /**
     * Writes debug text using the built in sprint font
     * @param ctx
     * @param text
     * @param pos
     */
    write(ctx, text, pos) {
        if (this._imageSource.isLoaded()) {
            this._spriteFont.render(ctx, text, null, pos.x, pos.y);
        }
    }
}
//# sourceMappingURL=debug-text.js.map