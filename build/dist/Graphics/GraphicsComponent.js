import { Vector, vec } from '../Math/vector';
import { Graphic } from './Graphic';
import { Logger } from '../Util/Log';
import { BoundingBox } from '../Collision/Index';
import { Component } from '../EntityComponentSystem/Component';
/**
 * Type guard for checking if a Graphic HasTick (used for graphics that change over time like animations)
 * @param graphic
 */
export function hasGraphicsTick(graphic) {
    return !!graphic.tick;
}
export class GraphicsLayer {
    constructor(_options, _graphics) {
        this._options = _options;
        this._graphics = _graphics;
        this.graphics = [];
    }
    get name() {
        return this._options.name;
    }
    hide(nameOrGraphic) {
        if (!nameOrGraphic) {
            this.graphics.length = 0;
        }
        else {
            let gfx = null;
            if (nameOrGraphic instanceof Graphic) {
                gfx = nameOrGraphic;
            }
            else {
                gfx = this._graphics.getGraphic(nameOrGraphic);
            }
            this.graphics = this.graphics.filter((g) => g.graphic !== gfx);
            this._graphics.recalculateBounds();
        }
    }
    /**
     * Show a graphic by name or instance at an offset, graphics are shown in the order in which `show()` is called.
     *
     * If `show()` is called multiple times for the same graphic it will be shown multiple times.
     * @param nameOrGraphic
     * @param options
     */
    show(nameOrGraphic, options) {
        options = { ...options };
        let gfx;
        if (nameOrGraphic instanceof Graphic) {
            gfx = this._graphics.copyGraphics ? nameOrGraphic.clone() : nameOrGraphic;
        }
        else {
            gfx = this._graphics.getGraphic(nameOrGraphic);
            if (!gfx) {
                Logger.getInstance().error(`No such graphic added to component named ${nameOrGraphic}. These named graphics are available: `, this._graphics.getNames());
            }
        }
        if (gfx) {
            this.graphics.push({ graphic: gfx, options });
            this._graphics.recalculateBounds();
            return gfx;
        }
        else {
            return null;
        }
    }
    /**
     * Use a specific graphic, swap out any current graphics being shown
     * @param nameOrGraphic
     * @param options
     */
    use(nameOrGraphic, options) {
        options = { ...options };
        this.hide();
        return this.show(nameOrGraphic, options);
    }
    /**
     * Current order of the layer, higher numbers are on top, lower numbers are on the bottom.
     *
     * For example a layer with `order = -1` would be under a layer of `order = 1`
     */
    get order() {
        return this._options.order;
    }
    /**
     * Set the order of the layer, higher numbers are on top, lower numbers are on the bottom.
     *
     * For example a layer with `order = -1` would be under a layer of `order = 1`
     */
    set order(order) {
        this._options.order = order;
    }
    /**
     * Get or set the pixel offset from the layer anchor for all graphics in the layer
     */
    get offset() {
        var _a;
        return (_a = this._options.offset) !== null && _a !== void 0 ? _a : Vector.Zero;
    }
    set offset(value) {
        this._options.offset = value;
    }
    get currentKeys() {
        var _a;
        return (_a = this.name) !== null && _a !== void 0 ? _a : 'anonymous';
    }
}
export class GraphicsLayers {
    constructor(_component) {
        this._component = _component;
        this._layers = [];
        this._layerMap = {};
        this.default = new GraphicsLayer({ name: 'default', order: 0 }, _component);
        this._maybeAddLayer(this.default);
    }
    create(options) {
        const layer = new GraphicsLayer(options, this._component);
        return this._maybeAddLayer(layer);
    }
    get(name) {
        if (name) {
            return this._getLayer(name);
        }
        return this._layers;
    }
    currentKeys() {
        const graphicsLayerKeys = [];
        for (const layer of this._layers) {
            graphicsLayerKeys.push(layer.currentKeys);
        }
        return graphicsLayerKeys;
    }
    has(name) {
        return name in this._layerMap;
    }
    _maybeAddLayer(layer) {
        if (this._layerMap[layer.name]) {
            // todo log warning
            return this._layerMap[layer.name];
        }
        this._layerMap[layer.name] = layer;
        this._layers.push(layer);
        this._layers.sort((a, b) => a.order - b.order);
        return layer;
    }
    _getLayer(name) {
        return this._layerMap[name];
    }
}
/**
 * Component to manage drawings, using with the position component
 */
