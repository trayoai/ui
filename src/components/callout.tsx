import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * A note box: the panel that explains a screen rather than being the screen.
 * "How this board was built", "Read this before you trust the numbers",
 * "Coverage is incomplete by design", "Target met: 81 accounts cleared the
 * bar". Every GTM tool ends up needing one, and hand-building it from
 * `Surface` + `SectionLabel` + `Body` gives each one a slightly different
 * shape — this is that shape, once.
 *
 * Sits one step down the surface ladder (a well, not a card), so it can live
 * inside a `Surface` or directly on the page. The tone tints the panel and the
 * eyebrow together; the body copy stays secondary text in every tone so a
 * warning reads as a note with a coloured frame, not as a wall of amber.
 */

export type CalloutTone = 'note' | 'info' | 'success' | 'warning' | 'destructive'

export interface CalloutProps
  extends Omit<React.ComponentProps<'div'>, 'title'> {
  /**
   * `note` (default) is the neutral well tint — method notes, caveats, data
   * limits. `info` is accent-tinted for something worth noticing. `success`,
   * `warning` and `destructive` are the status tints; `destructive` also
   * announces itself (`role="alert"`).
   */
  tone?: CalloutTone
  /** The eyebrow above the body — a short label, not a sentence. */
  title?: React.ReactNode
  /** A lucide icon. The component sizes and colours it; pass it bare. */
  icon?: React.ReactNode
  /** A trailing link or button, right-aligned. One, not a toolbar. */
  action?: React.ReactNode
  /**
   * Single-line density for an inline notice: title and body share a line,
   * padding tightens, the action centres. Keep the body to one clause.
   */
  compact?: boolean
}

/* Each tone is a panel (border + fill), a colour for the eyebrow, and a colour
   for the icon. Built from the status token triples so they flip theme. The
   destructive tint has no soft/line pair, so it borrows the badge's opacity
   trick on the one `destructive` colour. */
const TONE: Record<CalloutTone, { panel: string; title: string; icon: string }> = {
  note: {
    panel: 'border-border-subtle bg-surface-well',
    title: 'text-accent-text',
    icon: 'text-text-muted',
  },
  info: {
    panel: 'border-accent-line bg-accent-soft',
    title: 'text-accent-text',
    icon: 'text-accent-text',
  },
  success: {
    panel: 'border-success-line bg-success-soft',
    title: 'text-success-text',
    icon: 'text-success-text',
  },
  warning: {
    panel: 'border-warning-line bg-warning-soft',
    title: 'text-warning-text',
    icon: 'text-warning-text',
  },
  destructive: {
    panel: 'border-destructive/40 bg-destructive/10',
    title: 'text-destructive',
    icon: 'text-destructive',
  },
}

/**
 * An explanatory note, caveat or status panel. Give it a short `title`, one
 * to three lines of body copy as children, and at most one `action`.
 *
 * ```tsx
 * <Callout title="How this was built" action={<a href="/method">Full method</a>}>
 *   Every row came back from the Trayo API; nothing here is hand-typed.
 * </Callout>
 * <Callout tone="warning" icon={<AlertTriangle />} title="Post coverage is incomplete">
 *   Only public posts from the last 30 days were read.
 * </Callout>
 * ```
 */
export function Callout({
  tone = 'note',
  title,
  icon,
  action,
  compact = false,
  role,
  className,
  children,
  ...props
}: CalloutProps) {
  const t = TONE[tone]
  return (
    <div
      data-slot='callout'
      data-tone={tone}
      role={role ?? (tone === 'destructive' ? 'alert' : 'note')}
      className={cn(
        // `isolate overflow-hidden` keeps the texture layer inside the panel.
        'relative isolate flex flex-wrap gap-x-3 gap-y-2 overflow-hidden rounded-lg border',
        compact ? 'items-center px-3 py-2' : 'items-start p-3',
        t.panel,
        className
      )}
      {...props}
    >
      {/* The website cards' diagonal texture, in the tone's own colour: fine
          lines that fade in toward the bottom-right corner. */}
      <span
        aria-hidden
        className={cn('diagonal-fade pointer-events-none absolute inset-0 -z-10', t.icon)}
      />
      {/* Icon and text wrap as one unit, and ask for 16rem before the action
          may share their line: in a narrow column a `shrink-0` action beside
          the text took a third of the panel and left the copy a few words
          wide. Growing, this group is also what pushes the action right. */}
      <div className={cn('flex min-w-0 flex-[1_1_16rem] gap-3', compact ? 'items-center' : 'items-start')}>
        {icon && (
          <span
            aria-hidden
            className={cn(
              'flex shrink-0 items-center [&_svg]:size-4',
              // The eyebrow's 18px line box: nudge the 16px glyph onto it.
              !compact && 'mt-px',
              t.icon
            )}
          >
            {icon}
          </span>
        )}
        <div
          className={cn(
            'flex min-w-0 flex-1',
            compact
              ? 'flex-row flex-wrap items-baseline gap-x-2 gap-y-0'
              : 'flex-col gap-1'
          )}
        >
          {title != null && (
            <span className={cn('text-eyebrow shrink-0', t.title)}>{title}</span>
          )}
          {children != null && (
            <div className='text-body min-w-0 text-text-secondary [&_a]:text-accent-text [&_a]:underline-offset-4 [&_a:hover]:underline'>
              {children}
            </div>
          )}
        </div>
      </div>
      {action && (
        <div className={cn('flex max-w-full shrink-0 items-center', !compact && 'self-start')}>
          {action}
        </div>
      )}
    </div>
  )
}
