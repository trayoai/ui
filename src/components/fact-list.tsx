import * as React from 'react'
import { cn } from '../lib/cn'

export interface FactListProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** The caption above the list, set as an eyebrow: "Why now", "Fit". */
  title?: React.ReactNode
}

/**
 * A short list of labelled points: the reasons, signals or evidence behind a
 * person or a company ("Why now", "Fit with what we sell").
 *
 *   <FactList title='Why now'>
 *     <Fact label='FDA approval'>Approved the 2026-2027 formulas.</Fact>
 *     <Fact label='Trial results'>Positive Phase 3 results with Merck.</Fact>
 *   </FactList>
 *
 * It owns the two things a hand-built stack gets wrong. The label is the
 * heading of its fact, so it is set in the primary ink at name weight; in
 * `<Meta>` it is lighter than the sentence under it and the eye cannot find
 * where one fact ends. And a fact's label sits close to its own text, with
 * more room above it than below, so each pair reads as one unit.
 */
export function FactList({ title, className, children, ...props }: FactListProps) {
  return (
    <div data-slot='fact-list' className={cn('flex min-w-0 flex-col gap-3', className)} {...props}>
      {title != null && <span className='text-eyebrow'>{title}</span>}
      <dl className='flex min-w-0 flex-col gap-4'>{children}</dl>
    </div>
  )
}

export interface FactProps extends React.ComponentProps<'div'> {
  /** One to four words naming the fact. */
  label: React.ReactNode
}

/** One labelled point in a `<FactList>`: a short label over a sentence. */
export function Fact({ label, className, children, ...props }: FactProps) {
  return (
    <div data-slot='fact' className={cn('flex min-w-0 flex-col gap-0.5', className)} {...props}>
      <dt data-slot='fact-label' className='text-name-sm text-text-primary'>
        {label}
      </dt>
      <dd data-slot='fact-text' className='text-body text-text-secondary'>
        {children}
      </dd>
    </div>
  )
}
