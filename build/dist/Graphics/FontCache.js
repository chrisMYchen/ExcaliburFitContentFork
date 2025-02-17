import { Logger } from '../Util/Log';
import { FontTextInstance } from './FontTextInstance';
export class FontCache {
    static measureText(text, font) {
        const hash = FontTextInstance.getHashCode(font, text);
        if (FontCache._MEASURE_CACHE.has(hash)) {
            return FontCache._MEASURE_CACHE.get(hash);
        }
        FontCache._LOGGER.debug('Font text measurement cache miss');
        const measurement = font.measureTextWithoutCache(text);
        FontCache._MEASURE_CACHE.set(hash, measurement);
        return measurement;
    }
    static getTextInstance(text, font, color) {
        const hash = FontTextInstance.getHashCode(font, text, color);
        let textInstance = FontCache._TEXT_CACHE.get(hash);
        if (!textInstance) {
            textInstance = new FontTextInstance(font, text, color);
            FontCache._TEXT_CACHE.set(hash, textInstance);
            FontCache._LOGGER.debug('Font text instance cache miss');
        }
        // Cache the bitmap for certain amount of time
        FontCache._TEXT_USAGE.set(textInstance, performance.now());
        return textInstance;
    }
    static checkAndClearCache() {
        const deferred = [];
        const currentHashCodes = new Set();
        for (const [textInstance, time] of FontCache._TEXT_USAGE.entries()) {
            // if bitmap hasn't been used in 100 ms clear it
            if (time + 100 < performance.now()) {
                FontCache._LOGGER.debug(`Text cache entry timed out ${textInstance.text}`);
                deferred.push(textInstance);
                textInstance.dispose();
            }
            else {
                const hash = textInstance.getHashCode(false);
                currentHashCodes.add(hash);
            }
        }
        // Deferred removal of text instances
        deferred.forEach(t => {
            FontCache._TEXT_USAGE.delete(t);
        });
        // Regenerate text instance cache
        this._TEXT_CACHE.clear();
        for (const [textInstance] of this._TEXT_USAGE.entries()) {
            this._TEXT_CACHE.set(textInstance.getHashCode(), textInstance);
        }
        // Regenerated measurement cache
        const newTextMeasurementCache = new Map();
        for (const current of currentHashCodes) {
            if (FontCache._MEASURE_CACHE.has(current)) {
                newTextMeasurementCache.set(current, FontCache._MEASURE_CACHE.get(current));
            }
        }
        this._MEASURE_CACHE.clear();
        this._MEASURE_CACHE = newTextMeasurementCache;
    }
    static get cacheSize() {
        return FontCache._TEXT_USAGE.size;
    }
    /**
     * Force clear all cached text bitmaps
     */
    static clearCache() {
        for (const [textInstance] of FontCache._TEXT_USAGE.entries()) {
            textInstance.dispose();
        }
        FontCache._TEXT_USAGE.clear();
        FontCache._TEXT_CACHE.clear();
        FontCache._MEASURE_CACHE.clear();
    }
}
FontCache._LOGGER = Logger.getInstance();
FontCache._TEXT_USAGE = new Map();
FontCache._TEXT_CACHE = new Map();
FontCache._MEASURE_CACHE = new Map();
//# sourceMappingURL=FontCache.js.map