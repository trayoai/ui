/**
 * The toolbar control pill — single source of truth for the rounded trigger
 * shell shared by filter popovers and the Select dropdown trigger. Both compose
 * these classes, so restyling the pill here restyles every dropdown and filter
 * together.
 *
 * 32px pill, 12px semibold label, surface-card on
 * a subtle border; hover raises the border + fills with surface-well.
 */
export const controlPillShell =
  'flex h-8 w-auto items-center gap-2 rounded-full border bg-surface-card px-3.5 text-xs font-semibold whitespace-nowrap transition-all hover:border-border-strong hover:bg-surface-well'

/**
 * Form-density override — relax the toolbar pill to h-9 / text-sm / normal weight
 * so it lines up with `Input` (h-9) when a dropdown is used as a labelled form
 * field instead of a toolbar pill. This is the SAME step the Select trigger's
 * `default` size applies (ui/select.tsx); compose it AFTER `controlPillShell`
 * (twMerge resolves the h-8→h-9 / text-xs→text-sm overrides).
 */
export const controlPillFormSize = 'h-9 text-sm font-normal'

/** Selected/active state — border emphasis only; the pill itself stays put. */
export const controlPillActive = 'border-border-strong shadow-sm'

/** Idle state. */
export const controlPillIdle = 'border-border-subtle'

/* ------------------------------------------------------ segmented control */

/**
 * The segmented-control track: the same pill geometry as `controlPillShell`,
 * recessed one step (the `--seg-track` tokens) so the raised active segment
 * has something to stand up from. Scrolls sideways rather than wrapping when
 * it is too wide for its column — a filter group that wraps loses its meaning.
 */
export const segmentTrack =
  'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-seg-track-line bg-seg-track p-0.5'

/** One segment: a pill-shaped control label (`text-sm font-medium`, per the type rules). */
export const segmentItem =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'

/** Segment heights: `default` fits the 32px `controlPillShell` track; `sm` a 28px one. */
export const segmentItemSize = {
  default: 'h-7 px-3 text-sm',
  sm: 'h-6 px-2.5 text-xs',
} as const

/** The active segment, raised on the thumb surface with the segment shadow. */
export const segmentItemActive =
  'bg-seg-thumb text-text-primary shadow-[var(--shadow-seg-active)]'

/** An idle segment — a quiet label that brightens on hover. */
export const segmentItemIdle = 'text-seg-text-idle hover:text-text-primary'
