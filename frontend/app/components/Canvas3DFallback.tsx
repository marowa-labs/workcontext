import { cn } from "../lib/utils";

/**
 * Static background shown when WebGL is unavailable or the 3D canvas fails.
 * It mirrors the dark backdrop and accent glow of the live scene, so the page
 * still reads as designed instead of going blank.
 */
export default function Canvas3DFallback({
  accent,
  className,
  style,
}: {
  accent: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      style={{
        background: `radial-gradient(ellipse at center, ${accent}26 0%, transparent 60%)`,
        ...style,
      }}
    />
  );
}
