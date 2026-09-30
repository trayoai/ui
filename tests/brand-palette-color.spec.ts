import { describe, expect, it } from 'vitest'

import {
  composite,
  contrast,
  fromOklch,
  parseHex,
  shiftLightnessUntil,
  toHex,
  toOklch,
  toRgbChannels
} from '../src/lib/brand-palette/color'

describe('parseHex / toHex', () => {
  it.each([
    ['#845CFF', '#845cff'],
    ['845cff', '#845cff'],
    ['#abc', '#aabbcc'],
    ['  #000000 ', '#000000']
  ])('%s → %s', (input, hex) => {
    expect(toHex(parseHex(input)!)).toBe(hex)
  })

  it.each(['', 'blue', '#12345', '#gggggg', 'rgb(0,0,0)'])('rejects %j', (input) => {
    expect(parseHex(input)).toBeNull()
  })

  it('writes space-separated channels for rgb(var() / a)', () => {
    expect(toRgbChannels(parseHex('#845cff')!)).toBe('132 92 255')
  })
})

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast(parseHex('#000')!, parseHex('#fff')!)).toBeCloseTo(21, 5)
    expect(contrast(parseHex('#777')!, parseHex('#fff')!)).toBeCloseTo(4.48, 2)
  })

  it('composites alpha over a background', () => {
    expect(toHex(composite(parseHex('#845cff')!, 0.1, parseHex('#ffffff')!))).toBe('#f3efff')
  })
})

describe('OKLCH round trip', () => {
  it.each(['#845cff', '#002991', '#3fb6ff', '#ffe01b', '#000000', '#ffffff', '#727272'])('%s', (hex) => {
    expect(toHex(fromOklch(toOklch(parseHex(hex)!)))).toBe(hex)
  })

  it('greys have no chroma', () => {
    expect(toOklch(parseHex('#727272')!).c).toBeLessThan(1e-4)
  })

  it('maps out-of-gamut colours by lowering chroma', () => {
    const rgb = fromOklch({ l: 0.9, c: 0.4, h: 264 })
    for (const c of rgb) {
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThanOrEqual(1)
    }
    expect(toOklch(rgb).l).toBeCloseTo(0.9, 2)
  })
})

describe('shiftLightnessUntil', () => {
  const white = parseHex('#fff')!

  it('returns the input when it already passes', () => {
    const navy = parseHex('#002991')!
    expect(shiftLightnessUntil(navy, 'darker', (c) => contrast(c, white) >= 4.5)).toBe(navy)
  })

  it('darkens until the check holds, keeping the hue', () => {
    const yellow = parseHex('#ffe01b')!
    const out = shiftLightnessUntil(yellow, 'darker', (c) => contrast(c, white) >= 4.5)
    expect(contrast(out, white)).toBeGreaterThanOrEqual(4.5)
    expect(Math.abs(toOklch(out).h - toOklch(yellow).h)).toBeLessThan(6)
  })

  it('returns the extreme when nothing passes', () => {
    expect(toHex(shiftLightnessUntil(white, 'darker', () => false))).toBe('#000000')
  })
})
