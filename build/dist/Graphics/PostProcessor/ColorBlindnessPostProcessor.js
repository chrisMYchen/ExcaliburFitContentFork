import colorBlindCorrectSource from './color-blind-fragment.glsl';
import { ColorBlindnessMode } from './ColorBlindnessMode';
import { ScreenShader } from './ScreenShader';
export class ColorBlindnessPostProcessor {
    constructor(_colorBlindnessMode, simulate = false) {
        this._colorBlindnessMode = _colorBlindnessMode;
        this._simulate = false;
        this._simulate = simulate;
    }
    initialize(_gl) {
        this._shader = new ScreenShader(colorBlindCorrectSource);
        this.simulate = this._simulate;
        this.colorBlindnessMode = this._colorBlindnessMode;
    }
    getShader() {
        return this._shader.getShader();
    }
    getLayout() {
        return this._shader.getLayout();
    }
    set colorBlindnessMode(colorBlindMode) {
        this._colorBlindnessMode = colorBlindMode;
        if (this._shader) {
            const shader = this._shader.getShader();
            shader.use();
            if (this._colorBlindnessMode === ColorBlindnessMode.Protanope) {
                shader.setUniformInt('u_type', 0);
            }
            else if (this._colorBlindnessMode === ColorBlindnessMode.Deuteranope) {
                shader.setUniformInt('u_type', 1);
            }
            else if (this._colorBlindnessMode === ColorBlindnessMode.Tritanope) {
                shader.setUniformInt('u_type', 2);
            }
        }
    }
    get colorBlindnessMode() {
        return this._colorBlindnessMode;
    }
    set simulate(value) {
        this._simulate = value;
        if (this._shader) {
            const shader = this._shader.getShader();
            shader.use();
            shader.setUniformBoolean('u_simulate', value);
        }
    }
    get simulate() {
        return this._simulate;
    }
}
//# sourceMappingURL=ColorBlindnessPostProcessor.js.map