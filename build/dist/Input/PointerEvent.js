export class PointerEvent {
    constructor(type, pointerId, button, pointerType, coordinates, nativeEvent) {
        this.type = type;
        this.pointerId = pointerId;
        this.button = button;
        this.pointerType = pointerType;
        this.coordinates = coordinates;
        this.nativeEvent = nativeEvent;
        this.active = true;
    }
    cancel() {
        this.active = false;
    }
    get pagePos() {
        return this.coordinates.pagePos;
    }
    get screenPos() {
        return this.coordinates.screenPos;
    }
    get worldPos() {
        return this.coordinates.worldPos;
    }
    ;
}
//# sourceMappingURL=PointerEvent.js.map