import * as React from 'react'
import { cn } from '../../lib/cn'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  /**
   * The planned value (an estimate, a budget, a quota), on the same scale as
   * `value`. Turns the bar into plan against actual: a hatched bar for the
   * plan stacked over a solid bar for `value`, with anything past the plan
   * hatched in the danger colour. Give a group of these the same `max` so
   * their lengths compare.
   */
  target?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, target, ...props }, ref) => {
    const pct = (n: number) => Math.min(Math.max((n / max) * 100, 0), 100)
    const percentage = pct(value)

    if (target === undefined) {
      return (
        <div
          ref={ref}
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={cn(
            'bg-secondary relative h-2 w-full overflow-hidden rounded-full',
            className
          )}
          {...props}
        >
          <div
            className='bg-primary h-full transition-all duration-300 ease-in-out'
            style={{ width: `${percentage}%` }}
          />
        </div>
      )
    }

    const targetPct = pct(target)
    // The solid bar stops at the plan; whatever is past it is the overrun.
    const solidPct = Math.min(percentage, targetPct)
    const overPct = Math.max(percentage - targetPct, 0)
    const bar = 'h-1.5 transition-all duration-300 ease-in-out'

    return (
      <div
        ref={ref}
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn('flex w-full flex-col gap-1', className)}
        {...props}
      >
        {/* No track: the two bars are read against each other, not against
            an empty remainder. */}
        <div
          className={cn(bar, 'bg-hatch hatch-soft text-primary rounded-full')}
          style={{ width: `${targetPct}%` }}
        />
        <div className='flex'>
          <div
            className={cn(bar, 'bg-primary', overPct > 0 ? 'rounded-l-full' : 'rounded-full')}
            style={{ width: `${solidPct}%` }}
          />
          {overPct > 0 && (
            <div
              className={cn(bar, 'bg-hatch text-destructive rounded-r-full')}
              style={{ width: `${overPct}%` }}
            />
          )}
        </div>
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress, type ProgressProps }
