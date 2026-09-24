import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/cn'
import { useTrayoUI } from '../lib/config'
import { placeholderFaceUrl } from '../lib/placeholder-faces'

export const AVATAR_SIZES = {
  xs: 'size-5',
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
  xl: 'size-14',
  '2xl': 'size-20',
} as const

export type AvatarSize = keyof typeof AVATAR_SIZES

export interface PersonAvatarProps {
  /** The person's name — used for `alt` text and as the fallback face key. */
  name: string
  /**
   * Photo URL. An upstream URL that refuses to load cross-origin simply fails,
   * and the illustrated fallback face takes over automatically.
   */
  src?: string | null
  /**
   * Trayo person id. Used as the stable key for picking the placeholder face,
   * so the same person always gets the same one. Falls back to `name`.
   */
  personId?: string | null
  size?: AvatarSize
  /** Overlay a green check — "we have reached out to this person". */
  contacted?: boolean
  /** Square-ish tile instead of a circle. Circles are the default for people. */
  shape?: 'circle' | 'rounded'
  className?: string
  onClick?: React.MouseEventHandler<HTMLElement>
}

/**
 * A person's face.
 *
 * Resolution order, which is the whole point of this component:
 *   1. the real photo, if `src` loads
 *   2. one of Trayo's 50 illustrated placeholder FACES, chosen stably from
 *      `personId` (or `name`)
 *
 * It never degrades to initials — a GTM surface built on the Trayo API should
 * always show a face. Use `<TrayoUIProvider personImageProxy={…}>` if you have
 * an image proxy that can make more real photos load.
 */
export function PersonAvatar({
  name,
  src,
  personId,
  size = 'md',
  contacted = false,
  shape = 'circle',
  className,
  onClick,
}: PersonAvatarProps) {
  const { personImageProxy, placeholderFaceBase, isGenericPhoto } = useTrayoUI()
  const [photoFailed, setPhotoFailed] = React.useState(false)
  const [photoLoaded, setPhotoLoaded] = React.useState(false)

  const raw = src && !(isGenericPhoto?.(src) ?? false) ? src : null
  const proxied = raw && personImageProxy ? personImageProxy(raw) : raw
  const photo = photoFailed ? null : proxied || null

  // Reset when the incoming photo changes, so a recycled instance in a
  // virtualized list does not stay stuck on a previous person's failure.
  React.useEffect(() => {
    setPhotoFailed(false)
    setPhotoLoaded(false)
  }, [proxied])

  // A photo is held at opacity 0 until it has actually painted, so a URL that
  // resolves slowly or 404s never flashes the browser's broken-image glyph over
  // the fallback face. As in CompanyLogo, an image can complete BEFORE React
  // attaches onLoad — cached, or already done when a server-rendered island
  // hydrates — and React does not replay it, so check `complete` on mount too.
  const photoRef = React.useRef<HTMLImageElement | null>(null)
  React.useEffect(() => {
    const el = photoRef.current
    if (el?.complete && el.naturalWidth > 0) setPhotoLoaded(true)
  }, [proxied])

  const face = placeholderFaceUrl(personId || name, placeholderFaceBase)
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  return (
    <span
      data-slot='person-avatar'
      className={cn(
        'relative inline-flex shrink-0',
        AVATAR_SIZES[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          'relative flex size-full overflow-hidden bg-surface-well',
          radius
        )}
      >
        {/* The face sits underneath, so a slow or failing photo never leaves a
            blank hole — and a cached photo paints over it within a frame. */}
        <img
          src={face}
          alt={photoLoaded ? '' : name}
          aria-hidden={photoLoaded ? true : undefined}
          loading='lazy'
          decoding='async'
          className='absolute inset-0 size-full object-cover'
        />
        {photo && (
          <img
            ref={photoRef}
            src={photo}
            alt={name}
            aria-hidden={!photoLoaded}
            loading='lazy'
            decoding='async'
            onLoad={() => setPhotoLoaded(true)}
            onError={() => setPhotoFailed(true)}
            className={cn(
              'absolute inset-0 size-full object-cover',
              photoLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
      </span>
      {contacted && (
        <span
          aria-label='Contacted'
          className='absolute -right-0.5 -bottom-0.5 flex size-[42%] min-h-3 min-w-3 items-center justify-center rounded-full bg-[var(--color-emerald-500)] ring-2 ring-surface-card'
        >
          <Check className='size-[62%] text-white' strokeWidth={3} />
        </span>
      )}
    </span>
  )
}
