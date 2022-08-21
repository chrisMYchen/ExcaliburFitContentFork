import { isAddedSystemEntity, System, SystemType } from '../EntityComponentSystem/System';
import { ActionsComponent } from './ActionsComponent';
export class ActionsSystem extends System {
    constructor() {
        super(...arguments);
        this.types = ['ex.actions'];
        this.systemType = SystemType.Update;
        this.priority = -1;
        this._actions = [];
    }
    notify(entityAddedOrRemoved) {
        if (isAddedSystemEntity(entityAddedOrRemoved)) {
            const action = entityAddedOrRemoved.data.get(ActionsComponent);
            this._actions.push(action);
        }
        else {
            const action = entityAddedOrRemoved.data.get(ActionsComponent);
            const index = this._actions.indexOf(action);
            if (index > -1) {
                this._actions.splice(index, 1);
            }
        }
    }
    update(_entities, delta) {
        for (const actions of this._actions) {
            actions.update(delta);
        }
    }
}
//# sourceMappingURL=ActionsSystem.js.map