import { AffineMatrix } from '../../Math/affine-matrix';
import { Color } from '../../Color';
export class DrawCall {
    constructor() {
        this.z = 0;
        this.priority = 0;
        this.transform = AffineMatrix.identity();
        this.state = {
            z: 0,
            opacity: 1,
            tint: Color.White
        };
    }
}
//# sourceMappingURL=draw-call.js.map