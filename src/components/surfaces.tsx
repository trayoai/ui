import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/cn'

/**
 * Backgrounds, surfaces and page scaffolding.
 *
 * The surface ladder, lowest to highest: `shell` (the page canvas) → `card` →
 * `well` (an inset inside a card) → `raised`/popover. Put content on a `Card`
 * standing on an `AppShell`; nest a `Well` inside the card for a sub-panel.
 */

type ContainerWidth = 'default' | 'wide' | 'narrow'

/** Shared by `PageContainer` and the `AppShell` top bar so the two stay aligned. */
const CONTAINER_MAX: Record<ContainerWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
  wide: 'max-w-[1400px]',
}

/**
 * The page canvas. Paints Trayo's warm shell gradient with the fractal-noise
 * grain and the two corner glows — the single element that makes an app look
 * like Trayo rather than like a default Tailwind page. Wrap your whole app.
 *
 * Give it a `brand`, `nav` or `actions` and it also renders the app's top bar:
 * a sticky, blurred strip on a hairline, with the brand on the left, the view
 * links (`<AppShellNavLink>`) on the right and any actions after them. Bare
 * `<AppShell>` renders no bar, exactly as before.
 *
 * With a brand palette that has a `shell`, the top bar wears the customer's
 * product chrome (Slack's aubergine), text and fields included.
 *
 * Give it a `rail` and the app gets a left column for section links
 * (`<AppShellNavLink>`s stack there): a full-height strip in the same shell
 * colour as the top bar — one of the large colour areas that make two
 * branded apps look different. Content goes to its right. Below `md` the
 * rail becomes a horizontally scrolling strip under the top bar, so the
 * links stay reachable on phones.
 */
