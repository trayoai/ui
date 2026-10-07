import * as React from 'react'

/**
 * The right-hand part of a card's footer strip, wrapped so that whatever is
 * passed in stays inside the card.
 *
 * A `<Button>` cannot shrink, so `className='w-full'` on one placed straight
 * into the strip makes it as wide as the whole strip and pushes it out past
 * the contact links. In here `w-full` means the space left beside them.
 * `flex-auto` starts the slot at its content width, which is what lets the
 * strip (a wrapping row) move a label that does not fit onto its own line.
 */
export function CardFooterSlot({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot='card-footer-actions'
      className='flex min-w-0 flex-auto flex-wrap items-center justify-end gap-2'
    >
      {children}
    </div>
  )
}
