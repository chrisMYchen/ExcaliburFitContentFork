import { Matrix } from '../../Math/matrix';
import { TransformStack } from './transform-stack';
import { vec } from '../../Math/vector';
import { Color } from '../../Color';
import { StateStack } from './state-stack';
import { Logger } from '../../Util/Log';
import { DebugText } from './debug-text';
import { RenderTarget } from './render-target';
import { ExcaliburWebGLContextAccessor } from './webgl-adapter';
import { TextureLoader } from './texture-loader';
// renderers
import { LineRenderer } from './line-renderer/line-renderer';
import { PointRenderer } from './point-renderer/point-renderer';
import { ScreenPassPainter } from './screen-pass-painter/screen-pass-painter';
import { ImageRenderer } from './image-renderer/image-renderer';
import { RectangleRenderer } from './rectangle-renderer/rectangle-renderer';
import { CircleRenderer } from './circle-renderer/circle-renderer';
import { Pool } from '../../Util/Pool';
import { DrawCall } from './draw-call';
import { AffineMatrix } from '../../Math/affine-matrix';
export const pixelSnapEpsilon = 0.0001;
class ExcaliburGraphicsContextWebGLDebug {
    constructor(_webglCtx) {
        this._webglCtx = _webglCtx;
        this._debugText = new DebugText();
    }
    /**
     * Draw a debugging rectangle to the context
     * @param x
     * @param y
     * @param width
     * @param height
     */
    drawRect(x, y, width, height, rectOptions = { color: Color.Black }) {
        this.drawLine(vec(x, y), vec(x + width, y), { ...rectOptions });
        this.drawLine(vec(x + width, y), vec(x + width, y + height), { ...rectOptions });
        this.drawLine(vec(x + width, y + height), vec(x, y + height), { ...rectOptions });
        this.drawLine(vec(x, y + height), vec(x, y), { ...rectOptions });
    }
    /**
     * Draw a debugging line to the context
     * @param start
     * @param end
     * @param lineOptions
     */
    drawLine(start, end, lineOptions = { color: Color.Black }) {
        this._webglCtx.draw('ex.line', start, end, lineOptions.color);
    }
    /**
     * Draw a debugging point to the context
     * @param point
     * @param pointOptions
     */
    drawPoint(point, pointOptions = { color: Color.Black, size: 5 }) {
        this._webglCtx.draw('ex.point', point, pointOptions.color, pointOptions.size);
    }
    drawText(text, pos) {
        this._debugText.write(this._webglCtx, text, pos);
    }
}
export class ExcaliburGraphicsContextWebGL {
    constructor(options) {
        this._logger = Logger.getInstance();
        this._renderers = new Map();
        this._isDrawLifecycle = false;
        this.useDrawSorting = true;
        this._drawCallPool = new Pool(() => new DrawCall(), (instance) => {
            instance.priority = 0;
            instance.z = 0;
            instance.renderer = undefined;
            instance.args = undefined;
            return instance;
        }, 4000);
        this._drawCalls = [];
        // Postprocessing is a tuple with 2 render targets, these are flip-flopped during the postprocessing process
        this._postProcessTargets = [];
        this._postprocessors = [];
        this._transform = new TransformStack();
        this._state = new StateStack();
        this.snapToPixel = false;
        this.smoothing = false;
        this.backgroundColor = Color.ExcaliburBlue;
        this._alreadyWarnedDrawLifecycle = false;
        this.debug = new ExcaliburGraphicsContextWebGLDebug(this);
        const { canvasElement, enableTransparency, smoothing, snapToPixel, backgroundColor, useDrawSorting } = options;
        this.__gl = canvasElement.getContext('webgl2', {
            antialias: smoothing !== null && smoothing !== void 0 ? smoothing : this.smoothing,
            premultipliedAlpha: false,
            alpha: enableTransparency !== null && enableTransparency !== void 0 ? enableTransparency : true,
            depth: true,
            powerPreference: 'high-performance'
            // TODO Chromium fixed the bug where this didn't work now it breaks CI :(
            // failIfMajorPerformanceCaveat: true
        });
        if (!this.__gl) {
            throw Error('Failed to retrieve webgl context from browser');
        }
        ExcaliburWebGLContextAccessor.register(this.__gl);
        TextureLoader.register(this.__gl);
        this.snapToPixel = snapToPixel !== null && snapToPixel !== void 0 ? snapToPixel : this.snapToPixel;
        this.smoothing = smoothing !== null && smoothing !== void 0 ? smoothing : this.smoothing;
        this.backgroundColor = backgroundColor !== null && backgroundColor !== void 0 ? backgroundColor : this.backgroundColor;
        this.useDrawSorting = useDrawSorting !== null && useDrawSorting !== void 0 ? useDrawSorting : this.useDrawSorting;
        this._drawCallPool.disableWarnings = true;
        this._drawCallPool.preallocate();
        this._init();
    }
    get z() {
        return this._state.current.z;
    }
    set z(value) {
        this._state.current.z = value;
    }
    get opacity() {
        return this._state.current.opacity;
    }
    set opacity(value) {
        this._state.current.opacity = value;
    }
    get tint() {
        return this._state.current.tint;
    }
    set tint(color) {
        this._state.current.tint = color;
    }
    get width() {
        return this.__gl.canvas.width;
    }
    get height() {
        return this.__gl.canvas.height;
    }
    get ortho() {
        return this._ortho;
    }
    /**
     * Checks the underlying webgl implementation if the requested internal resolution is supported
     * @param dim
     */
    checkIfResolutionSupported(dim) {
        // Slight hack based on this thread https://groups.google.com/g/webgl-dev-list/c/AHONvz3oQTo
        let supported = true;
        if (dim.width > 4096 || dim.height > 4096) {
            supported = false;
        }
        return supported;
    }
    _init() {
        const gl = this.__gl;
        // Setup viewport and view matrix
        this._ortho = Matrix.ortho(0, gl.canvas.width, gl.canvas.height, 0, 400, -400);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // Clear background
        gl.clearColor(this.backgroundColor.r / 255, this.backgroundColor.g / 255, this.backgroundColor.b / 255, this.backgroundColor.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Enable alpha blending
        // https://www.realtimerendering.com/blog/gpus-prefer-premultiplication/
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        // Setup builtin renderers
        this.register(new ImageRenderer());
        this.register(new RectangleRenderer());
        this.register(new CircleRenderer());
        this.register(new PointRenderer());
        this.register(new LineRenderer());
        this._screenRenderer = new ScreenPassPainter(gl);
        this._renderTarget = new RenderTarget({
            gl,
            width: gl.canvas.width,
            height: gl.canvas.height
        });
        this._postProcessTargets = [
            new RenderTarget({
                gl,
                width: gl.canvas.width,
                height: gl.canvas.height
            }),
            new RenderTarget({
                gl,
                width: gl.canvas.width,
                height: gl.canvas.height
            })
        ];
    }
    register(renderer) {
        this._renderers.set(renderer.type, renderer);
        renderer.initialize(this.__gl, this);
    }
    get(rendererName) {
        return this._renderers.get(rendererName);
    }
    _isCurrentRenderer(renderer) {
        if (!this._currentRenderer || this._currentRenderer === renderer) {
            return true;
        }
        return false;
    }
    beginDrawLifecycle() {
        this._isDrawLifecycle = true;
    }
    endDrawLifecycle() {
        this._isDrawLifecycle = false;
    }
    draw(rendererName, ...args) {
        if (!this._isDrawLifecycle && !this._alreadyWarnedDrawLifecycle) {
            this._logger.warn(`Attempting to draw outside the the drawing lifecycle (preDraw/postDraw) is not supported and is a source of bugs/errors.\n` +
                `If you want to do custom drawing, use Actor.graphics, or any onPreDraw or onPostDraw handler.`);
            this._alreadyWarnedDrawLifecycle = true;
        }
        const renderer = this._renderers.get(rendererName);
        if (renderer) {
            if (this.useDrawSorting) {
                const drawCall = this._drawCallPool.get();
                drawCall.z = this._state.current.z;
                drawCall.priority = renderer.priority;
                drawCall.renderer = rendererName;
                this.getTransform().clone(drawCall.transform);
                drawCall.state.z = this._state.current.z;
                drawCall.state.opacity = this._state.current.opacity;
                drawCall.state.tint = this._state.current.tint;
                drawCall.args = args;
                this._drawCalls.push(drawCall);
            }
            else {
                // Set the current renderer if not defined
                if (!this._currentRenderer) {
                    this._currentRenderer = renderer;
                }
                if (!this._isCurrentRenderer(renderer)) {
                    // switching graphics means we must flush the previous
                    this._currentRenderer.flush();
                }
                // If we are still using the same renderer we can add to the current batch
                renderer.draw(...args);
                this._currentRenderer = renderer;
            }
        }
        else {
            throw Error(`No renderer with name ${rendererName} has been registered`);
        }
    }
    resetTransform() {
        this._transform.current = AffineMatrix.identity();
    }
    updateViewport(resolution) {
        const gl = this.__gl;
        this._ortho = this._ortho = Matrix.ortho(0, resolution.width, resolution.height, 0, 400, -400);
        this._renderTarget.setResolution(gl.canvas.width, gl.canvas.height);
        this._postProcessTargets[0].setResolution(gl.canvas.width, gl.canvas.height);
        this._postProcessTargets[1].setResolution(gl.canvas.width, gl.canvas.height);
    }
    drawImage(image, sx, sy, swidth, sheight, dx, dy, dwidth, dheight) {
        if (swidth === 0 || sheight === 0) {
            return; // zero dimension dest exit early
        }
        else if (dwidth === 0 || dheight === 0) {
            return; // zero dimension dest exit early
        }
        else if (image.width === 0 || image.height === 0) {
            return; // zero dimension source exit early
        }
        if (!image) {
            Logger.getInstance().warn('Cannot draw a null or undefined image');
            // tslint:disable-next-line: no-console
            if (console.trace) {
                // tslint:disable-next-line: no-console
                console.trace();
            }
            return;
        }
        this.draw('ex.image', image, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
    }
    drawLine(start, end, color, thickness = 1) {
        this.draw('ex.rectangle', start, end, color, thickness);
    }
    drawRectangle(pos, width, height, color, stroke, strokeThickness) {
        this.draw('ex.rectangle', pos, width, height, color, stroke, strokeThickness);
    }
    drawCircle(pos, radius, color, stroke, thickness) {
        this.draw('ex.circle', pos, radius, color, stroke, thickness);
    }
    save() {
        this._transform.save();
        this._state.save();
    }
    restore() {
        this._transform.restore();
        this._state.restore();
    }
    translate(x, y) {
        this._transform.translate(this.snapToPixel ? ~~(x + pixelSnapEpsilon) : x, this.snapToPixel ? ~~(y + pixelSnapEpsilon) : y);
    }
    rotate(angle) {
        this._transform.rotate(angle);
    }
    scale(x, y) {
        this._transform.scale(x, y);
    }
    transform(matrix) {
        this._transform.current = matrix;
    }
    getTransform() {
        return this._transform.current;
    }
    multiply(m) {
        this._transform.current.multiply(m, this._transform.current);
    }
    addPostProcessor(postprocessor) {
        this._postprocessors.push(postprocessor);
        postprocessor.initialize(this.__gl);
    }
    removePostProcessor(postprocessor) {
        const index = this._postprocessors.indexOf(postprocessor);
        if (index !== -1) {
            this._postprocessors.splice(index, 1);
        }
    }
    clearPostProcessors() {
        this._postprocessors.length = 0;
    }
    clear() {
        const gl = this.__gl;
        this._renderTarget.use();
        gl.clearColor(this.backgroundColor.r / 255, this.backgroundColor.g / 255, this.backgroundColor.b / 255, this.backgroundColor.a);
        // Clear the context with the newly set color. This is
        // the function call that actually does the drawing.
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    /**
     * Flushes all batched rendering to the screen
     */
    flush() {
        const gl = this.__gl;
        // render target captures all draws and redirects to the render target
        this._renderTarget.use();
        if (this.useDrawSorting) {
            // sort draw calls
            // Find the original order of the first instance of the draw call
            const originalSort = new Map();
            for (const [name] of this._renderers) {
                const firstIndex = this._drawCalls.findIndex(dc => dc.renderer === name);
                originalSort.set(name, firstIndex);
            }
            this._drawCalls.sort((a, b) => {
                const zIndex = a.z - b.z;
                const originalSortOrder = originalSort.get(a.renderer) - originalSort.get(b.renderer);
                const priority = a.priority - b.priority;
                if (zIndex === 0) { // sort by z first
                    if (priority === 0) { // sort by priority
                        return originalSortOrder; // use the original order to inform draw call packing to maximally preserve painter order
                    }
                    return priority;
                }
                return zIndex;
            });
            const oldTransform = this._transform.current;
            const oldState = this._state.current;
            if (this._drawCalls.length) {
                let currentRendererName = this._drawCalls[0].renderer;
                let currentRenderer = this._renderers.get(currentRendererName);
                for (let i = 0; i < this._drawCalls.length; i++) {
                    // hydrate the state for renderers
                    this._transform.current = this._drawCalls[i].transform;
                    this._state.current = this._drawCalls[i].state;
                    if (this._drawCalls[i].renderer !== currentRendererName) {
                        // switching graphics renderer means we must flush the previous
                        currentRenderer.flush();
                        currentRendererName = this._drawCalls[i].renderer;
                        currentRenderer = this._renderers.get(currentRendererName);
                    }
                    // If we are still using the same renderer we can add to the current batch
                    currentRenderer.draw(...this._drawCalls[i].args);
                }
                if (currentRenderer.hasPendingDraws()) {
                    currentRenderer.flush();
                }
            }
            // reset state
            this._transform.current = oldTransform;
            this._state.current = oldState;
            // reclaim draw calls
            this._drawCallPool.done();
            this._drawCalls.length = 0;
        }
        else {
            // This is the final flush at the moment to draw any leftover pending draw
            for (const renderer of this._renderers.values()) {
                if (renderer.hasPendingDraws()) {
                    renderer.flush();
                }
            }
        }
        this._renderTarget.disable();
        // post process step
        const source = this._renderTarget.toRenderSource();
        source.use();
        // flip flop render targets
        for (let i = 0; i < this._postprocessors.length; i++) {
            this._postProcessTargets[i % 2].use();
            this._screenRenderer.renderWithPostProcessor(this._postprocessors[i]);
            this._postProcessTargets[i % 2].toRenderSource().use();
        }
        // passing null switches rendering back to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this._screenRenderer.renderToScreen();
    }
}
//# sourceMappingURL=ExcaliburGraphicsContextWebGL.js.map