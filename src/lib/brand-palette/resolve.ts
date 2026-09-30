import {
  composite,
  contrast,
  fromOklch,
  parseHex,
  quantize,
  shiftLightnessUntil,
  toHex,
  toOklch,
  toRgbChannels,
  luminance,
  type RGB
} from './color'
import {
  BRAND_ATTRIBUTE,
  BRAND_SHELL_ATTRIBUTE,
  BRAND_SHELL_TOKENS,
  BRAND_TOKENS,
  type BrandShellToken,
  type BrandToken
} from './slots'

/**
 * Trayo UI's surfaces and text, copied from tokens.css (a spec keeps them
 * equal). Derived brand colours are checked against these, because the brand
 * never changes them.
 */
export const TRAYO_SURFACES = {
  light: { shell: '#fdf9ee', well: '#f8f1df', card: '#fffdf8', raised: '#ffffff', text: '#1c1a17' },
  dark: { shell: '#12141b', well: '#161921', card: '#232835', raised: '#384055', text: '#eaecf1' }
} as const

/** WCAG AA for body-size text, and the non-text minimum for rings and fills. */
export const TEXT_CONTRAST = 4.5
export const NON_TEXT_CONTRAST = 3

/** OKLCH chroma under which a colour reads as a grey (black-and-white brands). */
const NEUTRAL_CHROMA = 0.04
/** OKLCH lightness of the near-white dark-mode fill for a black-and-white brand. */
const NEUTRAL_DARK_FILL_L = 0.93
/**
 * Trayo's sequential chart ramp (tokens.css CHART PALETTE) as OKLCH
 * lightness/chroma steps, light→dark on cream and dim→bright on the dark card.
 */
const SEQ_LIGHT = [
  [0.78, 0.1],
  [0.69, 0.15],
  [0.6, 0.2],
  [0.5, 0.2],
  [0.4, 0.17]
] as const
const SEQ_DARK = [
  [0.5, 0.14],
  [0.58, 0.17],
  [0.66, 0.18],
  [0.74, 0.14],
  [0.82, 0.09]
] as const
/** A brand at least this saturated gets the ramp's full chroma. */
const SEQ_REFERENCE_CHROMA = 0.2
/** OKLCH lightness above which a shell reads as page, not brand chrome. */
const LIGHT_SHELL_L = 0.93

export interface BrandPaletteInput {
  primary: string
  secondary?: string | null
  primaryDark?: string | null
  shell?: string | null
  /**
   * Optional text colours from a palette that already names them (the brand
   * theme contract). Used only when they clear 4.5:1 on their fill; the
   * derived colour replaces them otherwise, with a note in `adjustments`.
   */
  onPrimary?: string | null
  onShell?: string | null
}

export interface BrandPaletteProblem {
  slot: keyof BrandPaletteInput
  message: string
}

export interface ResolvedBrandPalette {
  /** The slots as lowercase `#rrggbb`, null when omitted. */
  slots: { primary: string; secondary: string | null; primaryDark: string | null; shell: string | null }
  /** Shell tokens are present only when the palette has a shell. */
  tokens: Record<BrandToken, string> & Partial<Record<BrandShellToken, string>>
  /**
   * Where a derived colour had to move away from the slot to stay readable,
   * in words an agent or a reviewer can act on. Informational: the tokens are
   * already safe.
   */
  adjustments: string[]
}

const hexOf = (rgb: RGB) => toHex(rgb)
/** OKLCH lightness step between the two ends of a one-colour brand gradient. */
const GRADIENT_STEP = 0.18
const shiftL = (rgb: RGB, delta: number) => {
  const c = toOklch(rgb)
  return fromOklch({ ...c, l: c.l + delta })
}
const gradient = (from: RGB, to: RGB) => `linear-gradient(135deg, ${hexOf(from)} 0%, ${hexOf(to)} 100%)`
const rgba = (rgb: RGB, alpha: number) => `rgb(${toRgbChannels(rgb)} / ${alpha})`
const isNeutral = (rgb: RGB) => toOklch(rgb).c < NEUTRAL_CHROMA

/** A shell this light reads as page, not brand chrome; the resolver rejects it. */
export function isLightShell(rgb: RGB): boolean {
  return toOklch(rgb).l > LIGHT_SHELL_L
}

/** White or Trayo's ink on `fill`, whichever reads better (black as a last resort). */
function onColor(fill: RGB, ink: RGB): RGB {
  const white: RGB = [1, 1, 1]
  if (contrast(white, fill) >= TEXT_CONTRAST) return white
  if (contrast(ink, fill) >= TEXT_CONTRAST) return ink
  return contrast(white, fill) >= contrast([0, 0, 0], fill) ? white : [0, 0, 0]
}

