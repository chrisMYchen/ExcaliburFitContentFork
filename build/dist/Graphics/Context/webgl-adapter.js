/**
 * Must be accessed after Engine construction time to ensure the context has been created
 */
export class ExcaliburWebGLContextAccessor {
    static clear() {
        ExcaliburWebGLContextAccessor._GL = null;
    }
    static register(gl) {
        ExcaliburWebGLContextAccessor._GL = gl;
    }
    // current webgl context
    static get gl() {
        if (!ExcaliburWebGLContextAccessor._GL) {
            throw Error('Attempted gl access before init');
        }
        return ExcaliburWebGLContextAccessor._GL;
    }
}
//# sourceMappingURL=webgl-adapter.js.map