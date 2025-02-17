import { Vector } from '../Math/vector';
import { Future } from './Future';
/**
 * Find the screen position of an HTML element
 */
export function getPosition(el) {
    let oLeft = 0, oTop = 0;
    const calcOffsetLeft = (parent) => {
        oLeft += parent.offsetLeft;
        if (parent.offsetParent) {
            calcOffsetLeft(parent.offsetParent);
        }
    };
    const calcOffsetTop = (parent) => {
        oTop += parent.offsetTop;
        if (parent.offsetParent) {
            calcOffsetTop(parent.offsetParent);
        }
    };
    calcOffsetLeft(el);
    calcOffsetTop(el);
    return new Vector(oLeft, oTop);
}
/**
 * Add an item to an array list if it doesn't already exist. Returns true if added, false if not and already exists in the array.
 * @deprecated Will be removed in v0.26.0
 */
export function addItemToArray(item, array) {
    if (array.indexOf(item) === -1) {
        array.push(item);
        return true;
    }
    return false;
}
/**
 * Remove an item from an list
 * @deprecated Will be removed in v0.26.0
 */
export function removeItemFromArray(item, array) {
    let index = -1;
    if ((index = array.indexOf(item)) > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}
/**
 * See if an array contains something
 */
export function contains(array, obj) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}
/**
 * Used for exhaustive checks at compile time
 */
export function fail(message) {
    throw new Error(message);
}
/**
 * Create a promise that resolves after a certain number of milliseconds
 *
 * It is strongly recommended you pass the excalibur clock so delays are bound to the
 * excalibur clock which would be unaffected by stop/pause.
 * @param milliseconds
 * @param clock
 */
export function delay(milliseconds, clock) {
    var _a;
    const future = new Future();
    const schedule = (_a = clock === null || clock === void 0 ? void 0 : clock.schedule.bind(clock)) !== null && _a !== void 0 ? _a : setTimeout;
    schedule(() => {
        future.resolve();
    }, milliseconds);
    return future.promise;
}
//# sourceMappingURL=Util.js.map