import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // A compact result-count pill (e.g. next to a table's identity header):
        // a soft accent fill with the readable accent text, fully rounded and
        // tabular so digits don't jitter. `normal-case`/`tracking-normal` shrug
        // off an uppercase/tracked header context.
        count:
          'min-w-5 rounded-full border-transparent bg-accent-soft px-2 font-semibold tabular-nums normal-case tracking-normal text-accent-text',
        // The neutral tag pill — attributes, segments, industries. Recedes,
        // so several of them next to each other read as one group.
        soft:
          'rounded-full border-border-subtle bg-surface-well font-normal text-text-secondary',
        // Status tints, built from the status token triples so they flip theme.
        success: 'border-[var(--success-line)] bg-[var(--success-soft)] text-success-text',
        warning: 'border-[var(--warning-line)] bg-[var(--warning-soft)] text-warning-text',
        accent: 'border-accent-line bg-accent-soft text-accent-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type Tone = 'indigo' | 'cyan' | 'amber' | 'rose' | 'emerald' | 'neutral'

const TONE_CLASS: Record<Tone, string> = {
  indigo:  'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  cyan:    'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  amber:   'border-amber-500/30 bg-amber-500/10 text-amber-400',
  rose:    'border-rose-500/30 bg-rose-500/10 text-rose-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  neutral: 'border-border-subtle bg-surface-well text-text-secondary',
}

function Badge({
  className,
  variant,
  tone,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> &
  { asChild?: boolean; tone?: Tone }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot='badge'
      className={cn(
        badgeVariants({ variant: tone ? undefined : variant }),
        tone && TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
