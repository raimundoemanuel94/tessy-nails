/**
 * /api/version — nunca cacheado, retorna BUILD_ID do deploy atual
 * BUILD_ID é injetado pelo next.config.ts em build time
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "unknown";

  return new Response(
    JSON.stringify({ buildId, ts: Date.now() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      }
    }
  );
}
