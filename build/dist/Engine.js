import { EX_VERSION } from './';
import { Flags } from './Flags';
import { polyfill } from './Polyfill';
polyfill();
import { Screen, DisplayMode, Resolution } from './Screen';
import { Loader } from './Loader';
import { Detector } from './Util/Detector';
import { VisibleEvent, HiddenEvent, GameStartEvent, GameStopEvent, PreUpdateEvent, PostUpdateEvent, PreFrameEvent, PostFrameEvent, DeactivateEvent, ActivateEvent, PreDrawEvent, PostDrawEvent, InitializeEvent } from './Events';
import { Logger, LogLevel } from './Util/Log';
import { Color } from './Color';
import { Scene } from './Scene';
import { Entity } from './EntityComponentSystem/Entity';
import { Debug } from './Debug/Debug';
import { Class } from './Class';
import * as Input from './Input/Index';
import { BrowserEvents } from './Util/Browser';
import { ExcaliburGraphicsContext2DCanvas, ExcaliburGraphicsContextWebGL, TextureLoader } from './Graphics';
import { PointerEventReceiver } from './Input/PointerEventReceiver';
import { StandardClock } from './Util/Clock';
import { ImageFiltering } from './Graphics/Filtering';
import { GraphicsDiagnostics } from './Graphics/GraphicsDiagnostics';
import { Toaster } from './Util/Toaster';
/**
 * Enum representing the different mousewheel event bubble prevention
 */
export var ScrollPreventionMode;
(function (ScrollPreventionMode) {
    /**
     * Do not prevent any page scrolling
     */
    ScrollPreventionMode[ScrollPreventionMode["None"] = 0] = "None";
    /**
     * Prevent page scroll if mouse is over the game canvas
     */
    ScrollPreventionMode[ScrollPreventionMode["Canvas"] = 1] = "Canvas";
    /**
     * Prevent all page scrolling via mouse wheel
     */
    ScrollPreventionMode[ScrollPreventionMode["All"] = 2] = "All";
})(ScrollPreventionMode || (ScrollPreventionMode = {}));
/**
 * The Excalibur Engine
 *
 * The [[Engine]] is the main driver for a game. It is responsible for
 * starting/stopping the game, maintaining state, transmitting events,
 * loading resources, and managing the scene.
 */
