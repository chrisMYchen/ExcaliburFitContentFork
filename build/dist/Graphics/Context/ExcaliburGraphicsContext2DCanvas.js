import { Color } from '../../Color';
import { StateStack } from './state-stack';
import { GraphicsDiagnostics } from '../GraphicsDiagnostics';
import { DebugText } from './debug-text';
const pixelSnapEpsilon = 0.0001;
class ExcaliburGraphicsContext2DCanvasDebug {
    constructor(_ex) {
        this._ex = _ex;
        this._debugText = new DebugText();
    }
    /**
     * Draw a debug rectangle to the context
     * @param x
     * @param y
     * @param width
     * @param height
     */
    drawRect(x, y, width, height) {
        this._ex.__ctx.save();
        this._ex.__ctx.strokeStyle = 'red';
        this._ex.__ctx.strokeRect(this._ex.snapToPixel ? ~~(x + pixelSnapEpsilon) : x, this._ex.snapToPixel ? ~~(y + pixelSnapEpsilon) : y, this._ex.snapToPixel ? ~~(width + pixelSnapEpsilon) : width, this._ex.snapToPixel ? ~~(height + pixelSnapEpsilon) : height);
        this._ex.__ctx.restore();
    }
    drawLine(start, end, lineOptions = { color: Color.Black }) {
        this._ex.__ctx.save();
        this._ex.__ctx.beginPath();
        this._ex.__ctx.strokeStyle = lineOptions.color.toString();
        this._ex.__ctx.moveTo(this._ex.snapToPixel ? ~~(start.x + pixelSnapEpsilon) : start.x, this._ex.snapToPixel ? ~~(start.y + pixelSnapEpsilon) : start.y);
        this._ex.__ctx.lineTo(this._ex.snapToPixel ? ~~(end.x + pixelSnapEpsilon) : end.x, this._ex.snapToPixel ? ~~(end.y + pixelSnapEpsilon) : end.y);
        this._ex.__ctx.lineWidth = 2;
        this._ex.__ctx.stroke();
        this._ex.__ctx.closePath();
        this._ex.__ctx.restore();
    }
    drawPoint(point, pointOptions = { color: Color.Black, size: 5 }) {
        this._ex.__ctx.save();
        this._ex.__ctx.beginPath();
        this._ex.__ctx.fillStyle = pointOptions.color.toString();
        this._ex.__ctx.arc(this._ex.snapToPixel ? ~~(point.x + pixelSnapEpsilon) : point.x, this._ex.snapToPixel ? ~~(point.y + pixelSnapEpsilon) : point.y, pointOptions.size, 0, Math.PI * 2);
        this._ex.__ctx.fill();
        this._ex.__ctx.closePath();
        this._ex.__ctx.restore();
    }
    drawText(text, pos) {
        this._debugText.write(this._ex, text, pos);
    }
}
export class ExcaliburGraphicsContext2DCanvas {
    constructor(options) {
        /**
         * Unused in Canvas implementation
         */
        this.useDrawSorting = false;
        /**
         * Unused in Canvas implementation
         */
        this.z = 0;
        this.backgroundColor = Color.ExcaliburBlue;
        this._state = new StateStack();
        this.snapToPixel = false;
        this.debug = new ExcaliburGraphicsContext2DCanvasDebug(this);
        const { canvasElement, enableTransparency, snapToPixel, smoothing, backgroundColor } = options;
        this.__ctx = canvasElement.getContext('2d', {
            alpha: enableTransparency !== null && enableTransparency !== void 0 ? enableTransparency : true
        });
        this.backgroundColor = backgroundColor !== null && backgroundColor !== void 0 ? backgroundColor : this.backgroundColor;
        this.snapToPixel = snapToPixel !== null && snapToPixel !== void 0 ? snapToPixel : this.snapToPixel;
        this.smoothing = smoothing !== null && smoothing !== void 0 ? smoothing : this.smoothing;
    }
    get width() {
        return this.__ctx.canvas.width;
    }
    get height() {
        return this.__ctx.canvas.height;
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
    get smoothing() {
        return this.__ctx.imageSmoothingEnabled;
    }
    set smoothing(value) {
        this.__ctx.imageSmoothingEnabled = value;
    }
    resetTransform() {
        this.__ctx.resetTransform();
    }
    updateViewport(_resolution) {
        // pass
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
        this.__ctx.globalAlpha = this.opacity;
        const args = [image, sx, sy, swidth, sheight, dx, dy, dwidth, dheight]
            .filter((a) => a !== undefined)
            .map((a) => (typeof a === 'number' && this.snapToPixel ? ~~a : a));
        this.__ctx.drawImage.apply(this.__ctx, args);
        GraphicsDiagnostics.DrawCallCount++;
        GraphicsDiagnostics.DrawnImagesCount = 1;
    }
    drawLine(start, end, color, thickness = 1) {
        this.__ctx.save();
        this.__ctx.beginPath();
        this.__ctx.strokeStyle = color.toString();
        this.__ctx.moveTo(this.snapToPixel ? ~~(start.x + pixelSnapEpsilon) : start.x, this.snapToPixel ? ~~(start.y + pixelSnapEpsilon) : start.y);
        this.__ctx.lineTo(this.snapToPixel ? ~~(end.x + pixelSnapEpsilon) : end.x, this.snapToPixel ? ~~(end.y + pixelSnapEpsilon) : end.y);
        this.__ctx.lineWidth = thickness;
        this.__ctx.stroke();
        this.__ctx.closePath();
        this.__ctx.restore();
    }
    drawRectangle(pos, width, height, color) {
        this.__ctx.save();
        this.__ctx.fillStyle = color.toString();
        this.__ctx.fillRect(this.snapToPixel ? ~~(pos.x + pixelSnapEpsilon) : pos.x, this.snapToPixel ? ~~(pos.y + pixelSnapEpsilon) : pos.y, this.snapToPixel ? ~~(width + pixelSnapEpsilon) : width, this.snapToPixel ? ~~(height + pixelSnapEpsilon) : height);
        this.__ctx.restore();
    }
    drawCircle(pos, radius, color, stroke, thickness) {
        this.__ctx.save();
        this.__ctx.beginPath();
        if (stroke) {
            this.__ctx.strokeStyle = stroke.toString();
        }
        if (thickness) {
            this.__ctx.lineWidth = thickness;
        }
        this.__ctx.fillStyle = color.toString();
        this.__ctx.arc(this.snapToPixel ? ~~(pos.x + pixelSnapEpsilon) : pos.x, this.snapToPixel ? ~~(pos.y + pixelSnapEpsilon) : pos.y, radius, 0, Math.PI * 2);
        this.__ctx.fill();
        if (stroke) {
            this.__ctx.stroke();
        }
        this.__ctx.closePath();
        this.__ctx.restore();
    }
    /**
     * Save the current state of the canvas to the stack (transforms and opacity)
     */
    save() {
        this.__ctx.save();
    }
    /**
     * Restore the state of the canvas from the stack
     */
    restore() {
        this.__ctx.restore();
    }
    /**
     * Translate the origin of the context by an x and y
     * @param x
     * @param y
     */
    translate(x, y) {
        this.__ctx.translate(this.snapToPixel ? ~~(x + pixelSnapEpsilon) : x, this.snapToPixel ? ~~(y + pixelSnapEpsilon) : y);
    }
    /**
     * Rotate the context about the current origin
     */
    rotate(angle) {
        this.__ctx.rotate(angle);
    }
    /**
     * Scale the context by an x and y factor
     * @param x
     * @param y
     */
    scale(x, y) {
        this.__ctx.scale(x, y);
    }
    getTransform() {
        throw new Error('Not implemented');
    }
    multiply(_m) {
        this.__ctx.setTransform(this.__ctx.getTransform().multiply(_m.toDOMMatrix()));
    }
    addPostProcessor(_postprocessor) {
        // pass
    }
    removePostProcessor(_postprocessor) {
        // pass
    }
    clearPostProcessors() {
        // pass
    }
    beginDrawLifecycle() {
        // pass
    }
    endDrawLifecycle() {
        // pass
    }
    clear() {
        // Clear frame
        this.__ctx.clearRect(0, 0, this.width, this.height);
        this.__ctx.fillStyle = this.backgroundColor.toString();
        this.__ctx.fillRect(0, 0, this.width, this.height);
        GraphicsDiagnostics.clear();
    }
    /**
     * Flushes the batched draw calls to the screen
     */
    flush() {
        // pass
    }
}
//# sourceMappingURL=ExcaliburGraphicsContext2DCanvas.js.map