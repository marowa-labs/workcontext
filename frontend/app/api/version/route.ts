export async function GET() {
  return new Response(process.env.BUILD_VERSION || "unknown", {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
