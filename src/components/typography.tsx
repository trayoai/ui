import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * The type system as components, for when you would rather not remember the
 * role class names. These are thin — `<PageTitle>` is an `<h1>` with
 * `.text-page-title` on it. The classes are always available directly.
 *
 * The rule that matters: CONTENT uses a role (`text-page-title`, `text-name`,
 * `text-body`, `text-meta`, `text-eyebrow`); CONTROLS (buttons, inputs, badges)
 * use the plain Tailwind scale (`text-sm font-medium`). Do not mix the two
 * vocabularies on one element, and never reach for `text-[15px]`.
 */

type El = keyof React.JSX.IntrinsicElements

function role(defaultTag: El, roleClass: string, extra?: string) {
  function Role({
    as,
    className,
    ...props
  }: React.ComponentProps<'div'> & { as?: El }) {
    const Comp = (as ?? defaultTag) as React.ElementType
    return <Comp className={cn(roleClass, extra, className)} {...props} />
  }
  return Role
}

/** 56px — a marketing hero. Rare in-app. */
export const Display = role('h1', 'text-display', 'text-text-primary')
/** 40px (32px under md) — the top of a landing or onboarding screen. */
export const Hero = role('h1', 'text-hero', 'text-text-primary')
/** 24px — the one title on a page. */
export const PageTitle = role('h1', 'text-page-title', 'text-text-primary')
/** 18px — a section heading inside a page. */
export const SectionTitle = role('h2', 'text-section', 'text-text-primary')
/** 18px — the heading of a card. */
export const CardTitle = role('h3', 'text-card-title', 'text-text-primary')
/** 14px semibold heading font — a person's or company's NAME. */
export const EntityName = role('span', 'text-name', 'text-text-primary')
/** 14px — body copy. */
export const Body = role('p', 'text-body', 'text-text-secondary')
/** 12px muted — timestamps, counts, secondary attributes. */
export const Meta = role('span', 'text-meta')
/** 12px uppercase tracked, accent-tinted — the caption above a block. */
export const Eyebrow = role('span', 'text-eyebrow')
/** 12px medium — a form label or a column label. */
export const Label = role('span', 'text-label', 'text-text-secondary')
/** 13px mono — ids, code, raw API values. */
export const Code = role('code', 'text-code', 'text-text-secondary')

/** The accent-tinted caption that titles a block of a card. */
export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('mb-2 text-eyebrow text-accent-text', className)} {...props} />
}
