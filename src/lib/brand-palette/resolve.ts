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
  BRAND_SURFACES_ATTRIBUTE,
  type BrandChartToken,
  type BrandContainerToken,
  type BrandMeshToken,
  type BrandShellToken,
  type BrandSurfaceToken,
  type BrandToken
} from './slots'

/**
 * Trayo UI's surfaces and text, copied from tokens.css (a spec keeps them
 * equal). Derived brand colours are checked against these — or against the
 * brand's own surfaces when the palette overrides them.
 */
export const TRAYO_SURFACES = {
  light: { shell: '#fdf9ee', well: '#f8f1df', card: '#fffdf8', raised: '#ffffff', text: '#1c1a17' },
  dark: { shell: '#12141b', well: '#161921', card: '#232835', raised: '#384055', text: '#eaecf1' }
} as const

/** WCAG AA for body-size text, and the non-text minimum for rings and fills. */
export const TEXT_CONTRAST = 4.5
export const NON_TEXT_CONTRAST = 3

/**
 * What a derived secondary text tone clears on the page, well and card. Meta
 * text is held at TEXT_CONTRAST, so at the old ~5.9:1 the two greys were
 * 1.3:1 apart and Body and Meta read as one tone; at 7:1 they are 1.5:1.
 */
const DERIVED_SECONDARY_CONTRAST = 7

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
/** The page a brand gets when it names none: white, for the canvas tint to colour. */
const ASSUMED_PAGE = '#ffffff'
/** OKLCH lightness under which a page background is not a light theme. */
const LIGHT_PAGE_L = 0.8
/**
 * The canvas carries the brand: a neutral page (most contracts say #ffffff)
 * takes the primary's hue as a soft tint so two brands never share a
 * background, and dark surfaces tint the same way, more visibly. `neutral`
 * opts out: the page is kept as given and dark mode keeps Trayo's slate.
 *
 * `soft` is an off-white, under the chroma of Trayo's own cream: the page,
 * cards and wells all take the tint, and a cool hue at more than this reads
 * as a blue screen where a warm one passes for paper.
 */
// sRGB allows less than these for some hues this light; fromOklch clips.
const CANVAS = {
  neutral: null,
  soft: { chroma: 0.008, maxL: 0.985 },
  vibrant: { chroma: 0.024, maxL: 0.965 } // Material's neutral range
} as const
/** Container tone: primary at this lightness/chroma (Material tone 90 ≈ L 0.9). */
const CONTAINER_L = { light: 0.9, dark: 0.35 }
const CONTAINER_MAX_CHROMA = { light: 0.08, dark: 0.1 }
const DARK_SURFACE_CHROMA = 0.045
/** OKLCH lightness above which a given dark page or card is not a dark theme. */
const DARK_PAGE_MAX_L = { backgroundDark: 0.3, surfaceDark: 0.36 }
/** A given dark page's own ladder: lightness steps above it (card) and above the card. */
const GIVEN_DARK_STEP = { well: 0.034, card: 0.05, row: 0.05, raised: 0.09 }
/** A surface with less chroma than this is neutral and eligible for the tint. */
const NEUTRAL_SURFACE_CHROMA = 0.01
/**
 * Chroma of the ink a brand gets when it names no `text`: near-black with a
 * trace of the canvas's hue, about Trayo's own. More than this and the text,
 * the greys mixed from it and the borders all read as tones of the brand.
 */
const DERIVED_INK_CHROMA = 0.008
/**
 * Trayo's shadow ink (tokens.css, rgb(132 106 42)) as OKLCH lightness and
 * chroma. A brand's drop shadows keep both and take the canvas's hue.
 */
const SHADOW_INK = { l: 0.537, c: 0.088 }
/** Series 2–5 come from the accents, then from Trayo's own series. */
const CHART_SERIES = 4
/**
 * Candidates for chart series a brand leaves unfilled: Trayo's own series
 * 2–5 first (tokens.css CHART PALETTE), then four more hues spread around
 * the wheel, so four slots can always be filled after the hues a brand's
 * primary and accents already take are skipped. Light and dark pairs.
 */
