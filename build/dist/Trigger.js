import { EventDispatcher } from './EventDispatcher';
import { Vector } from './Math/vector';
import { ExitTriggerEvent, EnterTriggerEvent } from './Events';
import { CollisionType } from './Collision/CollisionType';
import { Actor } from './Actor';
const triggerDefaults = {
    pos: Vector.Zero,
    width: 10,
    height: 10,
    visible: false,
    action: () => {
        return;
    },
    filter: () => true,
    repeat: -1
};
/**
 * Triggers are a method of firing arbitrary code on collision. These are useful
 * as 'buttons', 'switches', or to trigger effects in a game. By default triggers
 * are invisible, and can only be seen when [[Trigger.visible]] is set to `true`.
 */
export class Trigger extends Actor {
    /**
     *
     * @param opts Trigger options
     */
    constructor(opts) {
        super({ x: opts.pos.x, y: opts.pos.y, width: opts.width, height: opts.height });
        /**
         * Action to fire when triggered by collision
         */
        this.action = () => {
            return;
        };
        /**
         * Filter to add additional granularity to action dispatch, if a filter is specified the action will only fire when
         * filter return true for the collided actor.
         */
        this.filter = () => true;
        /**
         * Number of times to repeat before killing the trigger,
         */
        this.repeat = -1;
        opts = {
            ...triggerDefaults,
            ...opts
        };
        this.filter = opts.filter || this.filter;
        this.repeat = opts.repeat || this.repeat;
        this.action = opts.action || this.action;
        if (opts.target) {
            this.target = opts.target;
        }
        this.graphics.visible = opts.visible;
        this.body.collisionType = CollisionType.Passive;
        this.eventDispatcher = new EventDispatcher();
        this.events.on('collisionstart', (evt) => {
            if (this.filter(evt.other)) {
                this.emit('enter', new EnterTriggerEvent(this, evt.other));
                this._dispatchAction();
                // remove trigger if its done, -1 repeat forever
                if (this.repeat === 0) {
                    this.kill();
                }
            }
        });
        this.events.on('collisionend', (evt) => {
            if (this.filter(evt.other)) {
                this.emit('exit', new ExitTriggerEvent(this, evt.other));
            }
        });
    }
    set target(target) {
        this._target = target;
        this.filter = (actor) => actor === target;
    }
    get target() {
        return this._target;
    }
    _initialize(engine) {
        super._initialize(engine);
    }
    _dispatchAction() {
        if (this.repeat !== 0) {
            this.action.call(this);
            this.repeat--;
        }
    }
}
//# sourceMappingURL=Trigger.js.map