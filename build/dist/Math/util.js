import { Random } from './Random';
/**
 * Two PI constant
 */
export const TwoPI = Math.PI * 2;
/**
 * Returns the fractional part of a number
 * @param x
 */
export function frac(x) {
    if (x >= 0) {
        return x - Math.floor(x);
    }
    else {
        return x - Math.ceil(x);
    }
}
/**
 * Returns the sign of a number, if 0 returns 0
 */
export function sign(val) {
    if (val === 0) {
        return 0;
    }
    return val < 0 ? -1 : 1;
}
;
/**
 * Clamps a value between a min and max inclusive
 */
export function clamp(val, min, max) {
    return Math.min(Math.max(min, val), max);
}
/**
 * Convert an angle to be the equivalent in the range [0, 2PI]
 */
export function canonicalizeAngle(angle) {
    let tmpAngle = angle;
    if (angle > TwoPI) {
        while (tmpAngle > TwoPI) {
            tmpAngle -= TwoPI;
        }
    }
    if (angle < 0) {
        while (tmpAngle < 0) {
            tmpAngle += TwoPI;
        }
    }
    return tmpAngle;
}
/**
 * Convert radians to degrees
 */
export function toDegrees(radians) {
    return (180 / Math.PI) * radians;
}
/**
 * Convert degrees to radians
 */
export function toRadians(degrees) {
    return (degrees / 180) * Math.PI;
}
/**
 * Generate a range of numbers
 * For example: range(0, 5) -> [0, 1, 2, 3, 4, 5]
 * @param from inclusive
 * @param to inclusive
 */
export const range = (from, to) => Array.from(new Array(to - from + 1), (_x, i) => i + from);
/**
 * Find a random floating point number in range
 */
export function randomInRange(min, max, random = new Random()) {
    return random ? random.floating(min, max) : min + Math.random() * (max - min);
}
/**
 * Find a random integer in a range
 */
export function randomIntInRange(min, max, random = new Random()) {
    return random ? random.integer(min, max) : Math.round(randomInRange(min, max));
}
//# sourceMappingURL=util.js.map