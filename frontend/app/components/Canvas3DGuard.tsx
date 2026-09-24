"use client";

import {
  Component,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import posthog from "posthog-js";
import { isWebGLAvailable } from "../lib/webgl";

const subscribe = () => () => {};

// WebGL support does not change within a document, so probe once and reuse the
// result. useSyncExternalStore reads the snapshot on every render, and the
// probe creates a throwaway WebGL context each time it runs.
let webglSupported: boolean | undefined;
const getWebGLSnapshot = () => (webglSupported ??= isWebGLAvailable());

function captureCanvasFailure(error: unknown, variant: string) {
  const err =
    error instanceof Error
      ? error
      : new Error(String(error ?? "WebGL context unavailable"));
  // Keep the failure visible in error tracking even though the boundary stops
  // it from breaking the page render.
  posthog.captureException(err, { area: "marketing-3d", variant });
}

class CanvasErrorBoundary extends Component<
  { variant: string; fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    captureCanvasFailure(error, this.props.variant);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Guards a react-three-fiber <Canvas> on the public marketing pages.
 *
 * It renders the fallback on the server and on the first client paint, then
 * probes for WebGL. Server and client markup stay identical (no hydration
 * mismatch), and the canvas only mounts once a context is known to be
 * creatable. An error boundary catches any runtime failure the probe misses
 * and swaps in the same fallback, so a WebGL error degrades to a static
 * background instead of taking the whole page down.
 */
export default function Canvas3DGuard({
  variant,
  fallback,
  children,
}: {
  variant: string;
  fallback: ReactNode;
  children: ReactNode;
}) {
  // Read WebGL support on the client only. useSyncExternalStore returns the
  // server snapshot (false) during SSR and hydration, so markup matches, then
  // switches to the client snapshot without a hydration mismatch.
  const ready = useSyncExternalStore(subscribe, getWebGLSnapshot, () => false);

  useEffect(() => {
    // Read the resolved probe value, not `ready`, which is still false during
    // hydration on a healthy client and would report a false failure.
    if (webglSupported === false) {
      captureCanvasFailure(
        new Error("THREE.WebGLRenderer: WebGL context unavailable"),
        variant,
      );
    }
  }, [variant]);

  if (!ready) return <>{fallback}</>;

  return (
    <CanvasErrorBoundary variant={variant} fallback={fallback}>
      {children}
    </CanvasErrorBoundary>
  );
}
