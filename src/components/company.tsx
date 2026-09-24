import * as React from 'react'
import { ExternalLink, MapPin, Users } from 'lucide-react'
import { cn } from '../lib/cn'
import { normalizeDomain } from '../lib/brand-image'
import { Badge } from './ui/badge'
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
        className={cn('inline-flex min-w-0 items-center gap-1.5 align-middle', className)}
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
      <div className={cn('flex min-w-0 flex-col items-center gap-2.5 text-center', className)} onClick={onClick}>
        {logo}
        <div className='flex min-w-0 flex-col items-center gap-1'>
          {name}
          {meta}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)} onClick={onClick}>
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
  className,
}: {
  company: CompanyLike
  showWebsite?: boolean
  centered?: boolean
  className?: string
}) {
  const employees = formatEmployees(company.employeeCount)
  const site = websiteHref(company.domain)
  const bits: React.ReactNode[] = []
  if (company.industry) bits.push(<span key='ind' className='truncate'>{company.industry}</span>)
  if (employees)
    bits.push(
      <span key='emp' className='inline-flex items-center gap-1 whitespace-nowrap'>
        <Users className='size-3 shrink-0' />
        {employees}
      </span>
    )
  if (company.location)
    bits.push(
      <span key='loc' className='inline-flex items-center gap-1 truncate'>
        <MapPin className='size-3 shrink-0' />
        {company.location}
      </span>
    )
  if (showWebsite && site)
    bits.push(
      <a
        key='web'
        href={site}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-1 whitespace-nowrap hover:text-accent-text'
      >
        {normalizeDomain(company.domain)}
        <ExternalLink className='size-3 shrink-0' />
      </a>
    )
  if (!bits.length) return null
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
  /** Footer slot, usually the primary CTA. */
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
  return (
    <div
      data-slot='company-card'
      className={cn(
        'flex flex-col gap-3 rounded-[var(--radius)] bg-[image:var(--gradient-card)] p-4',
        'shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]',
        className
      )}
    >
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
          <CompanyMeta company={company} showWebsite />
        </div>
        {actions && <span className='flex shrink-0 items-center gap-2'>{actions}</span>}
      </div>

      {summary && <p className='text-body line-clamp-4 text-text-secondary'>{summary}</p>}

      {!!tags?.length && (
        <div className='flex flex-wrap gap-1.5'>
          {tags.map((t) => (
            <Badge key={t} variant='soft'>
              {t}
            </Badge>
          ))}
        </div>
      )}

      {footer && (
        <div className='mt-auto flex items-center justify-end gap-3 border-t border-border-subtle pt-3'>
          {footer}
        </div>
      )}
    </div>
  )
}
