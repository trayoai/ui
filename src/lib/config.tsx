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
   * Optional proxy for PERSON photos. Raw `profileImageUrl` values from the
   * Trayo API point at LinkedIn's CDN, which frequently refuses cross-origin
   * hotlinks — when it does, `<PersonAvatar>` drops to the illustrated
   * placeholder face. Supply a function here (e.g. pointing at your own
   * image-proxy route) to turn an upstream URL into one your app can load.
   *
   * Return `null`/`undefined` to skip the photo entirely.
   */
  personImageProxy?: (url: string) => string | null | undefined
  /**
   * Where the 50 illustrated placeholder faces are served from. By default the
   * bundled PNGs are imported through your bundler, which is what you want.
   * Set this to a base URL (e.g. a CDN path ending in `/placeholder`) if you
   * would rather host them yourself; files are named `01.png` … `50.png`.
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