/**
 * Validates slot values. An empty list means `resolveBrandPalette` will
 * accept them; a problem names the slot so an agent can be asked again.
 */
export function checkBrandPalette(input: BrandPaletteInput): BrandPaletteProblem[] {
  const problems: BrandPaletteProblem[] = []
  const primary = parseHex(input.primary ?? '')
  if (!primary) {
    problems.push({
      slot: 'primary',
      message: `primary must be a hex colour, got ${JSON.stringify(input.primary)}`
    })
  } else if (toOklch(primary).l > 0.96) {
    problems.push({
      slot: 'primary',
      message: `primary ${hexOf(primary)} is near-white, which reads as background, not brand. Pick the brand colour, or its black for a black-and-white brand.`
    })
  }
  for (const slot of ['secondary', 'primaryDark', 'shell', 'onPrimary', 'onShell'] as const) {
    const value = input[slot]
    if (value == null || value === '') continue
    const rgb = parseHex(value)
    if (!rgb) {
      problems.push({ slot, message: `${slot} must be a hex colour or null, got ${JSON.stringify(value)}` })
    } else if (slot === 'secondary' && primary && hexOf(rgb) === hexOf(primary)) {
      problems.push({ slot, message: 'secondary repeats primary; omit it instead.' })
    } else if (slot === 'shell' && isLightShell(rgb)) {
      problems.push({
        slot,
        message: `shell ${hexOf(rgb)} is white or near-white, so it would look like the page. Omit shell for a brand with light navigation.`
      })
    }
  }
  return problems
}

/**
 * Turns the slots into every token Trayo UI's `[data-brand]` block reads.
 * Throws on slots `checkBrandPalette` rejects.
 */
