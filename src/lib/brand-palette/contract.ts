import { parseHex, toHex } from './color'
import { isLightShell, type BrandPaletteInput } from './resolve'

/**
 * The palette a brand-research agent writes for a company (the brand theme
 * contract): eight named colours plus optional accents, all hex.
 * `brandSlotsAgentGuide()` is the prompt that produces it.
 */
export interface BrandThemeContract {
  /** Buttons and brand emphasis. */
  primary: string
  /** Text on the primary colour. */
  onPrimary: string
  /** Navigation or header. */
  shell: string
  /** Text inside the shell. */
  onShell: string
  /** The page background. */
  background: string
  /** Cards and panels. */
  surface: string
  /** Main readable text. */
  text: string
  /** Supporting text. */
  mutedText: string
  /** Optional colours for charts and small highlights. */
  accents?: string[]
  /** Optional: the brand's own dark-mode fill. */
  primaryDark?: string | null
}

/** The page-and-text fields; left out with `surfaces: 'trayo'`. */
export const CONTRACT_SURFACE_FIELDS = ['background', 'surface', 'text', 'mutedText'] as const

export interface ContractOptions {
  /**
   * `'brand'` (default): the company's styling is the canvas — the contract's
   * background, surface, text and mutedText apply, and Trayo contributes the
   * language (components, type, radius, grain, motion, status colours).
   * `'trayo'`: accent-only — the page, cards and text stay Trayo's cream;
   * only the accent, charts and chrome take the brand.
   */
  surfaces?: 'brand' | 'trayo'
}

export interface ContractMapping {
  input: BrandPaletteInput
  /** What was dropped or kept as Trayo's, and why, for the agent or a reviewer. */
  notes: string[]
}

/**
 * Maps a theme-contract palette onto the brand slots:
 *
 * - `primary`, `onPrimary`, `shell`, `onShell`, `accents`, `primaryDark` →
 *   the same slots (the resolver keeps the `on*` colours only when they are
 *   readable, and turns accents into chart series 2–5);
 * - `background`, `surface`, `text`, `mutedText` → the same slots (the
 *   default); `surfaces: 'trayo'` leaves them out so the page stays Trayo's.
 *
 * A light shell (the brand's navigation is white) is left out so the Trayo
 * top bar stays; the resolver would reject it.
 */
export function fromBrandThemeContract(
  contract: BrandThemeContract,
  { surfaces = 'brand' }: ContractOptions = {}
): ContractMapping {
  const notes: string[] = []
  const norm = (value: string | null | undefined) => {
    const rgb = value ? parseHex(value) : null
    return rgb ? toHex(rgb) : null
  }
  const primary = norm(contract.primary)
  const shell = norm(contract.shell)
  const background = norm(contract.background)

  let keepShell = shell
  if (shell && (shell === background || isLightShell(parseHex(shell)!))) {
    keepShell = null
    notes.push(`shell ${shell} is light or the same as the page, so the Trayo top bar is kept.`)
  }

  const accents = (contract.accents ?? []).map(norm).filter((a): a is string => a !== null)
  if (accents.length > 4) {
    notes.push(`${accents.length - 4} accent(s) beyond the fourth are not applied: charts have five series.`)
  }

  const input: BrandPaletteInput = {
    // An unparseable primary is passed through as-is so checkBrandPalette
    // reports it with the agent's own value.
    primary: primary ?? contract.primary,
    onPrimary: contract.onPrimary,
    primaryDark: contract.primaryDark ?? null,
    accents,
    shell: keepShell,
    onShell: keepShell ? contract.onShell : null
  }

  if (surfaces === 'brand') {
    input.background = contract.background
    input.surface = contract.surface
    input.text = contract.text
    input.mutedText = contract.mutedText
  } else {
    for (const field of CONTRACT_SURFACE_FIELDS) {
      notes.push(
        `${field} ${contract[field]} is not applied: Trayo UI keeps its own ${field} (surfaces: 'trayo').`
      )
    }
  }

  return { input, notes }
}