export function AppShell({
  className,
  children,
  brand,
  nav,
  actions,
  width = 'default',
  rail,
  ...props
}: React.ComponentProps<'div'> & {
  /** App name, optionally a link or with a workspace tag beside it. */
  brand?: React.ReactNode
  /** The view switcher — a few `<AppShellNavLink>`s. */
  nav?: React.ReactNode
  /** Far right: a search field, a theme switch, the signed-in user. */
  actions?: React.ReactNode
  /** Aligns the bar's inner width with your `PageContainer`'s `width`. */
  width?: ContainerWidth
  /** A left rail of section links (`<AppShellNavLink>`s). */
  rail?: React.ReactNode
}) {
  const hasBar = brand != null || nav != null || actions != null
  return (
    <div
      data-slot='app-shell'
      className={cn('app-shell-bg min-h-screen text-text-primary', className)}
      {...props}
    >
      {hasBar && (
        <header
          data-slot='top-bar'
          // Takes a customer's shell colour when <html> carries
          // data-brand-shell (see brandAttributes); inert otherwise.
          data-shell-region=''
          className='sticky top-0 z-30 border-b border-border-subtle bg-surface-shell/80 backdrop-blur-md'
        >
          <div
            className={cn(
              'mx-auto flex min-h-topbar w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:px-6',
              CONTAINER_MAX[width]
            )}
          >
            {brand != null && (
              <div
                data-slot='top-bar-brand'
                className='flex min-w-0 items-center gap-2 text-name text-text-primary'
              >
                {brand}
              </div>
            )}
            {nav != null && (
              // Below sm the links drop to their own full-width row under the
              // brand; from sm up they sit on the right, before the actions.
              <nav
                data-slot='top-bar-nav'
                aria-label='Primary'
                className='order-3 flex basis-full flex-wrap items-center gap-1 sm:order-2 sm:ml-auto sm:basis-auto'
              >
                {nav}
              </nav>
            )}
            {actions != null && (
              <div
                data-slot='top-bar-actions'
                className={cn(
                  'order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3',
                  nav != null && 'sm:ml-0'
                )}
              >
                {actions}
              </div>
            )}
          </div>
        </header>
      )}
      {rail != null ? (
        <div data-slot='app-shell-body' className='flex flex-col md:flex-row md:items-start'>
          <aside
            data-slot='app-shell-rail'
            // Same shell colour as the top bar when the brand has one.
            data-shell-region=''
            className={cn(
              'flex w-full shrink-0 border-b border-border-subtle bg-surface-sidebar p-2',
              'md:sticky md:w-60 md:flex-col md:self-start md:border-r md:border-b-0 md:p-3',
              hasBar ? 'md:top-topbar md:h-[calc(100vh-var(--spacing-topbar))]' : 'md:top-0 md:h-screen'
            )}
          >
            <nav
              aria-label='Sections'
              className='flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible md:[&>*]:justify-start'
            >
              {rail}
            </nav>
          </aside>
          <div className='min-w-0 flex-1'>{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

/**
 * A view link in the `AppShell` top bar: a quiet pill that takes the soft
 * accent when `active`. Renders an `<a>` when given `href`, a `<button>`
 * otherwise, or wraps your router's link with `asChild`:
 *
 *   <AppShellNavLink asChild active={pathname === '/board'}>
 *     <Link to="/board">Board</Link>
 *   </AppShellNavLink>
 */
export function AppShellNavLink({
  active = false,
  asChild = false,
  className,
  href,
  ...props
}: React.ComponentProps<'a'> & { active?: boolean; asChild?: boolean }) {
  const Comp: React.ElementType = asChild ? Slot : href ? 'a' : 'button'
  return (
    <Comp
      data-slot='top-bar-link'
      data-active={active || undefined}
      aria-current={active ? 'page' : undefined}
      href={href}
      type={!asChild && !href ? 'button' : undefined}
      className={cn(
        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0',
        active
          ? 'bg-accent-soft text-accent-text'
          : 'text-text-secondary hover:bg-surface-well hover:text-text-primary',
        className
      )}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    />
  )
}

/**
 * A band in the brand's own colour for a page's headline — the strongest
 * single colour area a branded app has. Text inside takes the brand's
 * readable foreground (the same one its buttons use), whatever the role
 * class. Put it at the top of a `PageContainer`, once per page.
 */
export function BrandBand({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      data-slot='brand-band'
      className={cn(
        'rounded-[calc(var(--radius)+4px)] bg-accent-brand px-6 py-10 text-accent-brand-foreground md:px-8 md:py-12',
        className
      )}
      {...props}
    />
  )
}

/** The centred content column inside an `AppShell`. */
export function PageContainer({
  className,
  width = 'default',
  ...props
}: React.ComponentProps<'div'> & { width?: ContainerWidth }) {
  return (
    <div
      data-slot='page-container'
      className={cn('mx-auto w-full px-4 py-8 md:px-6', CONTAINER_MAX[width], className)}
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

/**
 * A single headline number with its label. Rows of these make a stat strip —
 * lay them out with `<StatGrid>`.
 */
export function StatTile({
  label,
  value,
  delta,
  hint,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  label: React.ReactNode
  value: React.ReactNode
  /** Signed change, e.g. `+12%`. Green when it starts with `+`, red with `-`. */
  delta?: string
  /** A second reading beside the number, e.g. `$2.6M ARR` or `283 with events`. */
  hint?: React.ReactNode
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
      <span className='flex flex-wrap items-baseline gap-x-2'>
        <span className='text-page-title tabular-nums text-text-primary'>{value}</span>
        {delta && <span className={cn('text-meta font-medium', tone)}>{delta}</span>}
        {hint != null && <span className='text-meta tabular-nums'>{hint}</span>}
      </span>
    </div>
  )
}

const STAT_GRID_COLUMNS = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
} as const

/**
 * The grid a row of `<StatTile>`s sits in. Two columns under `md`, then one
 * per tile (or `columns`, at most 6). With an odd number of tiles the last one
 * spans both mobile columns, so a five-tile strip never leaves a tile dangling
 * on its own half-row at phone width.
 */
export function StatGrid({
  columns,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  /** Columns from `md` up. Defaults to the number of tiles, capped at 6. */
  columns?: 1 | 2 | 3 | 4 | 5 | 6
}) {
  const count = React.Children.toArray(children).length
  const cols = (columns ?? Math.min(6, Math.max(1, count))) as keyof typeof STAT_GRID_COLUMNS
  return (
    <div
      data-slot='stat-grid'
      className={cn(
        'grid grid-cols-2 gap-1.5',
        STAT_GRID_COLUMNS[cols],
        count % 2 === 1 && '[&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
