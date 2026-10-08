import * as React from 'react'
import { Button, type ButtonProps } from './ui/button'

/**
 * A card repeats, so its footer action is the compact, quiet button: a
 * `<Button>` with no `size` or `variant` of its own gets `sm` and `secondary`.
 * One it names is kept. Fragments are looked through; a button wrapped in
 * something else (a tooltip, a menu trigger) is left as written.
 */
function withFooterDefaults(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    if (child.type === React.Fragment) {
      return withFooterDefaults((child.props as { children?: React.ReactNode }).children)
    }
    if (child.type !== Button) return child
    const { size, variant } = child.props as ButtonProps
    return React.cloneElement(child as React.ReactElement<ButtonProps>, {
      size: size ?? 'sm',
      variant: variant ?? 'secondary',
    })
  })
}

/**
 * The right-hand part of a card's footer strip, wrapped so that whatever is
 * passed in stays inside the card and stays the size of its label.
 *
 * The slot never grows (`flex-initial`), so it is as wide as its content and
 * `className='w-full'` on a button in it means that same width: a footer
 * action cannot stretch into a bar across the card. `ml-auto` keeps it at the
 * right, and because the strip is a wrapping row, a label that does not fit
 * beside the contact links moves onto its own line.
 */
export function CardFooterSlot({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot='card-footer-actions'
      className='ml-auto flex min-w-0 flex-initial flex-wrap items-center justify-end gap-2'
    >
      {withFooterDefaults(children)}
    </div>
  )
}
