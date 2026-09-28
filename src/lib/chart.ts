/**
 * Chart colours for inline SVG props, where a Tailwind class cannot be used.
 *
 *   <rect fill={chartColor(i)} />
 *   <circle fill={CHART_SEQUENTIAL[3]} />
 *   <circle fill={CHART_MUTED} />          // outside ICP / not tracked / other
 *
 * Every value is a `var(--chart-…)` reference, so the mark flips with the
 * theme like every other token. Where you CAN use a class, do: `fill-chart-1`,
 * `stroke-chart-2`, `bg-chart-seq-4`, `bg-chart-muted`.
 *
 * The palette itself (values, contrast, CVD checks) is documented in
 * `styles/tokens.css` under CHART PALETTE. Never write a hex colour in a chart.
 */

/**
 * The categorical palette, in its fixed order: brand violet, teal, amber,
 * rose, blue. Assign series in sequence and keep the assignment stable —
 * colour follows the entity, not its rank, so a filter that removes series
 * must not repaint the survivors. Five is the ceiling; a sixth series folds
 * into "Other" (`CHART_MUTED`). For bubble, scatter and treemap — where ANY
 * two marks can sit side by side — only the first three are guaranteed apart
 * under colour-vision deficiency; keep those forms to three series.
 */
export const CHART_COLORS: readonly string[] = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/**
 * The sequential ramp — one hue, monotone lightness, index 0 = least,
 * 4 = most. For MAGNITUDE (momentum, score, density, intensity), never for
 * identity. Light runs pale → deep; dark runs dim → bright. Both ends still
 * read as a mark against the card.
 */
export const CHART_SEQUENTIAL: readonly string[] = [
  'var(--chart-seq-1)',
  'var(--chart-seq-2)',
  'var(--chart-seq-3)',
  'var(--chart-seq-4)',
  'var(--chart-seq-5)',
]

/** The one neutral fill: "outside ICP", "not tracked", "other". */
export const CHART_MUTED = 'var(--chart-muted)'

/**
 * The categorical colour for series `index`, cycling past the end so a loop
 * over an unknown number of series never reads `undefined`. Cycling is a
 * SAFETY NET, not a design: two series sharing a colour is a chart that needs
 * fewer series, so fold the tail into "Other" before you reach it.
 */
export function chartColor(index: number): string {
  const n = CHART_COLORS.length
  return CHART_COLORS[((Math.trunc(index) % n) + n) % n]
}

/**
 * The sequential step for a value in `[0, 1]` (clamped): 0 → the weakest
 * step, 1 → the strongest. `NaN`/`null` is not a step — pass those through
 * `CHART_MUTED` yourself so "unknown" never reads as "low".
 */
export function chartSequential(t: number): string {
  const n = CHART_SEQUENTIAL.length
  const clamped = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0))
  return CHART_SEQUENTIAL[Math.min(n - 1, Math.floor(clamped * n))]
}
