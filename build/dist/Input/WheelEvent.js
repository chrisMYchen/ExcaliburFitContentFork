export class WheelEvent {
    constructor(x, y, pageX, pageY, screenX, screenY, index, deltaX, deltaY, deltaZ, deltaMode, ev) {
        this.x = x;
        this.y = y;
        this.pageX = pageX;
        this.pageY = pageY;
        this.screenX = screenX;
        this.screenY = screenY;
        this.index = index;
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        this.deltaZ = deltaZ;
        this.deltaMode = deltaMode;
        this.ev = ev;
        this.active = true;
    }
    cancel() {
        this.active = false;
    }
}
//# sourceMappingURL=WheelEvent.js.map