import * as React from 'react'
import { cn } from '../../lib/cn'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        // Same family as the Input pill: app-raised (light) / surface-well
        // (dark) fill; rounded-2xl rather than rounded-full so multi-line
        // corners don't clip the first/last lines of text.
        'border-input placeholder:text-muted-foreground bg-app-raised dark:bg-surface-well flex field-sizing-content min-h-16 w-full rounded-2xl border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // No filled-state tint (mirrors Input): the background encodes
        // interaction state, not content presence.
        // Prototype focus — soft accent-line border + 3px accent-soft halo.
        'focus-visible:border-accent-line focus-visible:ring-accent-soft focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
