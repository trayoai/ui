import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './button'
import { useHiddenColumns } from './use-hidden-columns'

/**
 * Horizontal scroll container plus the hidden-column overflow affordance
 * (per-edge fade + clickable `N more` badge), around ANY table markup.
 *
 * `Table` uses this for the shared primitive; surfaces that render bespoke
 * table markup (the Home `.htbl` tables, TRA-1428) wrap that markup directly.
 * Give the child table a `min-width` floor, otherwise flexible columns collapse
 * instead of overflowing and the affordance has nothing to count.
 *
 * `className` styles the SCROLLER; `rootClassName` styles the non-scrolling
 * anchor. Keep any vertical scroll on the scroller (pass `overflow-y-auto` via
 * `className`) so a sticky header keeps working off a single scroll parent.
 */
function TableScrollRegion({
  className,
  rootClassName,
  hideOverflowBadge = false,
  ariaLabel = 'Table, scrollable',
  onScrollerChange,
  children,
  ...props
  // `ref` is deliberately NOT forwardable: the scroller's ref is owned by
  // `useHiddenColumns`, and because `props` is spread LAST a consumer-supplied
  // ref would overwrite it — leaving `scrollRef.current` null, so the counts
  // stay 0 and the fades, the `N more` badge, `tabIndex` and `role="region"`
  // all silently disappear. Omitting it turns that into a type error.
}: Omit<React.ComponentProps<'div'>, 'ref'> & {
  rootClassName?: string
  hideOverflowBadge?: boolean
  ariaLabel?: string
  onScrollerChange?: (node: HTMLDivElement | null) => void
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const onScrollerChangeRef = React.useRef(onScrollerChange)
  onScrollerChangeRef.current = onScrollerChange
  const setScrollRef = React.useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
    onScrollerChangeRef.current?.(node)
  }, [])
  const { leftCount, rightCount, headerHeight, scrollBySide } = useHiddenColumns(scrollRef)
  const isOverflowing = leftCount > 0 || rightCount > 0
  return (
    // Non-scrolling positioning context: the affordance must be pinned to the
    // VISIBLE edge, so it is a sibling of the scroll container, not a child of
    // it (a child of the overflow-x-auto div would scroll away with content).
    <div data-slot='table-scroll-region' className={cn('relative', rootClassName)}>
      <div
        ref={setScrollRef}
        data-slot='table-container'
        // `overflow-x-auto` scrolls wide tables horizontally.
        className={cn('w-full overflow-x-auto', className)}
        // When the table overflows horizontally it becomes a scrollable region;
        // make it keyboard-focusable so arrow keys can scroll it (axe
        // `scrollable-region-focusable`). No tab stop when it fits.
        tabIndex={isOverflowing ? 0 : undefined}
        role={isOverflowing ? 'region' : undefined}
        aria-label={isOverflowing ? ariaLabel : undefined}
        {...props}
      >
        {children}
      </div>
      {!hideOverflowBadge && (
        <>
          <TableOverflowAffordance
            side='left'
            count={leftCount}
            headerHeight={headerHeight}
            onReveal={() => scrollBySide('left')}
          />
          <TableOverflowAffordance
            side='right'
            count={rightCount}
            headerHeight={headerHeight}
            onReveal={() => scrollBySide('right')}
          />
        </>
      )}
    </div>
  )
}

// Per-edge overflow affordance: a full-height surface→transparent fade plus a
// clickable count badge pinned to the HEADER ROW (centered on `headerHeight`).
// Renders only when its side has clipped columns. An arrow icon points toward
// the hidden columns — trailing on the right, leading on the left. Tokens only
// (no hex): fade uses the `surface-card` table background; the badge is the
// shared neutral (tertiary) Button, lifted with `bg-surface-popover shadow-sm`
// so it reads as a pill floating above the header band in BOTH themes. The
// fill is the raised surface, not `surface-card`: light gets its lift from the
// shadow (white vs card is a wash), but a black shadow is invisible on dark
// surfaces, where elevation is a LIGHTER fill. Card on the dark `surface-well`
// header band is 1.19:1 and the pill all but vanished; raised is 1.70:1. The
// label is `text-primary` for the same reason — secondary greyed it into the
// band.
function TableOverflowAffordance({
  side,
  count,
  headerHeight,
  onReveal,
}: {
  side: 'left' | 'right'
  count: number
  headerHeight: number
  onReveal: () => void
}) {
  if (count <= 0) return null
  const isRight = side === 'right'
  const fadeCls = isRight
    ? 'right-0 bg-gradient-to-l from-surface-card to-transparent'
    : 'left-0 bg-gradient-to-r from-surface-card to-transparent'
  const badgeCls = isRight ? 'right-2' : 'left-2'
  // Center the pill on the header row via `top` arithmetic (header midline minus
  // half the pill's 24px height). Falls back to `top-2` (≈40px header) until the
  // height is measured.
  const badgeStyle = headerHeight > 0 ? { top: headerHeight / 2 - 12 } : undefined
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 w-12 transition-opacity',
          fadeCls,
        )}
      />
      <Button
        type='button'
        variant='tertiary'
        size='sm'
        onClick={onReveal}
        data-testid={isRight ? 'table-overflow-badge-right' : 'table-overflow-badge-left'}
        style={badgeStyle}
        className={cn(
          // 12px bold label (text-xs font-bold) on a short pill (h-6, vs the sm
          // default h-8) — a compact overflow affordance. `z-30` keeps it above
          // the header cells. Centered via `top` (badgeStyle); fallback `top-2`
          // until the header height is measured.
          'absolute top-2 z-30 h-6 gap-1 bg-surface-popover text-xs font-bold text-text-primary shadow-sm transition-colors',
          // The variant's hover fill is `surface-well` — the header band's own
          // colour, so a hovered pill sank into it. Hover stays a raised step.
          'hover:bg-surface-hover',
          badgeCls,
        )}
      >
        {isRight ? (
          <>
            {count} more <ArrowRight />
          </>
        ) : (
          <>
            <ArrowLeft /> {count} more
          </>
        )}
      </Button>
    </>
  )
}

export { TableScrollRegion }
