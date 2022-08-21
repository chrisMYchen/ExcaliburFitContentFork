import { BodyComponent, BoundingBox, ColliderComponent, CollisionType, Color, CompositeCollider, vec, Vector } from '..';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { Entity } from '../EntityComponentSystem/Entity';
import { DebugGraphicsComponent, GraphicsComponent } from '../Graphics';
import { IsometricEntityComponent } from './IsometricEntityComponent';
export class IsometricTile extends Entity {
    /**
     * Construct a new IsometricTile
     * @param x tile coordinate in x (not world position)
     * @param y tile coordinate in y (not world position)
     * @param graphicsOffset offset that tile should be shifted by (default (0, 0))
     * @param map reference to owning IsometricMap
     */
    constructor(x, y, graphicsOffset, map) {
        super([
            new TransformComponent(),
            new GraphicsComponent({
                offset: graphicsOffset !== null && graphicsOffset !== void 0 ? graphicsOffset : Vector.Zero,
                onPostDraw: (gfx, elapsed) => this.draw(gfx, elapsed)
            }),
            new IsometricEntityComponent(map)
        ]);
        /**
         * Indicates whether this tile is solid
         */
        this.solid = false;
        this._tileBounds = new BoundingBox();
        this._graphics = [];
        /**
         * Tile colliders
         */
        this._colliders = [];
        this.x = x;
        this.y = y;
        this.map = map;
        this._transform = this.get(TransformComponent);
        this._isometricEntityComponent = this.get(IsometricEntityComponent);
        const halfTileWidth = this.map.tileWidth / 2;
        const halfTileHeight = this.map.tileHeight / 2;
        // See https://clintbellanger.net/articles/isometric_math/ for formula
        // The x position shifts left with every y step
        const xPos = (this.x - this.y) * halfTileWidth;
        // The y position needs to go down with every x step
        const yPos = (this.x + this.y) * halfTileHeight;
        this._transform.pos = vec(xPos, yPos);
        this._isometricEntityComponent.elevation = 0;
        this._gfx = this.get(GraphicsComponent);
        this._gfx.visible = false; // start not visible
        const totalWidth = this.map.tileWidth;
        const totalHeight = this.map.tileHeight;
        // initial guess at gfx bounds based on the tile
        const offset = vec(0, (this.map.renderFromTopOfGraphic ? totalHeight : 0));
        this._gfx.localBounds = this._tileBounds = new BoundingBox({
            left: -totalWidth / 2,
            top: -totalHeight,
            right: totalWidth / 2,
            bottom: totalHeight
        }).translate(offset);
    }
    getGraphics() {
        return this._graphics;
    }
    /**
     * Tile graphics
     */
    addGraphic(graphic) {
        this._graphics.push(graphic);
        this._gfx.visible = true;
        this._gfx.localBounds = this._recalculateBounds();
    }
    _recalculateBounds() {
        let bounds = this._tileBounds.clone();
        for (const graphic of this._graphics) {
            const offset = vec(this.map.graphicsOffset.x - this.map.tileWidth / 2, this.map.graphicsOffset.y - (this.map.renderFromTopOfGraphic ? 0 : (graphic.height - this.map.tileHeight)));
            bounds = bounds.combine(graphic.localBounds.translate(offset));
        }
        return bounds;
    }
    removeGraphic(graphic) {
        const index = this._graphics.indexOf(graphic);
        if (index > -1) {
            this._graphics.splice(index, 1);
        }
        this._gfx.localBounds = this._recalculateBounds();
    }
    clearGraphics() {
        this._graphics.length = 0;
        this._gfx.visible = false;
        this._gfx.localBounds = this._recalculateBounds();
    }
    getColliders() {
        return this._colliders;
    }
    /**
     * Adds a collider to the IsometricTile
     *
     * **Note!** the [[Tile.solid]] must be set to true for it to act as a "fixed" collider
     * @param collider
     */
    addCollider(collider) {
        this._colliders.push(collider);
        this.map.flagCollidersDirty();
    }
    /**
     * Removes a collider from the IsometricTile
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
     * Clears all colliders from the IsometricTile
     */
    clearColliders() {
        this._colliders.length = 0;
        this.map.flagCollidersDirty();
    }
    /**
     * Returns the top left corner of the [[IsometricTile]] in world space
     */
    get pos() {
        return this.map.tileToWorld(vec(this.x, this.y));
    }
    /**
     * Returns the center of the [[IsometricTile]]
     */
    get center() {
        return this.pos.add(vec(0, this.map.tileHeight / 2));
    }
    draw(gfx, _elapsed) {
        const halfTileWidth = this.map.tileWidth / 2;
        gfx.save();
        // shift left origin to corner of map, not the left corner of the first sprite
        gfx.translate(-halfTileWidth, 0);
        for (const graphic of this._graphics) {
            graphic.draw(gfx, this.map.graphicsOffset.x, this.map.graphicsOffset.y - (this.map.renderFromTopOfGraphic ? 0 : (graphic.height - this.map.tileHeight)));
        }
        gfx.restore();
    }
}
/**
 * The IsometricMap is a special tile map that provides isometric rendering support to Excalibur
 *
 * The tileWidth and tileHeight should be the height and width in pixels of the parallelogram of the base of the tile art asset.
 * The tileWidth and tileHeight is not necessarily the same as your graphic pixel width and height.
 *
 * Please refer to the docs https://excaliburjs.com for more details calculating what your tile width and height should be given
 * your art assets.
 */
