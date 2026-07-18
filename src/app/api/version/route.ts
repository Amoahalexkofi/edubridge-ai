// Returns the current deployment's build id. The client compares this against the
// build id baked into the running app; if they differ, a new version is live.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { build: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
