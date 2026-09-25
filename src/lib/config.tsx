import * as React from 'react'

/**
 * Library-wide configuration. Everything here has a working default, so a GTM
 * app renders correctly with NO provider at all — wrap in `<TrayoUIProvider>`
 * only to override.
 */
export interface TrayoUIConfig {
  /**
   * Origin of the Trayo API that serves the company-logo proxy
   * (`GET /api/brand-image?domain=…` — public, no key required, logo.dev with
   * a favicon fallback). Defaults to production.
   */
  brandImageOrigin: string
  /**
   * Optional proxy for PERSON photos. A raw upstream photo URL often refuses to
   * load cross-origin; when it fails, `<PersonAvatar>` drops to the illustrated
   * fallback face. Supply a function here — pointing at your own image-proxy
   * route — to turn an upstream URL into one your app can load.
   *
   * Return `null`/`undefined` to skip the photo entirely.
   */
  personImageProxy?: (url: string) => string | null | undefined
  /**
   * Optional test for "this URL is a generic outline, not a real photo". A
   * match is treated as no photo at all, so the illustrated fallback face shows
   * instead of a stock silhouette. Which URLs qualify depends on your data
   * source, so there is no default.
   */
  isGenericPhoto?: (url: string) => boolean
  /**
   * Where the 50 illustrated placeholder faces are served from. Defaults to
   * `https://ui.trayo.ai/faces/v1`. Set this to your own base URL if you would
   * rather host them yourself; files are named `01.png` … `50.png`.
   */
  placeholderFaceBase?: string
}

const DEFAULTS: TrayoUIConfig = {
  brandImageOrigin: 'https://api.trayo.ai',
}

const Ctx = React.createContext<TrayoUIConfig>(DEFAULTS)

export function TrayoUIProvider({
  children,
  ...overrides
}: Partial<TrayoUIConfig> & { children: React.ReactNode }) {
  const parent = React.useContext(Ctx)
  const value = React.useMemo(
    () => ({ ...parent, ...overrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parent, overrides.brandImageOrigin, overrides.personImageProxy, overrides.placeholderFaceBase]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTrayoUI(): TrayoUIConfig {
  return React.useContext(Ctx)
}
