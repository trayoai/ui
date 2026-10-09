import { describe, expect, it } from 'vitest'

import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/lib/brand-palette/color'
import {
  BRAND_CHART_TOKENS,
  BRAND_CONTAINER_TOKENS,
  BRAND_MESH_TOKENS,
  BRAND_SHELL_TOKENS,
  BRAND_SLOTS,
  BRAND_SURFACE_TOKENS,
  BRAND_TOKENS,
  brandAttributes,
  brandSlotsAgentGuide,
  type BrandChartToken,
  NON_TEXT_CONTRAST,
  TEXT_CONTRAST,
  TRAYO_SURFACES,
  brandPaletteCss,
  brandPaletteStyle,
  checkBrandPalette,
  resolveBrandPalette,
  type BrandPaletteInput
} from '../src/lib/brand-palette'

const rgb = (hex: string) => parseHex(hex)!
/** `rgb(r g b / a)` over an opaque background. */
const over = (value: string, bg: string) => {
  const m = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value)!
  const a = Number(m[4])
  return [1, 2, 3].map((i, k) => (Number(m[i]) / 255) * a + rgb(bg)[k] * (1 - a)) as unknown as ReturnType<
    typeof rgb
  >
}

// Slots an agent would pick from real logo.dev Describe responses (2026-09-30):
//   paypal.com  #000000 #3fb6ff #002991   stripe.com  #543afc #d7cdfd #ffffff
//   notion.so   #ffffff #000000 #727272   apple.com   #000000 #000000 #000000
// plus a yellow brand (Mailchimp), the hardest case for text on light surfaces.
const BRANDS: Record<string, BrandPaletteInput> = {
  paypal: { primary: '#002991', secondary: '#3fb6ff' },
  'paypal (sky blue as primary)': { primary: '#3fb6ff', secondary: '#002991' },
  stripe: { primary: '#543afc' },
  apple: { primary: '#000000' },
  notion: { primary: '#000000', secondary: null, primaryDark: null },
  mailchimp: { primary: '#ffe01b' },
  trayo: { primary: '#845cff' },
  // Regressions: contrast used to be checked before rounding to hex, so these
  // emitted accent text at 4.47 (light, #88cc44) and 4.48 (dark, #00aaff).
  'quantization (light)': { primary: '#88cc44' },
  'quantization (dark)': { primary: '#00aaff' },
  // Regression: the tooltip was checked unrounded; #e956a0 text was 4.495 on it.
  'quantization (tooltip)': { primary: '#e956a0' }
}

// Each brand is resolved twice: on its own page (the default, a white page
// tinted by the primary) and on Trayo's cream (surfaces: 'trayo').
const CASES = Object.entries(BRANDS).flatMap(([name, input]) =>
  (['brand', 'trayo'] as const).map((surfaces) => [name, surfaces, input] as const)
)

