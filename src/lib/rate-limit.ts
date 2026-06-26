// Rate limit em memória — funciona por instância serverless
// Limitação conhecida: zera em cold starts do Vercel
// Para produção com alto volume, migrar para Upstash Redis ou Vercel KV

type RateEntry = {
  count: number
  firstAt: number
}

const buckets = new Map<string, RateEntry>()
let lastCleanup = 0

export function requestIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()

  // Cleanup periodico
  if (now - lastCleanup > windowMs) {
    for (const [bucketKey, entry] of buckets) {
      if (now - entry.firstAt > windowMs) buckets.delete(bucketKey)
    }
    lastCleanup = now
  }

  const entry = buckets.get(key)
  if (!entry || now - entry.firstAt > windowMs) {
    buckets.set(key, { count: 1, firstAt: now })
    return true
  }

  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

// Limite mais permissivo para Wi-Fi compartilhado em salões físicos
// IPs de rede local podem ter vários clientes legítimos
export function checkRateLimitSalon(ip: string, windowMs: number = 10 * 60 * 1000) {
  // 10 requests por 10 minutos por IP (era 3 — muito restritivo para salão com Wi-Fi público)
  return checkRateLimit(`salon:${ip}`, 10, windowMs)
}

export function rateLimitResponse() {
  return Response.json(
    { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
    { status: 429 },
  )
}