export class GraphicsComponent extends Component {
    constructor(options) {
        super();
        this.type = 'ex.graphics';
        this._graphics = {};
        /**
         * Sets or gets wether any drawing should be visible in this component
         */
        this.visible = true;
        /**
         * Sets or gets wither all drawings should have an opacity applied
         */
        this.opacity = 1;
        /**
         * Offset to apply to graphics by default
         */
        this.offset = Vector.Zero;
        /**
         * Anchor to apply to graphics by default
         */
        this.anchor = Vector.Half;
        /**
         * If set to true graphics added to the component will be copied. This can affect performance
         */
        this.copyGraphics = false;
        this._localBounds = null;
        // Defaults
        options = {
            visible: this.visible,
            ...options
        };
        const { current, anchor, opacity, visible, graphics, offset, copyGraphics, onPreDraw, onPostDraw } = options;
        this._graphics = graphics || {};
        this.offset = offset !== null && offset !== void 0 ? offset : this.offset;
        this.opacity = opacity !== null && opacity !== void 0 ? opacity : this.opacity;
        this.anchor = anchor !== null && anchor !== void 0 ? anchor : this.anchor;
        this.copyGraphics = copyGraphics !== null && copyGraphics !== void 0 ? copyGraphics : this.copyGraphics;
        this.onPreDraw = onPreDraw !== null && onPreDraw !== void 0 ? onPreDraw : this.onPreDraw;
        this.onPostDraw = onPostDraw !== null && onPostDraw !== void 0 ? onPostDraw : this.onPostDraw;
        this.visible = !!visible;
        this.layers = new GraphicsLayers(this);
        if (current && this._graphics[current]) {
            this.show(this._graphics[current]);
        }
    }
    getGraphic(name) {
        return this._graphics[name];
    }
    /**
     * Get registered graphics names
     */
    getNames() {
        return Object.keys(this._graphics);
    }
    /**
     * Returns the currently displayed graphics and their offsets, empty array if hidden
     */
    get current() {
        return this.layers.default.graphics;
    }
    /**
     * Returns all graphics associated with this component
     */
    get graphics() {
        return this._graphics;
    }
    add(nameOrGraphic, graphic) {
        let name = 'default';
        let graphicToSet = null;
        if (typeof nameOrGraphic === 'string') {
            name = nameOrGraphic;
            graphicToSet = graphic;
        }
        else {
            graphicToSet = nameOrGraphic;
        }
        this._graphics[name] = this.copyGraphics ? graphicToSet.clone() : graphicToSet;
        if (name === 'default') {
            this.show('default');
        }
        return graphicToSet;
    }
    /**
     * Show a graphic by name on the **default** layer, returns the new [[Graphic]]
     */
    show(nameOrGraphic, options) {
        const result = this.layers.default.show(nameOrGraphic, options);
        this.recalculateBounds();
        return result;
    }
    /**
     * Use a graphic only, swap out any graphics on the **default** layer, returns the new [[Graphic]]
     * @param nameOrGraphic
     * @param options
     */
    use(nameOrGraphic, options) {
        const result = this.layers.default.use(nameOrGraphic, options);
        this.recalculateBounds();
        return result;
    }
    hide(nameOrGraphic) {
        this.layers.default.hide(nameOrGraphic);
    }
    set localBounds(bounds) {
        this._localBounds = bounds;
    }
    recalculateBounds() {
        let bb = new BoundingBox();
        for (const layer of this.layers.get()) {
            for (const { graphic, options } of layer.graphics) {
                let anchor = this.anchor;
                let offset = this.offset;
                if (options === null || options === void 0 ? void 0 : options.anchor) {
                    anchor = options.anchor;
                }
                if (options === null || options === void 0 ? void 0 : options.offset) {
                    offset = options.offset;
                }
                const bounds = graphic.localBounds;
                const offsetX = -bounds.width * anchor.x + offset.x;
                const offsetY = -bounds.height * anchor.y + offset.y;
                bb = graphic === null || graphic === void 0 ? void 0 : graphic.localBounds.translate(vec(offsetX + layer.offset.x, offsetY + layer.offset.y)).combine(bb);
            }
        }
        this._localBounds = bb;
    }
    get localBounds() {
        if (!this._localBounds || this._localBounds.hasZeroDimensions()) {
            this.recalculateBounds();
        }
        return this._localBounds;
    }
    /**
     * Update underlying graphics if necesary, called internally
     * @param elapsed
     * @internal
     */
    update(elapsed, idempotencyToken = 0) {
        for (const layer of this.layers.get()) {
            for (const { graphic } of layer.graphics) {
                if (hasGraphicsTick(graphic)) {
                    graphic === null || graphic === void 0 ? void 0 : graphic.tick(elapsed, idempotencyToken);
                }
            }
        }
    }
}
//# sourceMappingURL=GraphicsComponent.js.map