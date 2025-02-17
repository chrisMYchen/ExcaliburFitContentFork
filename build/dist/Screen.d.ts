import { Vector } from './Math/vector';
import { Camera } from './Camera';
import { BrowserEvents } from './Util/Browser';
import { BoundingBox } from './Collision/Index';
import { ExcaliburGraphicsContext } from './Graphics/Context/ExcaliburGraphicsContext';
/**
 * Enum representing the different display modes available to Excalibur.
 */
export declare enum DisplayMode {
    /**
     * Default, use a specified resolution for the game. Like 800x600 pixels for example.
     */
    Fixed = "Fixed",
    /**
     * Fit the aspect ratio given by the game resolution within the container at all times will fill any gaps with canvas.
     * The displayed area outside the aspect ratio is not guaranteed to be on the screen, only the [[Screen.contentArea]]
     * is guaranteed to be on screen.
     */
    FitContainerAndFill = "FitContainerAndFill",
    /**
     * Fit an aspect ratio within the screen at all times will fill the screen.
     */
    FitContent = "FitContent",
    /**
     * Fit the aspect ratio given by the game resolution the screen at all times will fill the screen.
     * This displayed area outside the aspect ratio is not guaranteed to be on the screen, only the [[Screen.contentArea]]
     * is guaranteed to be on screen.
     */
    FitScreenAndFill = "FitScreenAndFill",
    /**
     * Fit the viewport to the parent element maintaining aspect ratio given by the game resolution, but zooms in to avoid the black bars
     * (letterbox) that would otherwise be present in [[FitContainer]].
     *
     * **warning** This will clip some drawable area from the user because of the zoom,
     * use [[Screen.contentArea]] to know the safe to draw area.
     */
    FitContainerAndZoom = "FitContainerAndZoom",
    /**
     * Fit the viewport to the device screen maintaining aspect ratio given by the game resolution, but zooms in to avoid the black bars
     * (letterbox) that would otherwise be present in [[FitScreen]].
     *
     * **warning** This will clip some drawable area from the user because of the zoom,
     * use [[Screen.contentArea]] to know the safe to draw area.
     */
    FitScreenAndZoom = "FitScreenAndZoom",
    /**
     * Fit to screen using as much space as possible while maintaining aspect ratio and resolution.
     * This is not the same as [[Screen.goFullScreen]] but behaves in a similar way maintaining aspect ratio.
     *
     * You may want to center your game here is an example
     * ```html
     * <!-- html -->
     * <body>
     * <main>
     *   <canvas id="game"></canvas>
     * </main>
     * </body>
     * ```
     *
     * ```css
     * // css
     * main {
     *   display: flex;
     *   align-items: center;
     *   justify-content: center;
     *   height: 100%;
     *   width: 100%;
     * }
     * ```
     */
    FitScreen = "FitScreen",
    /**
     * Fill the entire screen's css width/height for the game resolution dynamically. This means the resolution of the game will
     * change dynamically as the window is resized. This is not the same as [[Screen.goFullScreen]]
     */
    FillScreen = "FillScreen",
    /**
     * Fit to parent element width/height using as much space as possible while maintaining aspect ratio and resolution.
     */
    FitContainer = "FitContainer",
    /**
     * Use the parent DOM container's css width/height for the game resolution dynamically
     */
    FillContainer = "FillContainer"
}
/**
 * Convenience class for quick resolutions
 * Mostly sourced from https://emulation.gametechwiki.com/index.php/Resolution
 */
export declare class Resolution {
    static get SVGA(): ScreenDimension;
    static get Standard(): ScreenDimension;
    static get Atari2600(): ScreenDimension;
    static get GameBoy(): ScreenDimension;
    static get GameBoyAdvance(): ScreenDimension;
    static get NintendoDS(): ScreenDimension;
    static get NES(): ScreenDimension;
    static get SNES(): ScreenDimension;
}
export interface ScreenDimension {
    width: number;
    height: number;
}
export interface ScreenOptions {
    /**
     * Canvas element to build a screen on
     */
    canvas: HTMLCanvasElement;
    /**
     * Graphics context for the screen
     */
    context: ExcaliburGraphicsContext;
    /**
     * Browser abstraction
     */
    browser: BrowserEvents;
    /**
     * Optionally set antialiasing, defaults to true. If set to true, images will be smoothed
     */
    antialiasing?: boolean;
    /**
     * Optionally override the pixel ratio to use for the screen, otherwise calculated automatically from the browser
     */
    pixelRatio?: number;
    /**
     * Optionally specify the actual pixel resolution in width/height pixels (also known as logical resolution), by default the
     * resolution will be the same as the viewport. Resolution will be overridden by [[DisplayMode.FillContainer]] and
     * [[DisplayMode.FillScreen]].
     */
    resolution?: ScreenDimension;
    /**
     * Visual viewport size in css pixel, if resolution is not specified it will be the same as the viewport
     */
    viewport: ScreenDimension;
    /**
     * Set the display mode of the screen, by default DisplayMode.Fixed.
     */
    displayMode?: DisplayMode;
}
/**
 * The Screen handles all aspects of interacting with the screen for Excalibur.
 */
