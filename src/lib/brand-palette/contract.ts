import { parseHex, toHex } from './color'
import { isLightShell, type BrandPaletteInput } from './resolve'

/**
 * The palette a brand-research agent writes for a company (the brand theme
 * contract): eight named colours plus optional accents, all hex.
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
}

/** Contract fields Trayo UI keeps its own values for (the Trayo look). */
export const CONTRACT_FIELDS_NOT_APPLIED = ['background', 'surface', 'text', 'mutedText'] as const

export interface ContractMapping {
  input: BrandPaletteInput
  /** What was dropped or kept as Trayo's, and why, for the agent or a reviewer. */
  notes: string[]
}

/**
 * Maps a theme-contract palette onto the brand slots:
 *
 * - `primary`, `onPrimary`, `shell`, `onShell` → the same slots (the resolver
 *   keeps the `on*` colours only when they are readable);
 * - the first accent that differs from primary → `secondary`;
 * - `background`, `surface`, `text`, `mutedText` → not applied: page, cards and
 *   text stay Trayo's, so every branded app still looks like Trayo UI.
 *
 * A light shell (the brand's navigation is white) is left out so the Trayo
 * top bar stays; the resolver would reject it.
 */
export function fromBrandThemeContract(contract: BrandThemeContract): ContractMapping {
  const notes: string[] = []
  const norm = (value: string | undefined) => {
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
  const secondary = accents.find((a) => a !== primary) ?? null

  for (const field of CONTRACT_FIELDS_NOT_APPLIED) {
    notes.push(`${field} ${contract[field]} is not applied: Trayo UI keeps its own ${field}.`)
  }
  if (accents.length > 1) {
    notes.push(`${accents.length - 1} further accent(s) are not applied: charts keep Trayo's palette.`)
  }

  return {
    // An unparseable primary is passed through as-is so checkBrandPalette
    // reports it with the agent's own value.
    input: {
      primary: primary ?? contract.primary,
      onPrimary: contract.onPrimary,
      secondary,
      shell: keepShell,
      onShell: keepShell ? contract.onShell : null
    },
    notes
  }
}
