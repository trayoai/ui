import { fromBrandThemeContract, type BrandThemeContract, type ContractOptions } from './contract'
import { fillsAttributes, FILL_PRESETS, type Fills } from './fills'
import {
  brandAttributes,
  brandPaletteCss,
  checkBrandPalette,
  resolveBrandPalette,
  type BrandPaletteInput,
  type ResolvedBrandPalette
} from './resolve'
import { BRAND_ATTRIBUTE, BRAND_SHELL_ATTRIBUTE, BRAND_SURFACES_ATTRIBUTE } from './slots'

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
  /** Which surfaces take the brand's container tone: a list or a preset name; omitted = none. */
  fills?: Fills | keyof typeof FILL_PRESETS
  /** Which of the brand's colours leads; see `BrandPaletteInput.lead`. */
  lead?: BrandPaletteInput['lead']
  /**
   * The page's colour: `'default'` (the brand canvas), `'canvas'` (the whole
   * page in the brand's container tone, cards stay light) or `'inverse'`
   * (the page framed in the brand's shell colour, content on its usual sheet
   * inside). Colour only; sets `data-page` on `<html>`.
   */
  page?: 'default' | 'canvas' | 'inverse'
  /** The canvas tint strength; see `BrandPaletteInput.canvas`. */
  canvas?: BrandPaletteInput['canvas']
  /** Whether a brand with no coloured shell gets a derived bar; see `BrandPaletteInput.emphasis`. */
  emphasis?: BrandPaletteInput['emphasis']
}

const STYLE_ID = 'trayo-brand'

/**
 * Brands a document in one call — the whole sequence a build agent would
 * otherwise have to get right in order: contract → slots → check → resolve →
 * stylesheet → attributes → theme class → fills. Idempotent: calling it
 * again replaces the previous brand. Returns the palette (its `adjustments`
 * and `theme` are worth logging).
 *
 * Throws when the contract fails `checkBrandPalette`, with the problems in
 * the message, so a bad contract never ships half-applied.
 */
export function applyBrand(
  doc: BrandDocument,
  contract: BrandThemeContract | BrandPaletteInput,
  { theme = 'auto', fills, lead, canvas, page, emphasis, ...contractOptions }: ApplyBrandOptions = {}
): ResolvedBrandPalette {
  // A raw BrandPaletteInput can carry every contract field too; mapping it
  // through the contract must not lose the fields only the raw shape has.
  const input = toBrandInput(contract, contractOptions)
  if (canvas) input.canvas = canvas
  if (lead) input.lead = lead
  if (emphasis) input.emphasis = emphasis
  const problems = checkBrandPalette(input)
  if (problems.length) {
    throw new Error(`applyBrand: invalid brand palette — ${problems.map((p) => p.message).join(' ')}`)
  }
  const palette = resolveBrandPalette(input)

  const root = doc.documentElement
  for (const name of root.getAttributeNames()) {
    if (name.startsWith('data-brand') || name.startsWith('data-fill-') || name === 'data-page')
      root.removeAttribute(name)
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
  root.classList.toggle('dark', theme === 'dark' || (theme === 'auto' && palette.theme === 'dark'))
  const fillList = typeof fills === 'string' ? FILL_PRESETS[fills] : fills
  if (fillList) for (const [k, v] of Object.entries(fillsAttributes(fillList))) root.setAttribute(k, v)
  if (page && page !== 'default') root.setAttribute('data-page', page)
  return palette
}

/**
 * A contract or raw slots as resolver input. A raw BrandPaletteInput can
 * carry every contract field too; mapping it through the contract must not
 * lose the fields only the raw shape has.
 */
export function toBrandInput(
  contract: BrandThemeContract | BrandPaletteInput,
  options: ContractOptions = {}
): BrandPaletteInput {
  return isContract(contract)
    ? {
        ...fromBrandThemeContract(contract, options).input,
        ...pick(contract as BrandPaletteInput, ['secondary', 'emphasis', 'canvas', 'lead'])
      }
    : { ...contract }
}

/** Attribute names `applyBrand` may set, for anything that wants to clear them. */
export const BRAND_ROOT_ATTRIBUTES = [
  BRAND_ATTRIBUTE,
  BRAND_SHELL_ATTRIBUTE,
  BRAND_SURFACES_ATTRIBUTE
] as const

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

function isContract(value: BrandThemeContract | BrandPaletteInput): value is BrandThemeContract {
  return 'background' in value && 'text' in value && 'onPrimary' in value
}
