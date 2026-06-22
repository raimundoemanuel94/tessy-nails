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

export function rateLimitResponse() {
  return Response.json(
    { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
    { status: 429 },
  )
}
