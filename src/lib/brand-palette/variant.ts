import type { ApplyBrandOptions } from './apply'
import { fromBrandThemeContract, type BrandThemeContract } from './contract'
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
 * (neighbours always differ in silhouette and theme; the lead turns every
 * six) or any string seed (hashed onto the same rotation).
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
  const available = contract ? brandLeads(toInput(contract)) : [...LEADS]
  const wanted = LEADS[turn % 3]
  const lead = available.includes(wanted) ? wanted : available[(LEADS.indexOf(wanted) + 1) % available.length]
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

function toInput(contract: BrandThemeContract | BrandPaletteInput): BrandPaletteInput {
  return 'onPrimary' in contract && 'text' in contract && 'background' in contract
    ? fromBrandThemeContract(contract as BrandThemeContract).input
    : (contract as BrandPaletteInput)
}

/** FNV-1a, so a recipe id always lands on the same slot. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return h >>> 0
}
