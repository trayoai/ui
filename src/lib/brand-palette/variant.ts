import { toBrandInput, type ApplyBrandOptions } from './apply'
import type { BrandThemeContract } from './contract'
import { brandLeads, type BrandPaletteInput } from './resolve'

/**
 * Where an app's one coloured region goes:
 * - `band`: a `<BrandBand>` headline; the top bar stays the kit's (or the brand's own shell).
 * - `rail`: `<AppShell rail>` and the top bar in the brand's chrome colour — one L-shaped region.
 * - `quiet`: no band, no derived bar; the brand sits in pale tiles or cards and the controls.
 */
export type BrandSilhouette = 'band' | 'rail' | 'quiet'

export interface BrandVariant {
  /** The rotation slot this variant came from. */
  index: number
  silhouette: BrandSilhouette
  theme: 'light' | 'dark'
  lead: NonNullable<BrandPaletteInput['lead']>
  fills: 'none' | 'tiles' | 'cards'
  /** `'bold'` only where the derived bar is the coloured region (`rail`). */
  emphasis: 'bold' | 'quiet'
}

const SILHOUETTES: BrandSilhouette[] = ['band', 'rail', 'quiet']
const THEMES = ['light', 'dark'] as const
const LEADS = ['primary', 'secondary', 'tertiary'] as const

/**
 * A calm, deterministic variant for one app in a batch, so a gallery of
 * recipes never repeats and never needs judgement: pass the recipe's index
 * (neighbours always differ in silhouette, theme and lead) or any string seed (hashed onto the same rotation).
 *
 * Calm by construction: the page stays neutral (`canvas: 'neutral'`, no
 * `page` colour) and a screen gets one coloured region. Given the contract,
 * a lead the brand cannot take is skipped for the next one it can.
 */
export function brandVariant(seed: number | string, contract?: BrandThemeContract | BrandPaletteInput): BrandVariant {
  const index = typeof seed === 'number' ? Math.abs(Math.trunc(seed)) : hash(seed)
  const silhouette = SILHOUETTES[index % 3]
  const theme = THEMES[index % 2]
  const turn = Math.floor(index / 6)
  const available = contract ? brandLeads(toBrandInput(contract)) : [...LEADS]
  // The slot's lead, else the next one round the rotation the brand can
  // take. (index + turn) moves the lead at every step and still gives each
  // silhouette × theme all three leads within 18 slots.
  const start = (index + turn) % 3
  const lead = [0, 1, 2].map((k) => LEADS[(start + k) % 3]).find((l) => available.includes(l)) ?? 'primary'
  const fills = silhouette === 'quiet' ? (turn % 2 === 0 ? 'tiles' : 'cards') : 'none'
  return { index, silhouette, theme, lead, fills, emphasis: silhouette === 'rail' ? 'bold' : 'quiet' }
}

/** The `applyBrand` options for a variant; the layout (`rail`, `<BrandBand>`) is the app's to render. */
export function brandVariantOptions(variant: BrandVariant): ApplyBrandOptions {
  return {
    theme: variant.theme,
    lead: variant.lead,
    fills: variant.fills,
    emphasis: variant.emphasis,
    canvas: 'neutral',
    page: 'default'
  }
}

/** FNV-1a, so a recipe id always lands on the same slot. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return h >>> 0
}
