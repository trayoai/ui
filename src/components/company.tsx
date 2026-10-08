import * as React from 'react'
import { ExternalLink, MapPin, Users } from 'lucide-react'
import { cn } from '../lib/cn'
import { normalizeDomain } from '../lib/brand-image'
import { CardFooterSlot } from './card-footer-slot'
import { CardSummary, CardTags } from './card-text'
import { CompanyLogo, type LogoSize } from './company-logo'

/**
 * The shape of a company. A loose superset of a Trayo `/v1` account, so an API
 * row can be passed straight through — every field but `name` is optional.
 */
export interface CompanyLike {
  id?: string | null
  name: string
  /** Website or bare domain. This is what draws the logo. */
  domain?: string | null
  /** An explicit logo URL — a Trayo account's published `logoUrl`. */
  logoUrl?: string | null
  industry?: string | null
  /** Headcount, or a band like "201-500". */
  employeeCount?: number | string | null
  location?: string | null
  description?: string | null
}

function formatEmployees(v?: number | string | null): string | null {
  if (v == null || v === '') return null
  if (typeof v === 'string') return v
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`
  return String(v)
}

function websiteHref(domain?: string | null): string | null {
  const d = normalizeDomain(domain)
  return d ? `https://${d}` : null
}

/* ----------------------------------------------------------------- Company */

export interface CompanyProps {
  company: CompanyLike
  /**
   * `row` — logo + name + meta on one line, for tables and lists (default).
   * `inline` — logo + name only, for sentences and chips.
   * `stacked` — centred logo over name over meta, for a tile or a header.
   */
  variant?: 'row' | 'inline' | 'stacked'
  size?: LogoSize
  /** Show the website link glyph. */
  showWebsite?: boolean
  /** Right-hand slot — a Button, a menu, a score. */
  actions?: React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  className?: string
}

/**
 * A company, the Trayo way: its real logo resolved from the domain, its name in
 * the entity-name type role, and its firmographics underneath.
 *
 * Use this anywhere a company appears — a table cell, an account list, a card
 * header. Prefer it over hand-assembling a logo tile and a name.
 */
