import * as React from 'react'
import { cn } from '../../lib/cn'
import {
  segmentItem,
  segmentItemActive,
  segmentItemIdle,
  segmentItemSize,
  segmentTrack,
} from './control-pill'

export type SegmentedControlOption<T extends string = string> = {
  value: T
  label: React.ReactNode
  /** A result count shown after the label as muted tabular meta. */
  count?: number | string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string = string> = Omit<
  React.ComponentProps<'div'>,
  'onChange' | 'defaultValue'
> & {
  value: T
  onValueChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  size?: 'sm' | 'default'
}

/**
 * A filter group in one bordered pill track — "All 59 · Red 3 · Amber 7 ·
 * Green 49". Controlled: you hold `value`. The active segment is raised on the
 * segment thumb surface; the rest read as quiet labels. Exactly one option is
 * selected at a time, so it is a radio group: Arrow keys move the selection,
 * Home/End jump to the ends, and only the selected segment is in the tab order.
 *
 * Use it for filtering what is on the current screen. Switching between views
 * belongs in the `AppShell` top bar (`<AppShellNavLink>`); switching between
 * panels of content belongs to `<Tabs>`.
 *
 * It is a radio group, so give it an `aria-label` (or `aria-labelledby`)
 * naming what is being filtered: "Risk band", "Stage".
 */
export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  size = 'default',
  className,
  onKeyDown,
  ...props
}: SegmentedControlProps<T>) {
  const buttons = React.useRef(new Map<T, HTMLButtonElement>())
  const enabled = options.filter((o) => !o.disabled)
  const selectedIndex = enabled.findIndex((o) => o.value === value)
  // If `value` matches nothing (or a disabled option), the first enabled
  // segment takes the tab stop so the group is still reachable.
  const tabStop = selectedIndex === -1 ? enabled[0]?.value : value

  const select = (next: T | undefined) => {
    if (next === undefined || next === value) return
    onValueChange(next)
    buttons.current.get(next)?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || enabled.length === 0) return
    const from = selectedIndex === -1 ? 0 : selectedIndex
    const last = enabled.length - 1
    let to: number | undefined
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        to = from === last ? 0 : from + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        to = from === 0 ? last : from - 1
        break
      case 'Home':
        to = 0
        break
      case 'End':
        to = last
        break
      default:
        return
    }
    event.preventDefault()
    select(enabled[to]?.value)
  }

  return (
    <div
      role='radiogroup'
      data-slot='segmented-control'
      data-size={size}
      className={cn(segmentTrack, className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) buttons.current.set(option.value, node)
              else buttons.current.delete(option.value)
            }}
            type='button'
            role='radio'
            aria-checked={selected}
            tabIndex={option.value === tabStop ? 0 : -1}
            disabled={option.disabled}
            data-state={selected ? 'on' : 'off'}
            className={cn(
              segmentItem,
              segmentItemSize[size],
              selected ? segmentItemActive : segmentItemIdle
            )}
            onClick={() => select(option.value)}
          >
            {option.label}
            {option.count != null && (
              <span className='text-meta tabular-nums'>{option.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
