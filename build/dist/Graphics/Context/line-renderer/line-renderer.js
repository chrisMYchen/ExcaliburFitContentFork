import lineVertexSource from './line-vertex.glsl';
import lineFragmentSource from './line-fragment.glsl';
import { Shader, VertexBuffer, VertexLayout } from '../..';
import { GraphicsDiagnostics } from '../../GraphicsDiagnostics';
export class LineRenderer {
    constructor() {
        this.type = 'ex.line';
        this.priority = 0;
        this._maxLines = 10922;
        this._vertexIndex = 0;
        this._lineCount = 0;
    }
    initialize(gl, context) {
        this._gl = gl;
        this._context = context;
        this._shader = new Shader({
            vertexSource: lineVertexSource,
            fragmentSource: lineFragmentSource
        });
        this._shader.compile();
        this._shader.use();
        this._shader.setUniformMatrix('u_matrix', this._context.ortho);
        this._vertexBuffer = new VertexBuffer({
            size: 6 * 2 * this._maxLines,
            type: 'dynamic'
        });
        this._layout = new VertexLayout({
            vertexBuffer: this._vertexBuffer,
            shader: this._shader,
            attributes: [
                ['a_position', 2],
                ['a_color', 4]
            ]
        });
    }
    draw(start, end, color) {
        // Force a render if the batch is full
        if (this._isFull()) {
            this.flush();
        }
        this._lineCount++;
        const transform = this._context.getTransform();
        const finalStart = transform.multiply(start);
        const finalEnd = transform.multiply(end);
        const vertexBuffer = this._vertexBuffer.bufferData;
        // Start
        vertexBuffer[this._vertexIndex++] = finalStart.x;
        vertexBuffer[this._vertexIndex++] = finalStart.y;
        vertexBuffer[this._vertexIndex++] = color.r / 255;
        vertexBuffer[this._vertexIndex++] = color.g / 255;
        vertexBuffer[this._vertexIndex++] = color.b / 255;
        vertexBuffer[this._vertexIndex++] = color.a;
        // End
        vertexBuffer[this._vertexIndex++] = finalEnd.x;
        vertexBuffer[this._vertexIndex++] = finalEnd.y;
        vertexBuffer[this._vertexIndex++] = color.r / 255;
        vertexBuffer[this._vertexIndex++] = color.g / 255;
        vertexBuffer[this._vertexIndex++] = color.b / 255;
        vertexBuffer[this._vertexIndex++] = color.a;
    }
    _isFull() {
        if (this._lineCount >= this._maxLines) {
            return true;
        }
        return false;
    }
    hasPendingDraws() {
        return this._lineCount !== 0;
    }
    flush() {
        // nothing to draw early exit
        if (this._lineCount === 0) {
            return;
        }
        const gl = this._gl;
        this._shader.use();
        this._layout.use(true);
        this._shader.setUniformMatrix('u_matrix', this._context.ortho);
        gl.drawArrays(gl.LINES, 0, this._lineCount * 2); // 2 verts per line
        GraphicsDiagnostics.DrawnImagesCount += this._lineCount;
        GraphicsDiagnostics.DrawCallCount++;
        // reset
        this._vertexIndex = 0;
        this._lineCount = 0;
    }
}
//# sourceMappingURL=line-renderer.js.map