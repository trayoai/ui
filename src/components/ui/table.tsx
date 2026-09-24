import * as React from 'react'
import { cn } from '../../lib/cn'
import { TableScrollRegion } from './table-scroll-region'

function Table({
  className,
  hideOverflowBadge = false,
  ...props
}: React.ComponentProps<'table'> & { hideOverflowBadge?: boolean }) {
  return (
    // The scroll container + overflow affordance live in TableScrollRegion so
    // bespoke table markup can reuse them (TRA-1428). DOM shape is unchanged:
    // relative anchor > [data-slot=table-container] > [data-slot=table].
    <TableScrollRegion rootClassName='w-full' hideOverflowBadge={hideOverflowBadge}>
      <table
        data-slot='table'
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </TableScrollRegion>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('[&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'bg-muted/50 border-t border-border font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border transition-colors',
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        // Opaque `bg-surface-card` gives the header its own band; consumers
        // (e.g. DataTable) can override the band color via `className`.
        'text-foreground bg-surface-card h-10 px-2 text-start align-middle font-medium whitespace-nowrap [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      // `px-2 py-2` (not the shorthand `p-2`) so a consumer can override a
      // single axis cleanly — tailwind-merge keeps `p-2` alongside an incoming
      // `px-*`/`py-*` (different groups), leaving padding to fragile CSS source
      // order. The DataTable relies on this to set `py-0`/`px-2.5`. Mirrors
      // TableHead, which already uses `px-2`. Visually identical to `p-2`.
      className={cn(
        'px-2 py-2 align-middle whitespace-nowrap [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
