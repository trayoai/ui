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
  /** Toggle every row on the current page (the `rows` passed to the table). */
  onToggleAllPage: (selected: boolean) => void;
  /** Optional per-row gate. When it returns false, that row renders no checkbox
   *  and is excluded from the header select-all / its "all selected" state — for
   *  rows that can't be acted on (e.g. Find's unmatched / already-added rows).
   *  Defaults to all-selectable when omitted. */
  isRowSelectable?: (key: string) => boolean;
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
   *  acted on (Find's unmatched results render pale). */
  rowClassName?: (row: T) => string | undefined;
  /** Optional compositional wrapper for a body <tr>. Use a non-DOM wrapper
   *  (for example, a Tooltip with an `asChild` trigger) so table semantics stay
   *  intact. */
  wrapRow?: (
    row: T,
    rowElement: React.ReactElement<React.ComponentPropsWithoutRef<'tr'>>,
  ) => React.ReactNode;
  /** Optional full-width detail row rendered directly beneath each row (spanning
   *  every column). Return null to skip it for a given row. Used for the events
   *  table's signal sub-row. */
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
   *  header — used by the bar-less table variant (see TableChrome `bare`), which
   *  drops the toolbar/footer and surfaces the count on the identity column. */
  count?: number;
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
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>;
  // Only render skeleton placeholders when there is nothing to show yet.
  // A background refetch/poll (Apollo `loading` flips true with data still
  // populated) must NOT blank out the visible rows — gating on `rows.length`
  // keeps loaded rows on screen and confines skeletons to the initial fetch,
  // making every caller robust without hand-rolled "first load" flags.
  const showSkeletons = loading && rows.length === 0;
  const totalColumnCount = columns.length + (selection ? 1 : 0);
  const alignClass = (align: Column<T>['align']) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : undefined;

  const pageKeys = rows.map(getRowKey);
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
          // `uppercase` is repeated here (the parent <th> already sets it)
          // because the browser UA stylesheet resets `text-transform: none` on
          // <button>, which would otherwise leave sortable headers title-cased
          // while non-sortable ones stay uppercase. Mirrors the prototype's
          // `.th-btn { text-transform: inherit }`.
          // `cursor-pointer` because the UA stylesheet gives <button> a default
          // arrow cursor; sortable headers are clickable, so signal it.
          // `max-w-full` + the truncating title span: a header title never
          // widens or overflows its column — when the column is narrower than
          // the title, the title ellipsizes (the chevron stays via shrink-0).
          'group inline-flex max-w-full cursor-pointer items-center gap-1 uppercase outline-none transition-colors hover:text-accent-text focus-visible:text-accent-text',
          c.align === 'right' && 'flex-row-reverse',
          // Active sort uses the readable accent (`accent-text`), NOT the brand
          // FILL (`accent-brand`) — matches the prototype's `var(--accent-text)`
          // and the design-system rule for accent text/links.
          active ? 'text-accent-text' : 'text-text-muted',
        )}
      >
        <span className="truncate">{c.header}</span>
        {/* Count pill before the caret: it belongs to the label, and the caret's
            reserved space then sits harmlessly at the end. The flex `gap-1` owns
            the spacing (the pill carries no margin of its own). */}
        {countNode}
        {/* Prototype `.th-sort`: a single chevron-down, hidden until hover,
            full + brand when this column is the active sort, rotated 180° for
            ascending. */}
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
    // Prototype `.td-l { padding-left: var(--sp-4) }`: the leading cell of every
    // row (header + body) gets a larger left inset (16px) than the default cell
    // padding, so identity/checkbox columns breathe against the card edge.
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
            <TableHead className="h-[38px] w-10 bg-surface-well">
              <Checkbox
                aria-label="Select all"
                checked={headerCheckedState}
                onCheckedChange={(value) => selection.onToggleAllPage(value === true)}
                // While skeletons are showing there are no visible rows to act
                // on, so bulk-select must be inert — otherwise an admin could
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
              // Prototype `.tbl thead th`: a small, bold, uppercase, tracked
              // muted caption. Headers are controls (the sortable ones are
              // buttons), so they use the Tailwind control scale — not a
              // content typography role — per the design-system rules.
              // text-caption (11px) + tracking-wider match the prototype's
              // 11px/0.06em caption exactly (text-xs at 12px read too chunky,
              // text-2xs at 10px too small). Non-sortable headers inherit these
              // directly; the sortable button inherits the type + sets its color.
              // `bg-surface-well` gives the header a subtle distinct band — a
              // touch darker/warmer than the rows' `surface-card` in both themes.
              // `surface-row` is invisible in light (≈ surface-card), so `well`
              // is the palette's nearest visibly-distinct step. Applied per-cell
              // (not on <thead>) so it stays opaque over the shared TableRow's
              // hover background.
              className={cn(
                // Prototype `.tbl thead th { height: 38px }` + `.th-btn {
                // padding: 0 10px }` — 38px tall, 10px horizontal (px-2.5).
                'h-[38px] bg-surface-well px-2.5 text-caption font-bold uppercase tracking-wider text-text-muted',
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
                      // Rest fill is `surface-card` — a step LIGHTER than the
                      // header's `surface-well` band — so the pill reads as a
                      // subtle raised chip rather than blending into the header.
                      // `rounded-md` squares it off from the variant's pill shape
                      // to match the header cells / controls.
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
              />
            ))
          : rows.map((row) => {
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
                // Prototype `.tbl tbody tr:hover { background: var(--bg-well) }`:
                // hover every row to the full `surface-well` band (the base
                // TableRow's shadcn `hover:bg-muted/50` is surface-well at 50%,
                // so it read lighter and inconsistent). `surface-row` is nearly
                // invisible vs the card in light, so `well` is the right band.
                // Applied to all rows (not just clickable) to override the base
                // default uniformly; the pointer cursor stays gated on onRowClick.
                'hover:bg-surface-well',
                // The base TableRow ships `transition-colors` (~150ms), which makes
                // the hover band fade in and feel laggy when sweeping the mouse down
                // a dense table. Hover should be instant — kill the transition.
                'transition-none',
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
                  className="h-11 w-10 py-0"
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
                // `.text-body-sm` role = the prototype's compact table density
                // (system / 400 / 13px). Entity-name cells override with
                // `.text-name-sm` (Polymath / 600 / 13px) to stay the focal
                // element; the header keeps its 11px caption.
                //
                // Text tier (prototype `.idn .nm` = --fg-1 vs `.tbl tbody td` =
                // muted): the first/leading column is the focal entity, so it
                // reads at `text-text-primary`; every other column is
                // de-emphasized to `text-text-muted`. A column can still
                // override via its own `className` (applied last) — and cells
                // whose content sets its own color (chips, buttons, avatars)
                // are unaffected since color only inherits to bare text.
                <TableCell
                  key={c.id}
                  className={cn(
                    // Prototype compact `.tbl tbody td { height: 44px; padding:
                    // 0 10px }`: pin the row height (h-11) and use horizontal-
                    // only padding so rows are a fixed 44px regardless of cell
                    // content (avatars/controls) or the body line-height —
                    // rather than the base TableCell's `p-2`, which let rows
                    // float to ~50px. (Height is a min for table cells, so the
                    // vertical padding must be dropped, not just capped.)
                    'h-11 px-2.5 py-0 text-body-sm',
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
  );
}
