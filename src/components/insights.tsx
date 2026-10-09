import * as React from 'react'
import { cn } from '../lib/cn'
import { CHART_MUTED, chartColor } from '../lib/chart'
import { ChartLegend } from './chart-legend'
import { Badge } from './ui/badge'
import { CompanyLogo } from './company-logo'
import type { CompanyLike } from './company'
import { IconTile } from './surfaces'

/**
 * Summary blocks: the shapes a screen's numbers take when a row of equal
 * `<StatTile>`s is the wrong fit. Pick by what the numbers are:
 *
 *   one figure that matters, with context   → `<HeroStat>`
 *   a count per period, or one clear leader → `<ColumnChart>`
 *   a count per company the user can pick   → `<BreakdownTiles>`
 *   stages of one pipeline                  → `<Funnel>`
 *   two parts of one whole                  → `<SplitBar>`
 *   a score on a row, against a pass mark   → `<Meter>`
 *   a few plain counts, none the headline   → `<StatBand>`
 *   parts of one whole, in a line           → `<ShareTicks>`
 *   parts of one whole, around a total      → `<ShareRing>`
 *   parts of one whole, with a row each     → `<DistributionList>`
 *   two opposed counts per period           → `<DivergingColumns>`
 *   the trend behind a figure, in a cell    → `<Sparkline>`
 */

/**
 * The bar language `<Progress target>` set: a thin solid bar for the settled
 * number, hatching for the part that is not (the remainder, the plan, the
 * dropped). Every bar in this file is drawn the same way. The hatch takes
 * the element's text colour.
 */
const BAR = 'h-1.5 rounded-full'

/**
 * How the part of a bar that is not the number is drawn. `hatched` (the
 * default) is the `<Progress target>` look. `solid` is a flat neutral track,
 * for a dense screen or one where hatching already means something else.
 */
export type BarStyle = 'hatched' | 'solid'
const rest = (bar: BarStyle) => (bar === 'solid' ? 'bg-chart-muted/40' : 'bg-hatch hatch-soft')

export interface HeroStatFigure {
  label: React.ReactNode
  value: React.ReactNode
  /** A second reading under the value, e.g. `300 rows over 6 searches`. */
  hint?: React.ReactNode
  /** 0–1. Draws a meter under the figure: this much of the whole. */
  share?: number
}

export interface HeroStatProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** Names the figure: `Gripes kept`. */
  title: React.ReactNode
  /** The scope under the title: a period, a source. */
  description?: React.ReactNode
  /** The one number the screen is about. */
  value: React.ReactNode
  /** Beside the value: a change or a count, usually one `<Badge>`. */
  chip?: React.ReactNode
  /** One sentence saying what the number means. */
  reading?: React.ReactNode
  /** Right of the value: one small chart, e.g. a `<ColumnChart>`. */
  media?: React.ReactNode
  /** Up to four supporting figures in a strip along the bottom. */
  figures?: readonly HeroStatFigure[]
  /** The part of a bar that is not the number: `hatched` (default), or `solid` for a flat neutral track. */
  bar?: BarStyle
}

/**
 * The headline card: one large number with its reading, a small chart beside
 * it and a strip of supporting figures below. One per screen, at the top.
 */
