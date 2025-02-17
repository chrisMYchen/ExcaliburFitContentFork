import { Vector } from './vector';
export class GlobalCoordinates {
    constructor(worldPos, pagePos, screenPos) {
        this.worldPos = worldPos;
        this.pagePos = pagePos;
        this.screenPos = screenPos;
    }
    static fromPagePosition(xOrPos, yOrEngine, engineOrUndefined) {
        let pageX;
        let pageY;
        let pagePos;
        let engine;
        if (arguments.length === 3) {
            pageX = xOrPos;
            pageY = yOrEngine;
            pagePos = new Vector(pageX, pageY);
            engine = engineOrUndefined;
        }
        else {
            pagePos = xOrPos;
            pageX = pagePos.x;
            pageY = pagePos.y;
            engine = yOrEngine;
        }
        const screenPos = engine.screen.pageToScreenCoordinates(pagePos);
        const worldPos = engine.screen.screenToWorldCoordinates(screenPos);
        return new GlobalCoordinates(worldPos, pagePos, screenPos);
    }
}
//# sourceMappingURL=global-coordinates.js.map