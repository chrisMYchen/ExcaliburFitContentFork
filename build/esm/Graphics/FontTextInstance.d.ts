import { BoundingBox } from '../Collision/BoundingBox';
import { Color } from '../Color';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { Font } from './Font';
export declare class FontTextInstance {
    readonly font: Font;
    readonly text: string;
    readonly color: Color;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    private _textFragments;
    dimensions: BoundingBox;
    disposed: boolean;
    private _lastHashCode;
    constructor(font: Font, text: string, color: Color);
    measureText(text: string): BoundingBox;
    private _setDimension;
    static getHashCode(font: Font, text: string, color?: Color): string;
    getHashCode(includeColor?: boolean): string;
    protected _applyRasterProperties(ctx: CanvasRenderingContext2D): void;
    private _applyFont;
    private _drawText;
    private _splitTextBitmap;
    flagDirty(): void;
    private _dirty;
    render(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    dispose(): void;
}
