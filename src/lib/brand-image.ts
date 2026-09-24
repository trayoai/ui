/**
 * Company-logo resolution.
 *
 * Trayo runs a public logo proxy at `GET /api/brand-image?domain=acme.com`
 * (logo.dev first, favicon chain as its internal fallback). It needs no API
 * key, is rate-limited per caller, and is the same path the Trayo app itself
 * uses — which is why `/v1` accounts publish their `logoUrl` pointing at it.
 */

/** Strip scheme / path / `www.` so `https://www.acme.com/about` → `acme.com`. */
export function normalizeDomain(domainOrUrl?: string | null): string | null {
  if (!domainOrUrl) return null
  const trimmed = domainOrUrl.trim().toLowerCase()
  if (!trimmed) return null
  const host = trimmed
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('@')
    .pop()
  if (!host || !host.includes('.')) return null
  return host
}

export function brandImageUrl(
  domainOrUrl: string | null | undefined,
  origin: string
): string | null {
  const domain = normalizeDomain(domainOrUrl)
  if (!domain) return null
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin
  return `${base}/api/brand-image?domain=${encodeURIComponent(domain)}`
}

/**
 * Ordered logo candidates, each the `onError` fallback of the one before it.
 * An explicitly-supplied `logoUrl` that is NOT itself a resolved favicon wins
 * over the proxy (it is a deliberate upload); otherwise the proxy leads.
 */
export function logoCandidates(
  { logoUrl, domain }: { logoUrl?: string | null; domain?: string | null },
  origin: string
): string[] {
  const proxy = brandImageUrl(domain, origin)
  const stored = logoUrl || null
  const storedIsAutoFavicon =
    !!stored && /favicons?|s2\/favicons|\/favicon\.ico|brand-image/.test(stored)
  const ordered =
    stored && !storedIsAutoFavicon ? [stored, proxy] : [proxy, stored]
  return ordered.filter((s): s is string => !!s)
}
