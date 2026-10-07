import { parseHex, toHex, toOklch, type RGB } from './color'
import type { BrandPaletteInput } from './resolve'

/**
 * A workspace's brand as the Trayo API returns it (`GET /v1/workspace` →
 * `brand`, or `trayo_get_workspace` over MCP). Only `colors` is read; the
 * object passes through unchanged.
 */
export interface WorkspaceBrand {
  /** Hex colours by prominence, not by role: `["#e4f222", "#1c1b18"]`. */
  colors?: readonly string[] | null
  name?: string | null
  domain?: string | null
}

export interface WorkspaceBrandMapping {
  /** Null when the brand has no usable colour; the app then stays Trayo's. */
  input: BrandPaletteInput | null
  /** Which colour took which slot, and what was left out, for a reviewer. */
  notes: string[]
}

/** Less chroma than this is a black, white or grey. */
const NEUTRAL_CHROMA = 0.03
/** A neutral lighter than this is the brand's page; darker than `INK_L`, its ink. */
const PAGE_L = 0.93
const INK_L = 0.35
/** `checkBrandPalette` refuses a primary lighter than this. */
const PRIMARY_MAX_L = 0.96
const MAX_ACCENTS = 4
/** Within this share of the highest chroma, two colours are equally saturated. */
const SAME_CHROMA = 0.8

/**
 * Gives the colours of a workspace brand their roles. The API lists them by
 * prominence, so the roles are read from the colours themselves:
 *
 * - the most saturated colour is `primary`, the earlier one where two are
 *   close (a brand of only blacks, whites and greys uses its darkest);
 * - a near-black is the brand's ink: `text`, `onPrimary` and the `shell`
 *   (the resolver keeps `onPrimary` only where it reads);
 * - a near-white is the `background`;
 * - every other colour is an accent, in the order given.
 *
 * Pass `input` to `applyBrand` or `resolveBrandPalette`. With no `background`
 * in the list the resolver assumes a white page and tints it with the primary.
 *
 * ```ts
 * const { input } = brandFromWorkspace(workspace.brand)
 * if (input) applyBrand(document, input)
 * ```
 */
export function brandFromWorkspace(brand: WorkspaceBrand | null | undefined): WorkspaceBrandMapping {
  const notes: string[] = []
  const seen = new Set<string>()
  const colors: Array<{ hex: string; l: number; c: number }> = []
  for (const value of brand?.colors ?? []) {
    const rgb: RGB | null = typeof value === 'string' ? parseHex(value) : null
    if (!rgb) {
      notes.push(`${JSON.stringify(value)} is not a hex colour; it is left out.`)
      continue
    }
    const hex = toHex(rgb)
    if (seen.has(hex)) continue
    seen.add(hex)
    const { l, c } = toOklch(rgb)
    colors.push({ hex, l, c })
  }
  if (!colors.length) {
    notes.push('The workspace brand has no colours; nothing is applied.')
    return { input: null, notes }
  }

  const chromatic = colors.filter((x) => x.c >= NEUTRAL_CHROMA && x.l <= PRIMARY_MAX_L)
  const neutrals = colors.filter((x) => x.c < NEUTRAL_CHROMA)
  const ink = neutrals.filter((x) => x.l < INK_L).sort((a, b) => a.l - b.l)[0] ?? null
  const page = neutrals.filter((x) => x.l > PAGE_L).sort((a, b) => b.l - a.l)[0] ?? null

  // The colour the company is known for: the most saturated one. A brand
  // with no hue at all (black, white, greys) uses its darkest colour.
  // Colours close to the most saturated one count as equally saturated, and
  // the list's own order (prominence) decides between them.
  const topChroma = Math.max(0, ...chromatic.map((x) => x.c))
  const primary =
    chromatic.find((x) => x.c >= topChroma * SAME_CHROMA) ??
    [...colors].filter((x) => x.l <= PRIMARY_MAX_L).sort((a, b) => a.l - b.l)[0] ??
    null
  if (!primary) {
    notes.push('Every colour in the workspace brand is near-white; nothing is applied.')
    return { input: null, notes }
  }
  notes.push(`primary ${primary.hex}: the most saturated colour of ${colors.length}.`)

  const input: BrandPaletteInput = { primary: primary.hex }
  if (ink && ink !== primary) {
    input.text = ink.hex
    input.onPrimary = ink.hex
    input.shell = ink.hex
    notes.push(`${ink.hex} is the brand's ink: text, text on primary where it reads, and the top bar.`)
  }
  if (page) {
    input.background = page.hex
    notes.push(`${page.hex} is the page.`)
  }
  const accents = chromatic.filter((x) => x !== primary).map((x) => x.hex)
  if (accents.length) {
    input.accents = accents.slice(0, MAX_ACCENTS)
    notes.push(`accents ${input.accents.join(', ')}: chart series 2 onward.`)
    if (accents.length > MAX_ACCENTS) {
      notes.push(`${accents.length - MAX_ACCENTS} colour(s) beyond the fourth accent are not applied.`)
    }
  }
  const unused = neutrals.filter((x) => x !== ink && x !== page && x !== primary)
  if (unused.length) notes.push(`${unused.map((x) => x.hex).join(', ')} (grey) is not applied.`)

  return { input, notes }
}
