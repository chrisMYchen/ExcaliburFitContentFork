import { Logger } from '../..';
import { ExcaliburWebGLContextAccessor } from './webgl-adapter';
import { getGlTypeSizeBytes } from './webgl-util';
/**
 * Helper around creating vertex attributes in a given [[VertexBuffer]], this is useful for describing
 * the memory layout for your vertices inside a particular buffer
 *
 * Note: This helper assumes interleaved attributes in one [[VertexBuffer]], not many.
 *
 * Working with `gl.vertexAttribPointer` can be tricky, and this attempts to double check you
 */
export class VertexLayout {
    constructor(options) {
        this._gl = ExcaliburWebGLContextAccessor.gl;
        this._logger = Logger.getInstance();
        this._layout = [];
        this._attributes = [];
        this._vertexTotalSizeBytes = 0;
        const { shader, vertexBuffer, attributes } = options;
        this._vertexBuffer = vertexBuffer;
        this._attributes = attributes;
        this._shader = shader;
        this.initialize();
    }
    get vertexBuffer() {
        return this._vertexBuffer;
    }
    get attributes() {
        return this._attributes;
    }
    /**
     * Total number of bytes that the vertex will take up
     */
    get totalVertexSizeBytes() {
        return this._vertexTotalSizeBytes;
    }
    /**
     * Layouts need shader locations and must be bound to a shader
     */
    initialize() {
        if (!this._shader.compiled) {
            throw Error('Shader not compiled, shader must be compiled before defining a vertex layout');
        }
        this._layout.length = 0;
        const shaderAttributes = this._shader.attributes;
        for (const attribute of this._attributes) {
            const attrib = shaderAttributes[attribute[0]];
            if (!attrib) {
                throw Error(`The attribute named: ${attribute[0]} size ${attribute[1]}` +
                    ` not found in the shader source code:\n ${this._shader.vertexSource}`);
            }
            if (attrib.size !== attribute[1]) {
                throw Error(`VertexLayout size definition for attribute: [${attribute[0]}, ${attribute[1]}],`
                    + ` doesnt match shader source size ${attrib.size}:\n ${this._shader.vertexSource}`);
            }
            this._layout.push(attrib);
        }
        // calc size
        let componentsPerVertex = 0;
        for (const vertAttribute of this._layout) {
            const typeSize = getGlTypeSizeBytes(this._gl, vertAttribute.glType);
            this._vertexTotalSizeBytes += typeSize * vertAttribute.size;
            componentsPerVertex += vertAttribute.size;
        }
        if (this._vertexBuffer.bufferData.length % componentsPerVertex !== 0) {
            this._logger.warn(`The vertex component size (${componentsPerVertex})  does divide evenly into the specified vertex buffer`
                + ` (${this._vertexBuffer.bufferData.length})`);
        }
    }
    /**
     * Bind this layout with it's associated vertex buffer
     *
     * @param uploadBuffer Optionally indicate you wish to upload the buffer to the GPU associated with this layout
     */
    use(uploadBuffer = false, count) {
        const gl = this._gl;
        if (!this._shader.isCurrentlyBound()) {
            throw Error('Shader associated with this vertex layout is not active! Call shader.use() before layout.use()');
        }
        this._vertexBuffer.bind();
        if (uploadBuffer) {
            this._vertexBuffer.upload(count);
        }
        let offset = 0;
        // TODO switch to VAOs if the extension is
        for (const vert of this._layout) {
            gl.vertexAttribPointer(vert.location, vert.size, vert.glType, vert.normalized, this.totalVertexSizeBytes, offset);
            gl.enableVertexAttribArray(vert.location);
            offset += getGlTypeSizeBytes(gl, vert.glType) * vert.size;
        }
    }
}
//# sourceMappingURL=vertex-layout.js.map