import { cn } from '../lib/cn';
import { Skeleton } from './ui/skeleton';
import { TableCell, TableRow } from './ui/table';
import type { Column } from './data-table';

export interface DataTableSkeletonRowProps<T> {
  columns: Column<T>[];
  /** Render the leading w-10 cell to match a selectable table's checkbox column. */
  hasSelection?: boolean;
}

/** A single shimmer placeholder row matching DataTable's body geometry (44px
 *  tall, 10px horizontal padding) so swapping in real data causes no reflow.
 *  Reuses each column's `className`/`align` and the shared Skeleton on the
 *  table's `surface-well` band. Decorative — marked aria-hidden. */
export function DataTableSkeletonRow<T>({
  columns,
  hasSelection = false,
}: DataTableSkeletonRowProps<T>) {
  return (
    <TableRow aria-hidden className='transition-none hover:bg-transparent'>
      {hasSelection && (
        <TableCell className='h-11 w-10 py-0'>
          <Skeleton className='size-4 rounded bg-surface-well' />
        </TableCell>
      )}
      {columns.map((c) => (
        <TableCell key={c.id} className={cn('h-11 px-2.5 py-0', c.className)}>
          <Skeleton
            className={cn(
              'h-4 w-full max-w-[140px] bg-surface-well',
              c.align === 'right' && 'ml-auto',
              c.align === 'center' && 'mx-auto',
            )}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}
