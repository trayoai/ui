import * as React from 'react'

/**
 * Page state for a list of `total` rows. Returns what `<Pagination>` and
 * `DataTable`'s `pagination` prop need, plus `from`/`to` (1-based, inclusive)
 * for slicing or for a server request. The page clamps to `pageCount` and the
 * clamp is persisted, so a filter that shrinks the list never leaves the user
 * on an empty page and never snaps them forward again when the list grows
 * back. Changing the page size resets to page 1.
 *
 * Pass `undefined` for `total` while it is unknown (a server page still
 * loading): the page is then left alone rather than clamped to 1.
 */
export function usePagination(
  total: number | undefined,
  options: { pageSize?: number; initialPage?: number } = {}
) {
  // `pageSize` and `initialPage` seed the state; change the size later with `setPageSize`.
  const [pageSize, setPageSizeState] = React.useState(options.pageSize ?? 25)
  const [requestedPage, setRequestedPage] = React.useState(options.initialPage ?? 1)
  const known = total != null
  const pageCount = known ? Math.max(1, Math.ceil(total / pageSize)) : Math.max(1, requestedPage)
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  // Persist the clamp: once the list has shrunk under the requested page, the
  // requested page is the clamped one, not the one from before the filter.
  React.useEffect(() => {
    if (known && requestedPage > pageCount) setRequestedPage(pageCount)
  }, [known, requestedPage, pageCount])
  const setPage = React.useCallback(
    (next: number) => setRequestedPage(Math.min(Math.max(1, next), pageCount)),
    [pageCount]
  )
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = known ? Math.min(page * pageSize, total) : page * pageSize
  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size)
    setRequestedPage(1)
  }, [])
  return { page, setPage, pageSize, setPageSize, from, to, pageCount }
}
