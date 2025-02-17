import { Raster } from './Raster';
/**
 * A canvas [[Graphic]] to provide an adapter between the 2D Canvas API and the [[ExcaliburGraphicsContext]].
 *
 * The [[Canvas]] works by re-rastering a draw handler to a HTMLCanvasElement for every draw which is then passed
 * to the [[ExcaliburGraphicsContext]] implementation as a rendered image.
 *
 * **Low performance API**
 */
export class Canvas extends Raster {
    constructor(_options) {
        super(_options);
        this._options = _options;
    }
    /**
     * Return the 2D graphics context of this canvas
     */
    get ctx() {
        return this._ctx;
    }
    clone() {
        return new Canvas({
            ...this._options,
            ...this.cloneGraphicOptions(),
            ...this.cloneRasterOptions()
        });
    }
    execute(ctx) {
        var _a, _b;
        if ((_a = this._options) === null || _a === void 0 ? void 0 : _a.draw) {
            (_b = this._options) === null || _b === void 0 ? void 0 : _b.draw(ctx);
        }
        if (!this._options.cache) {
            this.flagDirty();
        }
    }
}
//# sourceMappingURL=Canvas.js.map