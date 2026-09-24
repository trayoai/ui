import * as React from 'react'
import { cn } from '../lib/cn'
import { useTrayoUI } from '../lib/config'
import { logoCandidates } from '../lib/brand-image'
import { initials } from '../lib/initials'

export const LOGO_SIZES = {
  xs: 'size-5 rounded-[5px] text-[9px]',
  sm: 'size-6 rounded-[6px] text-[10px]',
  md: 'size-8 rounded-md text-xs',
  lg: 'size-10 rounded-lg text-sm',
  xl: 'size-14 rounded-xl text-lg',
  '2xl': 'size-20 rounded-2xl text-2xl',
} as const

export type LogoSize = keyof typeof LOGO_SIZES

export interface CompanyLogoProps {
  /** Company name — `alt` text, and the initials shown if no logo resolves. */
  name: string
  /**
   * Company domain or website. This is all the component needs: it builds the
   * Trayo logo-proxy URL itself (`/api/brand-image?domain=…`).
   */
  domain?: string | null
  /** An explicit logo URL, e.g. the `logoUrl` a Trayo `/v1` account publishes. */
  logoUrl?: string | null
  size?: LogoSize
  className?: string
  /** Circular instead of the default squared tile. */
  shape?: 'rounded' | 'circle'
}

/**
 * A company's logo, resolved from its domain.
 *
 * Tries each candidate in turn (an explicit upload, then Trayo's public logo
 * proxy) and lands on a warm initials tile when a company simply has no mark.
 * Pass `domain` and nothing else — that is the common case.
 */
export function CompanyLogo({
  name,
  domain,
  logoUrl,
  size = 'md',
  className,
  shape = 'rounded',
}: CompanyLogoProps) {
  const { brandImageOrigin } = useTrayoUI()
  const candidates = React.useMemo(
    () => logoCandidates({ logoUrl, domain }, brandImageOrigin),
    [logoUrl, domain, brandImageOrigin]
  )
  const [failed, setFailed] = React.useState(0)
  // Track the URL that actually fired `onLoad` rather than a boolean, so a
  // candidate swap can't leave a stale "loaded" state behind.
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null)
  React.useEffect(() => setFailed(0), [candidates])

  const src = candidates[failed]
  const loaded = !!src && loadedSrc === src
  const radius = shape === 'circle' ? 'rounded-full' : undefined

  return (
    <span
      data-slot='company-logo'
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        'bg-[var(--color-avatar-fallback)] font-heading font-bold text-white',
        LOGO_SIZES[size],
        radius,
        className
      )}
    >
      {/* Initials sit underneath so there is never an empty box mid-load, and
          they stay the accessible content until a real logo has painted. */}
      <span aria-hidden={loaded} className='leading-none select-none'>
        {initials(name)}
      </span>
      {src && (
        <img
          key={src}
          src={src}
          alt={name}
          aria-hidden={!loaded}
          loading='lazy'
          decoding='async'
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailed((c) => c + 1)}
          className={cn(
            'absolute inset-0 size-full bg-white object-contain',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </span>
  )
}
