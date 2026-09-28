import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export interface PaginationProps extends Omit<React.ComponentProps<'nav'>, 'onChange'> {
  /** Current page, 1-based. */
  page: number
  /** Rows per page. */
  pageSize: number
  /** Total number of rows across every page. */
  total: number
  onPageChange: (page: number) => void
  /** When given together with `onPageSizeChange`, a "Rows per page" Select is
   *  rendered before the page controls. Omit both for a fixed page size. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  /** How many page numbers to show on each side of the current page before the
   *  list collapses to an ellipsis. Defaults to 1. */
  siblingCount?: number
}

export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

/**
 * The compact page list: always the first and last page, a window of
 * `siblingCount` pages either side of the current one, and an ellipsis wherever
 * pages are skipped. Short lists (everything fits) render every page.
 */
export function paginationRange(page: number, pageCount: number, siblingCount = 1): PaginationItem[] {
  // first + last + current + siblings on both sides + the two ellipsis slots
  const slots = siblingCount * 2 + 5
  if (pageCount <= slots) return Array.from({ length: pageCount }, (_, i) => i + 1)

  // Keep the window the same width at the ends so the control never reflows
  // as the user walks from page 1 to page 2 to page 3.
  const windowSize = siblingCount * 2 + 3
  const left = Math.max(2, Math.min(page - siblingCount, pageCount - windowSize))
  const right = Math.min(pageCount - 1, Math.max(page + siblingCount, windowSize + 1))

  const items: PaginationItem[] = [1]
  if (left > 2) items.push('start-ellipsis')
  for (let p = left; p <= right; p++) items.push(p)
  if (right < pageCount - 1) items.push('end-ellipsis')
  items.push(pageCount)
  return items
}

/**
 * Paging control: "1–25 of 382" on the left, the page list with prev/next on
 * the right, and an optional rows-per-page Select. Fully controlled — hold the
 * page (and page size) in state and slice or fetch accordingly. `DataTable`
 * renders this in its footer when given a `pagination` prop, so reach for it
 * directly only for lists that are not tables (card grids, feeds).
 */
function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // Clamp so a stale page (a filter just shrank the list) still renders a sane
  // control; the caller should reset the page, but the control never breaks.
  const current = Math.min(Math.max(1, page), pageCount)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  const showSizes = pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange
  // Always list the active size, even if the caller's options omit it —
  // otherwise the Select shows nothing.
  const sizes = showSizes
    ? [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b)
    : []

  return (
    <nav
      aria-label='Pagination'
      data-slot='pagination'
      className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}
      {...props}
    >
      {/* The range is content (a count), so it takes the `text-meta` role;
          the buttons are controls and keep the Tailwind control scale. */}
      <span className='text-meta tabular-nums'>
        {total === 0 ? '0 of 0' : `${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()}`}
      </span>
      <div className='flex items-center gap-3'>
        {showSizes && (
          <label className='flex items-center gap-2'>
            <span className='text-meta whitespace-nowrap'>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger size='sm' aria-label='Rows per page' className='min-w-[4.5rem] tabular-nums'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align='end'>
                {sizes.map((n) => (
                  <SelectItem key={n} value={String(n)} className='tabular-nums'>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='quiet'
            size='icon-sm'
            aria-label='Previous page'
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            <ChevronLeft />
          </Button>
          {/* Page numbers collapse away on phones — prev/next and the range
              still tell the whole story there. */}
          <ol className='hidden items-center gap-1 sm:flex'>
            {paginationRange(current, pageCount, siblingCount).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <Button
                    type='button'
                    variant='quiet'
                    size='icon-sm'
                    aria-label={`Page ${item}`}
                    aria-current={item === current ? 'page' : undefined}
                    onClick={() => onPageChange(item)}
                    className={cn(
                      'tabular-nums',
                      // The active page takes the same accent wash a selected
                      // table row does, and stays put on hover.
                      item === current &&
                        'bg-accent-soft font-medium text-accent-text hover:border-transparent hover:bg-accent-soft hover:text-accent-text',
                    )}
                  >
                    {item}
                  </Button>
                </li>
              ) : (
                <li key={item} aria-hidden className='flex size-8 items-center justify-center text-sm text-text-muted'>
                  …
                </li>
              ),
            )}
          </ol>
          <Button
            type='button'
            variant='quiet'
            size='icon-sm'
            aria-label='Next page'
            disabled={current >= pageCount}
            onClick={() => onPageChange(current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export { Pagination }
