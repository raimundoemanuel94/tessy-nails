export async function GET() {
  return Response.json({
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    ts: Date.now(),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    }
  });
}