export function resolveBrandPalette(input: BrandPaletteInput): ResolvedBrandPalette {
  const problems = checkBrandPalette(input)
  if (problems.length) {
    throw new Error(`Invalid brand palette: ${problems.map((p) => p.message).join(' ')}`)
  }
  const L = mapValues(TRAYO_SURFACES.light, (v) => parseHex(v)!)
  const D = mapValues(TRAYO_SURFACES.dark, (v) => parseHex(v)!)
  const adjustments: string[] = []

  const primary = parseHex(input.primary)!
  const secondary = input.secondary ? parseHex(input.secondary)! : null
  const primaryDarkSlot = input.primaryDark ? parseHex(input.primaryDark)! : null

  // ── Light ──────────────────────────────────────────────────────────────
  const onPrimary = givenOrDerived(
    'onPrimary',
    input.onPrimary,
    primary,
    onColor(primary, L.text),
    adjustments
  )
  // Quantized: text is checked against the tooltip as it is written (hex).
  const tooltip = quantize(composite(primary, 0.1, L.card))
  const lightTextBackgrounds = [L.shell, L.well, L.card, L.raised, tooltip]
  const accentText = shiftLightnessUntil(primary, 'darker', (c) =>
    lightTextBackgrounds.every((bg) => contrast(c, bg) >= TEXT_CONTRAST)
  )
  if (hexOf(accentText) !== hexOf(primary)) {
    adjustments.push(
      `primary ${hexOf(primary)} is under ${TEXT_CONTRAST}:1 as text on the light page; links and accent text use ${hexOf(accentText)}.`
    )
  }
  const ringVisible = [L.shell, L.well, L.card].every((bg) => contrast(primary, bg) >= NON_TEXT_CONTRAST)
  const ring = ringVisible ? primary : accentText
  if (!ringVisible) {
    adjustments.push(
      `primary ${hexOf(primary)} is under ${NON_TEXT_CONTRAST}:1 on the light page; focus rings and accent borders use ${hexOf(ring)}.`
    )
  }

  // ── Dark ───────────────────────────────────────────────────────────────
  let darkFill: RGB
  if (primaryDarkSlot) {
    darkFill = primaryDarkSlot
  } else if (isNeutral(primary)) {
    darkFill = quantize(fromOklch({ ...toOklch(primary), l: NEUTRAL_DARK_FILL_L }))
    adjustments.push(
      `primary ${hexOf(primary)} has no hue; dark mode fills with near-white ${hexOf(darkFill)} instead of lifting it.`
    )
  } else {
    darkFill = primary
  }
  const liftedFill = shiftLightnessUntil(
    darkFill,
    'lighter',
    (c) => contrast(c, D.shell) >= NON_TEXT_CONTRAST
  )
  if (hexOf(liftedFill) !== hexOf(darkFill)) {
    adjustments.push(
      `the dark-mode fill ${hexOf(darkFill)} is under ${NON_TEXT_CONTRAST}:1 on the dark page; it is lifted to ${hexOf(liftedFill)}.`
    )
    darkFill = liftedFill
  }
  const onPrimaryDark = onColor(darkFill, L.text)
  const darkTextBackgrounds = [D.shell, D.well, D.card, D.raised]
  const accentTextDark = shiftLightnessUntil(darkFill, 'lighter', (c) =>
    darkTextBackgrounds.every((bg) => contrast(c, bg) >= TEXT_CONTRAST)
  )
  // Trayo's dark line is the text tone at 55%; a brand whose text only just
  // clears 4.5 needs a little more opacity for the line to stay visible.
  const lineAlphaDark = lowestAlpha(accentTextDark, D.card, 0.55)

  // Brand gradient: primary → secondary, or → a lighter (dark: dimmer) step of
  // the fill when there is no secondary, so it never runs back to the other
  // theme's fill (a black-and-white brand would otherwise fade white → black).
  const gradientEnd = secondary ?? shiftL(primary, GRADIENT_STEP)
  const gradientEndDark = secondary ?? shiftL(darkFill, -GRADIENT_STEP)

  // The chart and shell tokens are added below.
  const tokens = {
    '--brand-primary': hexOf(primary),
    '--brand-primary-rgb': toRgbChannels(primary),
    '--brand-on-primary': hexOf(onPrimary),
    '--brand-secondary': hexOf(secondary ?? primary),
    '--brand-secondary-rgb': toRgbChannels(secondary ?? primary),
    '--brand-accent-text': hexOf(accentText),
    '--brand-ring': hexOf(ring),
    '--brand-accent-soft': rgba(primary, 0.1),
    '--brand-accent-line': rgba(ring, 0.38),
    '--brand-tooltip': hexOf(tooltip),
    '--brand-gradient': gradient(primary, gradientEnd),
    '--brand-primary-dark': hexOf(darkFill),
    '--brand-primary-dark-rgb': toRgbChannels(darkFill),
    '--brand-on-primary-dark': hexOf(onPrimaryDark),
    '--brand-accent-text-dark': hexOf(accentTextDark),
    '--brand-accent-soft-dark': rgba(darkFill, 0.16),
    '--brand-accent-line-dark': rgba(accentTextDark, lineAlphaDark),
    '--brand-gradient-dark': gradient(darkFill, gradientEndDark)
  } as ResolvedBrandPalette['tokens']

  // ── Charts: the sequential (intensity) ramp in the brand's hue ─────────
  // Trayo's ramp is violet (hue 293) at fixed lightness steps; a brand keeps
  // the steps and swaps the hue. Chroma scales with the brand's own, so a
  // black-and-white brand gets a grey ramp rather than an invented hue.
  const hue = toOklch(primary).h
  const chromaScale = Math.min(1, toOklch(primary).c / SEQ_REFERENCE_CHROMA)
  const ramp = (steps: readonly (readonly [number, number])[]) =>
    steps.map(([l, c]) => hexOf(quantize(fromOklch({ l, c: c * chromaScale, h: hue }))))
  const seq = ramp(SEQ_LIGHT)
  const seqDark = ramp(SEQ_DARK)
  seq.forEach((v, i) => (tokens[`--brand-seq-${i + 1}` as BrandToken] = v))
  seqDark.forEach((v, i) => (tokens[`--brand-seq-dark-${i + 1}` as BrandToken] = v))

  // ── Shell (same in both themes: it is the brand's own chrome) ─────────
  const shell = input.shell ? parseHex(input.shell)! : null
  if (shell) Object.assign(tokens, resolveShell(shell, input.onShell, L.text, adjustments))

  return {
    slots: {
      primary: hexOf(primary),
      secondary: secondary ? hexOf(secondary) : null,
      primaryDark: primaryDarkSlot ? hexOf(primaryDarkSlot) : null,
      shell: shell ? hexOf(shell) : null
    },
    tokens,
    adjustments
  }
}

/**
 * Text, hover, selection and border inside a shell region. Secondary and muted
 * text are the on-shell colour at the lowest opacity that still reads on the
 * shell and on its hover and selected rows (4.5:1 and 3:1), flattened to hex.
 */
