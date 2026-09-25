import * as React from 'react'

import { cn } from '../../lib/cn'
import { XIcon } from 'lucide-react'
import { Badge } from './badge'

export interface TagChipProps
  extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The tag text. */
  label: string
  /** When provided, renders a trailing remove (×) button. */
  onRemove?: () => void
  /** Disables the remove button. */
  disabled?: boolean
}

/**
 * Generic neutral tag chip. A tag's color carries no meaning, so all
 * tags share one calm neutral surface — close to the filter controls — rather
 * than a per-label color ramp. Composes the Badge primitive with an optional
 * inline remove button.
 */
export function TagChip({
  label,
  onRemove,
  disabled = false,
  className,
  ...props
}: TagChipProps) {
  return (
    <Badge
      // variant='outline' keeps Badge's structure (layout, padding, text size)
      // without its color; the chip's own neutral surface tone takes over.
      variant='outline'
      className={cn(
        'rounded-full border-border-subtle bg-surface-well pl-2.5 font-medium text-text-secondary',
        onRemove && 'pr-1',
        className,
      )}
      {...props}
    >
      {label}
      {onRemove && (
        <button
          type='button'
          aria-label={`Remove ${label}`}
          disabled={disabled}
          // onMouseDown preventDefault keeps focus in an adjacent input (so the
          // chip stays inside a focused tag field) while still firing onClick.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          className='grid size-4 place-items-center rounded-full opacity-60 transition [&>svg]:size-2.5 hover:bg-black/10 hover:opacity-100 disabled:pointer-events-none dark:hover:bg-white/15'
        >
          <XIcon />
        </button>
      )}
    </Badge>
  )
}
