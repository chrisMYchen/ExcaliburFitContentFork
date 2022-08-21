import { ImageFiltering } from '.';
import { Raster } from './Raster';
/**
 * A circle [[Graphic]] for drawing circles to the [[ExcaliburGraphicsContext]]
 *
 * Circles default to [[ImageFiltering.Blended]]
 */
export class Circle extends Raster {
    constructor(options) {
        var _a, _b;
        super(options);
        this._radius = 0;
        this.padding = (_a = options.padding) !== null && _a !== void 0 ? _a : 2; // default 2 padding for circles looks nice
        this.radius = options.radius;
        this.filtering = (_b = options.filtering) !== null && _b !== void 0 ? _b : ImageFiltering.Blended;
        this.rasterize();
    }
    get radius() {
        return this._radius;
    }
    set radius(value) {
        this._radius = value;
        this.width = this._radius * 2;
        this.height = this._radius * 2;
        this.flagDirty();
    }
    clone() {
        return new Circle({
            radius: this.radius,
            ...this.cloneGraphicOptions(),
            ...this.cloneRasterOptions()
        });
    }
    execute(ctx) {
        if (this.radius > 0) {
            ctx.beginPath();
            ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
            if (this.color) {
                ctx.fill();
            }
            if (this.strokeColor) {
                ctx.stroke();
            }
        }
    }
}
//# sourceMappingURL=Circle.js.map