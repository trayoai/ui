import * as React from 'react'
import { Badge } from './ui/badge'

/** Tags a card shows before it counts the rest. */
const MAX_CARD_TAGS = 3

/**
 * The paragraph under a card's identity block. A card is a glance, so it holds
 * three lines; a longer string keeps its full text in the tooltip.
 */
export function CardSummary({ children }: { children: React.ReactNode }) {
  return (
    <p
      className='text-body line-clamp-3 text-text-secondary'
      title={typeof children === 'string' ? children : undefined}
    >
      {children}
    </p>
  )
}

/** A card's tags: the first three, then a count of the rest. */
export function CardTags({ tags }: { tags: string[] }) {
  const rest = tags.slice(MAX_CARD_TAGS)
  return (
    <div className='flex flex-wrap gap-1.5'>
      {tags.slice(0, MAX_CARD_TAGS).map((t) => (
        <Badge key={t} variant='soft'>
          {t}
        </Badge>
      ))}
      {rest.length > 0 && (
        <Badge variant='soft' title={rest.join(', ')}>
          +{rest.length}
        </Badge>
      )}
    </div>
  )
}
