import { System, SystemType } from '../EntityComponentSystem/System';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { IsometricEntityComponent } from './IsometricEntityComponent';
export class IsometricEntitySystem extends System {
    constructor() {
        super(...arguments);
        this.types = ['ex.transform', 'ex.isometricentity'];
        this.systemType = SystemType.Update;
        this.priority = 99;
    }
    update(entities, _delta) {
        let transform;
        let iso;
        for (const entity of entities) {
            transform = entity.get(TransformComponent);
            iso = entity.get(IsometricEntityComponent);
            const maxZindexPerElevation = Math.max(iso.map.columns * iso.map.tileWidth, iso.map.rows * iso.map.tileHeight);
            const newZ = maxZindexPerElevation * iso.elevation + transform.pos.y;
            transform.z = newZ;
        }
    }
}
//# sourceMappingURL=IsometricEntitySystem.js.map