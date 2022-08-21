import { BoundingBox } from '../Collision/BoundingBox';
import { Vector, vec } from '../Math/vector';
import { Logger } from '../Util/Log';
import * as Events from '../Events';
import { Entity } from '../EntityComponentSystem/Entity';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { BodyComponent } from '../Collision/BodyComponent';
import { CollisionType } from '../Collision/CollisionType';
import { Shape } from '../Collision/Colliders/Shape';
import { GraphicsComponent, hasGraphicsTick, ParallaxComponent } from '../Graphics';
import { removeItemFromArray } from '../Util/Util';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { ColliderComponent } from '../Collision/ColliderComponent';
import { Color } from '../Color';
import { DebugGraphicsComponent } from '../Graphics/DebugGraphicsComponent';
/**
 * The TileMap provides a mechanism for doing flat 2D tiles rendered in a grid.
 *
 * TileMaps are useful for top down or side scrolling grid oriented games.
 */
export class TileMap extends Entity {
    /**
     * @param options
     */
    constructor(options) {
        var _a, _b;
        super(null, options.name);
        this._token = 0;
        this._onScreenXStart = 0;
        this._onScreenXEnd = Number.MAX_VALUE;
        this._onScreenYStart = 0;
        this._onScreenYEnd = Number.MAX_VALUE;
        this.logger = Logger.getInstance();
        this.tiles = [];
        this._rows = [];
        this._cols = [];
        this.renderFromTopOfGraphic = false;
        this._collidersDirty = true;
        this._originalOffsets = new WeakMap();
        this.addComponent(new TransformComponent());
        this.addComponent(new MotionComponent());
        this.addComponent(new BodyComponent({
            type: CollisionType.Fixed
        }));
        this.addComponent(new GraphicsComponent({
            onPostDraw: (ctx, delta) => this.draw(ctx, delta)
        }));
        this.addComponent(new DebugGraphicsComponent((ctx) => this.debug(ctx)));
        this.addComponent(new ColliderComponent());
        this._graphics = this.get(GraphicsComponent);
        this._transform = this.get(TransformComponent);
        this._motion = this.get(MotionComponent);
        this._collider = this.get(ColliderComponent);
        this._composite = this._collider.useCompositeCollider([]);
        this._transform.pos = (_a = options.pos) !== null && _a !== void 0 ? _a : Vector.Zero;
        this._oldPos = this._transform.pos;
        this.renderFromTopOfGraphic = (_b = options.renderFromTopOfGraphic) !== null && _b !== void 0 ? _b : this.renderFromTopOfGraphic;
        this.tileWidth = options.tileWidth;
        this.tileHeight = options.tileHeight;
        this.rows = options.rows;
        this.columns = options.columns;
        this.tiles = new Array(this.rows * this.columns);
        this._rows = new Array(this.rows);
        this._cols = new Array(this.columns);
        let currentCol = [];
        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows; j++) {
                const cd = new Tile({
                    x: i,
                    y: j,
                    map: this
                });
                cd.map = this;
                this.tiles[i + j * this.columns] = cd;
                currentCol.push(cd);
                if (!this._rows[j]) {
                    this._rows[j] = [];
                }
                this._rows[j].push(cd);
            }
            this._cols[i] = currentCol;
            currentCol = [];
        }
        this._graphics.localBounds = new BoundingBox({
            left: 0,
            top: 0,
            right: this.columns * this.tileWidth,
            bottom: this.rows * this.tileHeight
        });
    }
    flagCollidersDirty() {
        this._collidersDirty = true;
    }
    get x() {
        var _a;
        return (_a = this._transform.pos.x) !== null && _a !== void 0 ? _a : 0;
    }
    set x(val) {
        var _a;
        if ((_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos) {
            this.get(TransformComponent).pos = vec(val, this.y);
        }
    }
    get y() {
        var _a, _b;
        return (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos.y) !== null && _b !== void 0 ? _b : 0;
    }
    set y(val) {
        var _a;
        if ((_a = this._transform) === null || _a === void 0 ? void 0 : _a.pos) {
            this._transform.pos = vec(this.x, val);
        }
    }
    get z() {
        var _a;
        return (_a = this._transform.z) !== null && _a !== void 0 ? _a : 0;
    }
    set z(val) {
        if (this._transform) {
            this._transform.z = val;
        }
    }
    get rotation() {
        var _a, _b;
        return (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.rotation) !== null && _b !== void 0 ? _b : 0;
    }
    set rotation(val) {
        var _a;
        if ((_a = this._transform) === null || _a === void 0 ? void 0 : _a.rotation) {
            this._transform.rotation = val;
        }
    }
    get scale() {
        var _a, _b;
        return (_b = (_a = this._transform) === null || _a === void 0 ? void 0 : _a.scale) !== null && _b !== void 0 ? _b : Vector.One;
    }
    set scale(val) {
        var _a;
        if ((_a = this._transform) === null || _a === void 0 ? void 0 : _a.scale) {
            this._transform.scale = val;
        }
    }
    get pos() {
        return this._transform.pos;
    }
    set pos(val) {
        this._transform.pos = val;
    }
    get vel() {
        return this._motion.vel;
    }
    set vel(val) {
        this._motion.vel = val;
    }
    on(eventName, handler) {
        super.on(eventName, handler);
    }
    _initialize(engine) {
        super._initialize(engine);
    }
    _getOrSetColliderOriginalOffset(collider) {
        if (!this._originalOffsets.has(collider)) {
            const originalOffset = collider.offset;
            this._originalOffsets.set(collider, originalOffset);
            return originalOffset;
        }
        else {
            return this._originalOffsets.get(collider);
        }
    }
    /**
     * Tiles colliders based on the solid tiles in the tilemap.
     */
    _updateColliders() {
        this._composite.clearColliders();
        const colliders = [];
        this._composite = this._collider.useCompositeCollider([]);
        let current;
        // Bad square tesselation algo
        for (let i = 0; i < this.columns; i++) {
            // Scan column for colliders
            for (let j = 0; j < this.rows; j++) {
                // Columns start with a new collider
                if (j === 0) {
                    current = null;
                }
                const tile = this.tiles[i + j * this.columns];
                // Current tile in column is solid build up current collider
                if (tile.solid) {
                    // Use custom collider otherwise bounding box
                    if (tile.getColliders().length > 0) {
                        for (const collider of tile.getColliders()) {
                            const originalOffset = this._getOrSetColliderOriginalOffset(collider);
                            collider.offset = vec(tile.x * this.tileWidth, tile.y * this.tileHeight).add(originalOffset);
                            collider.owner = this;
                            this._composite.addCollider(collider);
                        }
                        current = null;
                    }
                    else {
                        if (!current) {
                            current = tile.bounds;
                        }
                        else {
                            current = current.combine(tile.bounds);
                        }
                    }
                }
                else {
                    // Not solid skip and cut off the current collider
                    if (current) {
                        colliders.push(current);
                    }
                    current = null;
                }
            }
            // After a column is complete check to see if it can be merged into the last one
            if (current) {
                // if previous is the same combine it
                const prev = colliders[colliders.length - 1];
                if (prev && prev.top === current.top && prev.bottom === current.bottom) {
                    colliders[colliders.length - 1] = prev.combine(current);
                }
                else {
                    // else new collider
                    colliders.push(current);
                }
            }
        }
        for (const c of colliders) {
            const collider = Shape.Box(c.width, c.height, Vector.Zero, vec(c.left - this.pos.x, c.top - this.pos.y));
            collider.owner = this;
            this._composite.addCollider(collider);
        }
        this._collider.update();
    }
    /**
     * Returns the [[Tile]] by index (row major order)
     */
    getTileByIndex(index) {
        return this.tiles[index];
    }
    /**
     * Returns the [[Tile]] by its x and y integer coordinates
     */
    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) {
            return null;
        }
        return this.tiles[x + y * this.columns];
    }
    /**
     * Returns the [[Tile]] by testing a point in world coordinates,
     * returns `null` if no Tile was found.
     */
    getTileByPoint(point) {
        const x = Math.floor((point.x - this.pos.x) / this.tileWidth);
        const y = Math.floor((point.y - this.pos.y) / this.tileHeight);
        const tile = this.getTile(x, y);
        if (x >= 0 && y >= 0 && x < this.columns && y < this.rows && tile) {
            return tile;
        }
        return null;
    }
    getRows() {
        return this._rows;
    }
    getColumns() {
        return this._cols;
    }
    update(engine, delta) {
        this.onPreUpdate(engine, delta);
        this.emit('preupdate', new Events.PreUpdateEvent(engine, delta, this));
        if (!this._oldPos.equals(this.pos)) {
            this.flagCollidersDirty();
            for (let i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i]) {
                    this.tiles[i].flagDirty();
                }
            }
        }
        if (this._collidersDirty) {
            this._collidersDirty = false;
            this._updateColliders();
        }
        this._token++;
        const worldBounds = engine.getWorldBounds();
        const worldCoordsUpperLeft = vec(worldBounds.left, worldBounds.top);
        const worldCoordsLowerRight = vec(worldBounds.right, worldBounds.bottom);
        let pos = this.pos;
        const maybeParallax = this.get(ParallaxComponent);
        let parallaxOffset = Vector.One;
        if (maybeParallax) {
            const oneMinusFactor = Vector.One.sub(maybeParallax.parallaxFactor);
            parallaxOffset = engine.currentScene.camera.pos.scale(oneMinusFactor);
            pos = pos.add(parallaxOffset);
        }
        this._onScreenXStart = Math.max(Math.floor((worldCoordsUpperLeft.x - pos.x) / this.tileWidth) - 2, 0);
        this._onScreenYStart = Math.max(Math.floor((worldCoordsUpperLeft.y - pos.y) / this.tileHeight) - 2, 0);
        this._onScreenXEnd = Math.max(Math.floor((worldCoordsLowerRight.x - pos.x) / this.tileWidth) + 2, 0);
        this._onScreenYEnd = Math.max(Math.floor((worldCoordsLowerRight.y - pos.y) / this.tileHeight) + 2, 0);
        // why are we resetting pos?
        this._transform.pos = vec(this.x, this.y);
        this.onPostUpdate(engine, delta);
        this.emit('postupdate', new Events.PostUpdateEvent(engine, delta, this));
    }
    /**
     * Draws the tile map to the screen. Called by the [[Scene]].
     * @param ctx ExcaliburGraphicsContext
     * @param delta  The number of milliseconds since the last draw
     */
    draw(ctx, delta) {
        this.emit('predraw', new Events.PreDrawEvent(ctx, delta, this)); // TODO fix event
        let x = this._onScreenXStart;
        const xEnd = Math.min(this._onScreenXEnd, this.columns);
        let y = this._onScreenYStart;
        const yEnd = Math.min(this._onScreenYEnd, this.rows);
        let graphics, graphicsIndex, graphicsLen;
        for (x; x < xEnd; x++) {
            for (y; y < yEnd; y++) {
                // get non-negative tile sprites
                graphics = this.getTile(x, y).getGraphics();
                for (graphicsIndex = 0, graphicsLen = graphics.length; graphicsIndex < graphicsLen; graphicsIndex++) {
                    // draw sprite, warning if sprite doesn't exist
                    const graphic = graphics[graphicsIndex];
                    if (graphic) {
                        if (hasGraphicsTick(graphic)) {
                            graphic === null || graphic === void 0 ? void 0 : graphic.tick(delta, this._token);
                        }
                        const offsetY = this.renderFromTopOfGraphic ? 0 : (graphic.height - this.tileHeight);
                        graphic.draw(ctx, x * this.tileWidth, y * this.tileHeight - offsetY);
                    }
                }
            }
            y = this._onScreenYStart;
        }
        this.emit('postdraw', new Events.PostDrawEvent(ctx, delta, this));
    }
    debug(gfx) {
        const width = this.tileWidth * this.columns;
        const height = this.tileHeight * this.rows;
        const pos = Vector.Zero;
        for (let r = 0; r < this.rows + 1; r++) {
            const yOffset = vec(0, r * this.tileHeight);
            gfx.drawLine(pos.add(yOffset), pos.add(vec(width, yOffset.y)), Color.Red, 2);
        }
        for (let c = 0; c < this.columns + 1; c++) {
            const xOffset = vec(c * this.tileWidth, 0);
            gfx.drawLine(pos.add(xOffset), pos.add(vec(xOffset.x, height)), Color.Red, 2);
        }
        const colliders = this._composite.getColliders();
        for (const collider of colliders) {
            const grayish = Color.Gray;
            grayish.a = 0.5;
            const bounds = collider.localBounds;
            const pos = collider.worldPos.sub(this.pos);
            gfx.drawRectangle(pos, bounds.width, bounds.height, grayish);
        }
    }
}
/**
 * TileMap Tile
 *
 * A light-weight object that occupies a space in a collision map. Generally
 * created by a [[TileMap]].
 *
 * Tiles can draw multiple sprites. Note that the order of drawing is the order
 * of the sprites in the array so the last one will be drawn on top. You can
 * use transparency to create layers this way.
 */
