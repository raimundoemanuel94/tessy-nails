/**
 * scripts/generate-build-id.mjs
 * Roda antes do `next build` (prebuild).
 * 
 * Gera um BUILD_ID único baseado em:
 * 1. VERCEL_GIT_COMMIT_SHA (se estiver no Vercel)
 * 2. SHA do último commit git
 * 3. Timestamp (fallback)
 * 
 * Escreve em next.config.ts via env injection.
 * O valor fica em NEXT_PUBLIC_BUILD_ID no bundle JS.
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

function getBuildId() {
  // 1. Vercel CI
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8);
  }
  // 2. GitHub Actions  
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 8);
  }
  // 3. Git local
  try {
    return execSync("git rev-parse --short=8 HEAD", { stdio: ["pipe","pipe","pipe"] })
      .toString().trim();
  } catch {}
  // 4. Timestamp
  return `b${Date.now().toString(36)}`;
}

const buildId = getBuildId();
console.log(`\n🔨 Nailit Build ID: ${buildId}\n`);

// Escrever em arquivo para o next.config.ts ler
writeFileSync(".build-id", buildId);

// Também exportar como env var para o processo atual
process.env.NEXT_PUBLIC_BUILD_ID = buildId;
