import { Class } from '../Class';
import { Vector } from '../Math/vector';
export class PointerAbstraction extends Class {
    constructor() {
        super();
        /**
         * The last position on the document this pointer was at. Can be `null` if pointer was never active.
         */
        this.lastPagePos = Vector.Zero;
        /**
         * The last position on the screen this pointer was at. Can be `null` if pointer was never active.
         */
        this.lastScreenPos = Vector.Zero;
        /**
         * The last position in the game world coordinates this pointer was at. Can be `null` if pointer was never active.
         */
        this.lastWorldPos = Vector.Zero;
        this._onPointerMove = (ev) => {
            this.lastPagePos = new Vector(ev.pagePos.x, ev.pagePos.y);
            this.lastScreenPos = new Vector(ev.screenPos.x, ev.screenPos.y);
            this.lastWorldPos = new Vector(ev.worldPos.x, ev.worldPos.y);
        };
        this._onPointerDown = (ev) => {
            this.lastPagePos = new Vector(ev.pagePos.x, ev.pagePos.y);
            this.lastScreenPos = new Vector(ev.screenPos.x, ev.screenPos.y);
            this.lastWorldPos = new Vector(ev.worldPos.x, ev.worldPos.y);
        };
        this.on('move', this._onPointerMove);
        this.on('down', this._onPointerDown);
    }
    on(event, handler) {
        super.on(event, handler);
    }
    once(event, handler) {
        super.once(event, handler);
    }
    off(event, handler) {
        super.off(event, handler);
    }
}
//# sourceMappingURL=PointerAbstraction.js.map