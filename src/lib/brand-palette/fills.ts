/**
 * Fills: which surfaces take the brand's container tone instead of staying
 * neutral. Colour only — components, type, radius and spacing are untouched.
 * A generator picks a set per app so two apps for different companies place
 * their colour differently; the kit applies it to every instance.
 *
 * Each target is one `data-fill-<target>` attribute on `<html>` that
 * tokens.css reads. The container tone comes from the resolved palette
 * (`--brand-container` / `--brand-on-container`), so text on a filled
 * surface is always readable.
 */

export const FILL_TARGETS = {
  cards: 'Surfaces and cards take the container tone instead of the card gradient.',
  tiles: 'Stat tiles take the container tone.',
  'table-head': 'The DataTable header row takes the container tone.'
} as const

export type FillTarget = keyof typeof FILL_TARGETS
export type Fills = readonly FillTarget[]

/** Named sets a generator can rotate through. */
export const FILL_PRESETS: Record<'none' | 'tiles' | 'cards' | 'all', Fills> = {
  none: [],
  tiles: ['tiles', 'table-head'],
  cards: ['cards'],
  all: ['cards', 'tiles', 'table-head']
}

/** Problems with a fills list an agent wrote. */
export function checkFills(fills: Fills): { target: string; message: string }[] {
  return fills
    .filter((f) => !(f in FILL_TARGETS))
    .map((f) => ({ target: String(f), message: `unknown fill target ${JSON.stringify(f)}` }))
}

/** The `data-fill-*` attributes for `<html>`. */
export function fillsAttributes(fills: Fills): Record<string, string> {
  return Object.fromEntries(fills.filter((f) => f in FILL_TARGETS).map((f) => [`data-fill-${f}`, '']))
}
