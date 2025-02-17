import pointVertexSource from './point-vertex.glsl';
import pointFragmentSource from './point-fragment.glsl';
import { pixelSnapEpsilon } from '../ExcaliburGraphicsContextWebGL';
import { Shader } from '../shader';
import { VertexBuffer } from '../vertex-buffer';
import { VertexLayout } from '../vertex-layout';
import { GraphicsDiagnostics } from '../../GraphicsDiagnostics';
export class PointRenderer {
    constructor() {
        this.type = 'ex.point';
        this.priority = 0;
        this._maxPoints = 10922;
        this._pointCount = 0;
        this._vertexIndex = 0;
    }
    initialize(gl, context) {
        this._gl = gl;
        this._context = context;
        this._shader = new Shader({
            vertexSource: pointVertexSource,
            fragmentSource: pointFragmentSource
        });
        this._shader.compile();
        this._shader.use();
        this._shader.setUniformMatrix('u_matrix', this._context.ortho);
        this._buffer = new VertexBuffer({
            size: 7 * this._maxPoints,
            type: 'dynamic'
        });
        this._layout = new VertexLayout({
            shader: this._shader,
            vertexBuffer: this._buffer,
            attributes: [
                ['a_position', 2],
                ['a_color', 4],
                ['a_size', 1]
            ]
        });
    }
    draw(point, color, size) {
        // Force a render if the batch is full
        if (this._isFull()) {
            this.flush();
        }
        this._pointCount++;
        const transform = this._context.getTransform();
        const opacity = this._context.opacity;
        const snapToPixel = this._context.snapToPixel;
        const finalPoint = transform.multiply(point);
        if (snapToPixel) {
            finalPoint.x = ~~(finalPoint.x + pixelSnapEpsilon);
            finalPoint.y = ~~(finalPoint.y + pixelSnapEpsilon);
        }
        const vertexBuffer = this._buffer.bufferData;
        vertexBuffer[this._vertexIndex++] = finalPoint.x;
        vertexBuffer[this._vertexIndex++] = finalPoint.y;
        vertexBuffer[this._vertexIndex++] = color.r / 255;
        vertexBuffer[this._vertexIndex++] = color.g / 255;
        vertexBuffer[this._vertexIndex++] = color.b / 255;
        vertexBuffer[this._vertexIndex++] = color.a * opacity;
        vertexBuffer[this._vertexIndex++] = size * Math.max(transform.getScaleX(), transform.getScaleY());
    }
    _isFull() {
        if (this._pointCount >= this._maxPoints) {
            return true;
        }
        return false;
    }
    hasPendingDraws() {
        return this._pointCount !== 0;
    }
    flush() {
        // nothing to draw early exit
        if (this._pointCount === 0) {
            return;
        }
        const gl = this._gl;
        this._shader.use();
        this._layout.use(true);
        this._shader.setUniformMatrix('u_matrix', this._context.ortho);
        gl.drawArrays(gl.POINTS, 0, this._pointCount);
        GraphicsDiagnostics.DrawnImagesCount += this._pointCount;
        GraphicsDiagnostics.DrawCallCount++;
        this._pointCount = 0;
        this._vertexIndex = 0;
    }
}
//# sourceMappingURL=point-renderer.js.map