import type * as React from 'react';
import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { DataTableSkeletonRow } from './skeleton-row';
import { Pagination } from './ui/pagination';

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Extra classes applied to BOTH the header cell and every body cell — for
   *  column widths / responsive hide (e.g. 'w-24', 'hidden lg:table-cell'). */
  className?: string;
  /** When true (and onSortChange is provided) the header becomes a sort toggle.
   *  The sort key is the column `id`. */
  sortable?: boolean;
  /** Shape of this column's placeholder while the table is `loading`, so the
   *  skeleton resembles the rows about to arrive: `person` (avatar + two
   *  lines, for a `<Person>` cell), `company` (logo + name, for an inline
   *  `<Company>`), `badge` (a pill). Defaults to a plain text bar. */
  skeleton?: 'text' | 'person' | 'company' | 'badge';
}

export type SortState = { key: string; dir: 'asc' | 'desc' };

/** Optional row-selection model. The table is presentational — the caller owns
 *  the selected-key set (e.g. across pages) and the toggle handlers; the table
 *  only renders the leading checkbox column and reflects/queries that set. */
export interface DataTableSelection {
  /** Keys (from `getRowKey`) of the currently-selected rows. */
  selectedKeys: Set<string>;
  /** Toggle a single row by key. */
  onToggleRow: (key: string, selected: boolean) => void;
  /** Toggle every selectable row on the current page. Without `pagination`
   *  that is every row passed in `rows`; with client-side paging it is the
   *  slice the table is showing — so use the second argument, the keys of
   *  exactly those rows, rather than re-deriving the page yourself. */
  onToggleAllPage: (selected: boolean, pageKeys: string[]) => void;
  /** Optional per-row gate. When it returns false, that row renders no checkbox
   *  and is excluded from the header select-all / its "all selected" state — for
   *  rows that can't be acted on (e.g. results with no match, or already added).
   *  Defaults to all-selectable when omitted. */
  isRowSelectable?: (key: string) => boolean;
}

/** Controlled paging for `DataTable`. The caller owns `page` (1-based) and
 *  `pageSize`; the table renders a `<Pagination>` footer and either slices
 *  `rows` itself (no `total`: client-side) or shows `rows` as-is and trusts
 *  `total` (server-side: pass only the current page of rows). */
export interface DataTablePagination {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  /** Total rows across every page. Omit it and the table slices `rows` by
   *  page/pageSize and reports `rows.length` as the total. Pass it when the
   *  server does the paging and `rows` is already just the current page. */
  total?: number;
  onPageChange: (page: number) => void;
  /** Renders a "Rows per page" Select when both are given. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Controlled sort state. The table is presentational — the caller sorts
   *  `rows` and reflects the active column here. */
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  /** When provided, a leading checkbox column is rendered and selected rows are
   *  highlighted. Omit it entirely for non-selectable tables. */
  selection?: DataTableSelection;
  /** Optional per-row class on the body <tr> — e.g. to mute a row that can't be
   *  acted on. */
  rowClassName?: (row: T) => string | undefined;
  /** Optional compositional wrapper for a body <tr>. Use a non-DOM wrapper
   *  (for example, a Tooltip with an `asChild` trigger) so table semantics stay
   *  intact. */
  wrapRow?: (
    row: T,
    rowElement: React.ReactElement<React.ComponentPropsWithoutRef<'tr'>>,
  ) => React.ReactNode;
  /** Optional full-width detail row rendered directly beneath each row (spanning
   *  every column). Return null to skip it for a given row. */
  renderSubRow?: (row: T) => React.ReactNode;
  /** Table sizing algorithm. The default `auto` layout sizes columns by content,
   *  so content-heavy columns silently soak up surplus width regardless of the
   *  `width` hints. `fixed` makes the column `width`s authoritative: pin the
   *  columns that matter and leave exactly one column width-less — it absorbs
   *  surplus on wide viewports and is the first to shrink (its cells should
   *  truncate) on narrow ones, before any horizontal scroll appears. */
  layout?: 'auto' | 'fixed';
  /** Extra classes for the underlying <table>. With `layout='fixed'` use this
   *  for a `min-w-*` floor: fixed layout ignores per-cell min-width, so without
   *  it the flex column collapses to 0 before horizontal scroll kicks in. */
  tableClassName?: string;
  /** When true, render skeleton placeholder rows instead of `rows`/`empty`, so
   *  a list never flashes its empty/"not found" state while a query is in
   *  flight. The empty fallback shows only when `!loading && rows.length === 0`. */
  loading?: boolean;
  /** Number of skeleton rows to render while `loading`. Defaults to 8. */
  skeletonRows?: number;
  /** When set (and > 0), renders a result-count pill next to the FIRST column's
   *  header, so a table with no toolbar or footer still shows its result count on
   *  the identity column. */
  count?: number;
  /** Paging. Any list that can exceed ~50 rows should set this rather than
   *  render every row. Client-side when `total` is omitted (the table slices
   *  `rows`), server-side when it is given (`rows` is the current page). The
   *  footer is omitted while there is a single page and no page-size Select. */
  pagination?: DataTablePagination;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
  onRowClick,
  sort,
  onSortChange,
  selection,
  renderSubRow,
  rowClassName,
  wrapRow,
  layout = 'auto',
  tableClassName,
  loading = false,
  skeletonRows = 8,
  count,
  pagination,
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>;
  // Only render skeleton placeholders when there is nothing to show yet.
  // A background refetch or poll (most data libraries flip `loading` to true
  // while the previous data is still populated) must NOT blank out the visible rows — gating on `rows.length`
  // keeps loaded rows on screen and confines skeletons to the initial fetch,
  // making every caller robust without hand-rolled "first load" flags.
  const showSkeletons = loading && rows.length === 0;
  const totalColumnCount = columns.length + (selection ? 1 : 0);
  const alignClass = (align: Column<T>['align']) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : undefined;

