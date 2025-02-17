import { ImageFiltering } from '.';
import { vec } from '../Math/vector';
import { Raster } from './Raster';
/**
 * A polygon [[Graphic]] for drawing arbitrary polygons to the [[ExcaliburGraphicsContext]]
 *
 * Polygons default to [[ImageFiltering.Blended]]
 */
export class Polygon extends Raster {
    constructor(options) {
        super(options);
        this.points = options.points;
        this.filtering = ImageFiltering.Blended;
        this.rasterize();
    }
    get points() {
        return this._points;
    }
    set points(points) {
        this._points = points;
        const min = this.minPoint;
        this.width = this._points.reduce((max, p) => Math.max(p.x, max), 0) - min.x;
        this.height = this._points.reduce((max, p) => Math.max(p.y, max), 0) - min.y;
        this.flagDirty();
    }
    get minPoint() {
        const minX = this._points.reduce((min, p) => Math.min(p.x, min), Infinity);
        const minY = this._points.reduce((min, p) => Math.min(p.y, min), Infinity);
        return vec(minX, minY);
    }
    clone() {
        return new Polygon({
            points: this.points.map((p) => p.clone()),
            ...this.cloneGraphicOptions(),
            ...this.cloneRasterOptions()
        });
    }
    execute(ctx) {
        if (this.points && this.points.length) {
            ctx.beginPath();
            // Iterate through the supplied points and construct a 'polygon'
            const min = this.minPoint.negate();
            const firstPoint = this.points[0].add(min);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            this.points.forEach((point) => {
                ctx.lineTo(point.x + min.x, point.y + min.y);
            });
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.closePath();
            if (this.color) {
                ctx.fill();
            }
            if (this.strokeColor) {
                ctx.stroke();
            }
        }
    }
}
//# sourceMappingURL=Polygon.js.map