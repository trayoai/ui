import * as React from 'react'
import { cn } from '../lib/cn'

export interface EntityListProps extends React.ComponentProps<'ul'> {
  /** A hairline between rows. On by default; turn it off for a short, loose list. */
  divided?: boolean
}

/**
 * A vertical list of `<Person>` or `<Company>` rows, with the spacing between
 * them built in: 10px above and below each row and a hairline between rows.
 *
 * The rows have no vertical padding of their own (they also sit in table
 * cells and card headers, where it would push things out of line), so a
 * hand-spaced stack is easy to get wrong: with a small gap the 40px avatars
 * all but touch. Put the rows in here instead.
 *
 *   <EntityList>
 *     {people.map((p) => <Person key={p.id} person={p} showContact />)}
 *   </EntityList>
 *
 * The first row has no padding above it and the last none below, so the list
 * sits flush in whatever holds it — a `<Surface>`, a dialog body, a card.
 */
export function EntityList({ divided = true, className, children, ...props }: EntityListProps) {
  return (
    <ul
      data-slot='entity-list'
      className={cn('flex min-w-0 flex-col', divided && 'divide-y divide-border-subtle', className)}
      {...props}
    >
      {React.Children.toArray(children).map((child, i) => (
        <li
          key={React.isValidElement(child) && child.key != null ? child.key : i}
          data-slot='entity-list-item'
          className='min-w-0 py-2.5 first:pt-0 last:pb-0'
        >
          {child}
        </li>
      ))}
    </ul>
  )
}