function resolveShell(
  shell: RGB,
  onShellInput: string | null | undefined,
  ink: RGB,
  adjustments: string[]
): Record<BrandShellToken, string> {
  const onShell = givenOrDerived('onShell', onShellInput, shell, onColor(shell, ink), adjustments)
  // Rows normally tint toward the text colour. On a mid-tone shell that eats
  // the text's margin, so the rows tint away from it instead (darker under
  // light text, lighter under dark text), which only adds contrast.
  const towardText = [0.08, 0.14].map((a) => quantize(composite(onShell, a, shell)))
  const readsOn = (rows: RGB[]) => rows.every((bg) => contrast(onShell, bg) >= TEXT_CONTRAST)
  const away: RGB = luminance(onShell) > luminance(shell) ? [0, 0, 0] : [1, 1, 1]
  const [hover, active] = readsOn(towardText)
    ? towardText
    : [0.08, 0.14].map((a) => quantize(composite(away, a, shell)))
  const rows = [shell, hover, active]
  const secondary = textAtLowestAlpha(onShell, shell, rows, TEXT_CONTRAST, 0.72)
  const muted = textAtLowestAlpha(onShell, shell, rows, NON_TEXT_CONTRAST, 0.55)
  return {
    '--brand-shell': hexOf(shell),
    '--brand-on-shell': hexOf(onShell),
    '--brand-on-shell-secondary': hexOf(secondary),
    '--brand-on-shell-muted': hexOf(muted),
    '--brand-shell-hover': hexOf(hover),
    '--brand-shell-active': hexOf(active),
    '--brand-shell-border': hexOf(quantize(composite(onShell, 0.16, shell)))
  }
}

/** A supplied text colour when it clears 4.5:1 on `fill`, else the derived one (noted). */
function givenOrDerived(
  name: 'onPrimary' | 'onShell',
  value: string | null | undefined,
  fill: RGB,
  derived: RGB,
  adjustments: string[]
): RGB {
  const given = value ? parseHex(value) : null
  if (!given) return derived
  if (contrast(given, fill) >= TEXT_CONTRAST) return given
  adjustments.push(
    `${name} ${hexOf(given)} is under ${TEXT_CONTRAST}:1 on ${hexOf(fill)}; ${hexOf(derived)} is used instead.`
  )
  return derived
}

/** `fg` over `bg` at the lowest alpha ≥ `from` (0.05 steps) that clears `min` on every background. */
function textAtLowestAlpha(fg: RGB, bg: RGB, backgrounds: RGB[], min: number, from: number): RGB {
  for (let alpha = from; alpha < 1; alpha = Math.round((alpha + 0.05) * 100) / 100) {
    const candidate = quantize(composite(fg, alpha, bg))
    if (backgrounds.every((b) => contrast(candidate, b) >= min)) return candidate
  }
  return fg
}

/**
 * A stylesheet that brands everything under `selector` (the whole app by
 * default). Put it after Trayo UI's tokens.css, e.g. in a `<style>` tag.
 */
export function brandPaletteCss(palette: ResolvedBrandPalette, selector = `[${BRAND_ATTRIBUTE}]`): string {
  const body = Object.entries(brandPaletteStyle(palette))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}\n`
}

/**
 * The attributes to put on the branded element (`<html>` for an app):
 * `data-brand`, plus `data-brand-shell` when the palette has a shell.
 */
export function brandAttributes(palette: ResolvedBrandPalette): Record<string, string> {
  return palette.slots.shell
    ? { [BRAND_ATTRIBUTE]: '', [BRAND_SHELL_ATTRIBUTE]: '' }
    : { [BRAND_ATTRIBUTE]: '' }
}

/**
 * The same tokens as a React `style` object, to brand one subtree (add the
 * `data-brand` attribute on the same element). Portaled popovers and dialogs
 * render outside the subtree, so brand the `<html>` element for a whole app.
 */
export function brandPaletteStyle(palette: ResolvedBrandPalette): Record<string, string> {
  const names = palette.slots.shell ? [...BRAND_TOKENS, ...BRAND_SHELL_TOKENS] : BRAND_TOKENS
  return Object.fromEntries(names.map((name) => [name, palette.tokens[name]!]))
}

/** The smallest alpha ≥ `from` (in 0.05 steps) at which `fg` over `bg` clears the non-text minimum. */
function lowestAlpha(fg: RGB, bg: RGB, from: number): number {
  for (let alpha = from; alpha < 1; alpha = Math.round((alpha + 0.05) * 100) / 100) {
    if (contrast(composite(fg, alpha, bg), bg) >= NON_TEXT_CONTRAST) return alpha
  }
  return 1
}

function mapValues<T extends Record<string, string>, R>(obj: T, fn: (v: string) => R): { [K in keyof T]: R } {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)])) as { [K in keyof T]: R }
}