export class Tile extends Entity {
    constructor(options) {
        var _a, _b;
        super();
        this._posDirty = false;
        this._solid = false;
        this._graphics = [];
        /**
         * Current list of colliders for this tile
         */
        this._colliders = [];
        /**
         * Arbitrary data storage per tile, useful for any game specific data
         */
        this.data = new Map();
        this.x = options.x;
        this.y = options.y;
        this.map = options.map;
        this.width = options.map.tileWidth;
        this.height = options.map.tileHeight;
        this.solid = (_a = options.solid) !== null && _a !== void 0 ? _a : this.solid;
        this._graphics = (_b = options.graphics) !== null && _b !== void 0 ? _b : [];
        this._recalculate();
    }
    // private _transform: TransformComponent;
    /**
     * Return the world position of the top left corner of the tile
     */
    get pos() {
        if (this._posDirty) {
            this._recalculate();
            this._posDirty = false;
        }
        return this._pos;
    }
    /**
     * Wether this tile should be treated as solid by the tilemap
     */
    get solid() {
        return this._solid;
    }
    /**
     * Wether this tile should be treated as solid by the tilemap
     */
    set solid(val) {
        var _a;
        (_a = this.map) === null || _a === void 0 ? void 0 : _a.flagCollidersDirty();
        this._solid = val;
    }
    /**
     * Current list of graphics for this tile
     */
    getGraphics() {
        return this._graphics;
    }
    /**
     * Add another [[Graphic]] to this TileMap tile
     * @param graphic
     */
    addGraphic(graphic) {
        this._graphics.push(graphic);
    }
    /**
     * Remove an instance of a [[Graphic]] from this tile
     */
    removeGraphic(graphic) {
        removeItemFromArray(graphic, this._graphics);
    }
    /**
     * Clear all graphics from this tile
     */
    clearGraphics() {
        this._graphics.length = 0;
    }
    /**
     * Returns the list of colliders
     */
    getColliders() {
        return this._colliders;
    }
    /**
     * Adds a custom collider to the [[Tile]] to use instead of it's bounds
     *
     * If no collider is set but [[Tile.solid]] is set, the tile bounds are used as a collider.
     *
     * **Note!** the [[Tile.solid]] must be set to true for it to act as a "fixed" collider
     * @param collider
     */
    addCollider(collider) {
        this._colliders.push(collider);
        this.map.flagCollidersDirty();
    }
    /**
     * Removes a collider from the [[Tile]]
     * @param collider
     */
    removeCollider(collider) {
        const index = this._colliders.indexOf(collider);
        if (index > -1) {
            this._colliders.splice(index, 1);
        }
        this.map.flagCollidersDirty();
    }
    /**
     * Clears all colliders from the [[Tile]]
     */
    clearColliders() {
        this._colliders.length = 0;
        this.map.flagCollidersDirty();
    }
    flagDirty() {
        return this._posDirty = true;
    }
    _recalculate() {
        this._pos = this.map.pos.add(vec(this.x * this.map.tileWidth, this.y * this.map.tileHeight));
        this._bounds = new BoundingBox(this._pos.x, this._pos.y, this._pos.x + this.width, this._pos.y + this.height);
        this._posDirty = false;
    }
    get bounds() {
        if (this._posDirty) {
            this._recalculate();
        }
        return this._bounds;
    }
    get center() {
        if (this._posDirty) {
            this._recalculate();
        }
        return new Vector(this._pos.x + this.width / 2, this._pos.y + this.height / 2);
    }
}
//# sourceMappingURL=TileMap.js.map