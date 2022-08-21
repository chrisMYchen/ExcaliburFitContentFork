import { ExcaliburWebGLContextAccessor } from './webgl-adapter';
/**
 * Helper around vertex buffer to simplify creating and uploading geometry
 *
 * Under the hood uses Float32Array
 */
export class VertexBuffer {
    constructor(options) {
        this._gl = ExcaliburWebGLContextAccessor.gl;
        /**
         * If the vertices never change switching 'static' can be more efficient on the gpu
         *
         * Default is 'dynamic'
         */
        this.type = 'dynamic';
        const { size, type, data } = options;
        this.buffer = this._gl.createBuffer();
        if (!data && !size) {
            throw Error('Must either provide data or a size to the VertexBuffer');
        }
        if (!data) {
            this.bufferData = new Float32Array(size);
        }
        else {
            this.bufferData = data;
        }
        this.type = type !== null && type !== void 0 ? type : this.type;
        // Allocate buffer
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, this.type === 'static' ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
    }
    /**
     * Bind this vertex buffer
     */
    bind() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    }
    /**
     * Upload vertex buffer geometry to the GPU
     */
    upload(count) {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        if (count) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData, 0, count);
        }
        else {
            // TODO always use bufferSubData? need to perf test it
            gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, this.type === 'static' ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
        }
    }
}
//# sourceMappingURL=vertex-buffer.js.map