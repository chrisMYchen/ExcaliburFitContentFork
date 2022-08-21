import { Graphic } from './Graphic';
import { Animation } from './Animation';
import { BoundingBox } from '../Collision/Index';
export class GraphicsGroup extends Graphic {
    constructor(options) {
        super(options);
        this.members = [];
        this.members = options.members;
        this._updateDimensions();
    }
    clone() {
        return new GraphicsGroup({
            members: [...this.members],
            ...this.cloneGraphicOptions()
        });
    }
    _updateDimensions() {
        let bb = new BoundingBox();
        for (const { graphic, pos } of this.members) {
            bb = graphic.localBounds.translate(pos).combine(bb);
        }
        this.width = bb.width;
        this.height = bb.height;
        return bb;
    }
    get localBounds() {
        let bb = new BoundingBox();
        for (const { graphic, pos } of this.members) {
            bb = graphic.localBounds.translate(pos).combine(bb);
        }
        return bb;
    }
    _isAnimationOrGroup(graphic) {
        return graphic instanceof Animation || graphic instanceof GraphicsGroup;
    }
    tick(elapsedMilliseconds, idempotencyToken) {
        for (const member of this.members) {
            const maybeAnimation = member.graphic;
            if (this._isAnimationOrGroup(maybeAnimation)) {
                maybeAnimation.tick(elapsedMilliseconds, idempotencyToken);
            }
        }
    }
    reset() {
        for (const member of this.members) {
            const maybeAnimation = member.graphic;
            if (this._isAnimationOrGroup(maybeAnimation)) {
                maybeAnimation.reset();
            }
        }
    }
    _preDraw(ex, x, y) {
        this._updateDimensions();
        super._preDraw(ex, x, y);
    }
    _drawImage(ex, x, y) {
        for (const member of this.members) {
            ex.save();
            ex.translate(x, y);
            member.graphic.draw(ex, member.pos.x, member.pos.y);
            if (this.showDebug) {
                /* istanbul ignore next */
                ex.debug.drawRect(0, 0, this.width, this.height);
            }
            ex.restore();
        }
    }
}
//# sourceMappingURL=GraphicsGroup.js.map