import { Component } from '../EntityComponentSystem/Component';
/**
 * Provide arbitrary drawing for the purposes of debugging your game
 *
 * Will only show when the Engine is set to debug mode [[Engine.showDebug]] or [[Engine.toggleDebug]]
 *
 */
export class DebugGraphicsComponent extends Component {
    constructor(draw, useTransform = true) {
        super();
        this.draw = draw;
        this.useTransform = useTransform;
        this.type = 'ex.debuggraphics';
    }
}
//# sourceMappingURL=DebugGraphicsComponent.js.map