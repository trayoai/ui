import * as React from 'react'
import { Mail, MapPin, Phone, UserRound } from 'lucide-react'
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
   * Absolute URL to the person's public profile. Rendered as a profile link in
   * the contact row; omit it and no link appears. Map whatever your source
   * calls it onto this field.
   */
  profileUrl?: string | null
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
  /** Show email / phone / profile glyph links when the person has them. */
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
      // Stacked only: the avatar leads the block, so it takes the same offset
      // ring as the PersonCard avatar. The 4px margin is the ring's reach.
      className={variant === 'stacked' ? 'avatar-ring-gap m-1' : undefined}
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
              <CompanyLogo name={person.company} domain={person.companyDomain} size='2xs' />
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
  const profile = person.profileUrl || null
  const items: Array<{ key: string; href: string; label: string; icon: React.ReactNode }> = []
  if (person.email)
    items.push({ key: 'email', href: `mailto:${person.email}`, label: person.email, icon: <Mail /> })
  if (person.phone)
    items.push({ key: 'phone', href: `tel:${person.phone}`, label: person.phone, icon: <Phone /> })
  if (profile)
    items.push({ key: 'profile', href: profile, label: 'View profile', icon: <UserRound /> })
  if (!items.length) return null
  return (
    <span className={cn('flex shrink-0 items-center gap-1', className)}>
      {items.map((i) => (
        <a
          key={i.key}
          href={i.href}
          title={i.label}
          aria-label={i.label}
          target={i.key === 'profile' ? '_blank' : undefined}
          rel={i.key === 'profile' ? 'noreferrer' : undefined}
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
  /** Show email / phone / profile glyph links. On by default for cards. */
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
  // With a footer the card is built like a titled <Surface>, upside down: the
  // body is a sheet standing on a `surface-well` frame, and the footer is the
  // strip of well left showing beneath it. Without one it is a plain sheet.
  const hasFooter = showContact || !!footer
  const sheet =
    'flex flex-col gap-3 rounded-xl bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]'

  const body = (
    <>
      <div className='flex items-start gap-3'>
        <PersonAvatar
          name={person.name}
          src={personPhotoUrl(person)}
          personId={person.id}
          size='xl'
          contacted={contacted}
          // Offset ring, cards only. It paints 4px outside the avatar, so the
          // margin gives that back: the ring's outer edge sits on the card's
          // 16px inset and keeps the usual 12px from the name.
          className='avatar-ring-gap m-1'
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
          {/* Company and location share one line. The location gives way
              first (it shrinks far faster, down to its pin); once it has, a
              company name too long for the card truncates as well. */}
          {(person.company || person.location) && (
            <span className='mt-1 flex min-w-0 items-center gap-2'>
              {person.company && (
                <span className='inline-flex min-w-0 items-center gap-1.5'>
                  <CompanyLogo name={person.company} domain={person.companyDomain} size='sm' />
                  <span className='text-body-sm truncate text-text-secondary'>{person.company}</span>
                </span>
              )}
              {person.company && person.location && (
                <span aria-hidden className='text-text-muted'>·</span>
              )}
              {person.location && (
                <span className='text-meta inline-flex min-w-3 shrink-[999] items-center gap-1'>
                  <MapPin className='size-3 shrink-0' />
                  <span className='truncate'>{person.location}</span>
                </span>
              )}
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

    </>
  )

  if (!hasFooter) {
    return (
      <div
        data-slot='person-card'
        className={cn(sheet, 'transition-all hover:shadow-[var(--shadow-card-hover)]', className)}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      data-slot='person-card'
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
      <div className='well-gradient -mt-3 flex items-center justify-between gap-3 rounded-b-xl px-4 pt-5.5 pb-2.5'>
        {showContact ? <PersonContactLinks person={person} /> : <span />}
        {footer}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ PersonBanner */

export interface PersonBannerProps {
  person: PersonLike
  /** Right-hand slot — one action. Use `<Button variant='tertiary'>`. */
  actions?: React.ReactNode
  contacted?: boolean
  href?: string
  className?: string
}

/**
 * A person as the header of a page or drawer about them: a full-width band in
 * the brand colour, with the face, the name at section size, the title, and
 * one action on the right. One per screen, at the top; for a person in a list
 * or grid use `<Person>` or `<PersonCard>`.
 *
 * The band is the brand fill (as a gradient into a deeper shade of itself)
 * with its checked foreground, so it follows a
 * customer palette. Inside it the text, hairline, well and ring tokens are
 * repointed to that foreground, which is what lets a `tertiary` or `quiet`
 * Button in `actions` read correctly on the fill without its own styling.
 */
export function PersonBanner({ person, actions, contacted, href, className }: PersonBannerProps) {
  const subtitle = [person.title, person.company].filter(Boolean).join(' · ')
  const nameClass = 'text-section truncate text-text-primary'
  return (
    <div
      data-slot='person-banner'
      className={cn(
        // `relative isolate` holds the noise layer's -z-10 inside the band.
        'relative isolate flex min-w-0 items-center gap-4 rounded-xl bg-accent-brand px-5 py-4 text-accent-brand-foreground',
        // Same 160deg direction as the card and strip gradients: the brand
        // fill at the top-left, where the name sits, deepening toward the
        // bottom-right. It only ever darkens, so the foreground the resolver
        // checked against the fill stays readable.
        'bg-[image:linear-gradient(160deg,var(--accent-brand),color-mix(in_oklab,var(--accent-brand)_74%,black))]',
        '[--text-primary:var(--accent-brand-foreground)]',
        '[--text-secondary:var(--accent-brand-foreground)]',
        '[--border-strong:color-mix(in_oklab,var(--accent-brand-foreground)_30%,transparent)]',
        '[--surface-well:color-mix(in_oklab,var(--accent-brand-foreground)_12%,transparent)]',
        '[--ring:var(--accent-brand-foreground)]',
        className
      )}
    >
      {/* The website cards' backdrop: the dot grid against the right edge,
          in a tint of the band's foreground, under a layer of noise. */}
      <span
        aria-hidden
        className='bg-dot-grid dot-grid-right pointer-events-none absolute inset-0 -z-10 rounded-xl [--dot-size:6%] [--dot:color-mix(in_oklab,var(--accent-brand-foreground)_40%,transparent)]'
      />
      <span
        aria-hidden
        // Half the class's 70%: on a saturated fill the full grain reads as dirt.
        className='noise-grain pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-35'
      />
      <PersonAvatar
        name={person.name}
        src={personPhotoUrl(person)}
        personId={person.id}
        size='xl'
        contacted={contacted}
        // The offset ring, retuned for the fill: the gap is the brand colour
        // (not the card's), the ring a tint of the band's foreground.
        className='avatar-ring-gap m-1 [--surface-card:var(--accent-brand)] [--border-strong:color-mix(in_oklab,var(--accent-brand-foreground)_55%,transparent)]'
      />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        {href ? (
          <a href={href} className={cn(nameClass, 'hover:underline')}>
            {person.name}
          </a>
        ) : (
          <span className={nameClass}>{person.name}</span>
        )}
        {subtitle && <span className='text-body-sm truncate'>{subtitle}</span>}
      </div>
      {actions && <span className='flex shrink-0 items-center gap-2'>{actions}</span>}
    </div>
  )
}
