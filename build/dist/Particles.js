import { Actor } from './Actor';
import { Color } from './Color';
import { Vector, vec } from './Math/vector';
import * as Util from './Util/Util';
import { Configurable } from './Configurable';
import { Random } from './Math/Random';
import { CollisionType } from './Collision/CollisionType';
import { TransformComponent } from './EntityComponentSystem/Components/TransformComponent';
import { GraphicsComponent } from './Graphics/GraphicsComponent';
import { Entity } from './EntityComponentSystem/Entity';
import { BoundingBox } from './Collision/BoundingBox';
import { clamp, randomInRange } from './Math/util';
/**
 * An enum that represents the types of emitter nozzles
 */
export var EmitterType;
(function (EmitterType) {
    /**
     * Constant for the circular emitter type
     */
    EmitterType[EmitterType["Circle"] = 0] = "Circle";
    /**
     * Constant for the rectangular emitter type
     */
    EmitterType[EmitterType["Rectangle"] = 1] = "Rectangle";
})(EmitterType || (EmitterType = {}));
/**
 * @hidden
 */
export class ParticleImpl extends Entity {
    constructor(emitterOrConfig, life, opacity, beginColor, endColor, position, velocity, acceleration, startSize, endSize) {
        super();
        this.position = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.particleRotationalVelocity = 0;
        this.currentRotation = 0;
        this.focus = null;
        this.focusAccel = 0;
        this.opacity = 1;
        this.beginColor = Color.White;
        this.endColor = Color.White;
        // Life is counted in ms
        this.life = 300;
        this.fadeFlag = false;
        // Color transitions
        this._rRate = 1;
        this._gRate = 1;
        this._bRate = 1;
        this._aRate = 0;
        this._currentColor = Color.White;
        this.emitter = null;
        this.particleSize = 5;
        this.particleSprite = null;
        this.sizeRate = 0;
        this.elapsedMultiplier = 0;
        this.visible = true;
        this.isOffscreen = false;
        let emitter = emitterOrConfig;
        if (emitter && !(emitterOrConfig instanceof ParticleEmitter)) {
            const config = emitterOrConfig;
            emitter = config.emitter;
            life = config.life;
            opacity = config.opacity;
            endColor = config.endColor;
            beginColor = config.beginColor;
            position = config.position;
            velocity = config.velocity;
            acceleration = config.acceleration;
            startSize = config.startSize;
            endSize = config.endSize;
        }
        this.emitter = emitter;
        this.life = life || this.life;
        this.opacity = opacity || this.opacity;
        this.endColor = endColor || this.endColor.clone();
        this.beginColor = beginColor || this.beginColor.clone();
        this._currentColor = this.beginColor.clone();
        if (this.emitter.particleTransform === ParticleTransform.Global) {
            const globalPos = this.emitter.transform.globalPos;
            this.position = (position || this.position).add(globalPos);
            this.velocity = (velocity || this.velocity).rotate(this.emitter.transform.globalRotation);
        }
        else {
            this.velocity = velocity || this.velocity;
            this.position = (position || this.position);
        }
        this.acceleration = acceleration || this.acceleration;
        this._rRate = (this.endColor.r - this.beginColor.r) / this.life;
        this._gRate = (this.endColor.g - this.beginColor.g) / this.life;
        this._bRate = (this.endColor.b - this.beginColor.b) / this.life;
        this._aRate = this.opacity / this.life;
        this.startSize = startSize || 0;
        this.endSize = endSize || 0;
        if (this.endSize > 0 && this.startSize > 0) {
            this.sizeRate = (this.endSize - this.startSize) / this.life;
            this.particleSize = this.startSize;
        }
        this.addComponent((this.transform = new TransformComponent()));
        this.addComponent((this.graphics = new GraphicsComponent()));
        this.transform.pos = this.position;
        this.transform.rotation = this.currentRotation;
        this.transform.scale = vec(1, 1); // TODO wut
        if (this.particleSprite) {
            this.graphics.opacity = this.opacity;
            this.graphics.use(this.particleSprite);
        }
        else {
            this.graphics.localBounds = BoundingBox.fromDimension(this.particleSize, this.particleSize, Vector.Half);
            this.graphics.onPostDraw = (ctx) => {
                ctx.save();
                this.graphics.opacity = this.opacity;
                const tmpColor = this._currentColor.clone();
                tmpColor.a = 1;
                ctx.debug.drawPoint(vec(0, 0), { color: tmpColor, size: this.particleSize });
                ctx.restore();
            };
        }
    }
    kill() {
        this.emitter.removeParticle(this);
    }
    update(_engine, delta) {
        this.life = this.life - delta;
        this.elapsedMultiplier = this.elapsedMultiplier + delta;
        if (this.life < 0) {
            this.kill();
        }
        if (this.fadeFlag) {
            this.opacity = clamp(this._aRate * this.life, 0.0001, 1);
        }
        if (this.startSize > 0 && this.endSize > 0) {
            this.particleSize = clamp(this.sizeRate * delta + this.particleSize, Math.min(this.startSize, this.endSize), Math.max(this.startSize, this.endSize));
        }
        this._currentColor.r = clamp(this._currentColor.r + this._rRate * delta, 0, 255);
        this._currentColor.g = clamp(this._currentColor.g + this._gRate * delta, 0, 255);
        this._currentColor.b = clamp(this._currentColor.b + this._bRate * delta, 0, 255);
        this._currentColor.a = clamp(this.opacity, 0.0001, 1);
        if (this.focus) {
            const accel = this.focus
                .sub(this.position)
                .normalize()
                .scale(this.focusAccel)
                .scale(delta / 1000);
            this.velocity = this.velocity.add(accel);
        }
        else {
            this.velocity = this.velocity.add(this.acceleration.scale(delta / 1000));
        }
        this.position = this.position.add(this.velocity.scale(delta / 1000));
        if (this.particleRotationalVelocity) {
            this.currentRotation = (this.currentRotation + (this.particleRotationalVelocity * delta) / 1000) % (2 * Math.PI);
        }
        this.transform.pos = this.position;
        this.transform.rotation = this.currentRotation;
        this.transform.scale = vec(1, 1); // todo wut
        this.graphics.opacity = this.opacity;
    }
}
/**
 * Particle is used in a [[ParticleEmitter]]
 */
