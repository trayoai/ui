/**
 * The brand slots: the only colours an agent (or a person) chooses when a
 * Trayo UI app should wear a company's brand. Everything else — tints,
 * borders, readable text, dark mode, the colour of text on a filled button —
 * is derived by `resolveBrandPalette`, so every app with the same slots looks
 * the same.
 *
 * This object is the contract. It is written for the agent that fills it:
 * `role` says where the colour shows, `choose` says how to pick it from the
 * company's colours (logo.dev lists them by prominence, not by role), and
 * tokens.css names the same slots in its `[data-brand]` block.
 */

export type BrandSlotName = 'primary' | 'secondary' | 'primaryDark' | 'shell'

export interface BrandSlot {
  /** CSS custom property the resolved value lands in. */
  cssVar: `--brand-${string}`
  required: boolean
  role: string
  choose: string
}

export const BRAND_SLOTS: Readonly<Record<BrandSlotName, BrandSlot>> = {
  primary: {
    cssVar: '--brand-primary',
    required: true,
    role:
      'The colour people associate with the company. Fills primary buttons; drives links, focus rings, ' +
      'selected states, tinted backgrounds and borders. Covers about 5% of the screen.',
    choose:
      "Pick the colour the brand is known for, not the first colour listed: PayPal's logo.dev list starts " +
      'with #000000, but its brand is the blue. Skip white, off-white and pale tints of another colour. ' +
      'If the brand has no hue (Apple, Notion: black, white, greys), use its black; do not invent a hue.'
  },
  secondary: {
    cssVar: '--brand-secondary',
    required: false,
    role:
      'A second brand colour for decoration only: the end of the brand gradient and the cool layer of ' +
      'the brand mesh. Never used for text or controls.',
    choose:
      "Another colour from the brand's own palette that is clearly different from primary (PayPal's navy " +
      'next to its blue). Omit it rather than repeat primary or use a tint of it.'
  },
  primaryDark: {
    cssVar: '--brand-primary-dark',
    required: false,
    role: 'The button fill in dark mode. When omitted it is primary, lifted until it stands out on the dark page.',
    choose:
      'Set it only when the brand has an official dark-mode colour, or for a black-and-white brand, where a ' +
      'near-white fill is the right dark-mode answer. Otherwise omit it.'
  },
  shell: {
    cssVar: '--brand-shell',
    required: false,
    role:
      "The colour of the brand's own product chrome: fills the AppShell top bar and any element marked " +
      '`data-shell-region`. Often what makes an app recognisable: Slack is its aubergine chrome more than ' +
      'its buttons. Text, hover, fields and borders inside it are derived.',
    choose:
      "Use the colour the company's own product paints its navigation or header with (Slack #4a154b). Omit " +
      'it when that chrome is white or light: the Trayo top bar stays then.'
  }
}

/** The attribute that switches Trayo UI's accent tokens to the brand slots. */
export const BRAND_ATTRIBUTE = 'data-brand'
/** Set beside `data-brand` when the palette has a shell; paints shell regions. */
export const BRAND_SHELL_ATTRIBUTE = 'data-brand-shell'
/** Marks an element (the AppShell top bar, a sidebar) that takes the brand shell colour. */
export const SHELL_REGION_ATTRIBUTE = 'data-shell-region'

/** Every custom property `resolveBrandPalette` emits, in emit order. */
export const BRAND_TOKENS = [
  '--brand-primary',
  '--brand-primary-rgb',
  '--brand-on-primary',
  '--brand-secondary',
  '--brand-secondary-rgb',
  '--brand-accent-text',
  '--brand-ring',
  '--brand-accent-soft',
  '--brand-accent-line',
  '--brand-tooltip',
  '--brand-gradient',
  '--brand-primary-dark',
  '--brand-primary-dark-rgb',
  '--brand-on-primary-dark',
  '--brand-accent-text-dark',
  '--brand-accent-soft-dark',
  '--brand-accent-line-dark',
  '--brand-gradient-dark',
  '--brand-seq-1',
  '--brand-seq-2',
  '--brand-seq-3',
  '--brand-seq-4',
  '--brand-seq-5',
  '--brand-seq-dark-1',
  '--brand-seq-dark-2',
  '--brand-seq-dark-3',
  '--brand-seq-dark-4',
  '--brand-seq-dark-5'
] as const

export type BrandToken = (typeof BRAND_TOKENS)[number]

/** Emitted only when the palette has a shell. */
export const BRAND_SHELL_TOKENS = [
  '--brand-shell',
  '--brand-on-shell',
  '--brand-on-shell-secondary',
  '--brand-on-shell-muted',
  '--brand-shell-hover',
  '--brand-shell-active',
  '--brand-shell-border'
] as const

export type BrandShellToken = (typeof BRAND_SHELL_TOKENS)[number]

/**
 * Instructions for an agent that picks the slots, built from `BRAND_SLOTS` so
 * the prompt and the contract cannot drift. Append the company's name, domain
 * and logo.dev colours when calling it.
 */
export function brandSlotsAgentGuide(): string {
  const lines = [
    "Choose brand slots for a Trayo UI app from the company's colours.",
    'Answer with JSON: {"primary": "#rrggbb", "secondary": "#rrggbb" | null, "primaryDark": "#rrggbb" | null, "shell": "#rrggbb" | null, "rationale": "<one sentence>"}.',
    'Use only hex colours. Contrast, tints, text colours and dark mode are derived for you; do not adjust colours for contrast.',
    ''
  ]
  for (const [name, slot] of Object.entries(BRAND_SLOTS)) {
    lines.push(`${name}${slot.required ? ' (required)' : ' (optional)'}`)
    lines.push(`  Role: ${slot.role}`)
    lines.push(`  How to choose: ${slot.choose}`)
  }
  lines.push(
    '',
    'Never use brand colours for status (success, warning, danger), the page and card surfaces, body text or charts; Trayo keeps those.'
  )
  return lines.join('\n')
}
