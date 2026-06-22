export function normalizePhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) return digits.slice(2)
  return digits
}

function phoneVariants(value?: string | null) {
  const phone = normalizePhone(value)
  const variants = new Set<string>()
  if (!phone) return variants

  variants.add(phone)

  if (phone.length >= 11 && phone[2] === '9') {
    variants.add(phone.slice(0, 2) + phone.slice(3))
  }

  if (phone.length === 10) {
    variants.add(phone.slice(0, 2) + '9' + phone.slice(2))
  }

  return variants
}

export function phonesMatch(left?: string | null, right?: string | null) {
  const leftVariants = phoneVariants(left)
  const rightVariants = phoneVariants(right)
  if (!leftVariants.size || !rightVariants.size) return false

  for (const phone of leftVariants) {
    if (rightVariants.has(phone)) return true
  }

  return false
}