export class IsometricMap extends Entity {
    constructor(options) {
        super([
            new TransformComponent(),
            new BodyComponent({
                type: CollisionType.Fixed
            }),
            new ColliderComponent(),
            new DebugGraphicsComponent((ctx) => this.debug(ctx), false)
        ], options.name);
        /**
         * Render the tile graphic from the top instead of the bottom
         *
         * default is `false` meaning rendering from the bottom
         */
        this.renderFromTopOfGraphic = false;
        this.graphicsOffset = vec(0, 0);
        this._collidersDirty = false;
        this._originalOffsets = new WeakMap();
        const { pos, tileWidth, tileHeight, columns: width, rows: height, renderFromTopOfGraphic, graphicsOffset } = options;
        this.transform = this.get(TransformComponent);
        if (pos) {
            this.transform.pos = pos;
        }
        this.collider = this.get(ColliderComponent);
        if (this.collider) {
            this.collider.set(this._composite = new CompositeCollider([]));
        }
        this.renderFromTopOfGraphic = renderFromTopOfGraphic !== null && renderFromTopOfGraphic !== void 0 ? renderFromTopOfGraphic : this.renderFromTopOfGraphic;
        this.graphicsOffset = graphicsOffset !== null && graphicsOffset !== void 0 ? graphicsOffset : this.graphicsOffset;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.columns = width;
        this.rows = height;
        this.tiles = new Array(width * height);
        // build up tile representation
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = new IsometricTile(x, y, this.graphicsOffset, this);
                this.tiles[x + y * width] = tile;
                this.addChild(tile);
                // TODO row/columns helpers
            }
        }
    }
    update() {
        if (this._collidersDirty) {
            this.updateColliders();
            this._collidersDirty = false;
        }
    }
    flagCollidersDirty() {
        this._collidersDirty = true;
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
    updateColliders() {
        this._composite.clearColliders();
        const pos = this.get(TransformComponent).pos;
        for (const tile of this.tiles) {
            if (tile.solid) {
                for (const collider of tile.getColliders()) {
                    const originalOffset = this._getOrSetColliderOriginalOffset(collider);
                    collider.offset = this.tileToWorld(vec(tile.x, tile.y))
                        .sub(pos)
                        .add(originalOffset)
                        .sub(vec(this.tileWidth / 2, this.tileHeight)); // We need to unshift height based on drawing
                    collider.owner = this;
                    this._composite.addCollider(collider);
                }
            }
        }
        this.collider.update();
    }
    /**
     * Convert world space coordinates to the tile x, y coordinate
     * @param worldCoordinate
     */
    worldToTile(worldCoordinate) {
        worldCoordinate = worldCoordinate.sub(this.transform.globalPos);
        const halfTileWidth = this.tileWidth / 2;
        const halfTileHeight = this.tileHeight / 2;
        // See https://clintbellanger.net/articles/isometric_math/ for formula
        return vec(~~((worldCoordinate.x / halfTileWidth + (worldCoordinate.y / halfTileHeight)) / 2), ~~((worldCoordinate.y / halfTileHeight - (worldCoordinate.x / halfTileWidth)) / 2));
    }
    /**
     * Given a tile coordinate, return the top left corner in world space
     * @param tileCoordinate
     */
    tileToWorld(tileCoordinate) {
        const halfTileWidth = this.tileWidth / 2;
        const halfTileHeight = this.tileHeight / 2;
        // The x position shifts left with every y step
        const xPos = (tileCoordinate.x - tileCoordinate.y) * halfTileWidth;
        // The y position needs to go down with every x step
        const yPos = (tileCoordinate.x + tileCoordinate.y) * halfTileHeight;
        return vec(xPos, yPos).add(this.transform.pos);
    }
    /**
     * Returns the [[IsometricTile]] by its x and y coordinates
     */
    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) {
            return null;
        }
        return this.tiles[x + y * this.columns];
    }
    /**
     * Returns the [[IsometricTile]] by testing a point in world coordinates,
     * returns `null` if no Tile was found.
     */
    getTileByPoint(point) {
        const tileCoord = this.worldToTile(point);
        const tile = this.getTile(tileCoord.x, tileCoord.y);
        return tile;
    }
    _getMaxZIndex() {
        let maxZ = Number.NEGATIVE_INFINITY;
        for (const tile of this.tiles) {
            const currentZ = tile.get(TransformComponent).z;
            if (currentZ > maxZ) {
                maxZ = currentZ;
            }
        }
        return maxZ;
    }
    /**
     * Debug draw for IsometricMap, called internally by excalibur when debug mode is toggled on
     * @param gfx
     */
    debug(gfx) {
        gfx.save();
        gfx.z = this._getMaxZIndex() + 0.5;
        for (let y = 0; y < this.rows + 1; y++) {
            const left = this.tileToWorld(vec(0, y));
            const right = this.tileToWorld(vec(this.columns, y));
            gfx.drawLine(left, right, Color.Red, 2);
        }
        for (let x = 0; x < this.columns + 1; x++) {
            const top = this.tileToWorld(vec(x, 0));
            const bottom = this.tileToWorld(vec(x, this.rows));
            gfx.drawLine(top, bottom, Color.Red, 2);
        }
        for (const tile of this.tiles) {
            gfx.drawCircle(this.tileToWorld(vec(tile.x, tile.y)), 3, Color.Yellow);
        }
        gfx.restore();
    }
}
//# sourceMappingURL=IsometricMap.js.map