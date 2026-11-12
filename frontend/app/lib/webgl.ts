/**
 * Reports whether the browser can run the 3D marketing scenes.
 *
 * A visitor on a client with no GPU context (for example, Chrome on Linux with
 * no hardware acceleration) cannot create one, and mounting a react-three-fiber
 * <Canvas> there throws `THREE.WebGLRenderer: Error creating WebGL context`.
 * Probe with this first so the canvas only mounts when a context is available.
 *
 * Two contexts are required:
 * - WebGL2, because three.js (r163 and later) renders only with WebGL2.
 * - WebGL1 with `ANGLE_instanced_arrays`, because drei <Text> (troika-three-text)
 *   writes every glyph into a WebGL1 canvas that needs this extension. If it is
 *   missing, troika throws in an unhandled promise that no error boundary sees.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const gl2 = document.createElement("canvas").getContext("webgl2");
    const gl1 = document.createElement("canvas").getContext("webgl");
    return Boolean(gl2 && gl1?.getExtension("ANGLE_instanced_arrays"));
  } catch {
    return false;
  }
}
