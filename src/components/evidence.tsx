import * as React from 'react'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'

export interface EvidenceItemProps extends Omit<React.ComponentProps<'article'>, 'title'> {
  /**
   * What this is evidence of: the signals an event fired, the topics a post
   * is on. Drawn in the brand tint, the one place the block uses colour.
   */
  tags?: readonly string[]
  /** How many tags are shown before the rest collapse into `+N more`. */
  maxTags?: number
  /** What happened, in one line: the event's or the article's own headline. */
  title?: React.ReactNode
  /** Where and when it was reported: `News · 22 Jul 2026 · FinanceX`. */
  source?: React.ReactNode
  /**
   * The subject, when the evidence is about a person and not a headline: a
   * `<Person>`, and a `<JobMove>` under it. It sits where the text would.
   */
  media?: React.ReactNode
  /** Under the text: what to do with it, and the link to the source. */
  footer?: React.ReactNode
}

/**
 * One piece of evidence: an event, an article, a post that backs a claim on
 * the screen. What it is evidence of, what happened, where it was reported,
 * and why it matters.
 *
 *   <EvidenceItem
 *     tags={['Fraud & compliance', 'Scale-up']}
 *     title='Intuit launches a business credit card with QuickBooks built in'
 *     source='News · 22 Jul 2026 · FinanceX'
 *     footer={<a href={url}>Source</a>}
 *   >
 *     The card puts 100 million QuickBooks users on one credit workflow.
 *   </EvidenceItem>
 *
 * It owns the hierarchy a hand-built stack does not have. Built from chips,
 * a `<Meta>` and two `<Body>` paragraphs, every part is one size in one grey
 * and the eye cannot tell a signal from a sentence, or find where one event
 * ends. Here each part has its own weight: the tags in the brand tint, the
 * headline at 16px in the primary ink, the source as a byline under it, and
 * the explanation in the secondary ink.
 */
export function EvidenceItem({
  tags,
  maxTags = 3,
  title,
  source,
  media,
  footer,
  className,
  children,
  ...props
}: EvidenceItemProps) {
  const shown = tags?.slice(0, maxTags) ?? []
  const rest = tags?.slice(maxTags) ?? []
  return (
    <article data-slot='evidence-item' className={cn('flex min-w-0 flex-col gap-2', className)} {...props}>
      {shown.length > 0 && (
        <div data-slot='evidence-tags' className='flex min-w-0 flex-wrap gap-1.5'>
          {shown.map((tag) => (
            <Badge key={tag} variant='accent'>
              {tag}
            </Badge>
          ))}
          {rest.length > 0 && (
            <Badge variant='soft' title={rest.join(', ')}>
              +{rest.length} more
            </Badge>
          )}
        </div>
      )}
      {(title != null || source != null) && (
        <div className='flex min-w-0 flex-col gap-0.5'>
          {title != null && (
            // The name role's family and weight, a step up in size: the
            // headline is the heading of its item.
            <h4 data-slot='evidence-title' className='text-name text-base text-text-primary'>
              {title}
            </h4>
          )}
          {source != null && (
            <p data-slot='evidence-source' className='text-body-sm text-text-secondary'>
              {source}
            </p>
          )}
        </div>
      )}
      {media != null && <div className='flex min-w-0 flex-col gap-3'>{media}</div>}
      {children != null && (
        <div data-slot='evidence-text' className='text-body text-text-secondary'>
          {children}
        </div>
      )}
      {footer != null && (
        <div
          data-slot='evidence-footer'
          className='text-body-sm flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-text-secondary'
        >
          {footer}
        </div>
      )}
    </article>
  )
}

export interface EvidenceListProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** Names the list: `Events`. With `count`, it reads `Events (14)`. */
  title?: React.ReactNode
  /** How many items there are, shown beside the title. */
  count?: number
}

/**
 * `<EvidenceItem>`s one under another, with a hairline and more room between
 * two items than there is inside one, so each reads as a unit.
 */
export function EvidenceList({ title, count, className, children, ...props }: EvidenceListProps) {
  return (
    <section data-slot='evidence-list' className={cn('flex min-w-0 flex-col gap-4', className)} {...props}>
      {title != null && (
        <h3 data-slot='evidence-list-title' className='text-section text-text-primary'>
          {title}
          {count != null && <span className='font-normal text-text-secondary'> ({count})</span>}
        </h3>
      )}
      <div className='flex min-w-0 flex-col divide-y divide-border-subtle [&>[data-slot=evidence-item]]:py-5 [&>[data-slot=evidence-item]:first-child]:pt-0 [&>[data-slot=evidence-item]:last-child]:pb-0'>
        {children}
      </div>
    </section>
  )
}