export declare class Screen {
    graphicsContext: ExcaliburGraphicsContext;
    private _canvas;
    private _antialiasing;
    private _contentResolution;
    private _browser;
    private _camera;
    private _resolution;
    private _resolutionStack;
    private _viewport;
    private _viewportStack;
    private _pixelRatioOverride;
    private _displayMode;
    private _isFullScreen;
    private _mediaQueryList;
    private _isDisposed;
    private _logger;
    private _resizeObserver;
    constructor(options: ScreenOptions);
    private _listenForPixelRatio;
    dispose(): void;
    private _fullscreenChangeHandler;
    private _pixelRatioChangeHandler;
    private _resizeHandler;
    private _calculateDevicePixelRatio;
    private _devicePixelRatio;
    get pixelRatio(): number;
    get isHiDpi(): boolean;
    get displayMode(): DisplayMode;
    get canvas(): HTMLCanvasElement;
    get parent(): HTMLElement | Window;
    get resolution(): ScreenDimension;
    set resolution(resolution: ScreenDimension);
    get viewport(): ScreenDimension;
    set viewport(viewport: ScreenDimension);
    get aspectRatio(): number;
    get scaledWidth(): number;
    get scaledHeight(): number;
    setCurrentCamera(camera: Camera): void;
    pushResolutionAndViewport(): void;
    peekViewport(): ScreenDimension;
    peekResolution(): ScreenDimension;
    popResolutionAndViewport(): void;
    private _alreadyWarned;
    applyResolutionAndViewport(): void;
    get antialiasing(): boolean;
    set antialiasing(isSmooth: boolean);
    /**
     * Returns true if excalibur is fullscreen using the browser fullscreen api
     */
    get isFullScreen(): boolean;
    /**
     * Requests to go fullscreen using the browser fullscreen api, requires user interaction to be successful.
     * For example, wire this to a user click handler.
     *
     * Optionally specify a target element id to go fullscreen, by default the game canvas is used
     * @param elementId
     */
    goFullScreen(elementId?: string): Promise<void>;
    /**
     * Requests to exit fullscreen using the browser fullscreen api
     */
    exitFullScreen(): Promise<void>;
    /**
     * Takes a coordinate in normal html page space, for example from a pointer move event, and translates it to
     * Excalibur screen space.
     *
     * Excalibur screen space starts at the top left (0, 0) corner of the viewport, and extends to the
     * bottom right corner (resolutionX, resolutionY)
     * @param point
     */
    pageToScreenCoordinates(point: Vector): Vector;
    /**
     * Takes a coordinate in Excalibur screen space, and translates it to normal html page space. For example,
     * this is where html elements might live if you want to position them relative to Excalibur.
     *
     * Excalibur screen space starts at the top left (0, 0) corner of the viewport, and extends to the
     * bottom right corner (resolutionX, resolutionY)
     * @param point
     */
    screenToPageCoordinates(point: Vector): Vector;
    /**
     * Takes a coordinate in Excalibur screen space, and translates it to Excalibur world space.
     *
     * World space is where [[Entity|entities]] in Excalibur live by default [[CoordPlane.World]]
     * and extends infinitely out relative from the [[Camera]].
     * @param point  Screen coordinate to convert
     */
    screenToWorldCoordinates(point: Vector): Vector;
    /**
     * Takes a coordinate in Excalibur world space, and translates it to Excalibur screen space.
     *
     * Screen space is where [[ScreenElement|screen elements]] and [[Entity|entities]] with [[CoordPlane.Screen]] live.
     * @param point  World coordinate to convert
     */
    worldToScreenCoordinates(point: Vector): Vector;
    pageToWorldCoordinates(point: Vector): Vector;
    worldToPageCoordinates(point: Vector): Vector;
    /**
     * Returns a BoundingBox of the top left corner of the screen
     * and the bottom right corner of the screen.
     *
     * World bounds are in world coordinates, useful for culling objects offscreen
     */
    getWorldBounds(): BoundingBox;
    /**
     * The width of the game canvas in pixels (physical width component of the
     * resolution of the canvas element)
     */
    get canvasWidth(): number;
    /**
     * Returns half width of the game canvas in pixels (half physical width component)
     */
    get halfCanvasWidth(): number;
    /**
     * The height of the game canvas in pixels, (physical height component of
     * the resolution of the canvas element)
     */
    get canvasHeight(): number;
    /**
     * Returns half height of the game canvas in pixels (half physical height component)
     */
    get halfCanvasHeight(): number;
    /**
     * Returns the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawWidth(): number;
    /**
     * Returns half the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawWidth(): number;
    /**
     * Returns the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawHeight(): number;
    /**
     * Returns half the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawHeight(): number;
    /**
     * Returns screen center coordinates including zoom and device pixel ratio.
     */
    get center(): Vector;
    /**
     * Returns the content area in screen space where it is safe to place content
     */
    get contentArea(): BoundingBox;
    private _computeFit;
    private _computeFitContent;
    private _contentArea;
    private _computeFitScreenAndFill;
    private _computeFitContainerAndFill;
    private _computeFitAndFill;
    private _computeFitScreenAndZoom;
    private _computeFitContainerAndZoom;
    private _computeFitAndZoom;
    private _computeFitContainer;
    private _applyDisplayMode;
    /**
     * Sets the resolution and viewport based on the selected display mode.
     */
    private _setResolutionAndViewportByDisplayMode;
}
