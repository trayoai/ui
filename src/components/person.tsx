import * as React from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { LinkedInIcon } from './icons'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'
import { CompanyLogo } from './company-logo'
import { PersonAvatar, type AvatarSize } from './person-avatar'

/**
 * The shape of a person. Deliberately a loose superset of what the Trayo API
 * returns from `GET /v1/people` — every field is optional, so you can pass an
 * API row straight through and the component renders whatever is there.
 */
export interface PersonLike {
  id?: string | null
  name: string
  title?: string | null
  /** Company name. */
  company?: string | null
  /** Company domain — draws the company's logo beside its name. */
  companyDomain?: string | null
  location?: string | null
  email?: string | null
  phone?: string | null
  /**
   * LinkedIn identity — same asymmetry as the photo below. `GET /v1/people`
   * returns `linkedinUsername`; `linkedinUrl` is what you send and what other
   * sources carry. Either works; a bare username or a full URL both resolve.
   */
  linkedinUsername?: string | null
  linkedinUrl?: string | null
  /**
   * The person's photo. The Trayo API is ASYMMETRIC about this field and both
   * spellings show up in real code, so both are accepted here:
   *
   *   - `profileImageUrl` — what `GET /v1/people` returns.
   *   - `photoUrl`        — what a `POST /v1/find` contacts result carries
   *                         (the raw, persistable URL), and what you SEND when
   *                         creating a person.
   *
   * `imageUrl` / `avatarUrl` are accepted too, since they are the obvious
   * guesses when mapping from somewhere else. First non-empty one wins — see
   * `personPhotoUrl`.
   */
  profileImageUrl?: string | null
  photoUrl?: string | null
  imageUrl?: string | null
  avatarUrl?: string | null
}

/**
 * The person's photo URL, whichever field it arrived in.
 *
 * Reach for this instead of `person.profileImageUrl` anywhere you need the raw
 * URL: a find result spells it `photoUrl`, and reading only one spelling is how
 * every avatar silently degrades to the placeholder face.
 */
export function personPhotoUrl(person: PersonLike): string | null {
  return (
    person.profileImageUrl ||
    person.photoUrl ||
    person.imageUrl ||
    person.avatarUrl ||
    null
  )
}

function linkedinHref(username?: string | null): string | null {
  if (!username) return null
  if (username.startsWith('http')) return username
  return `https://www.linkedin.com/in/${username.replace(/^\/?in\//, '')}`
}

/* ------------------------------------------------------------------ Person */

export interface PersonProps {
  person: PersonLike
  /**
   * `row` — one line, for tables and lists (the default).
   * `inline` — avatar + name only, for sentences and chips.
   * `stacked` — name over title over company, for a card body or a header.
   */
  variant?: 'row' | 'inline' | 'stacked'
  size?: AvatarSize
  /** Show email / phone / LinkedIn glyph links when the person has them. */
  showContact?: boolean
  contacted?: boolean
  /** Right-hand slot — a Button, a menu, a score. */
  actions?: React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  className?: string
}

/**
 * A person, the Trayo way: a real face (or one of the built-in illustrated
 * fallbacks), their name in the entity-name type role, and their title and
 * company underneath.
 *
 * Use this anywhere a person appears — a table cell, a list row, a card header,
 * a search result. Prefer it over hand-assembling an avatar and a name.
 */
export function Person({
  person,
  variant = 'row',
  size,
  showContact = false,
  contacted = false,
  actions,
  href,
  onClick,
  className,
}: PersonProps) {
  const avatarSize: AvatarSize =
    size ?? (variant === 'inline' ? 'sm' : variant === 'stacked' ? 'xl' : 'lg')

  const nameEl = (
    <span className={cn(variant === 'inline' ? 'text-name-sm' : 'text-name', 'truncate text-text-primary')}>
      {person.name}
    </span>
  )

  const name = href ? (
    <a href={href} className='truncate hover:underline hover:decoration-accent-line'>
      {nameEl}
    </a>
  ) : (
    nameEl
  )

  const avatar = (
    <PersonAvatar
      name={person.name}
      src={personPhotoUrl(person)}
      personId={person.id}
      size={avatarSize}
      contacted={contacted}
    />
  )

  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex min-w-0 items-center gap-1.5 align-middle', className)}
        onClick={onClick}
      >
        {avatar}
        {name}
      </span>
    )
  }

  const subtitle = [person.title, person.company].filter(Boolean).join(' · ')

  if (variant === 'stacked') {
    return (
      <div className={cn('flex min-w-0 flex-col items-center gap-3 text-center', className)} onClick={onClick}>
        {avatar}
        <div className='flex min-w-0 flex-col items-center gap-0.5'>
          {name}
          {person.title && <span className='text-meta truncate'>{person.title}</span>}
          {person.company && (
            <span className='mt-1 inline-flex items-center gap-1.5'>
              <CompanyLogo name={person.company} domain={person.companyDomain} size='xs' />
              <span className='text-body-sm truncate text-text-secondary'>{person.company}</span>
            </span>
          )}
          {person.location && (
            <span className='text-meta mt-1 inline-flex items-center gap-1 truncate'>
              <MapPin className='size-3 shrink-0' /> {person.location}
            </span>
          )}
        </div>
        {showContact && <PersonContactLinks person={person} />}
      </div>
    )
  }

  return (
    <div
      className={cn('flex min-w-0 items-center gap-3', className)}
      onClick={onClick}
    >
      {avatar}
      <div className='flex min-w-0 flex-col'>
        <span className='flex min-w-0 items-center gap-2'>{name}</span>
        {subtitle && (
          <span className='text-meta flex min-w-0 items-center gap-1.5 truncate'>
            {person.company && person.companyDomain && (
              <CompanyLogo name={person.company} domain={person.companyDomain} size='xs' />
            )}
            <span className='truncate'>{subtitle}</span>
          </span>
        )}
      </div>
      {showContact && <PersonContactLinks person={person} className='ml-auto' />}
      {actions && <span className='ml-auto flex shrink-0 items-center gap-2'>{actions}</span>}
    </div>
  )
}

