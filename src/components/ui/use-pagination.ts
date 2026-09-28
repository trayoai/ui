import * as React from 'react'

/**
 * Page state for a list of `total` rows. Returns what `<Pagination>` and
 * `DataTable`'s `pagination` prop need, plus `from`/`to` (1-based, inclusive)
 * for slicing or for a server request. The page clamps to `pageCount`, so a
 * filter that shrinks the list never leaves the user on an empty page;
 * changing the page size resets to page 1.
 */
export function usePagination(total: number, options: { pageSize?: number; initialPage?: number } = {}) {
  const [pageSize, setPageSizeState] = React.useState(options.pageSize ?? 25)
  const [requestedPage, setPage] = React.useState(options.initialPage ?? 1)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
  }, [])
  return { page, setPage, pageSize, setPageSize, from, to, pageCount }
}
