import * as React from 'react'

/**
 * Page state for a list of `total` rows. Returns what `<Pagination>` and
 * `DataTable`'s `pagination` prop need, plus `from`/`to` (1-based, inclusive)
 * for slicing or for a server request. The page clamps to `pageCount`, so a
 * filter that shrinks the list never leaves the user on an empty page;
 * changing the page size resets to page 1.
 */
export function usePagination(total: number, options: { pageSize?: number; initialPage?: number } = {}) {
  // `pageSize` and `initialPage` seed the state; change the size later with `setPageSize`.
  const [pageSize, setPageSizeState] = React.useState(options.pageSize ?? 25)
  const [requestedPage, setRequestedPage] = React.useState(options.initialPage ?? 1)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  // Clamp on write as well as on read, so a list that shrinks and grows back
  // does not snap the user forward to a page they never asked for.
  const setPage = React.useCallback(
    (next: number) => setRequestedPage(Math.min(Math.max(1, next), pageCount)),
    [pageCount]
  )
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size)
    setRequestedPage(1)
  }, [])
  return { page, setPage, pageSize, setPageSize, from, to, pageCount }
}