/* ----------------------------------------------------------- contact links */

export function PersonContactLinks({
  person,
  className,
}: {
  person: PersonLike
  className?: string
}) {
  const li = linkedinHref(person.linkedinUsername || person.linkedinUrl)
  const items: Array<{ key: string; href: string; label: string; icon: React.ReactNode }> = []
  if (person.email)
    items.push({ key: 'email', href: `mailto:${person.email}`, label: person.email, icon: <Mail /> })
  if (person.phone)
    items.push({ key: 'phone', href: `tel:${person.phone}`, label: person.phone, icon: <Phone /> })
  if (li)
    items.push({ key: 'li', href: li, label: 'LinkedIn profile', icon: <LinkedInIcon /> })
  if (!items.length) return null
  return (
    <span className={cn('flex shrink-0 items-center gap-1', className)}>
      {items.map((i) => (
        <a
          key={i.key}
          href={i.href}
          title={i.label}
          aria-label={i.label}
          target={i.key === 'li' ? '_blank' : undefined}
          rel={i.key === 'li' ? 'noreferrer' : undefined}
          className='flex size-7 items-center justify-center rounded-full border border-transparent text-text-muted transition-all hover:border-accent-line hover:bg-accent-soft hover:text-accent-text [&_svg]:size-3.5'
        >
          {i.icon}
        </a>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------- PersonCard */

export interface PersonCardProps {
  person: PersonLike
  /** Free text under the identity block — a research summary, a "why now". */
  summary?: React.ReactNode
  /** Short labels: seniority, function, a signal that fired. */
  tags?: string[]
  /** Footer slot, usually the primary CTA. */
  footer?: React.ReactNode
  /** Show email / phone / LinkedIn glyph links. On by default for cards. */
  showContact?: boolean
  contacted?: boolean
  /** Top-right slot — a menu, a score, a secondary action. */
  actions?: React.ReactNode
  href?: string
  className?: string
}

/**
 * A person as a standalone card. This is the "show me this person" component —
 * reach for it on a detail page, in a stakeholder grid, or as a search result.
 */
export function PersonCard({
  person,
  summary,
  tags,
  footer,
  showContact = true,
  contacted,
  actions,
  href,
  className,
}: PersonCardProps) {
  return (
    <div
      data-slot='person-card'
      className={cn(
        'flex flex-col gap-3 rounded-[var(--radius)] bg-[image:var(--gradient-card)] p-4',
        'shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]',
        className
      )}
    >
      <div className='flex items-start gap-3'>
        <PersonAvatar
          name={person.name}
          src={personPhotoUrl(person)}
          personId={person.id}
          size='xl'
          contacted={contacted}
        />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          {href ? (
            <a href={href} className='text-card-title truncate text-text-primary hover:underline'>
              {person.name}
            </a>
          ) : (
            <span className='text-card-title truncate text-text-primary'>{person.name}</span>
          )}
          {person.title && <span className='text-body-sm truncate text-text-secondary'>{person.title}</span>}
          {person.company && (
            <span className='mt-1 inline-flex min-w-0 items-center gap-1.5'>
              <CompanyLogo name={person.company} domain={person.companyDomain} size='sm' />
              <span className='text-body-sm truncate text-text-secondary'>{person.company}</span>
            </span>
          )}
          {person.location && (
            <span className='text-meta mt-0.5 inline-flex items-center gap-1'>
              <MapPin className='size-3 shrink-0' /> {person.location}
            </span>
          )}
        </div>
        {actions && <span className='flex shrink-0 items-center gap-2'>{actions}</span>}
      </div>

      {summary && <p className='text-body text-text-secondary'>{summary}</p>}

      {!!tags?.length && (
        <div className='flex flex-wrap gap-1.5'>
          {tags.map((t) => (
            <Badge key={t} variant='soft'>
              {t}
            </Badge>
          ))}
        </div>
      )}

      {(showContact || footer) && (
        <div className='mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-3'>
          {showContact ? <PersonContactLinks person={person} /> : <span />}
          {footer}
        </div>
      )}
    </div>
  )
}