  // Paging. Without `total` the table pages `rows` itself; with it, `rows` is
  // already the current page (server paging) and is rendered untouched. The
  // page is clamped so a filter that shrinks the list never shows an empty
  // page — the footer still reflects the caller's state on the next change.
  const pageTotal = pagination ? (pagination.total ?? rows.length) : rows.length;
  const pageCount = pagination ? Math.max(1, Math.ceil(pageTotal / pagination.pageSize)) : 1;
  const currentPage = pagination ? Math.min(Math.max(1, pagination.page), pageCount) : 1;
  const pageRows =
    pagination && pagination.total == null
      ? rows.slice((currentPage - 1) * pagination.pageSize, currentPage * pagination.pageSize)
      : rows;
  const showPagination =
    pagination != null &&
    !showSkeletons &&
    (pageCount > 1 || (pagination.pageSizeOptions != null && pagination.onPageSizeChange != null));

  const pageKeys = pageRows.map(getRowKey);
  // Only rows the caller allows to be selected count toward the header
  // select-all + its checked/indeterminate state.
  const selectableKeys = pageKeys.filter(
    (k) => selection?.isRowSelectable?.(k) ?? true,
  );
  const selectedOnPage = selectableKeys.filter((k) => selection?.selectedKeys.has(k)).length;
  const allPageSelected = selectableKeys.length > 0 && selectedOnPage === selectableKeys.length;
  const headerCheckedState: boolean | 'indeterminate' = allPageSelected
    ? true
    : selectedOnPage > 0
      ? 'indeterminate'
      : false;

