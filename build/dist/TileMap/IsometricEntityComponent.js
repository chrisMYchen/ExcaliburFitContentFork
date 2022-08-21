import { Component } from '../EntityComponentSystem/Component';
export class IsometricEntityComponent extends Component {
    /**
     * Specify the isometric map to use to position this entity's z-index
     * @param map
     */
    constructor(map) {
        super();
        this.type = 'ex.isometricentity';
        /**
         * Vertical "height" in the isometric world
         */
        this.elevation = 0;
        this.map = map;
    }
}
//# sourceMappingURL=IsometricEntityComponent.js.map