import * as React from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'
import { IconTile } from './surfaces'
import { Button } from './ui/button'

export interface MethodPoint {
  /** The figure for this step or source: a count, a share. */
  value?: React.ReactNode
  /** One to four words naming it. */
  label: React.ReactNode
  /** A sentence under the label. Leave it off in a `flow` so the trail stays one line. */
  detail?: React.ReactNode
}

export interface MethodNoteProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** Names the note: `How this list was built`. */
  title: React.ReactNode
  /** One sentence: the method in brief. */
  summary?: React.ReactNode
  /** A lucide icon for the head of the note; pass it bare. */
  icon?: React.ReactNode
  /** The steps the data went through, or the sources it came from. */
  points?: readonly MethodPoint[]
  /**
   * Draws the points as a sequence, with an arrow from each to the next:
   * rows returned, then distinct, then kept. Without it they are parallel
   * sources set side by side.
   */
  flow?: boolean
  /** The label on the switch that opens the full account. */
  detailsLabel?: string
  /** The full account, closed until asked for. */
  children?: React.ReactNode
}

/**
 * Where a screen's data came from, as figures instead of a paragraph: the
 * steps a list was narrowed by, or the sources it was drawn from. The prose
 * goes in `children`, closed until asked for.
 *
 * A caveat or a warning is still a `<Callout>`. This is the method.
 *
 *   <MethodNote
 *     title='How this list was built'
 *     summary='Six LinkedIn searches, narrowed to buyers complaining.'
 *     flow
 *     points={[
 *       { value: 300, label: 'rows returned' },
 *       { value: 264, label: 'distinct posts' },
 *       { value: 20, label: 'kept by hand' },
 *     ]}
 *   >
 *     Posts written by people who work at those vendors were dropped.
 *   </MethodNote>
 */
export function MethodNote({
  title,
  summary,
  icon,
  points,
  flow = false,
  detailsLabel = 'Full method',
  className,
  children,
  ...props
}: MethodNoteProps) {
  const [open, setOpen] = React.useState(false)
  const detailsId = React.useId()
  const hasDetails = children != null && children !== false

  return (
    <section
      data-slot='method-note'
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-well p-4',
        className
      )}
      {...props}
    >
      <div className='flex flex-wrap items-start gap-x-4 gap-y-2'>
        <div className='flex min-w-0 flex-[1_1_16rem] items-center gap-3'>
          {icon != null && <IconTile className='size-12 rounded-lg [&_svg]:size-5'>{icon}</IconTile>}
          <div className='flex min-w-0 flex-col'>
            <h2 className='text-card-title text-text-primary'>{title}</h2>
            {summary != null && <p className='text-body text-text-secondary'>{summary}</p>}
          </div>
        </div>
        {hasDetails && (
          <Button
            variant='quiet'
            size='sm'
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((o) => !o)}
          >
            {detailsLabel}
            <ChevronDown aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
          </Button>
        )}
      </div>

      {points != null && points.length > 0 && (
        <ol
          data-slot='method-points'
          className={cn(
            flow
              ? 'flex flex-wrap items-center gap-x-3 gap-y-3'
              : 'grid gap-2 sm:grid-flow-col sm:auto-cols-fr'
          )}
        >
          {points.map((p, i) => (
            <li key={i} className={cn('flex min-w-0', flow && 'items-center gap-3')}>
              {flow && i > 0 && (
                <ArrowRight aria-hidden className='size-4 shrink-0 text-text-muted' />
              )}
              {/* Both layouts set a point on the same small sheet: the figure
                  and its label on one baseline. A source also carries its
                  sentence underneath, and the sheets share a row's height. */}
              <div
                className={cn(
                  'flex min-w-0 rounded-lg bg-surface-card shadow-[var(--shadow-card)]',
                  flow ? 'items-baseline gap-2 px-3 py-2' : 'flex-1 flex-col gap-1.5 p-3'
                )}
              >
                <span className='flex min-w-0 items-baseline gap-2'>
                  {p.value != null && (
                    <span
                      className={cn(
                        'tabular-nums text-text-primary',
                        flow ? 'text-section' : 'text-page-title leading-none'
                      )}
                    >
                      {p.value}
                    </span>
                  )}
                  <span className={cn(flow ? 'text-meta text-text-secondary' : 'text-name text-text-primary')}>
                    {p.label}
                  </span>
                </span>
                {p.detail != null && (
                  <span className='text-body text-text-secondary'>{p.detail}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {hasDetails && (
        <div
          id={detailsId}
          hidden={!open}
          className='text-body border-t border-border-subtle pt-3 text-text-secondary'
        >
          <div className='max-w-3xl'>{children}</div>
        </div>
      )}
    </section>
  )
}
