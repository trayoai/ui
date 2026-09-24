import * as React from 'react'
import { cn } from '../../lib/cn'

/**
 * Table-toolbar search preset (prototype `.search`): the base pill at toolbar
 * density — h-8, 13px type, fixed 210px width (the prototype's `min-width:
 * 210px`) that stays constant across breakpoints. Pair with
 * `icon={<Search />}`:
 * `<Input icon={<Search />} className={searchFieldClassName} … />`. Replaces
 * the former standalone TableSearchInput composable.
 */
export const searchFieldClassName =
  // `text-body-sm` (13px) matches the prototype `.search input { font-size:
  // 13px }`, overriding the base Input's `text-base md:text-sm` (16/14px) which
  // read a touch large in the toolbar. The `md:` variant is overridden too,
  // otherwise the base `md:text-sm` would win back to 14px on desktop.
  // `w-[210px]` is fixed (no responsive shrinking) per the prototype.
  'h-8 text-body-sm md:text-body-sm w-[210px]'

export interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Optional leading icon. When set, the input renders inside a relative
   * wrapper with the icon pinned to the left (muted, 14px) and a matching
   * left padding gutter. The icon is decorative (`aria-hidden`).
   */
  icon?: React.ReactNode
}

function Input({ className, type, icon, ...props }: InputProps) {
  const field = (
    <input
      type={type}
      data-slot='input'
      className={cn(
        // Every input is the search-field pill: rounded-full on the field
        // surface — app-raised in light, the well in dark, flipped by the
        // --surface-field token rather than a `dark:` fork (TRA-1439): one
        // class, so a consumer's `bg-transparent` wins in both themes. The
        // autofill override below fakes the same surface, so autofilled and
        // typed fields paint alike.
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-surface-field border-input flex h-9 w-full min-w-0 rounded-full border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // No filled-state tint: the background encodes interaction state
        // (focus/invalid/disabled), not content presence — a tinted filled
        // field reads as disabled or browser-autofilled.
        // Override browser autofill paint: the inset box-shadow fakes the bg
        // color, and -webkit-text-fill-color keeps the text on-theme (Chrome
        // forces near-black text otherwise — unreadable on the dark well fill).
        'autofill:shadow-[inset_0_0_0_1000px_var(--color-surface-field)] autofill:[--tw-text-opacity:1] autofill:[-webkit-text-fill-color:var(--text-primary)]',
        // Prototype focus (`.search:focus-within`): soft accent-line border +
        // a 3px accent-soft halo, instead of the heavier shadcn brand ring.
        'focus-visible:border-accent-line focus-visible:ring-accent-soft focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        icon && 'pl-9',
        className
      )}
      {...props}
    />
  )

  if (!icon) return field

  return (
    <div className='relative'>
      <span
        aria-hidden
        className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted [&>svg]:size-3.5'
      >
        {icon}
      </span>
      {field}
    </div>
  )
}

export { Input }
