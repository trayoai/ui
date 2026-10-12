import * as React from 'react'

/** What a `<PageHeader>` with no `variant` stands on, as the brand set it. */
export type BrandHeader = 'plain' | 'card' | 'band'

/** The attribute `applyBrand` writes on `<html>`. Kept here so the kit's components need not import the brand module. */
const ATTRIBUTE = 'data-brand-header'

function read(): BrandHeader {
  const value = document.documentElement.getAttribute(ATTRIBUTE)
  return value === 'card' || value === 'band' ? value : 'plain'
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTRIBUTE] })
  return () => observer.disconnect()
}

/**
 * The header style the applied brand chose, `plain` when there is no brand.
 * It follows the attribute, so a brand applied or replaced after the first
 * render is picked up. On the server it is `plain`.
 */
export function useBrandHeader(): BrandHeader {
  return React.useSyncExternalStore(subscribe, read, () => 'plain')
}