export function HeroStat({
  title,
  description,
  value,
  chip,
  reading,
  media,
  figures,
  bar = 'hatched',
  className,
  ...props
}: HeroStatProps) {
  return (
    <section
      data-slot='hero-stat'
      className={cn(
        'flex flex-col gap-4 rounded-xl bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]',
        className
      )}
      {...props}
    >
      <div className='flex flex-col'>
        <h2 className='text-card-title text-text-primary'>{title}</h2>
        {description != null && <span className='text-meta'>{description}</span>}
      </div>

      <div className='flex flex-1 flex-wrap items-stretch gap-x-6 gap-y-4'>
        <div className='flex min-w-0 flex-[1_1_14rem] flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-display tabular-nums text-text-primary'>{value}</span>
            {chip}
          </div>
          {reading != null && (
            <p className='text-body max-w-xs text-text-secondary'>{reading}</p>
          )}
        </div>
        {/* The chart takes the card's spare height, so a tall neighbour in a
            `Split` stretches the chart and not a gap above the number. */}
        {media != null && (
          <div className='flex min-w-0 flex-[2_1_16rem] flex-col [&>*]:flex-1'>{media}</div>
        )}
      </div>

      {figures != null && figures.length > 0 && (
        <dl
          data-slot='hero-stat-figures'
          className='well-gradient grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border-subtle bg-surface-well p-3 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none'
        >
          {figures.map((f, i) => (
            <div key={i} className='flex min-w-0 flex-col gap-1'>
              <dt className='text-meta text-text-secondary'>{f.label}</dt>
              <dd className='flex flex-wrap items-baseline gap-x-2'>
                <span className='text-section tabular-nums text-text-primary'>{f.value}</span>
                {f.hint != null && <span className='text-meta tabular-nums'>{f.hint}</span>}
              </dd>
              {f.share != null && (
                <div
                  aria-hidden
                  className={cn(BAR, rest(bar), 'mt-1 w-full overflow-hidden text-chart-1')}
                >
                  <div
                    className='h-full rounded-full bg-chart-1'
                    style={{ width: `${Math.min(Math.max(f.share, 0), 1) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export interface ColumnChartItem {
  label: React.ReactNode
  value: number
}

export interface ColumnChartProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  items: readonly ColumnChartItem[]
  /** Which column is solid. Defaults to the tallest; `none` keeps them all pale. */
  highlight?: number | 'max' | 'none'
  /** What the chart shows, for a screen reader. */
  label?: string
}

/**
 * A few columns of one series: a count per week, per stage, per segment. The
 * leader is solid in the first chart colour and the rest are pale, so the
 * shape reads at a glance and one colour means one series.
 */
export function ColumnChart({
  items,
  highlight = 'max',
  label,
  className,
  ...props
}: ColumnChartProps) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const lead =
    highlight === 'max'
      ? items.findIndex((i) => i.value === max)
      : highlight === 'none'
        ? -1
        : highlight
  return (
    <div
      data-slot='column-chart'
      role='img'
      aria-label={label ?? items.map((i) => `${i.label}: ${i.value}`).join(', ')}
      className={cn('flex min-h-32 items-stretch gap-2', className)}
      {...props}
    >
      {items.map((item, i) => (
        <div key={i} className='flex min-w-0 flex-1 flex-col items-center gap-1.5'>
          <div className='flex w-full flex-1 flex-col items-center justify-end gap-1'>
            <span className={cn('text-data-label', i === lead && 'text-text-primary')}>
              {item.value}
            </span>
            <div
              className={cn(
                'w-full max-w-12 rounded-md',
                i === lead ? 'bg-chart-1' : 'bg-chart-1/25'
              )}
              // A zero still draws a 2px foot, so an empty period reads as
              // "none" and not as a missing column.
              style={{ height: `max(2px, ${(item.value / max) * 100}%)` }}
            />
          </div>
          <span className='text-data-label w-full truncate text-center'>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export interface BreakdownItem {
  /** Identifies the tile for selection. Defaults to `label`. */
  id?: string
  label: string
  value: number
  /** Draws the company's logo on the tile. */
  company?: CompanyLike
  /** A short second line: the top theme, a segment, a note. */
  hint?: React.ReactNode
}

export interface BreakdownTilesProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  items: readonly BreakdownItem[]
  /** The selected tile's id, or `null`. Pass with `onValueChange` to make the tiles a filter. */
  value?: string | null
  /** Called with the tile's id, or `null` when the selected tile is pressed again. */
  onValueChange?: (id: string | null) => void
  /** What the shares are of. Defaults to the sum of the items. */
  total?: number
  columns?: 2 | 3
}

const BREAKDOWN_COLUMNS = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3' } as const

/**
 * A count per category as a grid of small tiles: logo, count, share, name.
 * With `onValueChange` each tile is a toggle, so the breakdown is also the
 * filter for the list beside it.
 */
export function BreakdownTiles({
  items,
  value,
  onValueChange,
  total,
  columns = 2,
  className,
  ...props
}: BreakdownTilesProps) {
  const sum = total ?? items.reduce((n, i) => n + i.value, 0)
  return (
    <div
      data-slot='breakdown-tiles'
      className={cn('grid gap-2', BREAKDOWN_COLUMNS[columns], className)}
      {...props}
    >
      {items.map((item) => {
        const id = item.id ?? item.label
        const selected = value === id
        const share = sum > 0 ? Math.round((item.value / sum) * 100) : 0
        const body = (
          <>
            <span className='flex items-start justify-between gap-2'>
              <CompanyLogo
                name={item.company?.name ?? item.label}
                domain={item.company?.domain}
                logoUrl={item.company?.logoUrl}
              />
              <span className='flex flex-col items-end'>
                <span className='text-page-title leading-none tabular-nums'>{item.value}</span>
                <span className='text-data-label mt-1'>{share}%</span>
              </span>
            </span>
            <span className='flex min-w-0 flex-col'>
              <span className='text-name truncate'>{item.label}</span>
              {item.hint != null && <span className='text-meta truncate'>{item.hint}</span>}
            </span>
          </>
        )
        const tile = cn(
          'flex min-w-0 flex-col gap-2 rounded-lg border p-3 text-left',
          selected
            ? 'border-accent-line bg-container text-container-foreground'
            : 'border-border-subtle bg-surface-card text-text-primary'
        )
        return onValueChange ? (
          <button
            key={id}
            type='button'
            aria-pressed={selected}
            onClick={() => onValueChange(selected ? null : id)}
            className={cn(
              tile,
              'cursor-pointer transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              !selected && 'hover:bg-surface-well'
            )}
          >
            {body}
          </button>
        ) : (
          <div key={id} className={tile}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

export interface FunnelStage {
  label: React.ReactNode
  value: number
  /** A short note beside the conversion: `pass mark 55`. */
  hint?: React.ReactNode
}

export interface FunnelProps extends Omit<React.ComponentProps<'ol'>, 'children'> {
  /** In order, widest first. Each bar is drawn against the first stage. */
  stages: readonly FunnelStage[]
  /** `vertical` (default) stacks the stages for a narrow column; `horizontal` sets them in a row. */
  orientation?: 'vertical' | 'horizontal'
  /** The part of a bar that is not the number: `hatched` (default), or `solid` for a flat neutral track. */
  bar?: BarStyle
}

/**
 * Stages of one pipeline, each narrower than the last: pulled, passed,
 * reachable. Every stage after the first says what share of the one before
 * it came through, so the drop is read and not worked out.
 */
export function Funnel({
  stages,
  orientation = 'vertical',
  bar = 'hatched',
  className,
  ...props
}: FunnelProps) {
  const first = Math.max(1, stages[0]?.value ?? 1)
  return (
    <ol
      data-slot='funnel'
      className={cn(
        orientation === 'vertical'
          ? 'flex flex-col gap-4'
          : 'grid gap-x-6 gap-y-4 sm:grid-flow-col sm:auto-cols-fr',
        className
      )}
      {...props}
    >
      {stages.map((stage, i) => {
        const prev = stages[i - 1]?.value
        const kept = prev ? Math.round((stage.value / prev) * 100) : null
        return (
          <li key={i} className='flex min-w-0 flex-col gap-1.5'>
            <div className='flex items-baseline justify-between gap-3'>
              <span className='text-name truncate text-text-primary'>{stage.label}</span>
              <span className='text-page-title leading-none tabular-nums text-text-primary'>
                {stage.value}
              </span>
            </div>
            <div aria-hidden className={cn(BAR, rest(bar), 'w-full overflow-hidden text-chart-1')}>
              <div
                className='h-full rounded-full bg-chart-1'
                style={{ width: `${Math.min((stage.value / first) * 100, 100)}%` }}
              />
            </div>
            {(kept != null || stage.hint != null) && (
              <span className='text-meta'>
                {kept != null && `${kept}% of the step before`}
                {kept != null && stage.hint != null && ' · '}
                {stage.hint}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export interface SplitBarSide {
  label: React.ReactNode
  value: number
  /** A short second line under the label. */
  hint?: React.ReactNode
}

export interface SplitBarProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The part the screen is for: kept, passed, won. Drawn solid. */
  start: SplitBarSide
  /** The rest: dropped, filtered, lost. Hatched, or a flat neutral bar with `bar="solid"`. */
  end: SplitBarSide
  /** The part of a bar that is not the number: `hatched` (default), or `solid` for a flat neutral track. */
  bar?: BarStyle
}

/** Two parts of one whole on a single bar, with a figure at each end. */
export function SplitBar({ start, end, bar = 'hatched', className, ...props }: SplitBarProps) {
  const total = start.value + end.value
  const share = total > 0 ? (start.value / total) * 100 : 0
  const side = (s: SplitBarSide, align: 'start' | 'end') => (
    <div className={cn('flex min-w-0 flex-col', align === 'end' && 'items-end text-right')}>
      <span className='text-page-title tabular-nums text-text-primary'>{s.value}</span>
      <span className='text-name text-text-primary'>{s.label}</span>
      {s.hint != null && <span className='text-meta'>{s.hint}</span>}
    </div>
  )
  return (
    <div data-slot='split-bar' className={cn('flex flex-col gap-3', className)} {...props}>
      <div aria-hidden className='flex w-full gap-0.5'>
        <div className={cn(BAR, 'bg-chart-1')} style={{ width: `${share}%` }} />
        <div className={cn(BAR, bar === 'solid' ? 'bg-chart-muted' : rest(bar), 'flex-1 text-chart-1')} />
      </div>
      <div className='flex items-start justify-between gap-4'>
        {side(start, 'start')}
        {side(end, 'end')}
      </div>
    </div>
  )
}

export interface MeterProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  value: number
  max?: number
  /** The pass mark, on the same scale. Draws a tick, and a value under it goes pale. */
  mark?: number
  /** A word for the reading: `Strong`, `Worth a call`. */
  label?: React.ReactNode
  /** The part of a bar that is not the number: `hatched` (default), or `solid` for a flat neutral track. */
  bar?: BarStyle
}

/**
 * A score on a row: the number, a word for it, and a short bar with the pass
 * mark ticked on it. For a table cell or an `EntityList` row.
 */
export function Meter({
  value,
  max = 100,
  mark,
  label,
  bar = 'hatched',
  className,
  ...props
}: MeterProps) {
  const pct = (n: number) => Math.min(Math.max((n / max) * 100, 0), 100)
  const passed = mark == null || value >= mark
  return (
    <div
      data-slot='meter'
      role='meter'
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('flex w-full min-w-0 flex-col gap-1.5', className)}
      {...props}
    >
      <div className='flex items-baseline justify-between gap-2'>
        <span
          className={cn('text-name tabular-nums', passed ? 'text-text-primary' : 'text-text-secondary')}
        >
          {value}
        </span>
        {label != null && <span className='text-meta truncate'>{label}</span>}
      </div>
      <div
        aria-hidden
        className={cn(BAR, rest(bar), 'relative w-full', passed ? 'text-chart-1' : 'text-text-muted')}
      >
        <div
          className={cn('h-full rounded-full', passed ? 'bg-chart-1' : 'bg-chart-muted')}
          style={{ width: `${pct(value)}%` }}
        />
        {mark != null && (
          <span
            className='absolute -top-0.5 -bottom-0.5 w-px bg-text-secondary'
            style={{ left: `${pct(mark)}%` }}
          />
        )}
      </div>
    </div>
  )
}

export interface StatBandItem {
  label: React.ReactNode
  value: React.ReactNode
  /** Signed change, e.g. `+8.4%`. Green when it starts with `+`, red with `-`. */
  delta?: string
  /** A short second reading: `across 8 accounts`, `vs last week`. */
  hint?: React.ReactNode
  /** A lucide icon; pass it bare. On a tile at the right, or beside the label when `headed`. */
  icon?: React.ReactNode
  /** Right of the figure: an `<EntityStack>`, a `<Sparkline>`, a `<Ring>`. */
  media?: React.ReactNode
}

export interface StatBandProps extends Omit<React.ComponentProps<'dl'>, 'children'> {
  /** Two to five figures. */
  items: readonly StatBandItem[]
  /**
   * Gives each cell a header strip with its icon and label, and the figure
   * with its small chart below. For figures that each carry a reading of
   * their own; leave it off for plain counts.
   */
  headed?: boolean
}

/**
 * A few figures on one sheet, split by hairlines, in place of a row of
 * separate tiles. Plain: the figure over its label, an icon or a stack of
 * faces or logos at the right. `headed`: a titled strip per cell, then the
 * figure, its change and a small chart.
 */
export function StatBand({ items, headed = false, className, ...props }: StatBandProps) {
  return (
    <dl
      data-slot='stat-band'
      className={cn(
        'grid grid-cols-1 overflow-hidden rounded-xl bg-[image:var(--gradient-card)] shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none',
        !headed && 'gap-y-4 py-4',
        className
      )}
      {...props}
    >
      {items.map((item, i) => {
        const tone = item.delta?.startsWith('+')
          ? 'text-success-text'
          : item.delta?.startsWith('-')
            ? 'text-destructive'
            : 'text-text-muted'
        const divider = 'border-border-subtle sm:max-lg:even:border-l lg:border-l lg:first:border-l-0'
        const reading = (item.delta != null || item.hint != null) && (
          <span className='text-meta flex flex-wrap gap-x-1.5'>
            {item.delta != null && <span className={cn('font-medium', tone)}>{item.delta}</span>}
            {item.hint}
          </span>
        )
        if (headed) {
          return (
            <div key={i} className={cn('flex min-w-0 flex-col max-sm:not-first:border-t', divider)}>
              <dt className='text-name flex items-center gap-2 border-b border-border-subtle px-4 py-2 text-text-primary [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-text-muted'>
                {item.icon}
                <span className='truncate'>{item.label}</span>
              </dt>
              <dd className='flex flex-1 items-center justify-between gap-3 p-4'>
                <span className='flex min-w-0 flex-col'>
                  <span className='text-page-title tabular-nums text-text-primary'>{item.value}</span>
                  {reading}
                </span>
                {item.media}
              </dd>
            </div>
          )
        }
        return (
          <div key={i} className={cn('flex min-w-0 items-center justify-between gap-3 px-4', divider)}>
            <div className='flex min-w-0 flex-col'>
              <dd className='text-page-title tabular-nums text-text-primary'>{item.value}</dd>
              <dt className='text-meta truncate text-text-secondary'>{item.label}</dt>
              {reading}
            </div>
            {item.media ??
              (item.icon != null && <IconTile className='bg-surface-well'>{item.icon}</IconTile>)}
          </div>
        )
      })}
    </dl>
  )
}

/**
 * A share as a small ring, for the right of a `<StatBand>` cell or beside
 * any figure that is a part of a whole. `value` is 0–1.
 */
export function Ring({
  value,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'children' | 'values'> & { value: number; label?: string }) {
  const share = Math.min(Math.max(value, 0), 1)
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <svg
      data-slot='ring'
      role='img'
      aria-label={label ?? `${Math.round(share * 100)}%`}
      viewBox='0 0 40 40'
      className={cn('size-10 shrink-0 -rotate-90', className)}
      {...props}
    >
      <circle cx='20' cy='20' r={r} fill='none' strokeWidth='4' className='stroke-chart-muted/40' />
      <circle
        cx='20'
        cy='20'
        r={r}
        fill='none'
        strokeWidth='4'
        strokeLinecap='round'
        strokeDasharray={`${share * c} ${c}`}
        className='stroke-chart-1'
      />
    </svg>
  )
}

export interface EntityStackProps extends React.ComponentProps<'div'> {
  /** How many to show before the rest collapse into `+N`. */
  max?: number
}

/**
 * A short overlapping pile of logos or faces: who a count is made of. Each
 * child sits on its own disc, and the rest collapse into a `+N` disc of the
 * same size. Pass `<PersonAvatar size='sm'>`s, or `<CompanyLogo size='xs'>`s:
 * the smaller logo keeps a margin inside its disc, so the next one overlaps
 * the margin and not the mark.
 */
export function EntityStack({ max = 4, className, children, ...props }: EntityStackProps) {
  const all = React.Children.toArray(children)
  const shown = all.slice(0, max)
  const rest = all.length - shown.length
  // `relative` so each disc paints over the one before it: an avatar is itself
  // positioned, and would otherwise sit above the plain `+N` disc after it.
  const disc =
    'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle'
  return (
    <div data-slot='entity-stack' className={cn('flex shrink-0 items-center', className)} {...props}>
      {shown.map((child, i) => (
        <span key={i} className={cn(disc, 'bg-surface-card', i > 0 && '-ml-2')}>
          {child}
        </span>
      ))}
      {rest > 0 && (
        <span className={cn(disc, 'text-data-label -ml-2 bg-surface-well text-text-secondary')}>
          +{rest}
        </span>
      )}
    </div>
  )
}

export interface ShareSegment {
  label: React.ReactNode
  /** The segment's size. The marks are shared out in proportion. */
  value: number
  /** The figure as it should read, e.g. `$4,385`. Defaults to `value`. */
  display?: React.ReactNode
  /** A short reading after the figure: a share, a change. */
  hint?: React.ReactNode
  /** Draws the segment in the neutral fill: the remainder, "other", "dropped". */
  muted?: boolean
}

/** Shares `count` marks among the segments, largest remainder first, so they always add up. */
function allocate(segments: readonly ShareSegment[], count: number): number[] {
  const total = segments.reduce((n, s) => n + Math.max(s.value, 0), 0)
  if (total <= 0) return segments.map(() => 0)
  const exact = segments.map((s) => (Math.max(s.value, 0) / total) * count)
  const marks = exact.map(Math.floor)
  const order = exact.map((e, i) => [e - marks[i], i] as const).sort((a, b) => b[0] - a[0])
  for (let left = count - marks.reduce((n, m) => n + m, 0), k = 0; left > 0; left--, k++)
    marks[order[k % order.length][1]] += 1
  return marks
}

/** One colour per mark: the series colours in order, skipping muted segments. */
function markColors(segments: readonly ShareSegment[], count: number): string[] {
  const marks = allocate(segments, count)
  let series = 0
  return segments.flatMap((s, i) => {
    const color = s.muted ? CHART_MUTED : chartColor(series++)
    return Array.from({ length: marks[i] }, () => color)
  })
}

function segmentColors(segments: readonly ShareSegment[]): string[] {
  let series = 0
  return segments.map((s) => (s.muted ? CHART_MUTED : chartColor(series++)))
}

export interface ShareTicksProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Up to five, plus a `muted` remainder. */
  segments: readonly ShareSegment[]
  /** How many ticks the bar is cut into. */
  ticks?: number
}

/**
 * Parts of one whole as a row of fine ticks, coloured by segment, with the
 * key underneath. Sits under a headline figure: how the total splits.
 */
export function ShareTicks({ segments, ticks = 48, className, ...props }: ShareTicksProps) {
  const colors = segmentColors(segments)
  return (
    <div data-slot='share-ticks' className={cn('flex flex-col gap-3', className)} {...props}>
      <div aria-hidden className='flex h-6 gap-0.5'>
        {markColors(segments, ticks).map((color, i) => (
          <span key={i} className='flex-1 rounded-xs' style={{ background: color }} />
        ))}
      </div>
      <ChartLegend
        items={segments.map((s, i) => ({
          label: s.label,
          color: colors[i],
          value: s.display ?? s.value,
        }))}
      />
    </div>
  )
}

export interface ShareRingProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Up to five, plus a `muted` remainder. */
  segments: readonly ShareSegment[]
  /** The total, set large in the middle of the ring. */
  value: React.ReactNode
  /** What the total is, set small above it: `Total revenue`. */
  label?: React.ReactNode
  /** A lucide icon above the label; pass it bare. */
  icon?: React.ReactNode
  /** How many ticks the ring is cut into. */
  ticks?: number
}

/**
 * Parts of one whole as a ring of ticks around the total, with a row per
 * segment below: its colour, its name, its figure.
 */
export function ShareRing({
  segments,
  value,
  label,
  icon,
  ticks = 60,
  className,
  ...props
}: ShareRingProps) {
  const colors = segmentColors(segments)
  return (
    <div data-slot='share-ring' className={cn('flex flex-col gap-4', className)} {...props}>
      <div className='relative mx-auto aspect-square w-full max-w-56'>
        <svg aria-hidden viewBox='0 0 200 200' className='size-full'>
          {markColors(segments, ticks).map((color, i) => (
            <line
              key={i}
              x1='100'
              y1='8'
              x2='100'
              y2='22'
              strokeWidth='3.5'
              strokeLinecap='round'
              stroke={color}
              transform={`rotate(${(i * 360) / ticks} 100 100)`}
            />
          ))}
        </svg>
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 text-center'>
          {icon != null && <IconTile className='bg-surface-well'>{icon}</IconTile>}
          {label != null && <span className='text-eyebrow'>{label}</span>}
          <span className='text-page-title tabular-nums text-text-primary'>{value}</span>
        </div>
      </div>
      <ul className='m-0 flex list-none flex-col gap-2 p-0'>
        {segments.map((s, i) => (
          <li key={i} className='flex items-center gap-3'>
            <span
              aria-hidden
              className='h-4 w-1.5 shrink-0 rounded-full'
              style={{ background: colors[i] }}
            />
            <span className='text-name min-w-0 flex-1 truncate text-text-primary'>{s.label}</span>
            <span className='text-name tabular-nums text-text-primary'>{s.display ?? s.value}</span>
            {s.hint != null && <span className='text-meta tabular-nums'>{s.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface SparklineProps extends Omit<React.ComponentProps<'svg'>, 'children' | 'values'> {
  /** In order, oldest first. Two or more. */
  values: readonly number[]
  /** Fills under the line. */
  area?: boolean
  /** What the line shows, for a screen reader. */
  label?: string
}

/**
 * The trend behind a figure as one small line, for the right of a
 * `<StatBand>` cell or beside any number. It shows direction, not values:
 * no axis, no labels.
 */
export function Sparkline({ values, area = false, label, className, ...props }: SparklineProps) {
  // One point is not a trend.
  if (values.length < 2) return null
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const step = 100 / (values.length - 1)
  // 2 units of headroom top and bottom so the stroke is not clipped.
  const points = values.map((v, i) => [i * step, 30 - ((v - min) / span) * 28] as const)
  // Horizontal tangents at every point: a smooth line that never overshoots.
  const line = points.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`
    const [px, py] = points[i - 1]
    const mid = (px + x) / 2
    return `${d} C${mid},${py} ${mid},${y} ${x},${y}`
  }, '')
  return (
    <svg
      data-slot='sparkline'
      role='img'
      aria-label={label ?? 'Trend'}
      viewBox='0 0 100 32'
      preserveAspectRatio='none'
      className={cn('h-10 w-24 shrink-0', className)}
      {...props}
    >
      {area && <path d={`${line} L100,32 L0,32 Z`} className='fill-chart-1/15' />}
      <path
        d={line}
        fill='none'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        vectorEffect='non-scaling-stroke'
        className='stroke-chart-1'
      />
    </svg>
  )
}

export interface DistributionItem extends ShareSegment {
  /** A line under the label: `82 accounts · 18 with a contact`. */
  detail?: React.ReactNode
  /** Draws the company's logo on the row. */
  company?: CompanyLike
  /** In place of a logo: a lucide icon on a tile; pass it bare. */
  icon?: React.ReactNode
}

export interface DistributionListProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Up to five, plus a `muted` remainder. */
  items: readonly DistributionItem[]
  /** The part of a bar that is not the number: `hatched` (default), or `solid` for a flat neutral track. */
  bar?: BarStyle
}

/**
 * Parts of one whole as a thin segmented bar with a row per part: its
 * colour, a logo or icon, its name and detail, its figure and its share.
 * For a breakdown whose parts need a line of their own.
 */
export function DistributionList({ items, bar = 'hatched', className, ...props }: DistributionListProps) {
  const colors = segmentColors(items)
  const total = items.reduce((n, i) => n + Math.max(i.value, 0), 0) || 1
  return (
    <div data-slot='distribution-list' className={cn('flex flex-col gap-4', className)} {...props}>
      <div aria-hidden className='flex h-1.5 w-full gap-0.5'>
        {items.map((item, i) => (
          <span
            key={i}
            // The remainder is hatched, as "not the settled number" is everywhere.
            className={cn(
              'h-full min-w-1 rounded-full',
              item.muted && bar === 'hatched' && cn(rest(bar), 'text-text-muted')
            )}
            style={{
              background: item.muted && bar === 'hatched' ? undefined : colors[i],
              width: `${(Math.max(item.value, 0) / total) * 100}%`,
            }}
          />
        ))}
      </div>
      <ul className='m-0 flex list-none flex-col p-0'>
        {items.map((item, i) => (
          <li
            key={i}
            className='flex items-center gap-3 border-border-subtle py-3 not-first:border-t first:pt-0 last:pb-0'
          >
            <span
              aria-hidden
              className='h-9 w-1 shrink-0 rounded-full'
              style={{ background: colors[i] }}
            />
            {item.company != null ? (
              <CompanyLogo
                name={item.company.name}
                domain={item.company.domain}
                logoUrl={item.company.logoUrl}
              />
            ) : (
              item.icon != null && <IconTile>{item.icon}</IconTile>
            )}
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='text-name truncate text-text-primary'>{item.label}</span>
              {item.detail != null && <span className='text-meta truncate'>{item.detail}</span>}
            </span>
            <span className='text-name shrink-0 tabular-nums text-text-primary'>
              {item.display ?? item.value}
            </span>
            <Badge variant='soft' className='min-w-11 tabular-nums'>
              {item.hint ?? `${Math.round((Math.max(item.value, 0) / total) * 100)}%`}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface DivergingItem {
  label: React.ReactNode
  /** Drawn above the line: joined, hired, won. */
  up: number
  /** Drawn below the line: left, lost, churned. */
  down: number
}

export interface DivergingColumnsProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  items: readonly DivergingItem[]
  /** Names the bars above the line, in the key. */
  upLabel: React.ReactNode
  /** Names the bars below the line, in the key. */
  downLabel: React.ReactNode
}

/**
 * Two opposed counts per period on one zero line: who joined above it, who
 * left below it. Both sides share a scale, so a tall bar below is as loud
 * as a tall bar above. It is one measure in two directions, so it is one
 * colour: solid above the line, outlined below. The two are told apart by
 * shape, which holds under any brand palette and for a colour-blind reader.
 */
export function DivergingColumns({
  items,
  upLabel,
  downLabel,
  className,
  ...props
}: DivergingColumnsProps) {
  const max = Math.max(1, ...items.flatMap((i) => [i.up, i.down]))
  // 80% of a half at most, which leaves room for the value above the bar.
  const height = (v: number) => `max(2px, ${(v / max) * 80}%)`
  return (
    <div data-slot='diverging-columns' className={cn('flex flex-col gap-3', className)} {...props}>
      <div
        role='img'
        aria-label={items.map((i) => `${i.label}: ${i.up} up, ${i.down} down`).join('; ')}
        className='relative flex h-40 gap-2'
      >
        <span aria-hidden className='absolute inset-x-0 top-1/2 h-px bg-border-strong' />
        {items.map((item, i) => (
          <div key={i} className='flex min-w-0 flex-1 flex-col items-center'>
            <div className='flex w-full flex-1 flex-col items-center justify-end gap-1'>
              <span className='text-data-label'>{item.up}</span>
              <span
                className='w-full max-w-12 rounded-t-md bg-chart-1'
                style={{ height: height(item.up) }}
              />
            </div>
            <div className='flex w-full flex-1 flex-col items-center gap-1'>
              <span
                className='w-full max-w-12 rounded-b-md border-2 border-t-0 border-chart-1 bg-chart-1/15'
                style={{ height: height(item.down) }}
              />
              <span className='text-data-label'>{item.down}</span>
            </div>
          </div>
        ))}
      </div>
      <div className='flex gap-2'>
        {items.map((item, i) => (
          <span key={i} className='text-data-label min-w-0 flex-1 truncate text-center'>
            {item.label}
          </span>
        ))}
      </div>
      <ChartLegend
        swatch='square'
        items={[
          { label: upLabel, swatchClassName: 'bg-chart-1' },
          { label: downLabel, swatchClassName: 'border-2 border-chart-1 bg-chart-1/15' },
        ]}
      />
    </div>
  )
}