export function Company({
  company,
  variant = 'row',
  size,
  showWebsite = false,
  actions,
  href,
  onClick,
  className,
}: CompanyProps) {
  const logoSize: LogoSize =
    size ?? (variant === 'inline' ? 'sm' : variant === 'stacked' ? 'xl' : 'lg')

  const logo = (
    <CompanyLogo
      name={company.name}
      domain={company.domain}
      logoUrl={company.logoUrl}
      size={logoSize}
    />
  )

  const nameClass = cn(
    variant === 'inline' ? 'text-name-sm' : 'text-name',
    'truncate text-text-primary'
  )
  const name = href ? (
    <a href={href} className={cn(nameClass, 'hover:underline hover:decoration-accent-line')}>
      {company.name}
    </a>
  ) : (
    <span className={nameClass}>{company.name}</span>
  )

  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex min-w-0 items-center gap-1.5 align-middle', onClick && 'cursor-pointer', className)}
        onClick={onClick}
      >
        {logo}
        {name}
      </span>
    )
  }

  const meta = (
    <CompanyMeta company={company} showWebsite={showWebsite} centered={variant === 'stacked'} />
  )

  if (variant === 'stacked') {
    return (
      <div
        className={cn('flex min-w-0 flex-col items-center gap-2.5 text-center', onClick && 'cursor-pointer', className)}
        onClick={onClick}
      >
        {logo}
        <div className='flex min-w-0 flex-col items-center gap-1'>
          {name}
          {meta}
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot='entity-row'
      className={cn('flex min-w-0 items-center gap-3', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {logo}
      <div className='flex min-w-0 flex-col'>
        {name}
        {meta}
      </div>
      {actions && <span className='ml-auto flex shrink-0 items-center gap-2'>{actions}</span>}
    </div>
  )
}

/* -------------------------------------------------------------------- meta */

export function CompanyMeta({
  company,
  showWebsite = false,
  centered = false,
  twoLine = false,
  className,
}: {
  company: CompanyLike
  showWebsite?: boolean
  centered?: boolean
  /**
   * Two fixed lines instead of one wrapping line: what the company is
   * (industry · headcount) over where it is (location · website). For a
   * narrow column such as a card header, where a single line of four facts
   * wraps mid-list and strands its separators. Each line truncates.
   */
  twoLine?: boolean
  className?: string
}) {
  const employees = formatEmployees(company.employeeCount)
  const site = websiteHref(company.domain)
  const what: React.ReactNode[] = []
  const where: React.ReactNode[] = []
  if (company.industry) what.push(<span key='ind' className='truncate'>{company.industry}</span>)
  if (employees)
    what.push(
      <span key='emp' className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap'>
        <Users className='size-3 shrink-0' />
        {employees}
      </span>
    )
  if (company.location)
    where.push(
      <span key='loc' className='inline-flex min-w-0 items-center gap-1'>
        <MapPin className='size-3 shrink-0' />
        <span className='truncate'>{company.location}</span>
      </span>
    )
  if (showWebsite && site)
    where.push(
      <a
        key='web'
        href={site}
        target='_blank'
        rel='noreferrer'
        className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap hover:text-accent-text'
      >
        {normalizeDomain(company.domain)}
        <ExternalLink className='size-3 shrink-0' />
      </a>
    )
  const bits = [...what, ...where]
  if (!bits.length) return null

  if (twoLine) {
    return (
      <span className={cn('text-meta flex min-w-0 flex-col gap-1', className)}>
        {[what, where].map(
          (line, li) =>
            line.length > 0 && (
              <span key={li} className='flex min-w-0 items-center gap-x-2'>
                {line.map((b, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span aria-hidden className='text-text-muted'>·</span>}
                    {b}
                  </React.Fragment>
                ))}
              </span>
            )
        )}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'text-meta flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5',
        centered && 'justify-center',
        className
      )}
    >
      {bits.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden className='text-text-muted'>·</span>}
          {b}
        </React.Fragment>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------- CompanyCard */

export interface CompanyCardProps {
  company: CompanyLike
  /** Free text under the identity block — a research brief, a "why now". */
  summary?: React.ReactNode
  /** Short labels: segment, tech in use, a signal that fired. */
  tags?: string[]
  /** Footer slot: the card's one action. A `<Button>` here is `sm` and
   *  `secondary` unless it says otherwise, and never stretches. */
  footer?: React.ReactNode
  /** Top-right slot — a menu, a score, a secondary action. */
  actions?: React.ReactNode
  href?: string
  className?: string
}

/**
 * A company as a standalone card. This is the "show me this account"
 * component — reach for it on a detail page, in an account grid, or as a
 * search result.
 */
export function CompanyCard({
  company,
  summary,
  tags,
  footer,
  actions,
  href,
  className,
}: CompanyCardProps) {
  // With a footer the card is built like a titled <Surface>, upside down: the
  // body is a sheet standing on a `surface-well` frame, and the footer is the
  // strip of well left showing beneath it. Without one it is a plain sheet.
  const sheet =
    'flex flex-col gap-3 rounded-xl bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]'

  const body = (
    <>
      <div className='flex items-start gap-3'>
        <CompanyLogo
          name={company.name}
          domain={company.domain}
          logoUrl={company.logoUrl}
          size='xl'
        />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          {href ? (
            <a href={href} className='text-card-title truncate text-text-primary hover:underline'>
              {company.name}
            </a>
          ) : (
            <span className='text-card-title truncate text-text-primary'>{company.name}</span>
          )}
          <CompanyMeta company={company} showWebsite twoLine />
        </div>
        {actions && <span className='flex shrink-0 items-center gap-2'>{actions}</span>}
      </div>

      {summary && <CardSummary>{summary}</CardSummary>}

      {!!tags?.length && <CardTags tags={tags} />}

    </>
  )

  if (!footer) {
    return (
      <div
        data-slot='company-card'
        className={cn(sheet, 'transition-all hover:shadow-[var(--shadow-card-hover)]', className)}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      data-slot='company-card'
      className={cn(
        'flex flex-col rounded-xl border border-border-subtle bg-surface-well',
        className
      )}
    >
      {/* The sheet keeps its hairline ring (`--shadow-card`), which lands on
          the frame's border at the sides and draws the line against the
          footer strip, and is permanently raised by a short drop
          (`--shadow-card-raised`) that falls across that strip. Nothing
          changes on hover. */}
      <div
        className={cn(
          sheet,
          'relative flex-1 shadow-[var(--shadow-card),var(--shadow-card-raised)]'
        )}
      >
        {body}
      </div>
      {/* The strip's gradient starts lighter than the frame behind it, so the
          strip is pulled up 12px under the sheet (-mt-3, with the padding to
          match): otherwise the frame's flat well would show as two darker
          notches beside the sheet's rounded bottom corners. The sheet is
          `relative` so it paints over the part tucked beneath it. */}
      <div className='well-gradient -mt-3 flex items-center rounded-b-xl px-4 pt-5.5 pb-2.5'>
        <CardFooterSlot>{footer}</CardFooterSlot>
      </div>
    </div>
  )
}
