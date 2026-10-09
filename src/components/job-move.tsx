import { ArrowRight } from 'lucide-react'
import { cn } from '../lib/cn'
import { Company, type CompanyLike } from './company'
import { Well } from './surfaces'

/** One side of a job change: the company, and the role held there. */
export interface JobMoveSide {
  company: CompanyLike
  title?: string | null
}

export interface JobMoveProps {
  from: JobMoveSide
  to: JobMoveSide
  fromLabel?: string
  toLabel?: string
  className?: string
}

/**
 * A job change: where someone left and where they landed.
 *
 * The layout follows the component's OWN width (a container query), not the
 * viewport, because it mostly sits in a dialog or a side panel:
 *
 *   - 512px and up: two equal tiles with an arrow between them, the label
 *     ("Left", "Joined") on its own line above the company.
 *   - narrower: two slim rows with the arrow pointing down between them,
 *     label in a fixed column, then the company and the role on one line.
 *     Stacked tiles are twice as tall and push the rest of a phone-sized
 *     dialog off the screen; tiles squeezed side by side are too narrow to
 *     read.
 *
 * Either way the label never sits against the logo.
 *
 *   <JobMove
 *     from={{ company: { name: 'Stripe', domain: 'stripe.com' }, title: 'Director, RevOps' }}
 *     to={{ company: { name: 'Ramp', domain: 'ramp.com' }, title: 'VP RevOps' }}
 *   />
 */
export function JobMove({
  from,
  to,
  fromLabel = 'Left',
  toLabel = 'Joined',
  className,
}: JobMoveProps) {
  return (
    <div data-slot='job-move' className={cn('@container', className)}>
      {/* `minmax(0,1fr)` twice: the tiles are equal and may shrink below
          their content, which is what lets the names inside truncate. */}
      <div className='grid grid-cols-1 items-stretch gap-1.5 @lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @lg:gap-2'>
        <JobMoveSideTile label={fromLabel} side={from} />
        <ArrowRight
          aria-hidden
          // Narrow: pointing down, under the label column, so the two rows
          // still read as from → to. Wide: pointing right, between the tiles.
          className='ml-3 size-3.5 shrink-0 rotate-90 self-center justify-self-start text-text-muted @lg:ml-0 @lg:size-4 @lg:rotate-0 @lg:justify-self-center'
        />
        <JobMoveSideTile label={toLabel} side={to} />
      </div>
    </div>
  )
}

function JobMoveSideTile({ label, side }: { label: string; side: JobMoveSide }) {
  return (
    <Well
      data-slot='job-move-side'
      className='grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-2 @lg:flex @lg:flex-col @lg:items-stretch @lg:gap-1 @lg:py-3'
    >
      <span data-slot='job-move-label' className='text-meta'>
        {label}
      </span>
      <div className='flex min-w-0 items-center gap-2 @lg:flex-col @lg:items-stretch @lg:gap-1'>
        <Company company={side.company} variant='inline' className='max-w-[60%] shrink-0 @lg:max-w-none' />
        {side.title && (
          <span className='text-body-sm min-w-0 truncate text-text-secondary @lg:line-clamp-2 @lg:whitespace-normal'>
            {side.title}
          </span>
        )}
      </div>
    </Well>
  )
}
