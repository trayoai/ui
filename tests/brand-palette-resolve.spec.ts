import { describe, expect, it } from 'vitest'

import { contrast, parseHex, toOklch } from '../src/lib/brand-palette/color'
import {
  BRAND_SHELL_TOKENS,
  BRAND_TOKENS,
  brandAttributes,
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

  it('emits every token', () => {
    expect(Object.keys(tokens).sort()).toEqual([...BRAND_TOKENS].sort())
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

describe('shell slot', () => {
  const slack = resolveBrandPalette({ primary: '#611f69', shell: '#4a154b', secondary: '#36c5f0' })
  const t = slack.tokens

  it('emits the shell tokens only when there is a shell', () => {
    for (const token of BRAND_SHELL_TOKENS) expect(t[token]).toMatch(/^#[0-9a-f]{6}$/)
    const noShell = resolveBrandPalette(BRANDS.paypal)
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
    expect(brandAttributes(resolveBrandPalette(BRANDS.paypal))).toEqual({ 'data-brand': '' })
  })

  it('brandPaletteCss and brandPaletteStyle include the shell tokens when present', () => {
    expect(brandPaletteCss(slack)).toContain('  --brand-shell: #4a154b;')
    expect(Object.keys(brandPaletteStyle(slack))).toEqual([...BRAND_TOKENS, ...BRAND_SHELL_TOKENS])
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
