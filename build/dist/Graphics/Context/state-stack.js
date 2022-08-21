import { Color } from '../../Color';
export class StateStack {
    constructor() {
        this._states = [];
        this._currentState = this._getDefaultState();
    }
    _getDefaultState() {
        return {
            opacity: 1,
            z: 0,
            tint: Color.White
        };
    }
    _cloneState() {
        return {
            opacity: this._currentState.opacity,
            z: this._currentState.z,
            tint: this._currentState.tint.clone()
        };
    }
    save() {
        this._states.push(this._currentState);
        this._currentState = this._cloneState();
    }
    restore() {
        this._currentState = this._states.pop();
    }
    get current() {
        return this._currentState;
    }
    set current(val) {
        this._currentState = val;
    }
}
//# sourceMappingURL=state-stack.js.map