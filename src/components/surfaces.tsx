import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * Backgrounds, surfaces and page scaffolding.
 *
 * The surface ladder, lowest to highest: `shell` (the page canvas) → `card` →
 * `well` (an inset inside a card) → `raised`/popover. Put content on a `Card`
 * standing on an `AppShell`; nest a `Well` inside the card for a sub-panel.
 */

/**
 * The page canvas. Paints Trayo's warm shell gradient with the fractal-noise
 * grain and the two corner glows — the single element that makes an app look
 * like Trayo rather than like a default Tailwind page. Wrap your whole app.
 */
export function AppShell({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='app-shell'
      className={cn('app-shell-bg min-h-screen text-text-primary', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** The centred content column inside an `AppShell`. */
export function PageContainer({
  className,
  width = 'default',
  ...props
}: React.ComponentProps<'div'> & { width?: 'default' | 'wide' | 'narrow' }) {
  const max = {
    narrow: 'max-w-2xl',
    default: 'max-w-6xl',
    wide: 'max-w-[1400px]',
  }[width]
  return (
    <div
      data-slot='page-container'
      className={cn('mx-auto w-full px-4 py-8 md:px-6', max, className)}
      {...props}
    />
  )
}

/**
 * The elevated card surface: the white→cream gradient plus the 1px hairline
 * ring that every Trayo panel stands on. `interactive` adds the hover lift.
 */
export function Surface({
  className,
  interactive = false,
  padded = true,
  ...props
}: React.ComponentProps<'div'> & { interactive?: boolean; padded?: boolean }) {
  return (
    <div
      data-slot='surface'
      className={cn(
        'rounded-[var(--radius)] bg-[image:var(--gradient-card)] shadow-[var(--shadow-card)]',
        padded && 'p-4',
        interactive &&
          'cursor-pointer transition-all hover:bg-[image:var(--gradient-card-hover)] hover:shadow-[var(--shadow-card-hover)]',
        className
      )}
      {...props}
    />
  )
}

/** An inset panel inside a `Surface` — one step down the ladder. */
export function Well({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='well'
      className={cn(
        'rounded-lg border border-border-subtle bg-surface-well p-3',
        className
      )}
      {...props}
    />
  )
}

/**
 * The slowly-drifting brand mesh gradient — for a hero, a login panel, an
 * empty state that needs presence. Children render above it.
 */
export function BrandMesh({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='brand-mesh'
      className={cn('brand-mesh relative overflow-hidden', className)}
      {...props}
    >
      {/* The mesh layers are ::before/::after and therefore positioned, so
          content needs its own stacking context to sit above them. */}
      <div className='relative z-10'>{children}</div>
    </div>
  )
}

/** The amber→pink hero gradient as a text fill. For one phrase, not a paragraph. */
export function GradientText({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'bg-[image:var(--gradient-cta)] bg-clip-text text-transparent',
        className
      )}
      {...props}
    />
  )
}

/** The page-title row: title, optional subtitle, right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<'header'>, 'title'> & {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header
      data-slot='page-header'
      className={cn(
        'mb-6 flex flex-wrap items-start justify-between gap-3',
        className
      )}
      {...props}
    >
      <div className='flex min-w-0 flex-wrap items-baseline gap-3'>
        <h1 className='text-page-title text-text-primary'>{title}</h1>
        {subtitle != null && (
          <p className='text-body text-text-secondary'>{subtitle}</p>
        )}
      </div>
      {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
    </header>
  )
}

/** Nothing-here state. Give it an icon, a line of copy, and one action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot='empty-state'
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border-subtle px-6 py-14 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <span className='flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-text [&_svg]:size-5'>
          {icon}
        </span>
      )}
      <span className='text-card-title text-text-primary'>{title}</span>
      {description && (
        <p className='text-body max-w-sm text-text-secondary'>{description}</p>
      )}
      {action && <div className='mt-1'>{action}</div>}
    </div>
  )
}

/** A single headline number with its label. Rows of these make a stat strip. */
export function StatTile({
  label,
  value,
  delta,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  label: React.ReactNode
  value: React.ReactNode
  /** Signed change, e.g. `+12%`. Green when it starts with `+`, red with `-`. */
  delta?: string
}) {
  const tone = delta?.startsWith('+')
    ? 'text-success-text'
    : delta?.startsWith('-')
      ? 'text-destructive'
      : 'text-text-muted'
  return (
    <div
      data-slot='stat-tile'
      className={cn(
        'flex flex-col gap-1 rounded-[var(--radius)] bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]',
        className
      )}
      {...props}
    >
      <span className='text-eyebrow'>{label}</span>
      <span className='flex items-baseline gap-2'>
        <span className='text-page-title tabular-nums text-text-primary'>{value}</span>
        {delta && <span className={cn('text-meta font-medium', tone)}>{delta}</span>}
      </span>
    </div>
  )
}
