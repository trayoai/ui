import * as React from 'react'
import { Button, type ButtonProps } from './ui/button'
import { DropdownMenuContent } from './ui/dropdown-menu'
import { PopoverContent } from './ui/popover'
import { TooltipContent } from './ui/tooltip'

/**
 * Overlay bodies: a button written inside one is that overlay's own control,
 * not the footer's action, so the defaults stop here.
 */
const OVERLAY_CONTENT: unknown[] = [TooltipContent, PopoverContent, DropdownMenuContent]

/**
 * A card repeats, so its footer action is the compact, quiet button: a
 * `<Button>` with no `size` or `variant` of its own gets `sm` and `secondary`.
 * One it names is kept.
 *
 * Every `<Button>` written in the footer is found, however it is wrapped (a
 * fragment, a tooltip or menu trigger, a layout div). One that only exists
 * inside another component (`footer={<MyButton />}`) cannot be seen from
 * here; that component passes `size='sm' variant='secondary'` itself.
 *
 * The shape of `children` is kept, a single element staying a single element,
 * because an `asChild` trigger accepts exactly one.
 */
function withFooterDefaults(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(withFooterDefaults)
  if (!React.isValidElement(node)) return node
  if (node.type === Button) {
    const { size, variant } = node.props as ButtonProps
    return React.cloneElement(node as React.ReactElement<ButtonProps>, {
      size: size ?? 'sm',
      variant: variant ?? 'secondary',
    })
  }
  if (OVERLAY_CONTENT.includes(node.type)) return node
  const { children } = node.props as { children?: React.ReactNode }
  // Nothing to look into, or a render prop.
  if (children == null || typeof children === 'function') return node
  // Several children go back as separate arguments, as JSX passes them, so
  // React does not ask for keys on them.
  const walked = withFooterDefaults(children)
  return React.cloneElement(node, undefined, ...(Array.isArray(walked) ? walked : [walked]))
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
