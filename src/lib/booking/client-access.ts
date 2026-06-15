export function normalizePhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) return digits.slice(2)
  return digits
}

export function phonesMatch(left?: string | null, right?: string | null) {
  const a = normalizePhone(left)
  const b = normalizePhone(right)
  return Boolean(a && b && a === b)
}
