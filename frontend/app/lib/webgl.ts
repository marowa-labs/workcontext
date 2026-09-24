/**
 * Reports whether the browser can create a WebGL rendering context.
 *
 * A visitor on a client with no GPU context (for example, Chrome on Linux with
 * no hardware acceleration) cannot create one, and mounting a react-three-fiber
 * <Canvas> there throws `THREE.WebGLRenderer: Error creating WebGL context`.
 * Probe with this first so the canvas only mounts when a context is available.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}
