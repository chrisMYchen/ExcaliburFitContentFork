import { ExcaliburWebGLContextAccessor } from './webgl-adapter';
import { getAttributeComponentSize, getAttributePointerType } from './webgl-util';
export class Shader {
    /**
     * Create a shader program in excalibur
     * @param options specify shader vertex and fragment source
     */
    constructor(options) {
        this._gl = ExcaliburWebGLContextAccessor.gl;
        this.uniforms = {};
        this.attributes = {};
        this._compiled = false;
        const { vertexSource, fragmentSource } = options;
        this.vertexSource = vertexSource;
        this.fragmentSource = fragmentSource;
    }
    get compiled() {
        return this._compiled;
    }
    /**
     * Binds the shader program
     */
    use() {
        const gl = this._gl;
        gl.useProgram(this.program);
        Shader._ACTIVE_SHADER_INSTANCE = this;
    }
    isCurrentlyBound() {
        return Shader._ACTIVE_SHADER_INSTANCE === this;
    }
    /**
     * Compile the current shader against a webgl context
     */
    compile() {
        const gl = this._gl;
        const vertexShader = this._compileShader(gl, this.vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this._compileShader(gl, this.fragmentSource, gl.FRAGMENT_SHADER);
        this.program = this._createProgram(gl, vertexShader, fragmentShader);
        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            this.attributes[attribute.name] = attribute;
        }
        const uniforms = this.getUniforms();
        for (const uniform of uniforms) {
            this.uniforms[uniform.name] = uniform;
        }
        this._compiled = true;
        return this.program;
    }
    getUniforms() {
        const gl = this._gl;
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        const uniforms = [];
        for (let i = 0; i < uniformCount; i++) {
            const uniform = gl.getActiveUniform(this.program, i);
            const uniformLocation = gl.getUniformLocation(this.program, uniform.name);
            uniforms.push({
                name: uniform.name,
                glType: uniform.type,
                location: uniformLocation
            });
        }
        return uniforms;
    }
    getAttributes() {
        const gl = this._gl;
        const attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        const attributes = [];
        for (let i = 0; i < attributeCount; i++) {
            const attribute = gl.getActiveAttrib(this.program, i);
            const attributeLocation = gl.getAttribLocation(this.program, attribute.name);
            attributes.push({
                name: attribute.name,
                glType: getAttributePointerType(gl, attribute.type),
                size: getAttributeComponentSize(gl, attribute.type),
                location: attributeLocation,
                normalized: false
            });
        }
        return attributes;
    }
    /**
     * Set a texture in a gpu texture slot
     * @param slotNumber
     * @param texture
     */
    setTexture(slotNumber, texture) {
        const gl = this._gl;
        gl.activeTexture(gl.TEXTURE0 + slotNumber);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    /**
     * Set an integer uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformInt(name, value) {
        this.setUniform('uniform1i', name, ~~value);
    }
    /**
     * Set an integer array uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformIntArray(name, value) {
        this.setUniform('uniform1iv', name, value);
    }
    /**
     * Set a boolean uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformBoolean(name, value) {
        this.setUniform('uniform1i', name, value ? 1 : 0);
    }
    /**
     * Set a float uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloat(name, value) {
        this.setUniform('uniform1f', name, value);
    }
    /**
     * Set a float array uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloatArray(name, value) {
        this.setUniform('uniform1fv', name, value);
    }
    /**
     * Set a [[Vector]] uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloatVector(name, value) {
        this.setUniform('uniform2f', name, value.x, value.y);
    }
    /**
     * Set an [[Matrix]] uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformMatrix(name, value) {
        this.setUniform('uniformMatrix4fv', name, false, value.data);
    }
    /**
     * Set any available uniform type in webgl
     *
     * For example setUniform('uniformMatrix2fv', 'u_my2x2_mat`, ...);
     */
    setUniform(uniformType, name, ...value) {
        if (!this._compiled) {
            throw Error(`Must compile shader before setting a uniform ${uniformType}:${name}`);
        }
        if (!this.isCurrentlyBound()) {
            throw Error('Currently accessed shader instance is not the current active shader in WebGL,' +
                ' must call `shader.use()` before setting uniforms');
        }
        const gl = this._gl;
        const location = gl.getUniformLocation(this.program, name);
        if (location) {
            const args = [location, ...value];
            this._gl[uniformType].apply(this._gl, args);
        }
        else {
            throw Error(`Uniform ${uniformType}:${name} doesn\'t exist or is not used in the shader source code,` +
                ' unused uniforms are optimized away by most browsers');
        }
    }
    _createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        if (program === null) {
            throw Error('Could not create graphics shader program');
        }
        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // link the program.
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            throw Error(`Could not link the program: [${gl.getProgramInfoLog(program)}]`);
        }
        return program;
    }
    _compileShader(gl, source, type) {
        const typeName = gl.VERTEX_SHADER === type ? 'vertex' : 'fragment';
        const shader = gl.createShader(type);
        if (shader === null) {
            throw Error(`Could not build shader: [${source}]`);
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            const errorInfo = gl.getShaderInfoLog(shader);
            throw Error(`Could not compile ${typeName} shader:\n\n${errorInfo}${this._processSourceForError(source, errorInfo)}`);
        }
        return shader;
    }
    _processSourceForError(source, errorInfo) {
        const lines = source.split('\n');
        const errorLineStart = errorInfo.search(/\d:\d/);
        const errorLineEnd = errorInfo.indexOf(' ', errorLineStart);
        const [_, error2] = errorInfo.slice(errorLineStart, errorLineEnd).split(':').map(v => Number(v));
        for (let i = 0; i < lines.length; i++) {
            lines[i] = `${i + 1}: ${lines[i]}${error2 === (i + 1) ? ' <----- ERROR!' : ''}`;
        }
        return '\n\nSource:\n' + lines.join('\n');
    }
}
Shader._ACTIVE_SHADER_INSTANCE = null;
//# sourceMappingURL=shader.js.map