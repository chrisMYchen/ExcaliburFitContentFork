import { Graphic } from './Graphic';
import { Logger } from '../Util/Log';
export class Sprite extends Graphic {
    constructor(options) {
        var _a, _b;
        super(options);
        this._logger = Logger.getInstance();
        this._dirty = true;
        this._logNotLoadedWarning = false;
        this.image = options.image;
        const { width, height } = options;
        this.sourceView = (_a = options.sourceView) !== null && _a !== void 0 ? _a : { x: 0, y: 0, width: width !== null && width !== void 0 ? width : 0, height: height !== null && height !== void 0 ? height : 0 };
        this.destSize = (_b = options.destSize) !== null && _b !== void 0 ? _b : { width: width !== null && width !== void 0 ? width : 0, height: height !== null && height !== void 0 ? height : 0 };
        this._updateSpriteDimensions();
        this.image.ready.then(() => {
            this._updateSpriteDimensions();
        });
    }
    static from(image) {
        return new Sprite({
            image: image
        });
    }
    get width() {
        return Math.abs(this.destSize.width * this.scale.x);
    }
    get height() {
        return Math.abs(this.destSize.height * this.scale.y);
    }
    set width(newWidth) {
        newWidth /= Math.abs(this.scale.x);
        this.destSize.width = newWidth;
        super.width = Math.ceil(this.destSize.width);
    }
    set height(newHeight) {
        newHeight /= Math.abs(this.scale.y);
        this.destSize.height = newHeight;
        super.height = Math.ceil(this.destSize.height);
    }
    _updateSpriteDimensions() {
        var _a, _b, _c, _d, _e, _f;
        const { width: nativeWidth, height: nativeHeight } = this.image;
        // This code uses || to avoid 0's
        // If the source is not specified, use the native dimension
        this.sourceView.width = ((_a = this.sourceView) === null || _a === void 0 ? void 0 : _a.width) || nativeWidth;
        this.sourceView.height = ((_b = this.sourceView) === null || _b === void 0 ? void 0 : _b.height) || nativeHeight;
        // If the destination is not specified, use the source if specified, then native
        this.destSize.width = ((_c = this.destSize) === null || _c === void 0 ? void 0 : _c.width) || ((_d = this.sourceView) === null || _d === void 0 ? void 0 : _d.width) || nativeWidth;
        this.destSize.height = ((_e = this.destSize) === null || _e === void 0 ? void 0 : _e.height) || ((_f = this.sourceView) === null || _f === void 0 ? void 0 : _f.height) || nativeHeight;
        this.width = Math.ceil(this.destSize.width) * this.scale.x;
        this.height = Math.ceil(this.destSize.height) * this.scale.y;
    }
    _preDraw(ex, x, y) {
        if (this.image.isLoaded() && this._dirty) {
            this._dirty = false;
            this._updateSpriteDimensions();
        }
        super._preDraw(ex, x, y);
    }
    _drawImage(ex, x, y) {
        if (this.image.isLoaded()) {
            ex.drawImage(this.image.image, this.sourceView.x, this.sourceView.y, this.sourceView.width, this.sourceView.height, x, y, this.destSize.width, this.destSize.height);
        }
        else {
            if (!this._logNotLoadedWarning) {
                this._logger.warn(`ImageSource ${this.image.path}` +
                    ` is not yet loaded and won't be drawn. Please call .load() or include in a Loader.\n\n` +
                    `Read https://excaliburjs.com/docs/imagesource for more information.`);
            }
            this._logNotLoadedWarning = true;
        }
    }
    clone() {
        return new Sprite({
            image: this.image,
            sourceView: { ...this.sourceView },
            destSize: { ...this.destSize },
            ...this.cloneGraphicOptions()
        });
    }
}
//# sourceMappingURL=Sprite.js.map