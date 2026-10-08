import * as React from 'react'
import { cn } from '../lib/cn'
import { useTrayoUI } from '../lib/config'
import { logoCandidates } from '../lib/brand-image'
import { initials } from '../lib/initials'

export const LOGO_SIZES = {
  // Sits inside a line of meta text (the company mark under a person's name).
  '2xs': 'size-4 rounded-[4px] text-[7px]',
  xs: 'size-5 rounded-[5px] text-[9px]',
  sm: 'size-7 rounded-[7px] text-[11px]',
  md: 'size-9 rounded-md text-xs',
  lg: 'size-12 rounded-lg text-base',
  xl: 'size-16 rounded-xl text-xl',
  '2xl': 'size-24 rounded-2xl text-3xl',
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

  // An image can finish loading BEFORE React attaches `onLoad` — served from
  // cache, or already complete by the time a server-rendered island hydrates.
  // React does not replay the event, so without this the logo sits at opacity 0
  // behind the initials forever, even though the bytes arrived fine.
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  React.useEffect(() => {
    const el = imgRef.current
    if (el?.complete && el.naturalWidth > 0) setLoadedSrc(el.getAttribute('src'))
  }, [src])
  const loaded = !!src && loadedSrc === src
  const radius = shape === 'circle' ? 'rounded-full' : undefined

  return (
    <span
      data-slot='company-logo'
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        'font-heading font-bold text-white',
        // The fallback fill is dropped once a logo has painted. Left in place
        // it sits under the logo as a second layer with the same rounded
        // edge, and the two anti-aliased edges do not cancel: a hairline of
        // the light fallback colour shows around the corners, most visibly as
        // pale flecks on a dark logo in dark mode.
        loaded ? 'bg-transparent' : 'bg-[var(--color-avatar-fallback)]',
        LOGO_SIZES[size],
        radius,
        className
      )}
    >
      {/* Initials sit underneath so there is never an empty box mid-load, and
          they stay the accessible content until a real logo has painted. */}
      <span aria-hidden={loaded} className={cn('leading-none select-none', loaded && 'invisible')}>
        {initials(name)}
      </span>
      {src && (
        <img
          key={src}
          ref={imgRef}
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