const SERIES_POOL = [
  ['#0d9488', '#00a38f'], // teal
  ['#d97706', '#cb7f00'], // amber
  ['#e11d48', '#e14660'], // rose
  ['#2563eb', '#3986e4'], // blue
  ['#7c3aed', '#a78bfa'], // violet
  ['#0891b2', '#22d3ee'], // cyan
  ['#65a30d', '#a3e635'], // lime
  ['#db2777', '#f472b6'] // pink
] as const
/** The bar a brand gets when its contract has no coloured shell: a deep step of the primary. */
const DERIVED_SHELL_L = { min: 0.24, max: 0.38 }
const DERIVED_SHELL_MAX_CHROMA = 0.16
/** A brand whose primary and shell are both this dark reads best in the dark theme. */
const DARK_THEME_PRIMARY_L = 0.5
const DARK_THEME_SHELL_L = 0.35
/**
 * A tertiary hue for brands that give no secondary or accents: the primary's
 * hue rotated 60° (Material 3's TONAL_SPOT rule), at modest chroma. It ends
 * the brand gradient, colours the mesh's second layer and leads the chart
 * series pool, so a one-colour brand still gets a two-hue look.
 */
const TERTIARY_HUE_SHIFT = 60
const TERTIARY_MAX_CHROMA = 0.12
/**
 * Dark surfaces under `emphasis: 'bold'` follow Material 3's tone ladder
 * (surface 6, containers 10/12/17/22) in the brand's hue, as OKLCH lightness.
 */
const DARK_LADDER_L = { shell: 0.19, well: 0.224, card: 0.24, row: 0.29, raised: 0.33 }
/** Two chart colours closer in hue than this read as the same series. */
const SERIES_HUE_GAP = 18

export interface BrandPaletteInput {
  primary: string
  secondary?: string | null
  primaryDark?: string | null
  shell?: string | null
  /**
   * Optional text colours from a palette that already names them (the brand
   * theme contract). Used only when they clear 4.5:1 on their fill; the
   * derived colour replaces them otherwise, with a note in `adjustments`.
   * One exception: an `onPrimary` that clears 3:1 is kept and the primary
   * takes a small lightness step until the pair reads.
   */
  onPrimary?: string | null
  onShell?: string | null
  /**
   * The brand's own dark-mode page and card, for a brand whose dark theme is
   * not a tint of its hue (Vercel's black, Linear's near-black). Used as
   * given; the well, hover row and raised surface are steps above them.
   * `surfaceDark` defaults to a step above `backgroundDark`. They belong to
   * the surface override, so they need `background`; without either, dark
   * mode is derived as before.
   */
  backgroundDark?: string | null
  surfaceDark?: string | null
  /**
   * The complete override: the page, cards and text take the brand's colours
   * instead of Trayo's. `background` switches it on; the others default from it.
   */
  background?: string | null
  surface?: string | null
  text?: string | null
  mutedText?: string | null
  /** Chart series 2–5 (and the secondary, when none is set), in order. */
  accents?: readonly string[] | null
  /**
   * `'brand'` (default): the page, cards and text are the brand's. A brand
   * that gives no `background` is treated as a white page, which then takes
   * the primary's hue like any neutral page (see `canvas`), so a palette of
   * one colour still colours the whole canvas. `'trayo'`: the page, cards and
   * text stay Trayo's cream when no `background` is given.
   */
  surfaces?: 'brand' | 'trayo'
  /**
   * `'bold'` (default): a brand with no coloured shell gets a bar in a deep
   * step of its primary, and the mesh band takes the brand's colours — the
   * large areas that make one branded app look unlike the next at a glance.
   * `'quiet'`: no derived bar; the mesh keeps Trayo's warm layers.
   */
  emphasis?: 'bold' | 'quiet'
  /**
   * How strongly a neutral page takes the brand hue: `'soft'` (default), an
   * off-white with a hint of the hue and near-white cards; `'vibrant'`, a
   * visibly coloured page; or `'neutral'`, not at all: the page and cards are
   * kept as given and dark mode keeps Trayo's slate. A chromatic background
   * is kept as given either way.
   */
  canvas?: 'neutral' | 'soft' | 'vibrant'
}

export interface BrandPaletteProblem {
  slot: keyof BrandPaletteInput
  message: string
}

export interface ResolvedBrandPalette {
  /** The slots as lowercase `#rrggbb`, null (or `[]`) when omitted. */
  slots: {
    primary: string
    secondary: string | null
    primaryDark: string | null
    shell: string | null
    background: string | null
    surface: string | null
    text: string | null
    mutedText: string | null
    accents: string[]
  }
  /** The theme this brand reads best in; the app sets `class="dark"` when 'dark'. */
  theme: 'light' | 'dark'
  /** Shell, surface, chart and mesh tokens are present only when their slots are. */
  tokens: Record<BrandToken | BrandContainerToken, string> &
    Partial<Record<BrandShellToken | BrandSurfaceToken | BrandChartToken | BrandMeshToken, string>>
  /**
   * Where a derived colour had to move away from the slot to stay readable,
   * in words an agent or a reviewer can act on. Informational: the tokens are
   * already safe.
   */
  adjustments: string[]
}

