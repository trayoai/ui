/**
 * Photo-filtering helper.
 *
 * Some upstream photo sources return a generic outline image rather than a real
 * headshot. Those load successfully, so nothing errors — the avatar just shows
 * a stock silhouette instead of the illustrated fallback face, which looks
 * worse than having no photo at all.
 *
 * The library ships no host list of its own: which URLs count as "not a real
 * photo" depends entirely on where your data comes from. Supply a predicate via
 * `TrayoUIProvider isGenericPhoto={...}` and `<PersonAvatar>` will treat a match
 * as "no photo" and fall back.
 */
export type IsGenericPhoto = (url: string) => boolean
