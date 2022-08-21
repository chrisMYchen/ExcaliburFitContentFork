import { BoundingBox } from '../Collision/BoundingBox';
import { Color } from '../Color';
import { Graphic } from './Graphic';
export class Line extends Graphic {
    constructor(options) {
        super();
        this.color = Color.Black;
        this.thickness = 1;
        const { start, end, color, thickness } = options;
        this.start = start;
        this.end = end;
        this.color = color !== null && color !== void 0 ? color : this.color;
        this.thickness = thickness !== null && thickness !== void 0 ? thickness : this.thickness;
        const { width, height } = BoundingBox.fromPoints([start, end]);
        this.width = width;
        this.height = height;
    }
    _drawImage(ctx, _x, _y) {
        ctx.drawLine(this.start, this.end, this.color, this.thickness);
    }
    clone() {
        return new Line({
            start: this.start,
            end: this.end,
            color: this.color,
            thickness: this.thickness
        });
    }
}
//# sourceMappingURL=Line.js.map