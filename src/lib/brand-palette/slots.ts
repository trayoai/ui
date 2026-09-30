/**
 * The brand slots: the only colours an agent (or a person) chooses when a
 * Trayo UI app should wear a company's brand. Everything else — tints,
 * borders, readable text, dark mode, the colour of text on a filled button —
 * is derived by `resolveBrandPalette`, so every app with the same slots looks
 * the same.
 *
 * The slots are the fields of the brand theme contract (the JSON a
 * brand-research agent writes: primary, onPrimary, shell, onShell,
 * background, surface, text, mutedText, accents), plus `primaryDark`. This
 * object is the contract's documentation: `role` says where a colour shows,
 * `choose` says how to pick it from the company's colours (logo APIs list
 * them by prominence, not by role), and tokens.css names the same slots in
 * its `[data-brand]` blocks.
 */

export type BrandSlotName =
  | 'primary'
  | 'onPrimary'
  | 'secondary'
  | 'primaryDark'
  | 'shell'
  | 'onShell'
  | 'background'
  | 'surface'
  | 'text'
  | 'mutedText'
  | 'accents'

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
      'selected states, tinted backgrounds, accent borders and chart series 1. Covers about 5% of the screen.',
    choose:
      "Pick the colour the brand is known for, not the first colour listed: PayPal's logo.dev list starts " +
      'with #000000, but its brand is the blue. Skip white, off-white and pale tints of another colour. ' +
      'If the brand has no hue (Apple, Notion: black, white, greys), use its black; do not invent a hue.'
  },
  onPrimary: {
    cssVar: '--brand-on-primary',
    required: false,
    role: 'Text and icons on a primary fill.',
    choose:
      "Usually #ffffff, or the brand's ink on a light primary. It is kept only when it reads at 4.5:1 on " +
      'primary; otherwise white or ink is chosen for you, so do not adjust it for contrast.'
  },
  secondary: {
    cssVar: '--brand-secondary',
    required: false,
    role:
      'A second brand colour for decoration only: the end of the brand gradient and the cool layer of ' +
      'the brand mesh. Never used for text or controls. Taken from the first accent when not set.',
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
  },
  onShell: {
    cssVar: '--brand-on-shell',
    required: false,
    role: 'Text inside the shell.',
    choose: 'Usually #ffffff on a dark shell. Kept only when it reads at 4.5:1 on shell; derived otherwise.'
  },
  background: {
    cssVar: '--brand-background',
    required: false,
    role:
      "The page canvas, when the app should take the brand's surfaces instead of Trayo's cream (a complete " +
      'override). The well, hover row and page gradient are derived from it; dark mode takes its hue on ' +
      "Trayo's dark ladder.",
    choose:
      "The brand's own page background, light (#ffffff for most). Omit background, surface, text and " +
      "mutedText together to keep Trayo's surfaces and only brand the accent and chrome."
  },
  surface: {
    cssVar: '--brand-surface',
    required: false,
    role: 'Cards and panels on the page. The raised popover surface is derived from it.',
    choose:
      "The brand's card colour, at least as light as background. Defaults to background lifted slightly."
  },
  text: {
    cssVar: '--brand-text',
    required: false,
    role: 'Main readable text on the brand surfaces. Borders are derived from it.',
    choose:
      "The brand's ink (#1d1c1d for Slack). It is darkened if it does not read at 4.5:1 on every surface."
  },
  mutedText: {
    cssVar: '--brand-text-secondary',
    required: false,
    role: 'Supporting text; the muted (meta) tone is derived as a lighter step of it.',
    choose: "The brand's secondary text colour. Darkened if it does not read at 4.5:1 on every surface."
  },
  accents: {
    cssVar: '--brand-chart-2',
    required: false,
    role:
      'Colours for charts and small highlights, in order: they become chart series 2, 3, 4 and 5 after ' +
      "primary (series 1); missing ones are filled from Trayo's series, skipping hues already taken. The " +
      'first accent is also the secondary when none is set.',
    choose:
      "The brand's other palette colours, distinct from each other and from primary (Slack's blue, green, " +
      'yellow, red). Skip white, black and greys. Up to four are used.'
  }
}