  // Header titles are single-line, always: a title that doesn't fit its
  // column ellipsizes — it never wraps, widens the column (fixed layout), or
  // bleeds into the neighbour cell (auto layout).
  // `countNode` (when present) is the result-count pill for the column that
  // carries the count. It renders between the label and the sort caret so the
  // pill hugs the label, and the caret's always-reserved (opacity-toggled) slot
  // lives at the very end — no phantom gap at rest, no reflow on hover.
  const renderHeader = (c: Column<T>, countNode?: React.ReactNode) => {
    const isSortable = c.sortable && onSortChange;
    if (!isSortable) {
      if (!countNode) return <span className="block truncate">{c.header}</span>;
      return (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{c.header}</span>
          {countNode}
        </span>
      );
    }
    const active = sort?.key === c.id;
    return (
      <button
        type="button"
        onClick={() =>
          onSortChange({ key: c.id, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })
        }
        className={cn(
          // `cursor-pointer` because the UA stylesheet gives <button> a default
          // arrow cursor; sortable headers are clickable, so signal it.
          // `max-w-full` + the truncating title span: a header title never
          // widens or overflows its column — when the column is narrower than
          // the title, the title ellipsizes (the chevron stays via shrink-0).
          'group inline-flex max-w-full cursor-pointer items-center gap-1 outline-none transition-colors hover:text-accent-text focus-visible:text-accent-text',
          c.align === 'right' && 'flex-row-reverse',
          // Active sort uses the readable accent (`accent-text`), NOT the brand
          // FILL (`accent-brand`), per the design-system rule for accent text/links.
          active ? 'text-accent-text' : 'text-text-secondary',
        )}
      >
        <span className="truncate">{c.header}</span>
        {/* Count pill before the caret: it belongs to the label, and the caret's
            reserved space then sits harmlessly at the end. The flex `gap-1` owns
            the spacing (the pill carries no margin of its own). */}
        {countNode}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-3.5 shrink-0 transition-[opacity,transform]',
            active
              ? 'text-accent-text opacity-100'
              : 'opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50',
            active && sort?.dir === 'asc' && 'rotate-180',
          )}
        />
      </button>
    );
  };

  const ariaSort = (c: Column<T>): React.AriaAttributes['aria-sort'] => {
    if (!c.sortable || sort?.key !== c.id) return undefined;
    return sort?.dir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <>
    {/* The leading cell of every
        row (header + body) gets a larger left inset (16px) than the default cell
        padding, so identity/checkbox columns breathe against the card edge. */}
    <Table
      className={cn(
        '[&_tr>:first-child]:pl-4',
        layout === 'fixed' && 'table-fixed',
        tableClassName,
      )}
    >
      <TableHeader>
        <TableRow>
          {selection && (
            <TableHead className="h-10 w-10 bg-transparent">
              <Checkbox
                aria-label="Select all"
                checked={headerCheckedState}
                onCheckedChange={(value) =>
                  selection.onToggleAllPage(value === true, selectableKeys)
                }
                // While skeletons are showing there are no visible rows to act
                // on, so bulk-select must be inert — otherwise a user could
                // toggle "select all" against stale, off-screen rows and fire
                // bulk actions on data they cannot currently see.
                disabled={showSkeletons}
                className="translate-y-[2px]"
              />
            </TableHead>
          )}
          {columns.map((c, colIndex) => (
            <TableHead
              key={c.id}
              // A quiet sentence-case label on the rows' own surface, set
              // apart by the hairline under it, not by a band. Headers are
              // controls (the sortable ones are buttons), so they use the
              // Tailwind control scale — not a content typography role.
              // Non-sortable headers inherit these directly; the sortable
              // button inherits the type + sets its color.
              className={cn(
                'h-10 bg-transparent px-2.5 text-xs font-medium text-text-secondary',
                alignClass(c.align),
                c.className,
              )}
              style={c.width ? { width: c.width } : undefined}
              aria-sort={ariaSort(c)}
            >
              {renderHeader(
                c,
                colIndex === 0 && count != null && count > 0 ? (
                  // The count pill rides INSIDE the sortable header (between the
                  // label and the caret). It's neutral at rest and only takes the
                  // accent fill/text when the header is hovered/focused or this
                  // column is the active sort — mirroring the label + caret, so
                  // the whole header lights up (or stays calm) as one unit.
                  <Badge
                    variant="count"
                    data-testid="data-table-count"
                    className={cn(
                      // Neutral at rest: the card fill and secondary text
                      // instead of the variant's accent, with the corners of
                      // the header's controls.
                      'rounded-md border-transparent bg-surface-card text-text-secondary',
                      'group-hover:bg-accent-soft group-hover:text-accent-text',
                      'group-focus-visible:bg-accent-soft group-focus-visible:text-accent-text',
                      sort?.key === c.id && 'bg-accent-soft text-accent-text',
                    )}
                  >
                    {count.toLocaleString()}
                  </Badge>
                ) : undefined,
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {showSkeletons
          ? Array.from({ length: skeletonRows }, (_, i) => (
              <DataTableSkeletonRow
                key={`skeleton-${i}`}
                columns={columns}
                hasSelection={!!selection}
                index={i}
              />
            ))
          : pageRows.map((row) => {
          const key = getRowKey(row);
          const isSelected = selection?.selectedKeys.has(key) ?? false;
          const subRow = renderSubRow?.(row);
          const rowElement = (
            <TableRow
              data-state={isSelected ? 'selected' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                // Hover every row to the full `surface-well` band (the base
                // TableRow's shadcn `hover:bg-muted/50` is surface-well at 50%,
                // so it read lighter and inconsistent). `surface-row` is nearly
                // invisible vs the card in light, so `well` is the right band.
                // Applied to all rows (not just clickable) to override the base
                // default uniformly; the pointer cursor stays gated on onRowClick.
                'hover:bg-surface-well',
                // The hover band is asymmetric: it arrives fast (75ms) and
                // lets go slowly (250ms). A symmetric fade (the base TableRow's
                // ~150ms `transition-colors`) feels laggy when sweeping the
                // mouse down a dense table, because every row is late; this
                // way the row under the pointer answers at once and the rows
                // behind it fade out as a soft trail.
                'transition-colors duration-250 ease-out hover:duration-75',
                onRowClick && 'cursor-pointer',
                // Selected: match the base's `data-[state=selected]:` variant so
                // tailwind-merge dedupes and our accent tint wins — a plain
                // `bg-accent-soft` loses to the base `data-[state=selected]:
                // bg-muted` on specificity (attribute selector), leaving
                // selected rows the same neutral band as hover.
                isSelected && 'data-[state=selected]:bg-accent-soft',
                // Keep the main row and its sub-row visually fused — the border
                // lives on the sub-row instead.
                subRow != null && 'border-b-0',
                rowClassName?.(row),
              )}
            >
              {selection && (
                // stopPropagation so toggling the checkbox never fires the row's
                // onRowClick / navigation. A non-selectable row keeps the cell
                // (column alignment) but renders no checkbox.
                <TableCell
                  className="h-15 w-10 py-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(selection.isRowSelectable?.(key) ?? true) && (
                    <Checkbox
                      aria-label="Select row"
                      checked={isSelected}
                      onCheckedChange={(value) => selection.onToggleRow(key, value === true)}
                      className="translate-y-[2px]"
                    />
                  )}
                </TableCell>
              )}
              {columns.map((c, colIndex) => (
                // `.text-body-sm` role = the compact table density
                // (system / 400 / 13px). Entity-name cells override with
                // `.text-name-sm` (Figtree / 600 / 13px) to stay the focal
                // element; the header is a 12px control label.
                //
                // Text tier: the first/leading column is the focal entity, so it
                // reads at `text-text-primary`; every other column is
                // de-emphasized to `text-text-muted`. A column can still
                // override via its own `className` (applied last) — and cells
                // whose content sets its own color (chips, buttons, avatars)
                // are unaffected since color only inherits to bare text.
                <TableCell
                  key={c.id}
                  className={cn(
                    // Fixed-height rows: pin the row height (h-15) and use
                    // horizontal-only padding so every row is 60px regardless
                    // of cell content (avatars/controls) or the body
                    // line-height — the base TableCell's `p-2` would let rows
                    // vary with their content. (Height is a min for table
                    // cells, so the vertical padding must be dropped, not just
                    // capped.)
                    'h-15 px-2.5 py-0 text-body-sm',
                    colIndex === 0 ? 'text-text-primary' : 'text-text-muted',
                    alignClass(c.align),
                    c.className,
                  )}
                >
                  {c.accessor(row)}
                </TableCell>
              ))}
            </TableRow>
          );
          return (
            <Fragment key={key}>
              {wrapRow?.(row, rowElement) ?? rowElement}
              {subRow != null && (
                <TableRow
                  data-state={isSelected ? 'selected' : undefined}
                  className={cn(isSelected && 'bg-accent-soft')}
                >
                  <TableCell colSpan={totalColumnCount} className="pt-0">
                    {subRow}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
    {showPagination && (
      // The footer sits OUTSIDE the scroll region as a sibling of the table,
      // so it never scrolls away horizontally with a wide table. `px-4`
      // matches the leading cell inset; the hairline replaces the last row's
      // suppressed bottom border.
      <Pagination
        page={currentPage}
        pageSize={pagination.pageSize}
        total={pageTotal}
        onPageChange={pagination.onPageChange}
        pageSizeOptions={pagination.pageSizeOptions}
        onPageSizeChange={pagination.onPageSizeChange}
        className="border-t border-border-subtle px-4 py-2"
      />
    )}
    </>
  );
}
