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
