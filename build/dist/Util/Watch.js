/**
 * Watch an object with a proxy, only fires if property value is different
 */
export function watch(type, change) {
    if (!type) {
        return type;
    }
    if (type.__isProxy === undefined) {
        // expando hack to mark a proxy
        return new Proxy(type, {
            set: (obj, prop, value) => {
                // The default behavior to store the value
                if (obj[prop] !== value) {
                    obj[prop] = value;
                    // Avoid watching private junk
                    if (typeof prop === 'string') {
                        if (prop[0] !== '_') {
                            change(obj);
                        }
                    }
                }
                // Indicate success
                return true;
            },
            get: (obj, prop) => {
                if (prop !== '__isProxy') {
                    return obj[prop];
                }
                return true;
            }
        });
    }
    return type;
}
/**
 * Watch an object with a proxy, fires change on any property value change
 */
export function watchAny(type, change) {
    if (!type) {
        return type;
    }
    if (type.__isProxy === undefined) {
        // expando hack to mark a proxy
        return new Proxy(type, {
            set: (obj, prop, value) => {
                // The default behavior to store the value
                obj[prop] = value;
                // Avoid watching private junk
                if (typeof prop === 'string') {
                    if (prop[0] !== '_') {
                        change(obj);
                    }
                }
                // Indicate success
                return true;
            },
            get: (obj, prop) => {
                if (prop !== '__isProxy') {
                    return obj[prop];
                }
                return true;
            }
        });
    }
    return type;
}
//# sourceMappingURL=Watch.js.map