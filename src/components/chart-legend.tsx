import * as React from 'react'
import { cn } from '../lib/cn'

export interface ChartLegendItem {
  /** What the swatch stands for. */
  label: React.ReactNode
  /**
   * The swatch colour as a CSS value — `chartColor(i)`, `CHART_SEQUENTIAL[n]`
   * or `CHART_MUTED`. Prefer `swatchClassName` where a class is possible.
   */
  color?: string
  /** A Tailwind fill for the swatch: `bg-chart-1`, `bg-chart-seq-3`, `bg-chart-muted`. */
  swatchClassName?: string
  /** An optional figure after the label — a count, a share, a total. */
  value?: React.ReactNode
}

export interface ChartLegendProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
  items: readonly ChartLegendItem[]
  /** `horizontal` wraps in a row (default); `vertical` stacks. */
  orientation?: 'horizontal' | 'vertical'
  /** `dot` for points and bubbles (default); `square` for bars, cells and areas; `line` for lines. */
  swatch?: 'dot' | 'square' | 'line'
}

/**
 * The key for a chart — a swatch and a label per series, in the palette order
 * the series were assigned. Present whenever a chart has two or more series
 * (a single series needs none; the title names it). The labels wear the
 * data-label role, muted; only the swatch carries the series colour.
 *
 *   <ChartLegend items={series.map((s, i) => ({ label: s.name, color: chartColor(i) }))} />
 */
export function ChartLegend({
  items,
  orientation = 'horizontal',
  swatch = 'dot',
  className,
  ...props
}: ChartLegendProps) {
  return (
    <ul
      data-slot='chart-legend'
      className={cn(
        'm-0 flex list-none p-0',
        orientation === 'vertical' ? 'flex-col gap-1.5' : 'flex-wrap items-center gap-x-4 gap-y-1.5',
        className
      )}
      {...props}
    >
      {items.map((item, i) => (
        <li key={i} className='flex items-center gap-1.5 text-data-label'>
          <span
            aria-hidden
            className={cn(
              'shrink-0',
              swatch === 'line' ? 'h-0.5 w-3 rounded-full' : 'size-2.5',
              swatch === 'dot' ? 'rounded-full' : swatch === 'square' ? 'rounded-[2px]' : undefined,
              item.swatchClassName
            )}
            style={item.color ? { background: item.color } : undefined}
          />
          <span className='text-text-secondary'>{item.label}</span>
          {item.value != null && <span className='text-text-primary'>{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}