/** The attribute that switches Trayo UI's accent tokens to the brand slots. */
export const BRAND_ATTRIBUTE = 'data-brand'
/** Set beside `data-brand` when the palette has a shell; paints shell regions. */
export const BRAND_SHELL_ATTRIBUTE = 'data-brand-shell'
/** Set beside `data-brand` when the palette overrides the page surfaces and text. */
export const BRAND_SURFACES_ATTRIBUTE = 'data-brand-surfaces'
/** Marks an element (the AppShell top bar, a sidebar) that takes the brand shell colour. */
export const SHELL_REGION_ATTRIBUTE = 'data-shell-region'

/** Custom properties every palette emits, in emit order. */
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
 * Always emitted: the brand's container tone (Material 3's primaryContainer,
 * tone 90 / on 10; dark 30 / 90) for fills that carry the brand strongly —
 * tinted cards, stat tiles, table headers, selected rows — plus the tertiary
 * container for two-tone screens.
 */
export const BRAND_CONTAINER_TOKENS = [
  '--brand-container',
  '--brand-on-container',
  '--brand-container-tertiary',
  '--brand-on-container-tertiary',
  '--brand-container-dark',
  '--brand-on-container-dark',
  '--brand-container-tertiary-dark',
  '--brand-on-container-tertiary-dark'
] as const

export type BrandContainerToken = (typeof BRAND_CONTAINER_TOKENS)[number]

/** Emitted with `emphasis: 'bold'` (the default): the mesh band's warm layers in the brand's colours. */
export const BRAND_MESH_TOKENS = [
  '--brand-mesh-warm-rgb',
  '--brand-mesh-warm-2-rgb',
  '--brand-mesh-warm-3-rgb'
] as const

export type BrandMeshToken = (typeof BRAND_MESH_TOKENS)[number]

/** Emitted only when the palette overrides the surfaces (has a background). */
export const BRAND_SURFACE_TOKENS = [
  '--brand-background',
  '--brand-surface',
  '--brand-well',
  '--brand-row',
  '--brand-raised',
  '--brand-text',
  '--brand-text-secondary',
  '--brand-text-muted',
  '--brand-border-subtle',
  '--brand-border-strong',
  '--brand-background-dark',
  '--brand-surface-dark',
  '--brand-well-dark',
  '--brand-row-dark',
  '--brand-raised-dark'
] as const

export type BrandSurfaceToken = (typeof BRAND_SURFACE_TOKENS)[number]

/** Emitted per accent given: series 2–5, light and dark. */
export const BRAND_CHART_TOKENS = [
  '--brand-chart-2',
  '--brand-chart-3',
  '--brand-chart-4',
  '--brand-chart-5',
  '--brand-chart-dark-2',
  '--brand-chart-dark-3',
  '--brand-chart-dark-4',
  '--brand-chart-dark-5'
] as const

export type BrandChartToken = (typeof BRAND_CHART_TOKENS)[number]

/**
 * Instructions for an agent that researches a company's brand and writes its
 * theme contract, built from `BRAND_SLOTS` so the prompt and the contract
 * cannot drift. Append the company's name, domain, description and any
 * colours a logo API returned when calling it.
 */
export function brandSlotsAgentGuide(): string {
  const lines = [
    "Write the brand theme contract for a Trayo UI app from the company's colours.",
    'Answer with JSON, hex colours only:',
    '{"primary": "#rrggbb", "onPrimary": "#rrggbb", "shell": "#rrggbb" | null, "onShell": "#rrggbb" | null,',
    ' "background": "#rrggbb", "surface": "#rrggbb", "text": "#rrggbb", "mutedText": "#rrggbb",',
    ' "accents": ["#rrggbb", ...], "primaryDark": "#rrggbb" | null, "rationale": "<one sentence>"}',
    'Contrast, tints, hover states, borders and dark mode are derived for you; never adjust a colour for contrast.',
    ''
  ]
  for (const [name, slot] of Object.entries(BRAND_SLOTS)) {
    lines.push(`${name}${slot.required ? ' (required)' : ' (optional)'}`)
    lines.push(`  Role: ${slot.role}`)
    lines.push(`  How to choose: ${slot.choose}`)
  }
  lines.push(
    '',
    "Status colours (success, warning, danger), typography, radius and the warm glow stay Trayo's in every brand."
  )
  return lines.join('\n')
}
