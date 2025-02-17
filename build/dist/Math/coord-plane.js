/**
 * Enum representing the coordinate plane for the position 2D vector in the [[TransformComponent]]
 */
export var CoordPlane;
(function (CoordPlane) {
    /**
     * The world coordinate plane (default) represents world space, any entities drawn with world
     * space move when the camera moves.
     */
    CoordPlane["World"] = "world";
    /**
     * The screen coordinate plane represents screen space, entities drawn in screen space are pinned
     * to screen coordinates ignoring the camera.
     */
    CoordPlane["Screen"] = "screen";
})(CoordPlane || (CoordPlane = {}));
//# sourceMappingURL=coord-plane.js.map