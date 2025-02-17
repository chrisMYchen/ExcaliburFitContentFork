import { Component } from '../EntityComponentSystem/Component';
import { vec } from '../Math/vector';
export class ParallaxComponent extends Component {
    constructor(parallaxFactor) {
        super();
        this.type = 'ex.parallax';
        this.parallaxFactor = vec(1.0, 1.0);
        this.parallaxFactor = parallaxFactor !== null && parallaxFactor !== void 0 ? parallaxFactor : this.parallaxFactor;
    }
}
//# sourceMappingURL=ParallaxComponent.js.map