describe.each(CASES)('resolveBrandPalette — %s (%s surfaces)', (_name, surfaces, input) => {
  const { tokens } = resolveBrandPalette({ ...input, surfaces })
  const own = surfaces === 'brand'
  const emitted = (suffix: '' | '-dark') => ({
    shell: tokens[`--brand-background${suffix}`]!,
    well: tokens[`--brand-well${suffix}`]!,
    card: tokens[`--brand-surface${suffix}`]!,
    raised: tokens[`--brand-raised${suffix}`]!
  })
  const light = own ? emitted('') : TRAYO_SURFACES.light
  const dark = own ? emitted('-dark') : TRAYO_SURFACES.dark

  it('emits every token (plus the derived bar and brand mesh, bold being the default)', () => {
    expect(Object.keys(tokens).sort()).toEqual(
      [
        ...BRAND_TOKENS,
        ...BRAND_CONTAINER_TOKENS,
        ...BRAND_SHELL_TOKENS,
        ...BRAND_MESH_TOKENS,
        ...(own ? [...BRAND_SURFACE_TOKENS, ...BRAND_CHART_TOKENS] : [])
      ].sort()
    )
  })

  it('keeps the chosen primary as the light fill', () => {
    expect(tokens['--brand-primary']).toBe(input.primary.toLowerCase())
  })

  it('text on the light fill reads (4.5:1)', () => {
    expect(
      contrast(rgb(tokens['--brand-on-primary']), rgb(tokens['--brand-primary']))
    ).toBeGreaterThanOrEqual(TEXT_CONTRAST)
  })

  it('accent text reads on every light surface and the tooltip (4.5:1)', () => {
    for (const bg of [light.shell, light.well, light.card, light.raised, tokens['--brand-tooltip']]) {
      expect(contrast(rgb(tokens['--brand-accent-text']), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
    }
  })

  it('the focus ring is visible on the light page (3:1)', () => {
    for (const bg of [light.shell, light.well, light.card]) {
      expect(contrast(rgb(tokens['--brand-ring']), rgb(bg))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
  })

  it('the dark fill stands out on the dark page (3:1) and its text reads (4.5:1)', () => {
    const fill = rgb(tokens['--brand-primary-dark'])
    expect(contrast(fill, rgb(dark.shell))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    expect(contrast(rgb(tokens['--brand-on-primary-dark']), fill)).toBeGreaterThanOrEqual(TEXT_CONTRAST)
  })

  it('dark accent text reads on every dark surface (4.5:1)', () => {
    for (const bg of [dark.shell, dark.well, dark.card, dark.raised]) {
      expect(contrast(rgb(tokens['--brand-accent-text-dark']), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
    }
  })

  it('the dark accent line clears the non-text minimum on the card', () => {
    expect(
      contrast(over(tokens['--brand-accent-line-dark'], dark.card), rgb(dark.card))
    ).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
  })
})

describe('resolveBrandPalette — brand-specific outcomes', () => {
  it('PayPal navy keeps white text and needs no light adjustment', () => {
    const p = resolveBrandPalette(BRANDS.paypal)
    expect(p.tokens['--brand-on-primary']).toBe('#ffffff')
    expect(p.tokens['--brand-accent-text']).toBe('#002991')
    expect(p.tokens['--brand-ring']).toBe('#002991')
    expect(p.tokens['--brand-secondary']).toBe('#3fb6ff')
  })

  it('a light primary (PayPal sky blue) gets dark text and a darker text/ring tone', () => {
    const p = resolveBrandPalette(BRANDS['paypal (sky blue as primary)'])
    expect(p.tokens['--brand-on-primary']).toBe(p.tokens['--brand-text'])
    expect(p.tokens['--brand-accent-text']).not.toBe('#3fb6ff')
    expect(p.adjustments.join(' ')).toMatch(/links and accent text use/)
  })

  it('a black-and-white brand fills dark mode with near-white and dark text', () => {
    const p = resolveBrandPalette(BRANDS.apple)
    const fill = toOklch(rgb(p.tokens['--brand-primary-dark']))
    expect(fill.l).toBeGreaterThan(0.9)
    expect(fill.c).toBeLessThan(0.04)
    expect(p.tokens['--brand-on-primary-dark']).toBe(TRAYO_SURFACES.light.text)
    expect(p.adjustments.join(' ')).toMatch(/no hue/)
  })

  it('a set primaryDark wins over the derived dark fill', () => {
    const p = resolveBrandPalette({ primary: '#000000', primaryDark: '#f5f5f7' })
    expect(p.tokens['--brand-primary-dark']).toBe('#f5f5f7')
    expect(p.slots.primaryDark).toBe('#f5f5f7')
  })

  it('secondary falls back to primary when omitted', () => {
    const p = resolveBrandPalette(BRANDS.stripe)
    expect(p.tokens['--brand-secondary']).toBe('#543afc')
    expect(p.slots.secondary).toBeNull()
  })

  it('yellow keeps its fill but moves text and ring to a readable tone', () => {
    const p = resolveBrandPalette(BRANDS.mailchimp)
    expect(p.tokens['--brand-primary']).toBe('#ffe01b')
    expect(p.tokens['--brand-ring']).toBe(p.tokens['--brand-accent-text'])
    expect(p.adjustments.join(' ')).toMatch(/focus rings/)
  })

  it('accepts shorthand and uppercase hex and normalizes it', () => {
    expect(resolveBrandPalette({ primary: 'F00' }).slots.primary).toBe('#ff0000')
    expect(resolveBrandPalette({ primary: '#ABCDEF' }).slots.primary).toBe('#abcdef')
  })
})

describe('checkBrandPalette', () => {
  it('accepts a valid palette', () => {
    expect(checkBrandPalette(BRANDS.paypal)).toEqual([])
  })

  it.each([
    [{ primary: 'blue' }, 'primary', /hex colour/],
    [{ primary: '#ffffff' }, 'primary', /near-white/],
    [{ primary: '#002991', secondary: 'rgb(0,0,0)' }, 'secondary', /hex colour/],
    [{ primary: '#002991', secondary: '#002991' }, 'secondary', /repeats primary/],
    [{ primary: '#002991', primaryDark: 'nope' }, 'primaryDark', /hex colour/]
  ])('rejects %j', (input, slot, message) => {
    const problems = checkBrandPalette(input as BrandPaletteInput)
    expect(problems).toHaveLength(1)
    expect(problems[0].slot).toBe(slot)
    expect(problems[0].message).toMatch(message)
  })

  it('resolveBrandPalette throws with the problems', () => {
    expect(() => resolveBrandPalette({ primary: '#fff' })).toThrow(/near-white/)
  })
})

describe('output formats', () => {
  const palette = resolveBrandPalette(BRANDS.paypal)

  it('brandPaletteCss writes every token under [data-brand] by default', () => {
    const css = brandPaletteCss(palette)
    expect(css.startsWith('[data-brand] {\n')).toBe(true)
    for (const token of BRAND_TOKENS) expect(css).toContain(`  ${token}: ${palette.tokens[token]};`)
  })

  it('brandPaletteCss takes another selector', () => {
    expect(brandPaletteCss(palette, 'html')).toMatch(/^html \{/)
  })

  it('brandPaletteStyle returns the same tokens as a style object', () => {
    expect(brandPaletteStyle(palette)).toEqual(palette.tokens)
  })
})

describe('brand gradient', () => {
  it('runs primary → secondary when there is one', () => {
    const p = resolveBrandPalette(BRANDS.paypal)
    expect(p.tokens['--brand-gradient']).toBe('linear-gradient(135deg, #002991 0%, #3fb6ff 100%)')
  })

  it('stays within one theme for a black-and-white brand', () => {
    const p = resolveBrandPalette(BRANDS.apple)
    const [, from, to] = /(#\w{6}) 0%, (#\w{6}) 100%/.exec(p.tokens['--brand-gradient-dark'])!
    expect(from).toBe(p.tokens['--brand-primary-dark'])
    // Both ends light: the dark gradient never fades back to the black fill.
    expect(toOklch(rgb(to)).l).toBeGreaterThan(0.6)
    const light = /(#\w{6}) 0%, (#\w{6}) 100%/.exec(p.tokens['--brand-gradient'])!
    expect(toOklch(rgb(light[2])).l).toBeLessThan(0.4)
  })
})

describe('emphasis (bold by default)', () => {
  it('a brand with no shell gets a bar in a deep step of its primary, dark and readable', () => {
    for (const primary of ['#002991', '#543afc', '#ffe01b', '#36c5f0']) {
      const p = resolveBrandPalette({ primary })
      expect(p.slots.shell).not.toBeNull()
      const shell = toOklch(rgb(p.slots.shell!))
      expect(shell.l).toBeLessThanOrEqual(0.39)
      expect(Math.abs(shell.h - toOklch(rgb(primary)).h)).toBeLessThan(6)
      expect(contrast(rgb(p.tokens['--brand-on-shell']!), rgb(p.slots.shell!))).toBeGreaterThanOrEqual(
        TEXT_CONTRAST
      )
      expect(p.adjustments.join(' ')).toMatch(/no shell given; the bar takes a deep step of the primary/)
      expect(brandAttributes(p)['data-brand-shell']).toBe('')
    }
  })

  it('a black-and-white brand gets its black as the bar; a given shell is kept', () => {
    expect(resolveBrandPalette({ primary: '#000000' }).slots.shell).toBe('#000000')
    expect(resolveBrandPalette({ primary: '#611f69', shell: '#4a154b' }).slots.shell).toBe('#4a154b')
  })

  it('emits the mesh warm layers as brand steps: hue of the primary (and secondary), light', () => {
    const p = resolveBrandPalette({ primary: '#002991', secondary: '#3fb6ff' })
    for (const t of BRAND_MESH_TOKENS) expect(p.tokens[t]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/)
    const asRgb = (v: string) => v.split(' ').map((n) => Number(n) / 255) as unknown as ReturnType<typeof rgb>
    expect(toOklch(asRgb(p.tokens['--brand-mesh-warm-rgb']!)).l).toBeGreaterThan(0.75)
    expect(
      Math.abs(toOklch(asRgb(p.tokens['--brand-mesh-warm-rgb']!)).h - toOklch(rgb('#002991')).h)
    ).toBeLessThan(8)
    expect(
      Math.abs(toOklch(asRgb(p.tokens['--brand-mesh-warm-2-rgb']!)).h - toOklch(rgb('#3fb6ff')).h)
    ).toBeLessThan(8)
  })

  it("quiet: no derived bar, Trayo's mesh layers", () => {
    const p = resolveBrandPalette({ primary: '#002991', emphasis: 'quiet' })
    expect(p.slots.shell).toBeNull()
    expect(brandAttributes(p)).toEqual({ 'data-brand': '', 'data-brand-surfaces': '' })
    for (const t of BRAND_MESH_TOKENS) expect(p.tokens[t]).toBeUndefined()
  })

  it('recommends the dark theme for a dark primary on a dark bar, light otherwise', () => {
    expect(resolveBrandPalette({ primary: '#002991' }).theme).toBe('dark') // PayPal navy
    expect(resolveBrandPalette({ primary: '#611f69', shell: '#4a154b' }).theme).toBe('dark') // Slack
    expect(resolveBrandPalette({ primary: '#543afc' }).theme).toBe('light') // Stripe
    expect(resolveBrandPalette({ primary: '#ffe01b' }).theme).toBe('light') // yellow
    expect(resolveBrandPalette({ primary: '#002991', emphasis: 'quiet' }).theme).toBe('light') // no bar
  })
})

describe('tertiary (primary hue + 60°) for one-colour brands', () => {
  const hueOf = (hex: string) => toOklch(rgb(hex)).h
  const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

  it('ends the brand gradient and colours the second mesh layer when there is no secondary', () => {
    const p = resolveBrandPalette({ primary: '#002991' })
    const end = /(#[0-9a-f]{6}) 100%/.exec(p.tokens['--brand-gradient'])![1]
    expect(gap(hueOf(end), hueOf('#002991'))).toBeGreaterThan(45)
    expect(gap(hueOf(end), hueOf('#002991'))).toBeLessThan(75)
    const [r, g, b] = p.tokens['--brand-mesh-warm-2-rgb']!.split(' ').map((n) => Number(n) / 255)
    expect(gap(toOklch([r, g, b] as unknown as ReturnType<typeof rgb>).h, hueOf('#002991'))).toBeGreaterThan(
      45
    )
  })

  it('leads the chart pool: series 2 of an accent-less brand is in the tertiary hue', () => {
    const p = resolveBrandPalette({ primary: '#002991', background: '#ffffff' })
    expect(gap(hueOf(p.tokens['--brand-chart-2']!), (hueOf('#002991') + 60) % 360)).toBeLessThan(10)
  })

  it('a given secondary still wins; a black-and-white brand has no tertiary', () => {
    const p = resolveBrandPalette({ primary: '#002991', secondary: '#3fb6ff' })
    expect(p.tokens['--brand-gradient']).toContain('#3fb6ff')
    const apple = resolveBrandPalette({ primary: '#000000' })
    expect(apple.tokens['--brand-gradient']).toMatch(/#000000 0%, #[0-9a-f]{6} 100%/)
  })
})

describe('dark ladder (bold) follows Material tones in the brand hue', () => {
  it('surface 6 → raised 22 as OKLCH lightness, chroma in the brand hue, text still 7:1', () => {
    const p = resolveBrandPalette({ primary: '#002991', background: '#ffffff' }).tokens
    const L = (t: string) => toOklch(rgb(p[t as keyof typeof p]!)).l
    expect(L('--brand-background-dark')).toBeCloseTo(0.19, 1)
    expect(L('--brand-well-dark')).toBeCloseTo(0.224, 1)
    expect(L('--brand-surface-dark')).toBeCloseTo(0.24, 1)
    expect(L('--brand-row-dark')).toBeCloseTo(0.29, 1)
    expect(L('--brand-raised-dark')).toBeCloseTo(0.33, 1)
    for (const t of ['--brand-background-dark', '--brand-surface-dark', '--brand-raised-dark'] as const) {
      expect(contrast(rgb(TRAYO_SURFACES.dark.text), rgb(p[t]!))).toBeGreaterThanOrEqual(7)
    }
    const quiet = resolveBrandPalette({ primary: '#002991', background: '#ffffff', emphasis: 'quiet' }).tokens
    expect(toOklch(rgb(quiet['--brand-raised-dark']!)).l).toBeGreaterThan(0.36)
  })
})

describe('containers (Material tone 90 / on 10; dark 30 / 90)', () => {
  it.each(['#002991', '#611f69', '#543afc', '#ffe01b', '#000000'])(
    '%s: readable, in the brand hue',
    (primary) => {
      const t = resolveBrandPalette({ primary }).tokens
      for (const token of BRAND_CONTAINER_TOKENS) expect(t[token]).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrast(rgb(t['--brand-on-container']), rgb(t['--brand-container']))).toBeGreaterThanOrEqual(7)
      expect(
        contrast(rgb(t['--brand-on-container-dark']), rgb(t['--brand-container-dark']))
      ).toBeGreaterThanOrEqual(7)
      expect(
        contrast(rgb(t['--brand-on-container-tertiary']), rgb(t['--brand-container-tertiary']))
      ).toBeGreaterThanOrEqual(7)
      expect(toOklch(rgb(t['--brand-container'])).l).toBeCloseTo(0.9, 1)
      expect(toOklch(rgb(t['--brand-container-dark'])).l).toBeCloseTo(0.35, 1)
      if (toOklch(rgb(primary)).c > 0.04) {
        const d = Math.abs(toOklch(rgb(t['--brand-container'])).h - toOklch(rgb(primary)).h)
        expect(Math.min(d, 360 - d)).toBeLessThan(10)
      }
    }
  )
})

describe('canvas strength', () => {
  it('the default tint leaves a light page in a cool hue, not a blue one', () => {
    // Regression (2026-10-07): Snowflake's cyan at the old strength gave a
    // #e6f7ff page with blue cards and wells; the whole screen read as blue.
    const { tokens } = resolveBrandPalette({ primary: '#29b5e8' })
    const page = toOklch(rgb(tokens['--brand-background']!))
    expect(page.l).toBeGreaterThanOrEqual(0.98)
    expect(page.c).toBeLessThanOrEqual(0.012)
    expect(toOklch(rgb(tokens['--brand-surface']!)).c).toBeLessThanOrEqual(0.006)
    expect(toOklch(rgb(tokens['--brand-well']!)).c).toBeLessThanOrEqual(0.012)
  })

  it("'vibrant' tints a neutral page more than 'soft', still 7:1 for text", () => {
    const soft = resolveBrandPalette({ primary: '#611f69', background: '#ffffff' })
    const vivid = resolveBrandPalette({ primary: '#611f69', background: '#ffffff', canvas: 'vibrant' })
    expect(toOklch(rgb(vivid.slots.background!)).c).toBeGreaterThan(toOklch(rgb(soft.slots.background!)).c)
    expect(toOklch(rgb(vivid.slots.background!)).l).toBeLessThan(toOklch(rgb(soft.slots.background!)).l)
    expect(contrast(rgb(vivid.tokens['--brand-text']!), rgb(vivid.slots.background!))).toBeGreaterThanOrEqual(
      7
    )
  })
})

describe("canvas 'neutral'", () => {
  const linear = { primary: '#5e6ad2', background: '#f4f5f8', surface: '#ffffff', text: '#222326' }

  it('keeps a neutral page and its cards as given', () => {
    const p = resolveBrandPalette({ ...linear, canvas: 'neutral' })
    expect(p.tokens['--brand-background']).toBe('#f4f5f8')
    expect(p.tokens['--brand-surface']).toBe('#ffffff')
    expect(p.adjustments.join(' ')).not.toMatch(/canvas takes the brand's hue/)
  })

  it("keeps the kit's dark slate, also when the ink has a hue", () => {
    for (const text of ['#222326', '#1d1c4d']) {
      const p = resolveBrandPalette({ ...linear, text, canvas: 'neutral' })
      expect(p.tokens['--brand-background-dark']).toBe(TRAYO_SURFACES.dark.shell)
      expect(p.tokens['--brand-surface-dark']).toBe(TRAYO_SURFACES.dark.card)
    }
  })

  it('still keeps a chromatic page as given, with its hue in dark mode', () => {
    const p = resolveBrandPalette({ primary: '#5e6ad2', background: '#fff4e0', canvas: 'neutral' })
    expect(p.tokens['--brand-background']).toBe('#fff4e0')
    expect(p.tokens['--brand-background-dark']).not.toBe(TRAYO_SURFACES.dark.shell)
  })

  it("is opt-in: the default is still the 'soft' tint", () => {
    const byDefault = resolveBrandPalette(linear)
    const soft = resolveBrandPalette({ ...linear, canvas: 'soft' })
    expect(byDefault.tokens['--brand-background']).toBe(soft.tokens['--brand-background'])
    expect(byDefault.tokens['--brand-background']).not.toBe('#f4f5f8')
  })

  it('is accepted by checkBrandPalette', () => {
    expect(checkBrandPalette({ ...linear, canvas: 'neutral' })).toEqual([])
  })
})

describe('dark surfaces (backgroundDark, surfaceDark)', () => {
  const vercel = { primary: '#171717', background: '#ffffff', surface: '#ffffff', text: '#171717' }
  const L = (hex: string) => toOklch(rgb(hex)).l

  it('uses the given dark page and card as they are', () => {
    const p = resolveBrandPalette({ ...vercel, backgroundDark: '#000000', surfaceDark: '#111111' })
    expect(p.tokens['--brand-background-dark']).toBe('#000000')
    expect(p.tokens['--brand-surface-dark']).toBe('#111111')
  })

  it('derives the card, well, row and raised steps from a dark page alone, in its hue', () => {
    const p = resolveBrandPalette({ primary: '#5e6ad2', background: '#f4f5f8', backgroundDark: '#08090a' })
    const page = L(p.tokens['--brand-background-dark']!)
    const well = L(p.tokens['--brand-well-dark']!)
    const card = L(p.tokens['--brand-surface-dark']!)
    const row = L(p.tokens['--brand-row-dark']!)
    const raised = L(p.tokens['--brand-raised-dark']!)
    expect(p.tokens['--brand-background-dark']).toBe('#08090a')
    expect(well).toBeGreaterThan(page)
    expect(card).toBeGreaterThan(well)
    expect(row).toBeGreaterThan(card)
    expect(raised).toBeGreaterThan(row)
    // A near-black page stays near-black: no brand hue is added to it.
    expect(toOklch(rgb(p.tokens['--brand-surface-dark']!)).c).toBeLessThan(0.02)
  })

  it("keeps the kit's dark text readable on every given dark surface (7:1)", () => {
    const p = resolveBrandPalette({ ...vercel, backgroundDark: '#1b1b29', surfaceDark: '#2a2a3d' })
    for (const t of ['--brand-background-dark', '--brand-surface-dark', '--brand-well-dark', '--brand-raised-dark'] as const) {
      expect(contrast(rgb(TRAYO_SURFACES.dark.text), rgb(p.tokens[t]!))).toBeGreaterThanOrEqual(7)
    }
  })

  it('leaves the light theme and brands without the slots unchanged', () => {
    const base = resolveBrandPalette(vercel)
    const withDark = resolveBrandPalette({ ...vercel, backgroundDark: '#000000' })
    expect(withDark.tokens['--brand-background']).toBe(base.tokens['--brand-background'])
    expect(withDark.tokens['--brand-surface']).toBe(base.tokens['--brand-surface'])
    expect(base.tokens['--brand-background-dark']).not.toBe('#000000')
  })

  it('rejects a dark slot that is not dark, or not hex', () => {
    expect(checkBrandPalette({ ...vercel, backgroundDark: '#f4f5f8' })).toEqual([
      expect.objectContaining({ slot: 'backgroundDark' })
    ])
    expect(checkBrandPalette({ ...vercel, surfaceDark: '#ffffff' })).toEqual([
      expect.objectContaining({ slot: 'surfaceDark' })
    ])
    expect(checkBrandPalette({ ...vercel, backgroundDark: 'black' })).toEqual([
      expect.objectContaining({ slot: 'backgroundDark' })
    ])
  })

  it('ignores them, with a note, when the brand does not override the page', () => {
    const p = resolveBrandPalette({ primary: '#171717', backgroundDark: '#000000', surfaces: 'trayo' })
    expect(p.tokens['--brand-background-dark']).toBeUndefined()
    expect(p.adjustments.join(' ')).toMatch(/backgroundDark .* needs background/)
  })
})

describe('shell slot', () => {
  const slack = resolveBrandPalette({ primary: '#611f69', shell: '#4a154b', secondary: '#36c5f0' })
  const t = slack.tokens

  it('emits the shell tokens only when there is a shell', () => {
    for (const token of BRAND_SHELL_TOKENS) expect(t[token]).toMatch(/^#[0-9a-f]{6}$/)
    const noShell = resolveBrandPalette({ ...BRANDS.paypal, emphasis: 'quiet' })
    for (const token of BRAND_SHELL_TOKENS) expect(noShell.tokens[token]).toBeUndefined()
    expect(slack.slots.shell).toBe('#4a154b')
    expect(noShell.slots.shell).toBeNull()
  })

  it('text reads on the shell and on its hover and selected rows', () => {
    const rows = [t['--brand-shell']!, t['--brand-shell-hover']!, t['--brand-shell-active']!]
    for (const bg of rows) {
      expect(contrast(rgb(t['--brand-on-shell']!), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(contrast(rgb(t['--brand-on-shell-secondary']!), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(contrast(rgb(t['--brand-on-shell-muted']!), rgb(bg))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
  })

  it('secondary and muted text are dimmer than the main shell text', () => {
    const main = contrast(rgb(t['--brand-on-shell']!), rgb(t['--brand-shell']!))
    const secondary = contrast(rgb(t['--brand-on-shell-secondary']!), rgb(t['--brand-shell']!))
    const muted = contrast(rgb(t['--brand-on-shell-muted']!), rgb(t['--brand-shell']!))
    expect(main).toBeGreaterThan(secondary)
    expect(secondary).toBeGreaterThan(muted)
  })

  it.each(['#707070', '#8a3ffc', '#00857c'])(
    'mid-tone shell %s keeps every shell text colour readable on hover and selected rows',
    (shell) => {
      // Regression: tinting rows toward white text on #707070 dropped it to
      // 4.23 (hover) and 3.74 (selected).
      const s = resolveBrandPalette({ primary: '#002991', shell }).tokens
      for (const bg of [s['--brand-shell']!, s['--brand-shell-hover']!, s['--brand-shell-active']!]) {
        expect(contrast(rgb(s['--brand-on-shell']!), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
        expect(contrast(rgb(s['--brand-on-shell-secondary']!), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
        expect(contrast(rgb(s['--brand-on-shell-muted']!), rgb(bg))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
      }
      expect(s['--brand-shell-hover']).not.toBe(s['--brand-shell'])
    }
  )

  it('a mid-tone shell gets dark text', () => {
    const p = resolveBrandPalette({ primary: '#002991', shell: '#3fb6ff' })
    expect(p.tokens['--brand-on-shell']).toBe(p.tokens['--brand-text'])
  })

  it('rejects a white or near-white shell', () => {
    const problems = checkBrandPalette({ primary: '#002991', shell: '#fafafa' })
    expect(problems).toEqual([
      expect.objectContaining({ slot: 'shell', message: expect.stringMatching(/near-white/) })
    ])
  })

  it('brandAttributes adds data-brand-shell only with a shell', () => {
    expect(brandAttributes(slack)).toEqual({
      'data-brand': '',
      'data-brand-shell': '',
      'data-brand-surfaces': ''
    })
    expect(brandAttributes(resolveBrandPalette({ ...BRANDS.paypal, emphasis: 'quiet' }))).toEqual({
      'data-brand': '',
      'data-brand-surfaces': ''
    })
  })

  it('brandPaletteCss and brandPaletteStyle include the shell tokens when present', () => {
    expect(brandPaletteCss(slack)).toContain('  --brand-shell: #4a154b;')
    // On Trayo's cream, so the surface and chart tokens stay out of the list.
    const onCream = (input: BrandPaletteInput) =>
      Object.keys(brandPaletteStyle(resolveBrandPalette({ ...input, surfaces: 'trayo' })))
    expect(onCream({ primary: '#611f69', shell: '#4a154b', secondary: '#36c5f0' })).toEqual([
      ...BRAND_TOKENS,
      ...BRAND_CONTAINER_TOKENS,
      ...BRAND_SHELL_TOKENS,
      ...BRAND_MESH_TOKENS
    ])
    expect(onCream({ ...BRANDS.paypal, emphasis: 'quiet' })).toEqual([
      ...BRAND_TOKENS,
      ...BRAND_CONTAINER_TOKENS
    ])
  })
})

describe('supplied on-colours (onPrimary, onShell)', () => {
  it('keeps a supplied colour that reads', () => {
    const p = resolveBrandPalette({
      primary: '#002991',
      onPrimary: '#f5f5f5',
      shell: '#4a154b',
      onShell: '#fdf6ff'
    })
    expect(p.tokens['--brand-on-primary']).toBe('#f5f5f5')
    expect(p.tokens['--brand-on-shell']).toBe('#fdf6ff')
    expect(p.adjustments.join(' ')).not.toMatch(/onPrimary|onShell/)
  })

  it('replaces one that does not, and says so', () => {
    const p = resolveBrandPalette({
      primary: '#ffe01b',
      onPrimary: '#ffffff',
      shell: '#4a154b',
      onShell: '#611f69'
    })
    expect(p.tokens['--brand-on-primary']).toBe(p.tokens['--brand-text'])
    expect(p.tokens['--brand-on-shell']).toBe('#ffffff')
    expect(p.adjustments.join(' ')).toMatch(/onPrimary #ffffff is under 4.5:1/)
    expect(p.adjustments.join(' ')).toMatch(/onShell #611f69 is under 4.5:1/)
  })

  it('deepens the fill a step when the supplied onPrimary narrowly misses, and keeps the text', () => {
    // Vanta: white on #ac55ff is 3.8:1. The brand puts white on its purple,
    // so the fill moves, not the text.
    const p = resolveBrandPalette({ primary: '#ac55ff', onPrimary: '#ffffff' })
    const fill = p.tokens['--brand-primary']
    expect(p.tokens['--brand-on-primary']).toBe('#ffffff')
    expect(fill).not.toBe('#ac55ff')
    expect(contrast(rgb('#ffffff'), rgb(fill))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
    // A small step of the same colour: hue kept, lightness within 0.06.
    const from = toOklch(rgb('#ac55ff'))
    const to = toOklch(rgb(fill))
    expect(Math.abs(to.h - from.h)).toBeLessThan(3)
    expect(from.l - to.l).toBeGreaterThan(0)
    expect(from.l - to.l).toBeLessThan(0.06)
    expect(p.adjustments.join(' ')).toMatch(/primary #ac55ff is under 4.5:1 with onPrimary #ffffff/)
  })

  it('lightens the fill instead when the supplied onPrimary is the darker of the two', () => {
    const p = resolveBrandPalette({ primary: '#7a5cff', onPrimary: '#141414' })
    const fill = p.tokens['--brand-primary']
    expect(contrast(rgb('#141414'), rgb('#7a5cff'))).toBeLessThan(TEXT_CONTRAST)
    expect(p.tokens['--brand-on-primary']).toBe('#141414')
    expect(toOklch(rgb(fill)).l).toBeGreaterThan(toOklch(rgb('#7a5cff')).l)
    expect(contrast(rgb('#141414'), rgb(fill))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
  })

  it('leaves the fill alone when the supplied onPrimary is far off (under 3:1)', () => {
    // Snowflake: white on #29b5e8 is 2.4:1; forcing it would turn the cyan teal.
    const p = resolveBrandPalette({ primary: '#29b5e8', onPrimary: '#ffffff' })
    expect(p.tokens['--brand-primary']).toBe('#29b5e8')
    expect(p.tokens['--brand-on-primary']).toBe(p.tokens['--brand-text'])
    expect(p.adjustments.join(' ')).toMatch(/onPrimary #ffffff is under 4.5:1/)
  })

  it('leaves the fill alone when no onPrimary is supplied', () => {
    const p = resolveBrandPalette({ primary: '#ac55ff' })
    expect(p.tokens['--brand-primary']).toBe('#ac55ff')
  })

  it('rejects a supplied colour that is not hex', () => {
    expect(checkBrandPalette({ primary: '#002991', onShell: 'white' })).toEqual([
      expect.objectContaining({ slot: 'onShell' })
    ])
  })
})

describe('chart ramp', () => {
  const step = (p: ReturnType<typeof resolveBrandPalette>, i: number, dark = false) =>
    toOklch(rgb(p.tokens[(dark ? `--brand-seq-dark-${i}` : `--brand-seq-${i}`) as keyof typeof p.tokens]!))

  it('takes the brand hue and keeps Trayo lightness steps', () => {
    const p = resolveBrandPalette(BRANDS.paypal)
    const hue = toOklch(rgb('#002991')).h
    const lights = [1, 2, 3, 4, 5].map((i) => step(p, i))
    for (const c of lights) expect(Math.abs(c.h - hue)).toBeLessThan(8)
    // light: light → dark; dark: dim → bright
    for (let i = 1; i < 5; i++) expect(lights[i].l).toBeLessThan(lights[i - 1].l)
    const darks = [1, 2, 3, 4, 5].map((i) => step(p, i, true))
    for (let i = 1; i < 5; i++) expect(darks[i].l).toBeGreaterThan(darks[i - 1].l)
  })

  it('lands close to Trayo violet ramp for the Trayo brand', () => {
    // #845CFF sits at hue ~288; the hand-tuned ramp uses 293. Same lightness
    // steps, so each step is within a few units per channel.
    const p = resolveBrandPalette(BRANDS.trayo)
    const trayo = ['#b9acf2', '#a087ef', '#8860ea', '#6c3fc8', '#4f2998']
    trayo.forEach((hex, i) => {
      const got = rgb(p.tokens[`--brand-seq-${i + 1}` as keyof typeof p.tokens]!)
      rgb(hex).forEach((c, k) => expect(Math.abs(c - got[k]) * 255).toBeLessThan(16))
    })
  })

  it('is grey for a black-and-white brand', () => {
    const p = resolveBrandPalette(BRANDS.apple)
    for (let i = 1; i <= 5; i++) expect(step(p, i).c).toBeLessThan(0.01)
  })
})

describe('complete override — surfaces', () => {
  const slack = {
    primary: '#611f69',
    background: '#ffffff',
    surface: '#f8f8f8',
    text: '#1d1c1d',
    mutedText: '#616061'
  }
  const p = resolveBrandPalette(slack)
  const t = p.tokens
  const lightSurfaces = [
    '--brand-background',
    '--brand-surface',
    '--brand-well',
    '--brand-row',
    '--brand-raised'
  ].map((k) => t[k as keyof typeof t]!)

  it("emits the surface tokens unless the page stays Trayo's, and the attribute with them", () => {
    for (const token of BRAND_SURFACE_TOKENS) expect(t[token]).toBeDefined()
    const cream = resolveBrandPalette({ ...BRANDS.paypal, surfaces: 'trayo' })
    expect(cream.tokens['--brand-background']).toBeUndefined()
    expect(brandAttributes(cream)).not.toHaveProperty('data-brand-surfaces')
    expect(brandAttributes(p)).toEqual({
      'data-brand': '',
      'data-brand-shell': '',
      'data-brand-surfaces': ''
    })
    expect(p.slots).toMatchObject({ text: '#1d1c1d', mutedText: '#616061' })
    // The white page and neutral card are tinted with the brand hue (tested below).
    expect(p.slots.background).toMatch(/^#[0-9a-f]{6}$/)
    expect(p.slots.surface).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('text reads on every brand surface: 7:1 primary, 4.5:1 secondary, 3:1 muted', () => {
    for (const bg of lightSurfaces) {
      expect(contrast(rgb(t['--brand-text']!), rgb(bg))).toBeGreaterThanOrEqual(7)
      expect(contrast(rgb(t['--brand-text-secondary']!), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(contrast(rgb(t['--brand-text-muted']!), rgb(bg))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
  })

  it('accent text and the ring are checked against the brand surfaces, not Trayo cream', () => {
    const y = resolveBrandPalette({ ...slack, primary: '#ffe01b' }).tokens
    for (const bg of ['#ffffff', '#f8f8f8']) {
      expect(contrast(rgb(y['--brand-accent-text']), rgb(bg))).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(contrast(rgb(y['--brand-ring']), rgb(bg))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
  })

  it('a light mutedText is darkened until it reads, and says so', () => {
    const q = resolveBrandPalette({ ...slack, mutedText: '#bbbbbb' })
    expect(contrast(rgb(q.tokens['--brand-text-secondary']!), rgb('#ffffff'))).toBeGreaterThanOrEqual(
      TEXT_CONTRAST
    )
    expect(q.adjustments.join(' ')).toMatch(/mutedText #bbbbbb is under 4.5:1/)
  })

  it('surface and text default from background when omitted', () => {
    const q = resolveBrandPalette({ primary: '#002991', background: '#eef3ff' })
    expect(q.slots.background).toBe('#eef3ff')
    expect(toOklch(rgb(q.slots.surface!)).l).toBeGreaterThan(toOklch(rgb('#eef3ff')).l)
    expect(contrast(rgb(q.tokens['--brand-text']!), rgb('#eef3ff'))).toBeGreaterThanOrEqual(7)
  })

  it("a brand that names no text gets a near-black in the canvas's hue, and its borders follow", () => {
    const q = resolveBrandPalette({ primary: '#002991' }).tokens
    const ink = toOklch(rgb(q['--brand-text']!))
    const page = toOklch(rgb(q['--brand-background']!))
    expect(q['--brand-text']).not.toBe(TRAYO_SURFACES.light.text)
    expect(Math.abs(ink.l - toOklch(rgb(TRAYO_SURFACES.light.text)).l)).toBeLessThan(0.02)
    expect(ink.c).toBeGreaterThan(0.008)
    expect(ink.c).toBeLessThan(0.03)
    expect(Math.abs(ink.h - page.h)).toBeLessThan(8)
    expect(q['--brand-border-subtle']).toBe(`rgb(${rgb(q['--brand-text']!).map((c) => Math.round(c * 255)).join(' ')} / 0.14)`)
    // A given text is kept; a canvas with no hue gets a plain grey.
    expect(resolveBrandPalette({ primary: '#002991', text: '#1d1c1d' }).tokens['--brand-text']).toBe('#1d1c1d')
    for (const grey of [{ primary: '#000000' }, { primary: '#002991', canvas: 'neutral' as const }]) {
      expect(toOklch(rgb(resolveBrandPalette(grey).tokens['--brand-text']!)).c).toBeLessThan(0.002)
    }
  })

  it("drop shadows take the canvas's hue at the depth of Trayo's sand", () => {
    const sand = toOklch(rgb('#846a2a'))
    const channels = (v: string) => v.split(' ').map((n) => Number(n) / 255) as unknown as ReturnType<typeof rgb>
    const q = resolveBrandPalette({ primary: '#002991' }).tokens
    const shadow = toOklch(channels(q['--brand-shadow-rgb']!))
    expect(q['--brand-shadow-rgb']).toMatch(/^\d+ \d+ \d+$/)
    expect(Math.abs(shadow.l - sand.l)).toBeLessThan(0.02)
    expect(Math.abs(shadow.h - toOklch(rgb(q['--brand-background']!)).h)).toBeLessThan(8)
    expect(shadow.c).toBeGreaterThan(0.05)
    const grey = resolveBrandPalette({ primary: '#002991', canvas: 'neutral' }).tokens
    expect(toOklch(channels(grey['--brand-shadow-rgb']!)).c).toBeLessThan(0.002)
  })

  it('quiet: dark mode keeps Trayo lightness steps and takes the brand hue at low chroma', () => {
    const tinted = resolveBrandPalette({
      primary: '#002991',
      background: '#eef3ff',
      text: '#001435',
      emphasis: 'quiet'
    }).tokens
    for (const [token, trayo] of [
      ['--brand-background-dark', TRAYO_SURFACES.dark.shell],
      ['--brand-surface-dark', TRAYO_SURFACES.dark.card],
      ['--brand-raised-dark', TRAYO_SURFACES.dark.raised]
    ] as const) {
      const c = toOklch(rgb(tinted[token]!))
      const trayoL = toOklch(rgb(trayo)).l
      expect(Math.abs(c.l - trayoL)).toBeLessThan(0.02)
      // As much of the 0.045 chroma as sRGB allows for this hue at this
      // lightness (navy at L≈0.2 clips near 0.015), never Trayo's grey.
      const reachable = toOklch(fromOklch({ l: trayoL, c: 0.045, h: toOklch(rgb('#eef3ff')).h })).c
      expect(c.c).toBeGreaterThanOrEqual(Math.min(0.045, reachable) - 0.004)
      expect(c.c).toBeGreaterThanOrEqual(0.01)
      expect(c.c).toBeLessThanOrEqual(0.05)
      expect(contrast(rgb(TRAYO_SURFACES.dark.text), rgb(tinted[token]!))).toBeGreaterThanOrEqual(7)
    }
    const grey = resolveBrandPalette({ primary: '#000000', background: '#ffffff', text: '#111111' }).tokens
    expect(grey['--brand-background-dark']).toBe(TRAYO_SURFACES.dark.shell)
  })

  it('a neutral background takes the primary hue as a soft tint, so brands never share a canvas', () => {
    // Regression (Ohad, 2026-09-30): every demo contract says #ffffff, so all
    // the screenshots had the same white page.
    const paypal = resolveBrandPalette({ primary: '#002991', background: '#ffffff', surface: '#f5f7fa' })
    const slack = resolveBrandPalette({ primary: '#611f69', background: '#ffffff', surface: '#f8f8f8' })
    for (const [p, hue] of [
      [paypal, toOklch(rgb('#002991')).h],
      [slack, toOklch(rgb('#611f69')).h]
    ] as const) {
      const bg = toOklch(rgb(p.slots.background!))
      // As much of the 0.008 chroma as sRGB allows at this lightness for
      // this hue, never a flat white, and never enough to read as a
      // coloured page.
      const reachable = toOklch(fromOklch({ l: 0.985, c: 0.008, h: hue })).c
      expect(bg.c).toBeGreaterThanOrEqual(Math.min(0.008, reachable) - 0.003)
      expect(bg.c).toBeGreaterThanOrEqual(0.004)
      expect(bg.c).toBeLessThanOrEqual(0.012)
      expect(bg.l).toBeLessThanOrEqual(0.986)
      expect(Math.abs(bg.h - hue)).toBeLessThan(8)
      // Cards stay a lighter, fainter step above the page.
      const card = toOklch(rgb(p.slots.surface!))
      expect(card.l).toBeGreaterThan(bg.l + 0.008)
      expect(card.c).toBeLessThan(bg.c)
      expect(p.adjustments.join(' ')).toMatch(/canvas takes the brand's hue/)
      // Text still reads on the tinted ladder.
      for (const t of ['--brand-background', '--brand-surface', '--brand-well', '--brand-raised'] as const) {
        expect(contrast(rgb(p.tokens['--brand-text']!), rgb(p.tokens[t]!))).toBeGreaterThanOrEqual(7)
      }
    }
    expect(paypal.slots.background).not.toBe(slack.slots.background)
  })

  it('a chromatic background is kept as given; a black-and-white brand keeps its white', () => {
    expect(resolveBrandPalette({ primary: '#002991', background: '#eef3ff' }).slots.background).toBe(
      '#eef3ff'
    )
    const apple = resolveBrandPalette({ primary: '#000000', background: '#ffffff', surface: '#f5f5f7' })
    expect(apple.slots.background).toBe('#ffffff')
    expect(apple.slots.surface).toBe('#f5f5f7')
    expect(apple.tokens['--brand-background-dark']).toBe(TRAYO_SURFACES.dark.shell)
  })

  it('rejects a dark background: the override is a light theme', () => {
    expect(checkBrandPalette({ primary: '#fff000', background: '#1d1c1d' })).toEqual([
      expect.objectContaining({ slot: 'background', message: expect.stringMatching(/not a light colour/) })
    ])
  })
})

const TRAYO_SERIES_BLUE = '#2563eb'

describe('accents → chart series', () => {
  const p = resolveBrandPalette({
    primary: '#611f69',
    accents: ['#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a', '#123456']
  })

  it('uses up to four accents as series 2–5, visible (3:1) on the light and dark card', () => {
    for (const n of [2, 3, 4, 5]) {
      const light = p.tokens[`--brand-chart-${n}` as BrandChartToken]!
      const dark = p.tokens[`--brand-chart-dark-${n}` as BrandChartToken]!
      expect(contrast(rgb(light), rgb(TRAYO_SURFACES.light.card))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
      expect(contrast(rgb(dark), rgb(TRAYO_SURFACES.dark.card))).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
    expect(p.slots.accents).toHaveLength(5)
    expect(p.tokens['--brand-chart-6' as BrandChartToken]).toBeUndefined()
  })

  it('a pale accent is darkened for the light card and noted; a dark one is lifted for the dark card', () => {
    const q = resolveBrandPalette({ primary: '#611f69', accents: ['#ecb22e', '#0a2540'] })
    expect(q.tokens['--brand-chart-2']).not.toBe('#ecb22e')
    expect(q.adjustments.join(' ')).toMatch(/accent #ecb22e is under 3:1 on the light card/)
    expect(q.tokens['--brand-chart-dark-3']).not.toBe('#0a2540')
  })

  it("the first accent is the secondary unless one is given; no accents on Trayo's page → no chart tokens", () => {
    expect(p.slots.secondary).toBe('#36c5f0')
    expect(
      resolveBrandPalette({ primary: '#611f69', secondary: '#e01e5a', accents: ['#36c5f0'] }).slots.secondary
    ).toBe('#e01e5a')
    expect(
      resolveBrandPalette({ ...BRANDS.paypal, surfaces: 'trayo' }).tokens['--brand-chart-2']
    ).toBeUndefined()
  })

  it('fills missing series from Trayo palette without repeating a chosen hue', () => {
    // Regression: one blue accent plus Trayo's blue fallback made series 2 and 5 identical.
    const q = resolveBrandPalette({ primary: '#611f69', accents: ['#2563eb'] })
    const light = [2, 3, 4, 5].map((n) => q.tokens[`--brand-chart-${n}` as BrandChartToken]!)
    expect(new Set(light).size).toBe(4)
    expect(light[0]).toBe('#2563eb')
    expect(light.slice(1)).not.toContain(TRAYO_SERIES_BLUE)
    const dark = [2, 3, 4, 5].map((n) => q.tokens[`--brand-chart-dark-${n}` as BrandChartToken]!)
    expect(new Set(dark).size).toBe(4)
  })

  it('checks filled-in series against the brand card under the complete override', () => {
    // Regression: Trayo amber (#d97706) is 2.07:1 on a #d0d0d0 card.
    const q = resolveBrandPalette({ primary: '#611f69', background: '#cccccc' })
    const card = q.tokens['--brand-surface']!
    for (const n of [2, 3, 4, 5]) {
      expect(
        contrast(rgb(q.tokens[`--brand-chart-${n}` as BrandChartToken]!), rgb(card))
      ).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
      expect(
        contrast(
          rgb(q.tokens[`--brand-chart-dark-${n}` as BrandChartToken]!),
          rgb(q.tokens['--brand-surface-dark']!)
        )
      ).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
    }
    expect(q.adjustments.join(' ')).toMatch(/series #d97706 is under 3:1 on the light card/)
  })

  it('always fills four distinct series, whatever hue the primary takes', () => {
    // Regression: a teal primary removed Trayo's teal from the pool and series
    // 5 was left to the CSS fallback, duplicating series 4.
    for (let h = 0; h < 360; h += 30) {
      const primary = toHex(fromOklch({ l: 0.5, c: 0.15, h }))
      const q = resolveBrandPalette({ primary, background: '#bfbfbf', surface: '#bfbfbf' })
      const light = [2, 3, 4, 5].map((n) => q.tokens[`--brand-chart-${n}` as BrandChartToken])
      expect(light.every(Boolean), primary).toBe(true)
      expect(new Set(light).size, primary).toBe(4)
      // Every filled series keeps at least 18° of hue from the primary and
      // from each other (Trayo amber vs a nearby orange was 17.2°).
      const hues = [primary, ...light].map((c) => toOklch(rgb(c!)).h)
      for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
          const d = Math.abs(hues[i] - hues[j])
          expect(Math.min(d, 360 - d), `${primary}: series ${i} vs ${j}`).toBeGreaterThanOrEqual(18)
        }
      }
      for (const c of light) {
        expect(contrast(rgb(c!), rgb(q.tokens['--brand-surface']!)), primary).toBeGreaterThanOrEqual(
          NON_TEXT_CONTRAST
        )
      }
    }
  })

  it('rejects a non-hex accent', () => {
    expect(checkBrandPalette({ primary: '#611f69', accents: ['blue'] })).toEqual([
      expect.objectContaining({ slot: 'accents' })
    ])
  })
})

describe('brandSlotsAgentGuide', () => {
  it('asks for the brand theme contract shape and documents every slot', () => {
    const guide = brandSlotsAgentGuide()
    for (const f of [
      '"primary"',
      '"onPrimary"',
      '"shell"',
      '"onShell"',
      '"background"',
      '"surface"',
      '"text"',
      '"mutedText"',
      '"accents"'
    ]) {
      expect(guide).toContain(f)
    }
    for (const name of Object.keys(BRAND_SLOTS)) {
      expect(guide).toMatch(new RegExp(`^${name} \\((required|optional)\\)`, 'm'))
    }
    expect(guide).toMatch(/never adjust a colour for contrast/)
  })
})

describe('contrast is the same for every brand', () => {
  // A panel around the hue wheel at three depths: the light primaries (cyan,
  // green, yellow) are the ones that used to land under the floors on the
  // brand's own container, where a navy or a purple cleared them by a mile.
  const panel: BrandPaletteInput[] = []
  for (let h = 0; h < 360; h += 30) {
    for (const l of [0.45, 0.6, 0.75]) {
      const primary = toHex(fromOklch({ l, c: 0.15, h }))
      panel.push({ primary }, { primary, canvas: 'vibrant' })
    }
  }
  panel.push({ primary: '#29b5e8' }, { primary: '#f25022' }, { primary: '#29b5e8', background: '#dff1fa' })

  const measure = (input: BrandPaletteInput) => {
    const t = resolveBrandPalette(input).tokens
    const page = ['--brand-background', '--brand-well', '--brand-surface', '--brand-raised'].map(
      (k) => rgb(t[k as keyof typeof t]!)
    )
    const container = rgb(t['--brand-container']!)
    // The soft accent fill (selected rows, soft badges) over the card and well.
    const soft = ['--brand-surface', '--brand-well'].map((k) =>
      over(t['--brand-accent-soft'], t[k as keyof typeof t]!)
    )
    const worst = (token: string, bgs: (typeof container)[]) =>
      Math.min(...bgs.map((bg) => contrast(rgb(t[token as keyof typeof t]!), bg)))
    return {
      text: worst('--brand-text', [...page, container]),
      secondary: worst('--brand-text-secondary', page),
      secondaryOnContainer: worst('--brand-text-secondary', [container]),
      muted: worst('--brand-text-muted', page),
      mutedOnContainer: worst('--brand-text-muted', [container]),
      accent: worst('--brand-accent-text', [...page, container, ...soft]),
      mutedOnPage: contrast(rgb(t['--brand-text-muted']!), page[0]),
      secondaryOnPage: contrast(rgb(t['--brand-text-secondary']!), page[0])
    }
  }

  it('every text tone clears its floor on every surface, the brand container included', () => {
    for (const input of panel) {
      const m = measure(input)
      const label = JSON.stringify(input)
      expect(m.text, label).toBeGreaterThanOrEqual(7)
      expect(m.secondary, label).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(m.secondaryOnContainer, label).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      // Meta text is text: 4.5:1 on the page ladder, not the 3:1 of a ring.
      expect(m.muted, label).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      expect(m.mutedOnContainer, label).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
      expect(m.accent, label).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      const t = resolveBrandPalette(input).tokens
      expect(
        contrast(rgb(t['--brand-accent-text-dark']), rgb(t['--brand-container-dark']!)),
        `${label} dark`
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST)
    }
  })

  it('derived greys sit in one narrow band, whatever the hue', () => {
    const derived = panel.filter((p) => !p.background).map(measure)
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values)
    expect(spread(derived.map((m) => m.mutedOnPage))).toBeLessThan(0.6)
    expect(spread(derived.map((m) => m.secondaryOnPage))).toBeLessThan(1)
  })

  it('derived secondary text is dark enough to stand apart from meta text', () => {
    for (const input of panel.filter((p) => !p.background)) {
      const m = measure(input)
      const label = JSON.stringify(input)
      expect(m.secondary, label).toBeGreaterThanOrEqual(7)
      expect(m.secondaryOnPage / m.mutedOnPage, label).toBeGreaterThanOrEqual(1.5)
    }
  })

  it("a brand's own mutedText is kept, not darkened to the derived level", () => {
    const p = resolveBrandPalette({ primary: '#611f69', background: '#ffffff', mutedText: '#616061' })
    expect(p.tokens['--brand-text-secondary']).toBe('#616061')
  })

  it('a derived ink is a near-neutral, not a tone of the brand', () => {
    for (const primary of ['#29b5e8', '#f25022', '#1db954']) {
      expect(toOklch(rgb(resolveBrandPalette({ primary }).tokens['--brand-text']!)).c).toBeLessThan(0.01)
    }
  })
})

describe('chart series are told apart in the theme they are drawn in', () => {
  const lab = (hex: string) => {
    const { l, c, h } = toOklch(rgb(hex))
    const r = (h * Math.PI) / 180
    return [l, c * Math.cos(r), c * Math.sin(r)]
  }
  const distance = (a: string, b: string) => {
    const [x, y] = [lab(a), lab(b)]
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
  }
  const series = (p: ReturnType<typeof resolveBrandPalette>) => ({
    light: [
      p.tokens['--brand-ring'],
      ...[2, 3, 4, 5].map((n) => p.tokens[`--brand-chart-${n}` as BrandChartToken]!)
    ],
    dark: [
      p.tokens['--brand-accent-text-dark'],
      ...[2, 3, 4, 5].map((n) => p.tokens[`--brand-chart-dark-${n}` as BrandChartToken]!)
    ]
  })

  it('a navy primary with a sky accent: the accent gives way in dark, where the two meet', () => {
    // Regression: lightened for the dark card, #002991 and #3fb6ff were 0.06
    // apart, so "Joined" and "Left" read as one bar.
    const p = resolveBrandPalette({ primary: '#002991', accents: ['#3fb6ff'], background: '#ffffff' })
    const s = series(p)
    expect(distance(s.dark[0], s.dark[1])).toBeGreaterThanOrEqual(0.1)
    expect(p.tokens['--brand-chart-dark-2']).not.toBe('#3fb6ff')
    // In light they were already apart, so the brand's own accent hue stays.
    const hue = (hex: string) => toOklch(rgb(hex)).h
    expect(Math.abs(hue(p.tokens['--brand-chart-2']!) - hue('#3fb6ff'))).toBeLessThan(10)
    expect(p.adjustments.join(' ')).toMatch(/chart series 2 .* too close to an earlier series on the dark card/)
  })

  it('every pair of series is apart in both themes, whatever hue the primary takes', () => {
    for (let h = 0; h < 360; h += 30) {
      const primary = toHex(fromOklch({ l: 0.5, c: 0.15, h }))
      const s = series(resolveBrandPalette({ primary, background: '#ffffff' }))
      for (const theme of [s.light, s.dark]) {
        for (let i = 0; i < theme.length; i++) {
          for (let j = i + 1; j < theme.length; j++) {
            expect(distance(theme[i], theme[j]), `${primary}: ${theme[i]} vs ${theme[j]}`).toBeGreaterThanOrEqual(0.1)
          }
        }
      }
    }
  })
})
