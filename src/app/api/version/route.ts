/**
 * GET /api/version
 * Retorna versão do app para detecção de updates.
 * 
 * IMPORTANTE: VERCEL_GIT_COMMIT_SHA só existe em build time como env var.
 * Usamos NEXT_PUBLIC_BUILD_ID que é injetado pelo next.config via env.
 */

// Injetado pelo next.config.ts no build
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 
                 process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
                 `local-${Date.now()}`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(
    { 
      buildId: BUILD_ID,
      ts: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    }
  );
}
