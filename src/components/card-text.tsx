'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'

const MAX_CARD_TAGS = 3

/** A text button at the end of a card's summary: "More" / "Less". */
const TOGGLE =
  'cursor-pointer rounded-sm text-xs font-medium text-accent-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * The paragraph under a card's identity block. A card is a glance, so it holds
 * three lines; when the text is longer than that, a "More" button opens it in
 * place. A button, not a tooltip: it works from the keyboard and on touch, and
 * for a formatted summary as well as a string.
 */
export function CardSummary({ children }: { children: React.ReactNode }) {
  const id = React.useId()
  const ref = React.useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = React.useState(false)
  const [cut, setCut] = React.useState(false)

  // Measured while clamped, and again whenever the card changes width.
  React.useLayoutEffect(() => {
    const p = ref.current
    if (!p || open) return
    const measure = () => setCut(p.scrollHeight > p.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(p)
    return () => observer.disconnect()
  }, [open, children])

  return (
    <div className='flex min-w-0 flex-col items-start gap-1'>
      <p ref={ref} id={id} className={cn('text-body text-text-secondary', !open && 'line-clamp-3')}>
        {children}
      </p>
      {(cut || open) && (
        <button
          type='button'
          className={TOGGLE}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Less' : 'More'}
        </button>
      )}
    </div>
  )
}

/**
 * A card's tags: the first three, then a count of the rest. The count is a
 * button that shows them in the same row.
 */
export function CardTags({ tags }: { tags: string[] }) {
  const [open, setOpen] = React.useState(false)
  const rest = tags.length - MAX_CARD_TAGS
  // The `count` badge (soft accent fill, accent text) so it reads as the
  // one thing in the row to press, not as a fourth tag.
  const toggle =
    'cursor-pointer hover:border-accent-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  return (
    <div className='flex flex-wrap gap-1.5'>
      {(open ? tags : tags.slice(0, MAX_CARD_TAGS)).map((t) => (
        <Badge key={t} variant='soft'>
          {t}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge asChild variant='count' className={toggle}>
          <button
            type='button'
            aria-expanded={open}
            aria-label={open ? 'Show fewer tags' : `Show ${rest} more tags`}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Less' : `+${rest}`}
          </button>
        </Badge>
      )}
    </div>
  )
}
