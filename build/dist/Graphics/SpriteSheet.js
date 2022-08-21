import { Sprite } from './Sprite';
import { Logger } from '../Util/Log';
/**
 * Represents a collection of sprites from a source image with some organization in a grid
 */
export class SpriteSheet {
    /**
     * Build a new sprite sheet from a list of sprites
     *
     * Use [[SpriteSheet.fromImageSource]] to create a SpriteSheet from an [[ImageSource]] organized in a grid
     * @param options
     */
    constructor(options) {
        this._logger = Logger.getInstance();
        this.sprites = [];
        const { sprites, rows, columns } = options;
        this.sprites = sprites;
        this.rows = rows !== null && rows !== void 0 ? rows : 1;
        this.columns = columns !== null && columns !== void 0 ? columns : this.sprites.length;
    }
    /**
     * Find a sprite by their x/y position in the SpriteSheet, for example `getSprite(0, 0)` is the [[Sprite]] in the top-left
     * @param x
     * @param y
     */
    getSprite(x, y) {
        if (x >= this.columns || x < 0) {
            this._logger.warn(`No sprite exists in the SpriteSheet at (${x}, ${y}), x: ${x} should be between 0 and ${this.columns - 1}`);
            return null;
        }
        if (y >= this.rows || y < 0) {
            this._logger.warn(`No sprite exists in the SpriteSheet at (${x}, ${y}), y: ${y} should be between 0 and ${this.rows - 1}`);
            return null;
        }
        const spriteIndex = x + y * this.columns;
        return this.sprites[spriteIndex];
    }
    /**
     * Create a sprite sheet from a sparse set of [[SourceView]] rectangles
     * @param options
     */
    static fromImageSourceWithSourceViews(options) {
        const sprites = options.sourceViews.map(sourceView => {
            return new Sprite({
                image: options.image,
                sourceView
            });
        });
        return new SpriteSheet({ sprites });
    }
    /**
     * Create a SpriteSheet from an [[ImageSource]] organized in a grid
     *
     * Example:
     * ```
     * const spriteSheet = SpriteSheet.fromImageSource({
     *   image: imageSource,
     *   grid: {
     *     rows: 5,
     *     columns: 2,
     *     spriteWidth: 32, // pixels
     *     spriteHeight: 32 // pixels
     *   },
     *   // Optionally specify spacing
     *   spacing: {
     *     // pixels from the top left to start the sprite parsing
     *     originOffset: {
     *       x: 5,
     *       y: 5
     *     },
     *     // pixels between each sprite while parsing
     *     margin: {
     *       x: 1,
     *       y: 1
     *     }
     *   }
     * })
     * ```
     *
     * @param options
     */
    static fromImageSource(options) {
        var _a;
        const sprites = [];
        options.spacing = (_a = options.spacing) !== null && _a !== void 0 ? _a : {};
        const { image, grid: { rows, columns: cols, spriteWidth, spriteHeight }, spacing: { originOffset, margin } } = options;
        const offsetDefaults = { x: 0, y: 0, ...originOffset };
        const marginDefaults = { x: 0, y: 0, ...margin };
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                sprites[x + y * cols] = new Sprite({
                    image: image,
                    sourceView: {
                        x: x * spriteWidth + marginDefaults.x * x + offsetDefaults.x,
                        y: y * spriteHeight + marginDefaults.y * y + offsetDefaults.y,
                        width: spriteWidth,
                        height: spriteHeight
                    },
                    destSize: { height: spriteHeight, width: spriteWidth }
                });
            }
        }
        return new SpriteSheet({
            sprites: sprites,
            rows: rows,
            columns: cols
        });
    }
}
//# sourceMappingURL=SpriteSheet.js.map