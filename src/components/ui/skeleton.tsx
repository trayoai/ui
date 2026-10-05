import { cn } from '../../lib/cn'

/** A placeholder block with a highlight that sweeps across it (the
 *  `.skeleton-shimmer` rule in styles/animations.css). Set `--skeleton-delay`
 *  on it or any ancestor to offset the sweep, e.g. to cascade a list. With
 *  reduced motion the sweep is replaced by a plain opacity pulse. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn(
        'skeleton-shimmer bg-accent relative overflow-hidden rounded-md motion-reduce:animate-pulse',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
