import { GameEvent } from './Events';
export class EventDispatcher {
    constructor() {
        this._handlers = {};
        this._wiredEventDispatchers = [];
        this._deferedHandlerRemovals = [];
    }
    /**
     * Clears any existing handlers or wired event dispatchers on this event dispatcher
     */
    clear() {
        this._handlers = {};
        this._wiredEventDispatchers = [];
    }
    _processDeferredHandlerRemovals() {
        for (const eventHandler of this._deferedHandlerRemovals) {
            this._removeHandler(eventHandler.name, eventHandler.handler);
        }
        this._deferedHandlerRemovals.length = 0;
    }
    /**
     * Emits an event for target
     * @param eventName  The name of the event to publish
     * @param event      Optionally pass an event data object to the handler
     */
    emit(eventName, event) {
        this._processDeferredHandlerRemovals();
        if (!eventName) {
            // key not mapped
            return;
        }
        eventName = eventName.toLowerCase();
        if (typeof event === 'undefined' || event === null) {
            event = new GameEvent();
        }
        let i, len;
        if (this._handlers[eventName]) {
            i = 0;
            len = this._handlers[eventName].length;
            for (i; i < len; i++) {
                this._handlers[eventName][i](event);
            }
        }
        i = 0;
        len = this._wiredEventDispatchers.length;
        for (i; i < len; i++) {
            this._wiredEventDispatchers[i].emit(eventName, event);
        }
    }
    /**
     * Subscribe an event handler to a particular event name, multiple handlers per event name are allowed.
     * @param eventName  The name of the event to subscribe to
     * @param handler    The handler callback to fire on this event
     */
    on(eventName, handler) {
        this._processDeferredHandlerRemovals();
        eventName = eventName.toLowerCase();
        if (!this._handlers[eventName]) {
            this._handlers[eventName] = [];
        }
        this._handlers[eventName].push(handler);
    }
    /**
     * Unsubscribe an event handler(s) from an event. If a specific handler
     * is specified for an event, only that handler will be unsubscribed.
     * Otherwise all handlers will be unsubscribed for that event.
     *
     * @param eventName  The name of the event to unsubscribe
     * @param handler    Optionally the specific handler to unsubscribe
     */
    off(eventName, handler) {
        this._deferedHandlerRemovals.push({ name: eventName, handler });
    }
    _removeHandler(eventName, handler) {
        eventName = eventName.toLowerCase();
        const eventHandlers = this._handlers[eventName];
        if (eventHandlers) {
            // if no explicit handler is give with the event name clear all handlers
            if (!handler) {
                this._handlers[eventName].length = 0;
            }
            else {
                const index = eventHandlers.indexOf(handler);
                if (index > -1) {
                    this._handlers[eventName].splice(index, 1);
                }
            }
        }
    }
    /**
     * Once listens to an event one time, then unsubscribes from that event
     *
     * @param eventName The name of the event to subscribe to once
     * @param handler   The handler of the event that will be auto unsubscribed
     */
    once(eventName, handler) {
        this._processDeferredHandlerRemovals();
        const metaHandler = (event) => {
            const ev = event || new GameEvent();
            this.off(eventName, metaHandler);
            handler(ev);
        };
        this.on(eventName, metaHandler);
    }
    /**
     * Wires this event dispatcher to also receive events from another
     */
    wire(eventDispatcher) {
        eventDispatcher._wiredEventDispatchers.push(this);
    }
    /**
     * Unwires this event dispatcher from another
     */
    unwire(eventDispatcher) {
        const index = eventDispatcher._wiredEventDispatchers.indexOf(this);
        if (index > -1) {
            eventDispatcher._wiredEventDispatchers.splice(index, 1);
        }
    }
}
//# sourceMappingURL=EventDispatcher.js.map