// api/_lib/rateLimit.ts
//
// Small, best-effort in-memory rate limiter shared by the new auth
// endpoints (resend-verification, request-password-reset). Resets on
// cold start — enough to stop casual abuse/spam, not a hard guarantee
// across all instances. (api/gitter.ts and api/reviews.ts have their
// own copies of this same idea predating this file — left as-is to
// avoid touching working code.)

const buckets = new Map<string, number[]>()

export function isRateLimited(key: string, windowMs: number, maxHits: number): boolean {
  const now = Date.now()
  const timestamps = (buckets.get(key) || []).filter(t => now - t < windowMs)
  timestamps.push(now)
  buckets.set(key, timestamps)
  if (buckets.size > 5000) buckets.clear()
  return timestamps.length > maxHits
}
