import { vec } from '../../Math/vector';
import { MotionComponent } from '../../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../../EntityComponentSystem/Components/TransformComponent';
export class ScaleTo {
    constructor(entity, scaleX, scaleY, speedX, speedY) {
        this._started = false;
        this._stopped = false;
        this._tx = entity.get(TransformComponent);
        this._motion = entity.get(MotionComponent);
        this._endX = scaleX;
        this._endY = scaleY;
        this._speedX = speedX;
        this._speedY = speedY;
    }
    update(_delta) {
        if (!this._started) {
            this._started = true;
            this._startX = this._tx.scale.x;
            this._startY = this._tx.scale.y;
            this._distanceX = Math.abs(this._endX - this._startX);
            this._distanceY = Math.abs(this._endY - this._startY);
        }
        if (!(Math.abs(this._tx.scale.x - this._startX) >= this._distanceX)) {
            const directionX = this._endY < this._startY ? -1 : 1;
            this._motion.scaleFactor.x = this._speedX * directionX;
        }
        else {
            this._motion.scaleFactor.x = 0;
        }
        if (!(Math.abs(this._tx.scale.y - this._startY) >= this._distanceY)) {
            const directionY = this._endY < this._startY ? -1 : 1;
            this._motion.scaleFactor.y = this._speedY * directionY;
        }
        else {
            this._motion.scaleFactor.y = 0;
        }
        if (this.isComplete()) {
            this._tx.scale = vec(this._endX, this._endY);
            this._motion.scaleFactor.x = 0;
            this._motion.scaleFactor.y = 0;
        }
    }
    isComplete() {
        return (this._stopped ||
            (Math.abs(this._tx.scale.y - this._startX) >= (this._distanceX - 0.01) &&
                Math.abs(this._tx.scale.y - this._startY) >= (this._distanceY - 0.01)));
    }
    stop() {
        this._motion.scaleFactor.x = 0;
        this._motion.scaleFactor.y = 0;
        this._stopped = true;
    }
    reset() {
        this._started = false;
        this._stopped = false;
    }
}
//# sourceMappingURL=ScaleTo.js.map