export class Particle extends Configurable(ParticleImpl) {
    constructor(emitterOrConfig, life, opacity, beginColor, endColor, position, velocity, acceleration, startSize, endSize) {
        super(emitterOrConfig, life, opacity, beginColor, endColor, position, velocity, acceleration, startSize, endSize);
    }
}
export var ParticleTransform;
(function (ParticleTransform) {
    /**
     * [[ParticleTransform.Global]] is the default and emits particles as if
     * they were world space objects, useful for most effects.
     */
    ParticleTransform["Global"] = "global";
    /**
     * [[ParticleTransform.Local]] particles are children of the emitter and move relative to the emitter
     * as they would in a parent/child actor relationship.
     */
    ParticleTransform["Local"] = "local";
})(ParticleTransform || (ParticleTransform = {}));
/**
 * Using a particle emitter is a great way to create interesting effects
 * in your game, like smoke, fire, water, explosions, etc. `ParticleEmitter`
 * extend [[Actor]] allowing you to use all of the features that come with.
 */
export class ParticleEmitter extends Actor {
    /**
     * @param config particle emitter options bag
     */
    constructor(config) {
        var _a, _b;
        super({ width: (_a = config.width) !== null && _a !== void 0 ? _a : 0, height: (_b = config.height) !== null && _b !== void 0 ? _b : 0 });
        this._particlesToEmit = 0;
        this.numParticles = 0;
        /**
         * Gets or sets the isEmitting flag
         */
        this.isEmitting = true;
        /**
         * Gets or sets the backing particle collection
         */
        this.particles = [];
        /**
         * Gets or sets the backing deadParticle collection
         */
        this.deadParticles = [];
        /**
         * Gets or sets the minimum particle velocity
         */
        this.minVel = 0;
        /**
         * Gets or sets the maximum particle velocity
         */
        this.maxVel = 0;
        /**
         * Gets or sets the acceleration vector for all particles
         */
        this.acceleration = new Vector(0, 0);
        /**
         * Gets or sets the minimum angle in radians
         */
        this.minAngle = 0;
        /**
         * Gets or sets the maximum angle in radians
         */
        this.maxAngle = 0;
        /**
         * Gets or sets the emission rate for particles (particles/sec)
         */
        this.emitRate = 1; //particles/sec
        /**
         * Gets or sets the life of each particle in milliseconds
         */
        this.particleLife = 2000;
        /**
         * Gets or sets the fade flag which causes particles to gradually fade out over the course of their life.
         */
        this.fadeFlag = false;
        /**
         * Gets or sets the optional focus where all particles should accelerate towards
         */
        this.focus = null;
        /**
         * Gets or sets the acceleration for focusing particles if a focus has been specified
         */
        this.focusAccel = null;
        /**
         * Gets or sets the optional starting size for the particles
         */
        this.startSize = null;
        /**
         * Gets or sets the optional ending size for the particles
         */
        this.endSize = null;
        /**
         * Gets or sets the minimum size of all particles
         */
        this.minSize = 5;
        /**
         * Gets or sets the maximum size of all particles
         */
        this.maxSize = 5;
        /**
         * Gets or sets the beginning color of all particles
         */
        this.beginColor = Color.White;
        /**
         * Gets or sets the ending color of all particles
         */
        this.endColor = Color.White;
        this._sprite = null;
        /**
         * Gets or sets the emitter type for the particle emitter
         */
        this.emitterType = EmitterType.Rectangle;
        /**
         * Gets or sets the emitter radius, only takes effect when the [[emitterType]] is [[EmitterType.Circle]]
         */
        this.radius = 0;
        /**
         * Gets or sets the particle rotational speed velocity
         */
        this.particleRotationalVelocity = 0;
        /**
         * Indicates whether particles should start with a random rotation
         */
        this.randomRotation = false;
        /**
         * Gets or sets the emitted particle transform style, [[ParticleTransform.Global]] is the default and emits particles as if
         * they were world space objects, useful for most effects.
         *
         * If set to [[ParticleTransform.Local]] particles are children of the emitter and move relative to the emitter
         * as they would in a parent/child actor relationship.
         */
        this.particleTransform = ParticleTransform.Global;
        const { x, y, pos, isEmitting, minVel, maxVel, acceleration, minAngle, maxAngle, emitRate, particleLife, opacity, fadeFlag, focus, focusAccel, startSize, endSize, minSize, maxSize, beginColor, endColor, particleSprite, emitterType, radius, particleRotationalVelocity, particleTransform, randomRotation, random } = { ...config };
        this.pos = pos !== null && pos !== void 0 ? pos : vec(x !== null && x !== void 0 ? x : 0, y !== null && y !== void 0 ? y : 0);
        this.isEmitting = isEmitting !== null && isEmitting !== void 0 ? isEmitting : this.isEmitting;
        this.minVel = minVel !== null && minVel !== void 0 ? minVel : this.minVel;
        this.maxVel = maxVel !== null && maxVel !== void 0 ? maxVel : this.maxVel;
        this.acceleration = acceleration !== null && acceleration !== void 0 ? acceleration : this.acceleration;
        this.minAngle = minAngle !== null && minAngle !== void 0 ? minAngle : this.minAngle;
        this.maxAngle = maxAngle !== null && maxAngle !== void 0 ? maxAngle : this.maxAngle;
        this.emitRate = emitRate !== null && emitRate !== void 0 ? emitRate : this.emitRate;
        this.particleLife = particleLife !== null && particleLife !== void 0 ? particleLife : this.particleLife;
        this.opacity = opacity !== null && opacity !== void 0 ? opacity : this.opacity;
        this.fadeFlag = fadeFlag !== null && fadeFlag !== void 0 ? fadeFlag : this.fadeFlag;
        this.focus = focus !== null && focus !== void 0 ? focus : this.focus;
        this.focusAccel = focusAccel !== null && focusAccel !== void 0 ? focusAccel : this.focusAccel;
        this.startSize = startSize !== null && startSize !== void 0 ? startSize : this.startSize;
        this.endSize = endSize !== null && endSize !== void 0 ? endSize : this.endSize;
        this.minSize = minSize !== null && minSize !== void 0 ? minSize : this.minSize;
        this.maxSize = maxSize !== null && maxSize !== void 0 ? maxSize : this.maxSize;
        this.beginColor = beginColor !== null && beginColor !== void 0 ? beginColor : this.beginColor;
        this.endColor = endColor !== null && endColor !== void 0 ? endColor : this.endColor;
        this.particleSprite = particleSprite !== null && particleSprite !== void 0 ? particleSprite : this.particleSprite;
        this.emitterType = emitterType !== null && emitterType !== void 0 ? emitterType : this.emitterType;
        this.radius = radius !== null && radius !== void 0 ? radius : this.radius;
        this.particleRotationalVelocity = particleRotationalVelocity !== null && particleRotationalVelocity !== void 0 ? particleRotationalVelocity : this.particleRotationalVelocity;
        this.randomRotation = randomRotation !== null && randomRotation !== void 0 ? randomRotation : this.randomRotation;
        this.particleTransform = particleTransform !== null && particleTransform !== void 0 ? particleTransform : this.particleTransform;
        this.body.collisionType = CollisionType.PreventCollision;
        this.random = random !== null && random !== void 0 ? random : new Random();
    }
    /**
     * Gets the opacity of each particle from 0 to 1.0
     */
    get opacity() {
        return super.graphics.opacity;
    }
    /**
     * Gets the opacity of each particle from 0 to 1.0
     */
    set opacity(opacity) {
        super.graphics.opacity = opacity;
    }
    /**
     * Gets or sets the sprite that a particle should use
     */
    get particleSprite() {
        return this._sprite;
    }
    set particleSprite(val) {
        if (val) {
            this._sprite = val;
        }
    }
    removeParticle(particle) {
        this.deadParticles.push(particle);
    }
    /**
     * Causes the emitter to emit particles
     * @param particleCount  Number of particles to emit right now
     */
    emitParticles(particleCount) {
        var _a;
        for (let i = 0; i < particleCount; i++) {
            const p = this._createParticle();
            this.particles.push(p);
            if ((_a = this === null || this === void 0 ? void 0 : this.scene) === null || _a === void 0 ? void 0 : _a.world) {
                if (this.particleTransform === ParticleTransform.Global) {
                    this.scene.world.add(p);
                }
                else {
                    this.addChild(p);
                }
            }
        }
    }
    clearParticles() {
        this.particles.length = 0;
    }
    // Creates a new particle given the constraints of the emitter
    _createParticle() {
        // todo implement emitter constraints;
        let ranX = 0;
        let ranY = 0;
        const angle = randomInRange(this.minAngle, this.maxAngle, this.random);
        const vel = randomInRange(this.minVel, this.maxVel, this.random);
        const size = this.startSize || randomInRange(this.minSize, this.maxSize, this.random);
        const dx = vel * Math.cos(angle);
        const dy = vel * Math.sin(angle);
        if (this.emitterType === EmitterType.Rectangle) {
            ranX = randomInRange(0, this.width, this.random);
            ranY = randomInRange(0, this.height, this.random);
        }
        else if (this.emitterType === EmitterType.Circle) {
            const radius = randomInRange(0, this.radius, this.random);
            ranX = radius * Math.cos(angle);
            ranY = radius * Math.sin(angle);
        }
        const p = new Particle(this, this.particleLife, this.opacity, this.beginColor, this.endColor, new Vector(ranX, ranY), new Vector(dx, dy), this.acceleration, this.startSize, this.endSize);
        p.fadeFlag = this.fadeFlag;
        p.particleSize = size;
        if (this.particleSprite) {
            p.particleSprite = this.particleSprite;
            p.graphics.opacity = this.opacity;
            p.graphics.use(this._sprite);
        }
        p.particleRotationalVelocity = this.particleRotationalVelocity;
        if (this.randomRotation) {
            p.currentRotation = randomInRange(0, Math.PI * 2, this.random);
        }
        if (this.focus) {
            p.focus = this.focus.add(new Vector(this.pos.x, this.pos.y));
            p.focusAccel = this.focusAccel;
        }
        return p;
    }
    update(engine, delta) {
        var _a;
        super.update(engine, delta);
        if (this.isEmitting) {
            this._particlesToEmit += this.emitRate * (delta / 1000);
            if (this._particlesToEmit > 1.0) {
                this.emitParticles(Math.floor(this._particlesToEmit));
                this._particlesToEmit = this._particlesToEmit - Math.floor(this._particlesToEmit);
            }
        }
        // deferred removal
        for (let i = 0; i < this.deadParticles.length; i++) {
            Util.removeItemFromArray(this.deadParticles[i], this.particles);
            if ((_a = this === null || this === void 0 ? void 0 : this.scene) === null || _a === void 0 ? void 0 : _a.world) {
                this.scene.world.remove(this.deadParticles[i], false);
            }
        }
        this.deadParticles.length = 0;
    }
}
//# sourceMappingURL=Particles.js.map