type Surfaces = { shell: RGB; well: RGB; card: RGB; raised: RGB; text: RGB }

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
const same = (a: RGB, b: RGB) => hexOf(a) === hexOf(b)
/** Same series to the eye: equal, or two coloured hues within SERIES_HUE_GAP. */
const sameHue = (a: RGB, b: RGB) => {
  if (same(a, b)) return true
  if (isNeutral(a) || isNeutral(b)) return false
  const d = Math.abs(toOklch(a).h - toOklch(b).h)
  return Math.min(d, 360 - d) < SERIES_HUE_GAP
}

/** A shell this light reads as page, not brand chrome; the resolver rejects it. */
export function isLightShell(rgb: RGB): boolean {
  return toOklch(rgb).l > LIGHT_SHELL_L
}

/** White or the ink on `fill`, whichever reads better (black as a last resort). */
function onColor(fill: RGB, ink: RGB): RGB {
  const white: RGB = [1, 1, 1]
  if (contrast(white, fill) >= TEXT_CONTRAST) return white
  if (contrast(ink, fill) >= TEXT_CONTRAST) return ink
  return contrast(white, fill) >= contrast([0, 0, 0], fill) ? white : [0, 0, 0]
}

const HEX_SLOTS = [
  'secondary',
  'primaryDark',
  'shell',
  'onPrimary',
  'onShell',
  'background',
  'surface',
  'text',
  'mutedText',
  'backgroundDark',
  'surfaceDark'
] as const

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
  for (const slot of HEX_SLOTS) {
    const value = input[slot]
    if (value == null || value === '') continue
    const rgb = parseHex(value)
    if (!rgb) {
      problems.push({ slot, message: `${slot} must be a hex colour or null, got ${JSON.stringify(value)}` })
    } else if (slot === 'secondary' && primary && same(rgb, primary)) {
      problems.push({ slot, message: 'secondary repeats primary; omit it instead.' })
    } else if (slot === 'shell' && isLightShell(rgb)) {
      problems.push({
        slot,
        message: `shell ${hexOf(rgb)} is white or near-white, so it would look like the page. Omit shell for a brand with light navigation.`
      })
    } else if ((slot === 'background' || slot === 'surface') && toOklch(rgb).l < LIGHT_PAGE_L) {
      problems.push({
        slot,
        message: `${slot} ${hexOf(rgb)} is not a light colour. The override is for the light theme; a dark brand keeps Trayo's surfaces and sets class="dark".`
      })
    } else if ((slot === 'backgroundDark' || slot === 'surfaceDark') && toOklch(rgb).l > DARK_PAGE_MAX_L[slot]) {
      problems.push({
        slot,
        message: `${slot} ${hexOf(rgb)} is not a dark colour. It is the dark theme's ${slot === 'backgroundDark' ? 'page' : 'card'}; omit it to have dark mode derived.`
      })
    }
  }
  if (input.accents != null && !Array.isArray(input.accents)) {
    problems.push({ slot: 'accents', message: 'accents must be an array of hex colours.' })
  } else {
    for (const value of input.accents ?? []) {
      if (!parseHex(value)) {
        problems.push({
          slot: 'accents',
          message: `accents must be hex colours, got ${JSON.stringify(value)}`
        })
      }
    }
  }
  return problems
}

/**
 * Turns the slots into every token Trayo UI's `[data-brand]` blocks read.
 * Throws on slots `checkBrandPalette` rejects.
 */
