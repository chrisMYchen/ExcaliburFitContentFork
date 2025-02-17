import screenVertex from './screen-vertex.glsl';
import screenFragment from './screen-fragment.glsl';
import { Shader } from '../shader';
import { VertexBuffer } from '../vertex-buffer';
import { VertexLayout } from '../vertex-layout';
/**
 * This is responsible for painting the entire screen during the render passes
 */
export class ScreenPassPainter {
    constructor(gl) {
        this._gl = gl;
        this._shader = new Shader({
            vertexSource: screenVertex,
            fragmentSource: screenFragment
        });
        this._shader.compile();
        // Setup memory layout
        this._buffer = new VertexBuffer({
            type: 'static',
            // clip space quad + uv since we don't need a camera
            data: new Float32Array([
                -1, -1, 0, 0,
                -1, 1, 0, 1,
                1, -1, 1, 0,
                1, -1, 1, 0,
                -1, 1, 0, 1,
                1, 1, 1, 1
            ])
        });
        this._layout = new VertexLayout({
            shader: this._shader,
            vertexBuffer: this._buffer,
            attributes: [
                ['a_position', 2],
                ['a_texcoord', 2]
            ]
        });
        this._buffer.upload();
    }
    renderWithPostProcessor(postprocessor) {
        const gl = this._gl;
        postprocessor.getShader().use();
        postprocessor.getLayout().use();
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    renderToScreen() {
        const gl = this._gl;
        this._shader.use();
        this._layout.use();
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
//# sourceMappingURL=screen-pass-painter.js.map