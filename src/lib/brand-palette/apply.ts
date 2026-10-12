import { fromBrandThemeContract, type BrandThemeContract, type ContractOptions } from './contract'
import { dialectAttributes, DIALECT_PRESETS, type Dialect } from './dialect'
import {
  brandAttributes,
  brandPaletteCss,
  checkBrandPalette,
  resolveBrandPalette,
  type BrandPaletteInput,
  type ResolvedBrandPalette
} from './resolve'
import {
  BRAND_ATTRIBUTE,
  BRAND_SHELL_ATTRIBUTE,
  BRAND_HEADER_ATTRIBUTE,
  BRAND_SURFACES_ATTRIBUTE,
  BRAND_TEXTURE_ATTRIBUTE
} from './slots'
import { parseHex, toOklch } from './color'
import { fnv1a } from '../hash'

/** The textures a brand can be given. `none` is a choice, never a derived one. */
export const BRAND_TEXTURES = ['diagonal', 'dots', 'wash'] as const
export type BrandTexture = (typeof BRAND_TEXTURES)[number]

/**
 * The texture a brand's notes are drawn on, derived from its primary colour.
 * Every app used to have the diagonal lines, because that was the default
 * and nothing gave a builder a reason to choose. A hash of the colour is
 * arbitrary, and that is the point: it is stable for one company and spreads
 * companies across the three, with no decision for anyone to skip.
 */
export function brandTexture(palette: Pick<ResolvedBrandPalette, 'slots'>): BrandTexture {
  return BRAND_TEXTURES[fnv1a(palette.slots.primary.toLowerCase()) % BRAND_TEXTURES.length]
}

/** The subset of `Document` `applyBrand` touches, so it can run against a stub in tests. */
export interface BrandDocument {
  documentElement: {
    setAttribute(name: string, value: string): void
    removeAttribute(name: string): void
    getAttributeNames(): string[]
    classList: { toggle(token: string, force?: boolean): boolean }
  }
  head: { append(node: unknown): void }
  getElementById(id: string): { textContent: string | null } | null
  createElement(tag: string): { id: string; textContent: string | null }
}

export interface ApplyBrandOptions extends ContractOptions {
  /** `'auto'` (default) follows `palette.theme`; a generator balancing a gallery passes it explicitly. */
  theme?: 'auto' | 'light' | 'dark'
  /** A dialect object or a preset name; omitted = the kit as shipped. */
  dialect?: Dialect | keyof typeof DIALECT_PRESETS
  /** The canvas tint strength; see `BrandPaletteInput.canvas`. */
  canvas?: BrandPaletteInput['canvas']
  /**
   * The texture behind a `<Callout>` that sets none. Omitted, it is derived
   * from the primary colour (`brandTexture`); `'none'` leaves the flat tint.
   */
  texture?: BrandTexture | 'none'
  /**
   * What a `<PageHeader>` that sets no `variant` stands on. Omitted, it is
   * derived from the primary colour (`brandHeader`).
   */
  header?: BrandHeaderStyle
}

const STYLE_ID = 'trayo-brand'

/** What a brand's page header can stand on. */
export const BRAND_HEADERS = ['plain', 'card', 'band'] as const
export type BrandHeaderStyle = (typeof BRAND_HEADERS)[number]

/** Under this OKLCH chroma a primary is a grey, and its container is one too. */
const HEADER_NEUTRAL_CHROMA = 0.04

/**
 * What a brand's page header stands on, derived from its primary colour.
 * Builders left it at `plain` almost every time, so the brand band, the one
 * header that makes a tool look like the company's own, was never seen.
 *
 * A primary with a hue gets the band two times in three and its own card the
 * third. A black, white or grey primary gets `plain`: its container is a
 * grey, and a grey band at the top of a page reads as a disabled one.
 */
export function brandHeader(palette: Pick<ResolvedBrandPalette, 'slots'>): BrandHeaderStyle {
  const primary = palette.slots.primary.toLowerCase()
  const rgb = parseHex(primary)
  if (!rgb || toOklch(rgb).c < HEADER_NEUTRAL_CHROMA) return 'plain'
  // A different salt from the texture's, so the two do not move together.
  return fnv1a(`header:${primary}`) % 3 === 2 ? 'card' : 'band'
}

/**
 * Brands a document in one call — the whole sequence a build agent would
 * otherwise have to get right in order: contract → slots → check → resolve →
 * stylesheet → attributes → theme class → dialect. Idempotent: calling it
 * again replaces the previous brand. Returns the palette (its `adjustments`
 * and `theme` are worth logging).
 *
 * Throws when the contract fails `checkBrandPalette`, with the problems in
 * the message, so a bad contract never ships half-applied.
 */
export function applyBrand(
  doc: BrandDocument,
  contract: BrandThemeContract | BrandPaletteInput,
  { theme = 'auto', dialect, canvas, texture, header, ...contractOptions }: ApplyBrandOptions = {}
): ResolvedBrandPalette {
  // A raw BrandPaletteInput can carry every contract field too; mapping it
  // through the contract must not lose the fields only the raw shape has.
  const input: BrandPaletteInput = isContract(contract)
    ? {
        ...fromBrandThemeContract(contract, contractOptions).input,
        ...pick(contract as BrandPaletteInput, ['secondary', 'emphasis', 'canvas'])
      }
    : { ...contract, ...(contractOptions.surfaces ? { surfaces: contractOptions.surfaces } : {}) }
  if (canvas) input.canvas = canvas
  const problems = checkBrandPalette(input)
  if (problems.length) {
    throw new Error(`applyBrand: invalid brand palette — ${problems.map((p) => p.message).join(' ')}`)
  }
  const palette = resolveBrandPalette(input)

  const root = doc.documentElement
  for (const name of root.getAttributeNames()) {
    if (name.startsWith('data-brand') || name.startsWith('data-dialect-')) root.removeAttribute(name)
  }
  const existing = doc.getElementById(STYLE_ID)
  const css = brandPaletteCss(palette, 'html')
  if (existing) existing.textContent = css
  else {
    const style = doc.createElement('style')
    style.id = STYLE_ID
    style.textContent = css
    doc.head.append(style)
  }
  for (const [k, v] of Object.entries(brandAttributes(palette))) root.setAttribute(k, v)
  root.setAttribute(BRAND_TEXTURE_ATTRIBUTE, texture ?? brandTexture(palette))
  root.setAttribute(BRAND_HEADER_ATTRIBUTE, header ?? brandHeader(palette))
  root.classList.toggle('dark', theme === 'dark' || (theme === 'auto' && palette.theme === 'dark'))
  const dialectValue = typeof dialect === 'string' ? DIALECT_PRESETS[dialect] : dialect
  if (dialectValue)
    for (const [k, v] of Object.entries(dialectAttributes(dialectValue))) root.setAttribute(k, v)
  return palette
}

/** Attribute names `applyBrand` may set, for anything that wants to clear them. */
export const BRAND_ROOT_ATTRIBUTES = [
  BRAND_ATTRIBUTE,
  BRAND_SHELL_ATTRIBUTE,
  BRAND_SURFACES_ATTRIBUTE,
  BRAND_TEXTURE_ATTRIBUTE,
  BRAND_HEADER_ATTRIBUTE
] as const

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

function isContract(value: BrandThemeContract | BrandPaletteInput): value is BrandThemeContract {
  return 'background' in value && 'text' in value && 'onPrimary' in value
}
