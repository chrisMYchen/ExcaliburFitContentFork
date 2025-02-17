import { ColorBlindnessMode } from '../Graphics/PostProcessor/ColorBlindnessMode';
import { ColorBlindnessPostProcessor } from '../Graphics/PostProcessor/ColorBlindnessPostProcessor';
import { ExcaliburGraphicsContextWebGL } from '..';
export class ColorBlindFlags {
    constructor(engine) {
        this._engine = engine;
        this._colorBlindPostProcessor = new ColorBlindnessPostProcessor(ColorBlindnessMode.Protanope);
    }
    /**
     * Correct colors for a specified color blindness
     * @param colorBlindness
     */
    correct(colorBlindness) {
        if (this._engine.graphicsContext instanceof ExcaliburGraphicsContextWebGL) {
            this.clear();
            this._colorBlindPostProcessor.colorBlindnessMode = colorBlindness;
            this._colorBlindPostProcessor.simulate = false;
            this._engine.graphicsContext.addPostProcessor(this._colorBlindPostProcessor);
        }
    }
    /**
     * Simulate colors for a specified color blindness
     * @param colorBlindness
     */
    simulate(colorBlindness) {
        if (this._engine.graphicsContext instanceof ExcaliburGraphicsContextWebGL) {
            this.clear();
            this._colorBlindPostProcessor.colorBlindnessMode = colorBlindness;
            this._colorBlindPostProcessor.simulate = true;
            this._engine.graphicsContext.addPostProcessor(this._colorBlindPostProcessor);
        }
    }
    /**
     * Remove color blindness post processor
     */
    clear() {
        this._engine.graphicsContext.removePostProcessor(this._colorBlindPostProcessor);
    }
}
//# sourceMappingURL=DebugFlags.js.map