export class Engine extends Class {
    /**
     * Creates a new game using the given [[EngineOptions]]. By default, if no options are provided,
     * the game will be rendered full screen (taking up all available browser window space).
     * You can customize the game rendering through [[EngineOptions]].
     *
     * Example:
     *
     * ```js
     * var game = new ex.Engine({
     *   width: 0, // the width of the canvas
     *   height: 0, // the height of the canvas
     *   enableCanvasTransparency: true, // the transparencySection of the canvas
     *   canvasElementId: '', // the DOM canvas element ID, if you are providing your own
     *   displayMode: ex.DisplayMode.FullScreen, // the display mode
     *   pointerScope: ex.Input.PointerScope.Document, // the scope of capturing pointer (mouse/touch) events
     *   backgroundColor: ex.Color.fromHex('#2185d0') // background color of the engine
     * });
     *
     * // call game.start, which is a Promise
     * game.start().then(function () {
     *   // ready, set, go!
     * });
     * ```
     */
    constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        super();
        /**
         * Optionally set the maximum fps if not set Excalibur will go as fast as the device allows.
         *
         * You may want to constrain max fps if your game cannot maintain fps consistently, it can look and feel better to have a 30fps game than
         * one that bounces between 30fps and 60fps
         */
        this.maxFps = Number.POSITIVE_INFINITY;
        /**
         * Contains all the scenes currently registered with Excalibur
         */
        this.scenes = {};
        this._suppressPlayButton = false;
        /**
         * Indicates whether audio should be paused when the game is no longer visible.
         */
        this.pauseAudioWhenHidden = true;
        /**
         * Indicates whether the engine should draw with debug information
         */
        this._isDebug = false;
        /**
         * Sets the Transparency for the engine.
         */
        this.enableCanvasTransparency = true;
        /**
         * The action to take when a fatal exception is thrown
         */
        this.onFatalException = (e) => {
            Logger.getInstance().fatal(e);
        };
        this._toaster = new Toaster();
        this._timescale = 1.0;
        this._isInitialized = false;
        this._deferredGoTo = null;
        this._originalOptions = {};
        this._performanceThresholdTriggered = false;
        this._fpsSamples = [];
        this._loadingComplete = false;
        this._isReady = false;
        this._isReadyPromise = new Promise(resolve => {
            this._isReadyResolve = resolve;
        });
        /**
         * Returns the current frames elapsed milliseconds
         */
        this.currentFrameElapsedMs = 0;
        /**
         * Returns the current frame lag when in fixed update mode
         */
        this.currentFrameLagMs = 0;
        this._lagMs = 0;
        this._screenShotRequests = [];
        options = { ...Engine._DEFAULT_ENGINE_OPTIONS, ...options };
        this._originalOptions = options;
        Flags.freeze();
        // Initialize browser events facade
        this.browser = new BrowserEvents(window, document);
        // Check compatibility
        const detector = new Detector();
        if (!options.suppressMinimumBrowserFeatureDetection && !(this._compatible = detector.test())) {
            const message = document.createElement('div');
            message.innerText = 'Sorry, your browser does not support all the features needed for Excalibur';
            document.body.appendChild(message);
            detector.failedTests.forEach(function (test) {
                const testMessage = document.createElement('div');
                testMessage.innerText = 'Browser feature missing ' + test;
                document.body.appendChild(testMessage);
            });
            if (options.canvasElementId) {
                const canvas = document.getElementById(options.canvasElementId);
                if (canvas) {
                    canvas.parentElement.removeChild(canvas);
                }
            }
            return;
        }
        else {
            this._compatible = true;
        }
        // Use native console API for color fun
        // eslint-disable-next-line no-console
        if (console.log && !options.suppressConsoleBootMessage) {
            // eslint-disable-next-line no-console
            console.log(`%cPowered by Excalibur.js (v${EX_VERSION})`, 'background: #176BAA; color: white; border-radius: 5px; padding: 15px; font-size: 1.5em; line-height: 80px;');
            // eslint-disable-next-line no-console
            console.log('\n\
      /| ________________\n\
O|===|* >________________>\n\
      \\|');
            // eslint-disable-next-line no-console
            console.log('Visit', 'http://excaliburjs.com', 'for more information');
        }
        // Suppress play button
        if (options.suppressPlayButton) {
            this._suppressPlayButton = true;
        }
        this._logger = Logger.getInstance();
        // If debug is enabled, let's log browser features to the console.
        if (this._logger.defaultLevel === LogLevel.Debug) {
            detector.logBrowserFeatures();
        }
        this._logger.debug('Building engine...');
        this.canvasElementId = options.canvasElementId;
        if (options.canvasElementId) {
            this._logger.debug('Using Canvas element specified: ' + options.canvasElementId);
            this.canvas = document.getElementById(options.canvasElementId);
        }
        else if (options.canvasElement) {
            this._logger.debug('Using Canvas element specified:', options.canvasElement);
            this.canvas = options.canvasElement;
        }
        else {
            this._logger.debug('Using generated canvas element');
            this.canvas = document.createElement('canvas');
        }
        let displayMode = (_a = options.displayMode) !== null && _a !== void 0 ? _a : DisplayMode.Fixed;
        if ((options.width && options.height) || options.viewport) {
            if (options.displayMode === undefined) {
                displayMode = DisplayMode.Fixed;
            }
            this._logger.debug('Engine viewport is size ' + options.width + ' x ' + options.height);
        }
        else if (!options.displayMode) {
            this._logger.debug('Engine viewport is fit');
            displayMode = DisplayMode.FitScreen;
        }
        this._originalDisplayMode = displayMode;
        // Canvas 2D fallback can be flagged on
        let useCanvasGraphicsContext = Flags.isEnabled('use-canvas-context');
        if (!useCanvasGraphicsContext) {
            // Attempt webgl first
            try {
                this.graphicsContext = new ExcaliburGraphicsContextWebGL({
                    canvasElement: this.canvas,
                    enableTransparency: this.enableCanvasTransparency,
                    smoothing: options.antialiasing,
                    backgroundColor: options.backgroundColor,
                    snapToPixel: options.snapToPixel,
                    useDrawSorting: options.useDrawSorting
                });
            }
            catch (e) {
                this._logger.warn(`Excalibur could not load webgl for some reason (${e.message}) and loaded a Canvas 2D fallback. ` +
                    `Some features of Excalibur will not work in this mode. \n\n` +
                    'Read more about this issue at https://excaliburjs.com/docs/webgl');
                // fallback to canvas in case of failure
                useCanvasGraphicsContext = true;
            }
        }
        if (useCanvasGraphicsContext) {
            this.graphicsContext = new ExcaliburGraphicsContext2DCanvas({
                canvasElement: this.canvas,
                enableTransparency: this.enableCanvasTransparency,
                smoothing: options.antialiasing,
                backgroundColor: options.backgroundColor,
                snapToPixel: options.snapToPixel,
                useDrawSorting: options.useDrawSorting
            });
        }
        this.screen = new Screen({
            canvas: this.canvas,
            context: this.graphicsContext,
            antialiasing: (_b = options.antialiasing) !== null && _b !== void 0 ? _b : true,
            browser: this.browser,
            viewport: (_c = options.viewport) !== null && _c !== void 0 ? _c : (options.width && options.height ? { width: options.width, height: options.height } : Resolution.SVGA),
            resolution: options.resolution,
            displayMode,
            pixelRatio: options.suppressHiDPIScaling ? 1 : ((_d = options.pixelRatio) !== null && _d !== void 0 ? _d : null)
        });
        // Set default filtering based on antialiasing
        TextureLoader.filtering = options.antialiasing ? ImageFiltering.Blended : ImageFiltering.Pixel;
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor.clone();
        }
        this.maxFps = (_e = options.maxFps) !== null && _e !== void 0 ? _e : this.maxFps;
        this.fixedUpdateFps = (_f = options.fixedUpdateFps) !== null && _f !== void 0 ? _f : this.fixedUpdateFps;
        this.clock = new StandardClock({
            maxFps: this.maxFps,
            tick: this._mainloop.bind(this),
            onFatalException: (e) => this.onFatalException(e)
        });
        this.enableCanvasTransparency = options.enableCanvasTransparency;
        this._loader = new Loader();
        this._loader.wireEngine(this);
        this.debug = new Debug(this);
        this._initialize(options);
        this.rootScene = this.currentScene = new Scene();
        this.addScene('root', this.rootScene);
        window.___EXCALIBUR_DEVTOOL = this;
    }
    /**
     * The width of the game canvas in pixels (physical width component of the
     * resolution of the canvas element)
     */
    get canvasWidth() {
        return this.screen.canvasWidth;
    }
    /**
     * Returns half width of the game canvas in pixels (half physical width component)
     */
    get halfCanvasWidth() {
        return this.screen.halfCanvasWidth;
    }
    /**
     * The height of the game canvas in pixels, (physical height component of
     * the resolution of the canvas element)
     */
    get canvasHeight() {
        return this.screen.canvasHeight;
    }
    /**
     * Returns half height of the game canvas in pixels (half physical height component)
     */
    get halfCanvasHeight() {
        return this.screen.halfCanvasHeight;
    }
    /**
     * Returns the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawWidth() {
        return this.screen.drawWidth;
    }
    /**
     * Returns half the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawWidth() {
        return this.screen.halfDrawWidth;
    }
    /**
     * Returns the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawHeight() {
        return this.screen.drawHeight;
    }
    /**
     * Returns half the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawHeight() {
        return this.screen.halfDrawHeight;
    }
    /**
     * Returns whether excalibur detects the current screen to be HiDPI
     */
    get isHiDpi() {
        return this.screen.isHiDpi;
    }
    /**
     * Access [[stats]] that holds frame statistics.
     */
    get stats() {
        return this.debug.stats;
    }
    /**
     * Indicates whether the engine is set to fullscreen or not
     */
    get isFullscreen() {
        return this.screen.isFullScreen;
    }
    /**
     * Indicates the current [[DisplayMode]] of the engine.
     */
    get displayMode() {
        return this.screen.displayMode;
    }
    /**
     * Returns the calculated pixel ration for use in rendering
     */
    get pixelRatio() {
        return this.screen.pixelRatio;
    }
    get isDebug() {
        return this._isDebug;
    }
    /**
     * Hints the graphics context to truncate fractional world space coordinates
     */
    get snapToPixel() {
        return this.graphicsContext.snapToPixel;
    }
    ;
    set snapToPixel(shouldSnapToPixel) {
        this.graphicsContext.snapToPixel = shouldSnapToPixel;
    }
    ;
    on(eventName, handler) {
        super.on(eventName, handler);
    }
    once(eventName, handler) {
        super.once(eventName, handler);
    }
    off(eventName, handler) {
        super.off(eventName, handler);
    }
    _monitorPerformanceThresholdAndTriggerFallback() {
        const { allow } = this._originalOptions.configurePerformanceCanvas2DFallback;
        let { threshold, showPlayerMessage } = this._originalOptions.configurePerformanceCanvas2DFallback;
        if (threshold === undefined) {
            threshold = Engine._DEFAULT_ENGINE_OPTIONS.configurePerformanceCanvas2DFallback.threshold;
        }
        if (showPlayerMessage === undefined) {
            showPlayerMessage = Engine._DEFAULT_ENGINE_OPTIONS.configurePerformanceCanvas2DFallback.showPlayerMessage;
        }
        if (!Flags.isEnabled('use-canvas-context') && allow && this.ready && !this._performanceThresholdTriggered) {
            // Calculate Average fps for last X number of frames after start
            if (this._fpsSamples.length === threshold.numberOfFrames) {
                this._fpsSamples.splice(0, 1);
            }
            this._fpsSamples.push(this.clock.fpsSampler.fps);
            let total = 0;
            for (let i = 0; i < this._fpsSamples.length; i++) {
                total += this._fpsSamples[i];
            }
            const average = total / this._fpsSamples.length;
            if (this._fpsSamples.length === threshold.numberOfFrames) {
                if (average <= threshold.fps) {
                    this._performanceThresholdTriggered = true;
                    this._logger.warn(`Switching to browser 2D Canvas fallback due to performance. Some features of Excalibur will not work in this mode.\n` +
                        'this might mean your browser doesn\'t have webgl enabled or hardware acceleration is unavailable.\n\n' +
                        'If in Chrome:\n' +
                        '  * Visit Settings > Advanced > System, and ensure "Use Hardware Acceleration" is checked.\n' +
                        '  * Visit chrome://flags/#ignore-gpu-blocklist and ensure "Override software rendering list" is "enabled"\n' +
                        'If in Firefox, visit about:config\n' +
                        '  * Ensure webgl.disabled = false\n' +
                        '  * Ensure webgl.force-enabled = true\n' +
                        '  * Ensure layers.acceleration.force-enabled = true\n\n' +
                        'Read more about this issue at https://excaliburjs.com/docs/performance');
                    if (showPlayerMessage) {
                        this._toaster.toast('Excalibur is encountering performance issues. ' +
                            'It\'s possible that your browser doesn\'t have hardware acceleration enabled. ' +
                            'Visit [LINK] for more information and potential solutions.', 'https://excaliburjs.com/docs/performance');
                    }
                    this.useCanvas2DFallback();
                    this.emit('fallbackgraphicscontext', this.graphicsContext);
                }
            }
        }
    }
    /**
     * Switches the engine's graphics context to the 2D Canvas.
     * @warning Some features of Excalibur will not work in this mode.
     */
    useCanvas2DFallback() {
        var _a, _b, _c;
        // Swap out the canvas
        const newCanvas = this.canvas.cloneNode(false);
        this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
        this.canvas = newCanvas;
        const options = this._originalOptions;
        const displayMode = this._originalDisplayMode;
        // New graphics context
        this.graphicsContext = new ExcaliburGraphicsContext2DCanvas({
            canvasElement: this.canvas,
            enableTransparency: this.enableCanvasTransparency,
            smoothing: options.antialiasing,
            backgroundColor: options.backgroundColor,
            snapToPixel: options.snapToPixel,
            useDrawSorting: options.useDrawSorting
        });
        // Reset screen
        if (this.screen) {
            this.screen.dispose();
        }
        this.screen = new Screen({
            canvas: this.canvas,
            context: this.graphicsContext,
            antialiasing: (_a = options.antialiasing) !== null && _a !== void 0 ? _a : true,
            browser: this.browser,
            viewport: (_b = options.viewport) !== null && _b !== void 0 ? _b : (options.width && options.height ? { width: options.width, height: options.height } : Resolution.SVGA),
            resolution: options.resolution,
            displayMode,
            pixelRatio: options.suppressHiDPIScaling ? 1 : ((_c = options.pixelRatio) !== null && _c !== void 0 ? _c : null)
        });
        this.screen.setCurrentCamera(this.currentScene.camera);
        // Reset pointers
        this.input.pointers.detach();
        const pointerTarget = options && options.pointerScope === Input.PointerScope.Document ? document : this.canvas;
        this.input.pointers = this.input.pointers.recreate(pointerTarget, this);
        this.input.pointers.init();
    }
    /**
     * Returns a BoundingBox of the top left corner of the screen
     * and the bottom right corner of the screen.
     */
    getWorldBounds() {
        return this.screen.getWorldBounds();
    }
    /**
     * Gets the current engine timescale factor (default is 1.0 which is 1:1 time)
     */
    get timescale() {
        return this._timescale;
    }
    /**
     * Sets the current engine timescale factor. Useful for creating slow-motion effects or fast-forward effects
     * when using time-based movement.
     */
    set timescale(value) {
        if (value <= 0) {
            Logger.getInstance().error('Cannot set engine.timescale to a value of 0 or less than 0.');
            return;
        }
        this._timescale = value;
    }
    /**
     * Adds a [[Timer]] to the [[currentScene]].
     * @param timer  The timer to add to the [[currentScene]].
     */
    addTimer(timer) {
        return this.currentScene.addTimer(timer);
    }
    /**
     * Removes a [[Timer]] from the [[currentScene]].
     * @param timer  The timer to remove to the [[currentScene]].
     */
    removeTimer(timer) {
        return this.currentScene.removeTimer(timer);
    }
    /**
     * Adds a [[Scene]] to the engine, think of scenes in Excalibur as you
     * would levels or menus.
     *
     * @param key  The name of the scene, must be unique
     * @param scene The scene to add to the engine
     */
    addScene(key, scene) {
        if (this.scenes[key]) {
            this._logger.warn('Scene', key, 'already exists overwriting');
        }
        this.scenes[key] = scene;
    }
    /**
     * @internal
     */
    removeScene(entity) {
        if (entity instanceof Scene) {
            // remove scene
            for (const key in this.scenes) {
                if (this.scenes.hasOwnProperty(key)) {
                    if (this.scenes[key] === entity) {
                        delete this.scenes[key];
                    }
                }
            }
        }
        if (typeof entity === 'string') {
            // remove scene
            delete this.scenes[entity];
        }
    }
    add(entity) {
        if (arguments.length === 2) {
            this.addScene(arguments[0], arguments[1]);
            return;
        }
        if (this._deferredGoTo && this.scenes[this._deferredGoTo]) {
            this.scenes[this._deferredGoTo].add(entity);
        }
        else {
            this.currentScene.add(entity);
        }
    }
    remove(entity) {
        if (entity instanceof Entity) {
            this.currentScene.remove(entity);
        }
        if (entity instanceof Scene) {
            this.removeScene(entity);
        }
        if (typeof entity === 'string') {
            this.removeScene(entity);
        }
    }
    /**
     * Changes the currently updating and drawing scene to a different,
     * named scene. Calls the [[Scene]] lifecycle events.
     * @param key  The key of the scene to transition to.
     * @param data Optional data to send to the scene's onActivate method
     */
    goToScene(key, data) {
        // if not yet initialized defer goToScene
        if (!this.isInitialized) {
            this._deferredGoTo = key;
            return;
        }
        if (this.scenes[key]) {
            const previousScene = this.currentScene;
            const nextScene = this.scenes[key];
            this._logger.debug('Going to scene:', key);
            // only deactivate when initialized
            if (this.currentScene.isInitialized) {
                const context = { engine: this, previousScene, nextScene };
                this.currentScene._deactivate.apply(this.currentScene, [context, nextScene]);
                this.currentScene.eventDispatcher.emit('deactivate', new DeactivateEvent(context, this.currentScene));
            }
            // set current scene to new one
            this.currentScene = nextScene;
            this.screen.setCurrentCamera(nextScene.camera);
            // initialize the current scene if has not been already
            this.currentScene._initialize(this);
            const context = { engine: this, previousScene, nextScene, data };
            this.currentScene._activate.apply(this.currentScene, [context, nextScene]);
            this.currentScene.eventDispatcher.emit('activate', new ActivateEvent(context, this.currentScene));
        }
        else {
            this._logger.error('Scene', key, 'does not exist!');
        }
    }
    /**
     * Transforms the current x, y from screen coordinates to world coordinates
     * @param point  Screen coordinate to convert
     */
    screenToWorldCoordinates(point) {
        return this.screen.screenToWorldCoordinates(point);
    }
    /**
     * Transforms a world coordinate, to a screen coordinate
     * @param point  World coordinate to convert
     */
    worldToScreenCoordinates(point) {
        return this.screen.worldToScreenCoordinates(point);
    }
    /**
     * Initializes the internal canvas, rendering context, display mode, and native event listeners
     */
    _initialize(options) {
        this.pageScrollPreventionMode = options.scrollPreventionMode;
        // initialize inputs
        const pointerTarget = options && options.pointerScope === Input.PointerScope.Document ? document : this.canvas;
        this.input = {
            keyboard: new Input.Keyboard(),
            pointers: new PointerEventReceiver(pointerTarget, this),
            gamepads: new Input.Gamepads()
        };
        this.input.keyboard.init();
        this.input.pointers.init();
        this.input.gamepads.init();
        // Issue #385 make use of the visibility api
        // https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
        this.browser.document.on('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.eventDispatcher.emit('hidden', new HiddenEvent(this));
                this._logger.debug('Window hidden');
            }
            else if (document.visibilityState === 'visible') {
                this.eventDispatcher.emit('visible', new VisibleEvent(this));
                this._logger.debug('Window visible');
            }
        });
        if (!this.canvasElementId && !options.canvasElement) {
            document.body.appendChild(this.canvas);
        }
    }
    onInitialize(_engine) {
        // Override me
    }
    /**
     * If supported by the browser, this will set the antialiasing flag on the
     * canvas. Set this to `false` if you want a 'jagged' pixel art look to your
     * image resources.
     * @param isSmooth  Set smoothing to true or false
     */
    setAntialiasing(isSmooth) {
        this.screen.antialiasing = isSmooth;
    }
    /**
     * Return the current smoothing status of the canvas
     */
    getAntialiasing() {
        return this.screen.antialiasing;
    }
    /**
     * Gets whether the actor is Initialized
     */
    get isInitialized() {
        return this._isInitialized;
    }
    _overrideInitialize(engine) {
        if (!this.isInitialized) {
            this.onInitialize(engine);
            super.emit('initialize', new InitializeEvent(engine, this));
            this._isInitialized = true;
            if (this._deferredGoTo) {
                const deferredScene = this._deferredGoTo;
                this._deferredGoTo = null;
                this.goToScene(deferredScene);
            }
            else {
                this.goToScene('root');
            }
        }
    }
    /**
     * Updates the entire state of the game
     * @param delta  Number of milliseconds elapsed since the last update.
     */
    _update(delta) {
        if (!this.ready) {
            // suspend updates until loading is finished
            this._loader.update(this, delta);
            // Update input listeners
            this.input.keyboard.update();
            this.input.gamepads.update();
            return;
        }
        // Publish preupdate events
        this._preupdate(delta);
        // process engine level events
        this.currentScene.update(this, delta);
        // Publish update event
        this._postupdate(delta);
        // Update input listeners
        this.input.keyboard.update();
        this.input.gamepads.update();
    }
    /**
     * @internal
     */
    _preupdate(delta) {
        this.emit('preupdate', new PreUpdateEvent(this, delta, this));
        this.onPreUpdate(this, delta);
    }
    onPreUpdate(_engine, _delta) {
        // Override me
    }
    /**
     * @internal
     */
    _postupdate(delta) {
        this.emit('postupdate', new PostUpdateEvent(this, delta, this));
        this.onPostUpdate(this, delta);
    }
    onPostUpdate(_engine, _delta) {
        // Override me
    }
    /**
     * Draws the entire game
     * @param delta  Number of milliseconds elapsed since the last draw.
     */
    _draw(delta) {
        this.graphicsContext.beginDrawLifecycle();
        this.graphicsContext.clear();
        this._predraw(this.graphicsContext, delta);
        // Drawing nothing else while loading
        if (!this._isReady) {
            this._loader.canvas.draw(this.graphicsContext, 0, 0);
            this.graphicsContext.flush();
            return;
        }
        this.graphicsContext.backgroundColor = this.backgroundColor;
        this.currentScene.draw(this.graphicsContext, delta);
        this._postdraw(this.graphicsContext, delta);
        // Flush any pending drawings
        this.graphicsContext.flush();
        this.graphicsContext.endDrawLifecycle();
        this._checkForScreenShots();
    }
    /**
     * @internal
     */
    _predraw(_ctx, delta) {
        this.emit('predraw', new PreDrawEvent(_ctx, delta, this));
        this.onPreDraw(_ctx, delta);
    }
    onPreDraw(_ctx, _delta) {
        // Override me
    }
    /**
     * @internal
     */
    _postdraw(_ctx, delta) {
        this.emit('postdraw', new PostDrawEvent(_ctx, delta, this));
        this.onPostDraw(_ctx, delta);
    }
    onPostDraw(_ctx, _delta) {
        // Override me
    }
    /**
     * Enable or disable Excalibur debugging functionality.
     * @param toggle a value that debug drawing will be changed to
     */
    showDebug(toggle) {
        this._isDebug = toggle;
    }
    /**
     * Toggle Excalibur debugging functionality.
     */
    toggleDebug() {
        this._isDebug = !this._isDebug;
        return this._isDebug;
    }
    /**
     * Returns true when loading is totally complete and the player has clicked start
     */
    get loadingComplete() {
        return this._loadingComplete;
    }
    get ready() {
        return this._isReady;
    }
    isReady() {
        return this._isReadyPromise;
    }
    /**
     * Starts the internal game loop for Excalibur after loading
     * any provided assets.
     * @param loader  Optional [[Loader]] to use to load resources. The default loader is [[Loader]], override to provide your own
     * custom loader.
     *
     * Note: start() only resolves AFTER the user has clicked the play button
     */
    async start(loader) {
        if (!this._compatible) {
            throw new Error('Excalibur is incompatible with your browser');
        }
        // Wire loader if we have it
        if (loader) {
            // Push the current user entered resolution/viewport
            this.screen.pushResolutionAndViewport();
            // Configure resolution for loader, it expects resolution === viewport
            this.screen.resolution = this.screen.viewport;
            this.screen.applyResolutionAndViewport();
            this._loader = loader;
            this._loader.suppressPlayButton = this._suppressPlayButton || this._loader.suppressPlayButton;
            this._loader.wireEngine(this);
        }
        // Start the excalibur clock which drives the mainloop
        // has started is a slight misnomer, it's really mainloop started
        this._logger.debug('Starting game clock...');
        this.browser.resume();
        this.clock.start();
        this._logger.debug('Game clock started');
        if (loader) {
            await this.load(this._loader);
            this._loadingComplete = true;
            // reset back to previous user resolution/viewport
            this.screen.popResolutionAndViewport();
            this.screen.applyResolutionAndViewport();
        }
        this._loadingComplete = true;
        // Initialize before ready
        this._overrideInitialize(this);
        this._isReady = true;
        this._isReadyResolve();
        this.emit('start', new GameStartEvent(this));
        return this._isReadyPromise;
    }
    _mainloop(elapsed) {
        this.emit('preframe', new PreFrameEvent(this, this.stats.prevFrame));
        const delta = elapsed * this.timescale;
        this.currentFrameElapsedMs = delta;
        // reset frame stats (reuse existing instances)
        const frameId = this.stats.prevFrame.id + 1;
        this.stats.currFrame.reset();
        this.stats.currFrame.id = frameId;
        this.stats.currFrame.delta = delta;
        this.stats.currFrame.fps = this.clock.fpsSampler.fps;
        GraphicsDiagnostics.clear();
        const beforeUpdate = this.clock.now();
        const fixedTimestepMs = 1000 / this.fixedUpdateFps;
        if (this.fixedUpdateFps) {
            this._lagMs += delta;
            while (this._lagMs >= fixedTimestepMs) {
                this._update(fixedTimestepMs);
                this._lagMs -= fixedTimestepMs;
            }
        }
        else {
            this._update(delta);
        }
        const afterUpdate = this.clock.now();
        this.currentFrameLagMs = this._lagMs;
        this._draw(delta);
        const afterDraw = this.clock.now();
        this.stats.currFrame.duration.update = afterUpdate - beforeUpdate;
        this.stats.currFrame.duration.draw = afterDraw - afterUpdate;
        this.stats.currFrame.graphics.drawnImages = GraphicsDiagnostics.DrawnImagesCount;
        this.stats.currFrame.graphics.drawCalls = GraphicsDiagnostics.DrawCallCount;
        this.emit('postframe', new PostFrameEvent(this, this.stats.currFrame));
        this.stats.prevFrame.reset(this.stats.currFrame);
        this._monitorPerformanceThresholdAndTriggerFallback();
    }
    /**
     * Stops Excalibur's main loop, useful for pausing the game.
     */
    stop() {
        if (this.clock.isRunning()) {
            this.emit('stop', new GameStopEvent(this));
            this.browser.pause();
            this.clock.stop();
            this._logger.debug('Game stopped');
        }
    }
    /**
     * Returns the Engine's running status, Useful for checking whether engine is running or paused.
     */
    isRunning() {
        return this.clock.isRunning();
    }
    /**
     * Takes a screen shot of the current viewport and returns it as an
     * HTML Image Element.
     * @param preserveHiDPIResolution in the case of HiDPI return the full scaled backing image, by default false
     */
    screenshot(preserveHiDPIResolution = false) {
        const screenShotPromise = new Promise((resolve) => {
            this._screenShotRequests.push({ preserveHiDPIResolution, resolve });
        });
        return screenShotPromise;
    }
    _checkForScreenShots() {
        // We must grab the draw buffer before we yield to the browser
        // the draw buffer is cleared after compositing
        // the reason for the asynchrony is setting `preserveDrawingBuffer: true`
        // forces the browser to copy buffers which can have a mass perf impact on mobile
        for (const request of this._screenShotRequests) {
            const finalWidth = request.preserveHiDPIResolution ? this.canvas.width : this.screen.resolution.width;
            const finalHeight = request.preserveHiDPIResolution ? this.canvas.height : this.screen.resolution.height;
            const screenshot = document.createElement('canvas');
            screenshot.width = finalWidth;
            screenshot.height = finalHeight;
            const ctx = screenshot.getContext('2d');
            ctx.imageSmoothingEnabled = this.screen.antialiasing;
            ctx.drawImage(this.canvas, 0, 0, finalWidth, finalHeight);
            const result = new Image();
            const raw = screenshot.toDataURL('image/png');
            result.src = raw;
            request.resolve(result);
        }
        // Reset state
        this._screenShotRequests.length = 0;
    }
    /**
     * Another option available to you to load resources into the game.
     * Immediately after calling this the game will pause and the loading screen
     * will appear.
     * @param loader  Some [[Loadable]] such as a [[Loader]] collection, [[Sound]], or [[Texture]].
     */
    async load(loader) {
        try {
            await loader.load();
        }
        catch (e) {
            this._logger.error('Error loading resources, things may not behave properly', e);
            await Promise.resolve();
        }
    }
}
/**
 * Default [[EngineOptions]]
 */
Engine._DEFAULT_ENGINE_OPTIONS = {
    width: 0,
    height: 0,
    enableCanvasTransparency: true,
    useDrawSorting: true,
    configurePerformanceCanvas2DFallback: {
        allow: true,
        showPlayerMessage: false,
        threshold: { fps: 20, numberOfFrames: 100 }
    },
    canvasElementId: '',
    canvasElement: undefined,
    snapToPixel: false,
    pointerScope: Input.PointerScope.Canvas,
    suppressConsoleBootMessage: null,
    suppressMinimumBrowserFeatureDetection: null,
    suppressHiDPIScaling: null,
    suppressPlayButton: null,
    scrollPreventionMode: ScrollPreventionMode.Canvas,
    backgroundColor: Color.fromHex('#2185d0') // Excalibur blue
};
//# sourceMappingURL=Engine.js.map