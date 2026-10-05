import type * as React from 'react';
import { cn } from '../lib/cn';
import { Skeleton } from './ui/skeleton';
import { TableCell, TableRow } from './ui/table';
import type { Column } from './data-table';

export interface DataTableSkeletonRowProps<T> {
  columns: Column<T>[];
  /** Render the leading w-10 cell to match a selectable table's checkbox column. */
  hasSelection?: boolean;
  /** Position of this row among the skeleton rows. Offsets its shimmer so the
   *  sweep cascades down the table, and varies the bar widths row to row. */
  index?: number;
}

/** Bar widths cycled by row + column, so the placeholder reads as uneven text
 *  rather than a grid of identical blocks. */
const BAR_WIDTHS = [
  'max-w-[140px]',
  'max-w-[96px]',
  'max-w-[124px]',
  'max-w-[80px]',
];

/** Delay between one row's shimmer and the next. */
const ROW_STAGGER_MS = 80;

/** A single shimmer placeholder row matching DataTable's body geometry (60px
 *  tall, 10px horizontal padding) so swapping in real data causes no reflow.
 *  Reuses each column's `className`/`align` and the shared Skeleton on the
 *  table's `surface-well` band; a column's `skeleton` hint picks a placeholder
 *  shaped like its cell. Decorative — marked aria-hidden. */
export function DataTableSkeletonRow<T>({
  columns,
  hasSelection = false,
  index = 0,
}: DataTableSkeletonRowProps<T>) {
  return (
    <TableRow
      aria-hidden
      className='transition-none hover:bg-transparent'
      style={
        { '--skeleton-delay': `${index * ROW_STAGGER_MS}ms` } as React.CSSProperties
      }
    >
      {hasSelection && (
        <TableCell className='h-15 w-10 py-0'>
          <Skeleton className='size-4 rounded bg-surface-well' />
        </TableCell>
      )}
      {columns.map((c, ci) => {
        const width = BAR_WIDTHS[(index + ci) % BAR_WIDTHS.length];
        const justify =
          c.align === 'right'
            ? 'justify-end'
            : c.align === 'center'
              ? 'justify-center'
              : undefined;
        return (
          <TableCell key={c.id} className={cn('h-15 px-2.5 py-0', c.className)}>
            {c.skeleton === 'person' ? (
              <div className={cn('flex items-center gap-2.5', justify)}>
                <Skeleton className='size-8 shrink-0 rounded-full bg-surface-well' />
                <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                  <Skeleton className={cn('h-3 w-full bg-surface-well', width)} />
                  <Skeleton className='h-2.5 w-full max-w-[72px] bg-surface-well' />
                </div>
              </div>
            ) : c.skeleton === 'company' ? (
              <div className={cn('flex items-center gap-1.5', justify)}>
                <Skeleton className='size-6 shrink-0 rounded-[6px] bg-surface-well' />
                <Skeleton className={cn('h-3.5 w-full bg-surface-well', width)} />
              </div>
            ) : c.skeleton === 'badge' ? (
              <Skeleton
                className={cn(
                  'h-5 w-full max-w-[84px] rounded-full bg-surface-well',
                  c.align === 'right' && 'ml-auto',
                  c.align === 'center' && 'mx-auto',
                )}
              />
            ) : (
              <Skeleton
                className={cn(
                  'h-4 w-full bg-surface-well',
                  width,
                  c.align === 'right' && 'ml-auto',
                  c.align === 'center' && 'mx-auto',
                )}
              />
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