export function resolveBrandPalette(input: BrandPaletteInput): ResolvedBrandPalette {
  const problems = checkBrandPalette(input)
  if (problems.length) {
    throw new Error(`Invalid brand palette: ${problems.map((p) => p.message).join(' ')}`)
  }
  const adjustments: string[] = []
  const primary = fillForOnPrimary(parseHex(input.primary)!, input.onPrimary, adjustments)
  const primaryDarkSlot = input.primaryDark ? parseHex(input.primaryDark)! : null
  const accents = uniqueAccents(input.accents ?? [], primary)
  const secondary = input.secondary ? parseHex(input.secondary)! : (accents[0] ?? null)
  const tertiary = isNeutral(primary)
    ? null
    : quantize(
        fromOklch({
          l: Math.min(Math.max(toOklch(primary).l, 0.55), 0.7),
          c: Math.min(toOklch(primary).c, TERTIARY_MAX_CHROMA),
          h: (toOklch(primary).h + TERTIARY_HUE_SHIFT) % 360
        })
      )

  // ── Surfaces: Trayo's, or the brand's when it overrides them ──────────
  const trayoLight = mapValues(TRAYO_SURFACES.light, (v) => parseHex(v)!)
  const trayoDark = mapValues(TRAYO_SURFACES.dark, (v) => parseHex(v)!)
  // A brand with no page of its own gets a white one, which the canvas tint
  // then colours; `surfaces: 'trayo'` keeps the kit's cream instead.
  const assumedPage = !input.background && input.surfaces !== 'trayo'
  if (assumedPage) {
    adjustments.push("no background given; a white page is assumed (surfaces: 'trayo' keeps Trayo's cream).")
  }
  // The light container is a surface text sits on like any other, so the
  // text tones below are checked on it too: without that a light primary
  // (cyan, green) reads on the page and fades on its own tinted panels.
  const cL = containerOf(primary, 'light')
  const override = input.background || assumedPage
    ? resolveSurfaces(
        assumedPage ? { ...input, background: ASSUMED_PAGE } : input,
        primary,
        trayoLight,
        trayoDark,
        adjustments,
        input.emphasis !== 'quiet',
        CANVAS[input.canvas ?? 'soft'],
        cL.fill
      )
    : null
  const L: Surfaces = override?.light ?? trayoLight
  const D: Surfaces = override?.dark ?? trayoDark
  if (!override) {
    for (const slot of ['backgroundDark', 'surfaceDark'] as const) {
      if (input[slot]) {
        adjustments.push(`${slot} ${input[slot]} needs background (the surface override); it is not applied.`)
      }
    }
  }

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
  // Everything accent text is set on: the page ladder, the soft accent fill
  // over the card (the tooltip's tone) and the well, and the container.
  const softOnWell = quantize(composite(primary, 0.1, L.well))
  const lightTextBackgrounds = [L.shell, L.well, L.card, L.raised, tooltip, softOnWell, cL.fill]
  const accentText = shiftLightnessUntil(primary, 'darker', (c) =>
    lightTextBackgrounds.every((bg) => contrast(c, bg) >= TEXT_CONTRAST)
  )
  if (!same(accentText, primary)) {
    adjustments.push(
      `primary ${hexOf(primary)} is under ${TEXT_CONTRAST}:1 as text on the light page or the brand container; links and accent text use ${hexOf(accentText)}.`
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
  if (!same(liftedFill, darkFill)) {
    adjustments.push(
      `the dark-mode fill ${hexOf(darkFill)} is under ${NON_TEXT_CONTRAST}:1 on the dark page; it is lifted to ${hexOf(liftedFill)}.`
    )
    darkFill = liftedFill
  }
  const onPrimaryDark = onColor(darkFill, trayoLight.text)
  const cD = containerOf(primary, 'dark')
  const darkTextBackgrounds = [D.shell, D.well, D.card, D.raised, cD.fill]
  const accentTextDark = shiftLightnessUntil(darkFill, 'lighter', (c) =>
    darkTextBackgrounds.every((bg) => contrast(c, bg) >= TEXT_CONTRAST)
  )
  // Trayo's dark line is the text tone at 55%; a brand whose text only just
  // clears 4.5 needs a little more opacity for the line to stay visible.
  const lineAlphaDark = lowestAlpha(accentTextDark, D.card, 0.55)

  // Brand gradient: primary → secondary, or → a lighter (dark: dimmer) step of
  // the fill when there is no secondary, so it never runs back to the other
  // theme's fill (a black-and-white brand would otherwise fade white → black).
  const gradientEnd = secondary ?? tertiary ?? shiftL(primary, GRADIENT_STEP)
  const gradientEndDark = secondary ?? tertiary ?? shiftL(darkFill, -GRADIENT_STEP)

  // The chart, shell and surface tokens are added below.
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
  ramp(SEQ_LIGHT).forEach((v, i) => (tokens[`--brand-seq-${i + 1}` as BrandToken] = v))
  ramp(SEQ_DARK).forEach((v, i) => (tokens[`--brand-seq-dark-${i + 1}` as BrandToken] = v))

  // ── Charts: series 2–5 are the accents, then Trayo's series ──────────
  // Emitted whenever the brand has accents or its own surfaces: every series
  // (given or filled in) is checked at 3:1 on the card the charts sit on, and
  // a Trayo series whose hue a chosen colour already takes is skipped so two
  // legend keys never look alike. Without either, tokens.css keeps Trayo's.
  if (accents.length || override) {
    const chosen: RGB[] = [primary, ...accents.slice(0, CHART_SERIES)]
    const nearChosen = (rgb: RGB) => chosen.some((c) => sameHue(c, rgb))
    // The tertiary leads the pool, so a brand with no accents still gets a
    // second series in its own family before Trayo's teal/amber/rose/blue.
    const pool = [
      ...(tertiary ? [[tertiary, tertiary] as const] : []),
      ...SERIES_POOL.map(([l, d]) => [parseHex(l)!, parseHex(d)!] as const)
    ]
    // Rechecked at every fill: a candidate that was distinct from the accents
    // may sit next to a series filled in the step before.
    const nextFromPool = () => {
      const i = pool.findIndex(([light]) => !nearChosen(light))
      return i === -1 ? undefined : pool.splice(i, 1)[0]
    }
    for (let n = 2; n <= CHART_SERIES + 1; n++) {
      const given = accents[n - 2]
      // Last resort (a brand taking most of the wheel): the primary's hue
      // rotated by fifths, the same colour in both themes before the checks.
      const rotated = quantize(
        fromOklch({
          ...toOklch(primary),
          c: Math.max(toOklch(primary).c, 0.12),
          h: (hue + 72 * (n - 1)) % 360
        })
      )
      const filled = given ? null : (nextFromPool() ?? ([rotated, rotated] as const))
      const lightSource = given ?? filled![0]
      const darkSource = given ?? filled![1]
      if (filled) chosen.push(filled[0])
      const light = shiftLightnessUntil(
        lightSource,
        'darker',
        (c) => contrast(c, L.card) >= NON_TEXT_CONTRAST
      )
      const dark = shiftLightnessUntil(darkSource, 'lighter', (c) => contrast(c, D.card) >= NON_TEXT_CONTRAST)
      if (!same(light, lightSource)) {
        adjustments.push(
          `${given ? 'accent' : 'series'} ${hexOf(lightSource)} is under ${NON_TEXT_CONTRAST}:1 on the light card; chart series ${n} uses ${hexOf(light)}.`
        )
      }
      tokens[`--brand-chart-${n}` as BrandChartToken] = hexOf(light)
      tokens[`--brand-chart-dark-${n}` as BrandChartToken] = hexOf(dark)
    }
  }

  // ── Containers: brand colour on surfaces, Material tone 90 / on 10 (dark 30 / 90) ──
  const tL = tertiary ? containerOf(tertiary, 'light') : cL
  const tD = tertiary ? containerOf(tertiary, 'dark') : cD
  Object.assign(tokens, {
    '--brand-container': hexOf(cL.fill),
    '--brand-on-container': hexOf(cL.on),
    '--brand-container-tertiary': hexOf(tL.fill),
    '--brand-on-container-tertiary': hexOf(tL.on),
    '--brand-container-dark': hexOf(cD.fill),
    '--brand-on-container-dark': hexOf(cD.on),
    '--brand-container-tertiary-dark': hexOf(tD.fill),
    '--brand-on-container-tertiary-dark': hexOf(tD.on)
  } satisfies Record<BrandContainerToken, string>)

  // ── Shell (same in both themes: it is the brand's own chrome) ─────────
  const bold = input.emphasis !== 'quiet'
  let shell = input.shell ? parseHex(input.shell)! : null
  if (!shell && bold) {
    shell = derivedShell(primary)
    adjustments.push(`no shell given; the bar takes a deep step of the primary, ${hexOf(shell)}.`)
  }
  if (shell) Object.assign(tokens, resolveShell(shell, input.onShell, L.text, adjustments))

  // ── Mesh band in the brand's colours (bold): the warm layers, which stay
  // Trayo's peach/salmon/cream otherwise, become light steps of the brand. ──
  if (bold) {
    const p = toOklch(primary)
    const warm = (l: number, c: number, dh = 0) =>
      toRgbChannels(quantize(fromOklch({ l, c: Math.min(p.c, c), h: (p.h + dh + 360) % 360 })))
    const second = secondary ? toOklch(secondary) : null
    tokens['--brand-mesh-warm-rgb'] = warm(0.8, 0.14)
    const secondHue = second ?? (tertiary ? toOklch(tertiary) : null)
    tokens['--brand-mesh-warm-2-rgb'] = secondHue
      ? toRgbChannels(quantize(fromOklch({ l: 0.72, c: Math.min(secondHue.c, 0.16), h: secondHue.h })))
      : warm(0.72, 0.16, 40)
    tokens['--brand-mesh-warm-3-rgb'] = warm(0.9, 0.06, -20)
  }

  // ── Theme: a dark primary on a dark bar reads best dark; the gallery mixes. ──
  const theme: ResolvedBrandPalette['theme'] =
    toOklch(primary).l < DARK_THEME_PRIMARY_L && shell && toOklch(shell).l < DARK_THEME_SHELL_L
      ? 'dark'
      : 'light'

  if (override) Object.assign(tokens, override.tokens)

  return {
    slots: {
      primary: hexOf(primary),
      secondary: secondary ? hexOf(secondary) : null,
      primaryDark: primaryDarkSlot ? hexOf(primaryDarkSlot) : null,
      shell: shell ? hexOf(shell) : null,
      background: override ? hexOf(override.light.shell) : null,
      surface: override ? hexOf(override.light.card) : null,
      text: override ? hexOf(override.light.text) : null,
      mutedText: override ? override.tokens['--brand-text-secondary'] : null,
      accents: accents.map(hexOf)
    },
    theme,
    tokens,
    adjustments
  }
}

/** The brand on a surface: Material tone 90 with tone-10 text (dark 30 / 90). */
function containerOf(hue: RGB, mode: 'light' | 'dark'): { fill: RGB; on: RGB } {
  const h = toOklch(hue)
  const fill = quantize(
    fromOklch({ l: CONTAINER_L[mode], c: Math.min(h.c, CONTAINER_MAX_CHROMA[mode]), h: h.h })
  )
  const start = quantize(fromOklch({ l: mode === 'light' ? 0.3 : 0.9, c: Math.min(h.c, 0.12), h: h.h }))
  const on = shiftLightnessUntil(start, mode === 'light' ? 'darker' : 'lighter', (c) => contrast(c, fill) >= 7)
  return { fill, on }
}

/** A bar for a brand that gave none: a deep step of the primary (its black, for a black-and-white brand). */
function derivedShell(primary: RGB): RGB {
  const p = toOklch(primary)
  if (isNeutral(primary)) return quantize(fromOklch({ l: Math.min(p.l, DERIVED_SHELL_L.min), c: 0, h: 0 }))
  return quantize(
    fromOklch({
      l: Math.min(Math.max(p.l, DERIVED_SHELL_L.min), DERIVED_SHELL_L.max),
      c: Math.min(p.c, DERIVED_SHELL_MAX_CHROMA),
      h: p.h
    })
  )
}

/** Parsed accents, without duplicates, white/black/greys, or the primary. */
function uniqueAccents(values: readonly string[], primary: RGB): RGB[] {
  const out: RGB[] = []
  for (const value of values) {
    const rgb = parseHex(value)
    if (!rgb || same(rgb, primary) || isNeutral(rgb)) continue
    if (out.some((o) => same(o, rgb))) continue
    out.push(rgb)
  }
  return out
}

/**
 * The complete override: the brand's page and cards, with the well, hover
 * row, raised surface, text scale and borders derived. Dark mode keeps
 * Trayo's dark lightness ladder and takes the brand's hue at low chroma —
 * the contract has no dark colours to take literally.
 */
function resolveSurfaces(
  input: BrandPaletteInput,
  primary: RGB,
  trayoLight: Surfaces,
  trayoDark: Surfaces,
  adjustments: string[],
  bold: boolean,
  canvas: { chroma: number; maxL: number } | null,
  container: RGB
): { light: Surfaces; dark: Surfaces; tokens: Record<BrandSurfaceToken, string> } {
  const given = parseHex(input.background!)!
  const givenL = toOklch(given)
  // The hue the canvas carries: the page's own when it has one, else (when
  // a tint is asked for) the primary's. A black-and-white brand has neither
  // and keeps its white.
  const canvasHue =
    givenL.c >= NEUTRAL_SURFACE_CHROMA
      ? givenL.h
      : canvas && !isNeutral(primary)
        ? toOklch(primary).h
        : null
  const tintCanvas = canvas !== null && canvasHue !== null && givenL.c < NEUTRAL_SURFACE_CHROMA
  const shell = tintCanvas
    ? quantize(fromOklch({ l: Math.min(givenL.l, canvas.maxL), c: canvas.chroma, h: canvasHue! }))
    : given
  const shellL = toOklch(shell)
  if (tintCanvas) {
    adjustments.push(
      `background ${hexOf(given)} has no hue; the canvas takes the brand's hue as a soft tint, ${hexOf(shell)}.`
    )
  }
  // Cards sit a step above the page (Trayo: #fdf9ee → #fffdf8). A surface
  // given darker than the page is kept; the ladder is what the brand says —
  // except a neutral card on a tinted canvas, which takes a fainter tint and
  // stays a step lighter than the page.
  const givenCard = input.surface ? parseHex(input.surface)! : null
  const card =
    givenCard && !(tintCanvas && toOklch(givenCard).c < NEUTRAL_SURFACE_CHROMA)
      ? givenCard
      : quantize(
          fromOklch({
            l: Math.max(givenCard ? toOklch(givenCard).l : 0, shellL.l + 0.012),
            c: tintCanvas ? canvas!.chroma / 2 : shellL.c,
            h: shellL.h
          })
        )
  const cardL = toOklch(card)
  const raised = quantize(fromOklch({ ...cardL, l: Math.min(1, cardL.l + 0.015) }))
  const well = quantize(fromOklch({ ...shellL, l: shellL.l - 0.02 }))
  const row = quantize(composite(shell, 0.3, card))
  const surfaces = [shell, well, card, raised]

  // A brand that names no ink gets Trayo's near-black in the canvas's hue,
  // so the text scale and the borders derived from it sit with the tinted
  // page. A canvas with no hue gets a plain grey.
  const inHue = (l: number, c: number) =>
    quantize(fromOklch({ l, c: canvasHue === null ? 0 : c, h: canvasHue ?? 0 }))
  const textInput = input.text
    ? parseHex(input.text)!
    : inHue(toOklch(trayoLight.text).l, DERIVED_INK_CHROMA)
  const text = shiftLightnessUntil(textInput, 'darker', (c) => surfaces.every((bg) => contrast(c, bg) >= 7))
  if (!same(text, textInput)) {
    adjustments.push(`text ${hexOf(textInput)} is under 7:1 on the brand surfaces; ${hexOf(text)} is used.`)
  }
  // A brand's own mutedText only has to read; a derived one is held higher.
  const secondaryInput = input.mutedText ? parseHex(input.mutedText)! : quantize(composite(text, 0.7, shell))
  const secondaryFloor = input.mutedText ? TEXT_CONTRAST : DERIVED_SECONDARY_CONTRAST
  const textSecondary = shiftLightnessUntil(
    secondaryInput,
    'darker',
    (c) =>
      surfaces.every((bg) => contrast(c, bg) >= secondaryFloor) && contrast(c, container) >= TEXT_CONTRAST
  )
  if (input.mutedText && !same(textSecondary, secondaryInput)) {
    adjustments.push(
      `mutedText ${hexOf(secondaryInput)} is under ${TEXT_CONTRAST}:1 on the brand surfaces; ${hexOf(textSecondary)} is used.`
    )
  }
  // Muted (meta) text: a lighter step of secondary. It is still text, so it
  // clears the text minimum on the page ladder (timestamps and counts are
  // read, not glanced at) and the non-text one on the brand container.
  const textMuted = shiftLightnessUntil(
    shiftL(textSecondary, 0.12),
    'darker',
    (c) =>
      surfaces.every((bg) => contrast(c, bg) >= TEXT_CONTRAST) &&
      contrast(c, container) >= NON_TEXT_CONTRAST
  )

  // Dark: Trayo's ladder, tinted with the brand's hue (the canvas hue, else
  // the ink's) at a chroma that keeps the kit's dark text readable everywhere.
  // A neutral canvas keeps the kit's slate: no fallback to the ink's hue.
  const tint =
    canvasHue !== null
      ? { h: canvasHue }
      : canvas
        ? [toOklch(text)].find((c) => c.c >= NEUTRAL_SURFACE_CHROMA)
        : undefined
  // Bold: Material's tone ladder in the brand hue, a deeper night than
  // Trayo's slate. Quiet: Trayo's own lightness steps, tinted.
  const darkOf = (trayo: RGB, ladderL: number) => {
    const t = toOklch(trayo)
    const l = bold && tint ? ladderL : t.l
    return tint ? quantize(fromOklch({ l, c: DARK_SURFACE_CHROMA, h: tint.h })) : trayo
  }
  // The brand's own dark page and card win over the derived ladder: they are
  // used as given, and the steps between and above them keep their hue.
  const givenDarkPage = input.backgroundDark ? parseHex(input.backgroundDark)! : null
  const givenDarkCard = input.surfaceDark ? parseHex(input.surfaceDark)! : null
  const lift = (from: RGB, by: number) => {
    const c = toOklch(from)
    return quantize(fromOklch({ ...c, l: c.l + by }))
  }
  const darkShell = givenDarkPage ?? darkOf(trayoDark.shell, DARK_LADDER_L.shell)
  const darkCard =
    givenDarkCard ??
    (givenDarkPage ? lift(givenDarkPage, GIVEN_DARK_STEP.card) : darkOf(trayoDark.card, DARK_LADDER_L.card))
  const ownDark = givenDarkPage !== null || givenDarkCard !== null
  const dark: Surfaces = {
    shell: darkShell,
    well: ownDark ? lift(darkShell, GIVEN_DARK_STEP.well) : darkOf(trayoDark.well, DARK_LADDER_L.well),
    card: darkCard,
    raised: ownDark ? lift(darkCard, GIVEN_DARK_STEP.raised) : darkOf(trayoDark.raised, DARK_LADDER_L.raised),
    text: trayoDark.text
  }
  const darkRow = ownDark
    ? lift(darkCard, GIVEN_DARK_STEP.row)
    : darkOf(parseHex('#2e3445')!, DARK_LADDER_L.row)

  return {
    light: { shell, well, card, raised, text },
    dark,
    tokens: {
      '--brand-background': hexOf(shell),
      '--brand-surface': hexOf(card),
      '--brand-well': hexOf(well),
      '--brand-row': hexOf(row),
      '--brand-raised': hexOf(raised),
      '--brand-text': hexOf(text),
      '--brand-text-secondary': hexOf(textSecondary),
      '--brand-text-muted': hexOf(textMuted),
      '--brand-border-subtle': rgba(text, 0.14),
      '--brand-border-strong': rgba(text, 0.24),
      '--brand-shadow-rgb': toRgbChannels(inHue(SHADOW_INK.l, SHADOW_INK.c)),
      '--brand-background-dark': hexOf(dark.shell),
      '--brand-surface-dark': hexOf(dark.card),
      '--brand-well-dark': hexOf(dark.well),
      '--brand-row-dark': hexOf(darkRow),
      '--brand-raised-dark': hexOf(dark.raised)
    }
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

/**
 * The primary as the brand's own text colour can sit on it. A supplied
 * `onPrimary` that narrowly misses 4.5:1 (it clears 3:1) is the brand's real
 * pairing — Vanta puts white on its purple at 3.8:1 — so the fill moves a
 * small lightness step toward it and the text stays. Further off than 3:1 the
 * step would change the colour (white on sky blue), so the primary is kept
 * and `givenOrDerived` replaces the text instead.
 */
function fillForOnPrimary(primary: RGB, onPrimary: string | null | undefined, adjustments: string[]): RGB {
  const given = onPrimary ? parseHex(onPrimary) : null
  if (!given) return primary
  const ratio = contrast(given, primary)
  if (ratio >= TEXT_CONTRAST || ratio < NON_TEXT_CONTRAST) return primary
  const fill = shiftLightnessUntil(
    primary,
    luminance(given) > luminance(primary) ? 'darker' : 'lighter',
    (c) => contrast(given, c) >= TEXT_CONTRAST
  )
  adjustments.push(
    `primary ${hexOf(primary)} is under ${TEXT_CONTRAST}:1 with onPrimary ${hexOf(given)}; ${hexOf(fill)} is used so the brand's text colour is kept.`
  )
  return fill
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
 * `data-brand`, plus `data-brand-shell` when the palette has a shell and
 * `data-brand-surfaces` when it overrides the page.
 */
export function brandAttributes(palette: ResolvedBrandPalette): Record<string, string> {
  const attrs: Record<string, string> = { [BRAND_ATTRIBUTE]: '' }
  if (palette.slots.shell) attrs[BRAND_SHELL_ATTRIBUTE] = ''
  if (palette.slots.background) attrs[BRAND_SURFACES_ATTRIBUTE] = ''
  return attrs
}

/**
 * The same tokens as a React `style` object, to brand one subtree (add the
 * attributes on the same element). Portaled popovers and dialogs render
 * outside the subtree, so brand the `<html>` element for a whole app.
 */
export function brandPaletteStyle(palette: ResolvedBrandPalette): Record<string, string> {
  return { ...palette.tokens }
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
