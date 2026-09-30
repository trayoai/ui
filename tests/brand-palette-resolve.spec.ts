import { describe, expect, it } from 'vitest'

import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/lib/brand-palette/color'
import {
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

describe.each(Object.entries(BRANDS))('resolveBrandPalette — %s', (_name, input) => {
  const { tokens } = resolveBrandPalette(input)
  const light = TRAYO_SURFACES.light
  const dark = TRAYO_SURFACES.dark

  it('emits every token (plus the derived bar and brand mesh, bold being the default)', () => {
    expect(Object.keys(tokens).sort()).toEqual(
      [...BRAND_TOKENS, ...BRAND_SHELL_TOKENS, ...BRAND_MESH_TOKENS].sort()
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
    expect(p.tokens['--brand-on-primary']).toBe(TRAYO_SURFACES.light.text)
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
    expect(brandAttributes(p)).toEqual({ 'data-brand': '' })
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
    expect(p.tokens['--brand-on-shell']).toBe(TRAYO_SURFACES.light.text)
  })

  it('rejects a white or near-white shell', () => {
    const problems = checkBrandPalette({ primary: '#002991', shell: '#fafafa' })
    expect(problems).toEqual([
      expect.objectContaining({ slot: 'shell', message: expect.stringMatching(/near-white/) })
    ])
  })

  it('brandAttributes adds data-brand-shell only with a shell', () => {
    expect(brandAttributes(slack)).toEqual({ 'data-brand': '', 'data-brand-shell': '' })
    expect(brandAttributes(resolveBrandPalette({ ...BRANDS.paypal, emphasis: 'quiet' }))).toEqual({
      'data-brand': ''
    })
  })

  it('brandPaletteCss and brandPaletteStyle include the shell tokens when present', () => {
    expect(brandPaletteCss(slack)).toContain('  --brand-shell: #4a154b;')
    expect(Object.keys(brandPaletteStyle(slack))).toEqual([
      ...BRAND_TOKENS,
      ...BRAND_SHELL_TOKENS,
      ...BRAND_MESH_TOKENS
    ])
    expect(
      Object.keys(brandPaletteStyle(resolveBrandPalette({ ...BRANDS.paypal, emphasis: 'quiet' })))
    ).toEqual([...BRAND_TOKENS])
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
    expect(p.tokens['--brand-on-primary']).toBe(TRAYO_SURFACES.light.text)
    expect(p.tokens['--brand-on-shell']).toBe('#ffffff')
    expect(p.adjustments.join(' ')).toMatch(/onPrimary #ffffff is under 4.5:1/)
    expect(p.adjustments.join(' ')).toMatch(/onShell #611f69 is under 4.5:1/)
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

  it('emits the surface tokens only with a background, and the attribute with them', () => {
    for (const token of BRAND_SURFACE_TOKENS) expect(t[token]).toBeDefined()
    expect(resolveBrandPalette(BRANDS.paypal).tokens['--brand-background']).toBeUndefined()
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
      // As much of the 0.024 chroma as sRGB allows at this lightness for
      // this hue (navy near white clips well under it), never a flat white.
      const reachable = toOklch(fromOklch({ l: 0.965, c: 0.024, h: hue })).c
      expect(bg.c).toBeGreaterThanOrEqual(Math.min(0.024, reachable) - 0.003)
      expect(bg.c).toBeGreaterThanOrEqual(0.008)
      expect(bg.l).toBeLessThanOrEqual(0.966)
      expect(Math.abs(bg.h - hue)).toBeLessThan(8)
      // Cards stay a lighter, fainter step above the page.
      const card = toOklch(rgb(p.slots.surface!))
      expect(card.l).toBeGreaterThan(bg.l + 0.01)
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

  it('the first accent is the secondary unless one is given; no accents → no chart tokens', () => {
    expect(p.slots.secondary).toBe('#36c5f0')
    expect(
      resolveBrandPalette({ primary: '#611f69', secondary: '#e01e5a', accents: ['#36c5f0'] }).slots.secondary
    ).toBe('#e01e5a')
    expect(resolveBrandPalette(BRANDS.paypal).tokens['--brand-chart-2']).toBeUndefined()
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
