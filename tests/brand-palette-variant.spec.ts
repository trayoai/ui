import { describe, expect, it } from 'vitest'

import {
  applyBrand,
  brandLeads,
  brandVariant,
  brandVariantOptions,
  fromBrandThemeContract,
  type BrandDocument,
  type BrandThemeContract
} from '../src/lib/brand-palette'
import { parseHex, toOklch } from '../src/lib/brand-palette/color'

function fakeDocument() {
  const attrs = new Map<string, string>()
  const doc: BrandDocument = {
    documentElement: {
      setAttribute: (n, v) => void attrs.set(n, v),
      removeAttribute: (n) => void attrs.delete(n),
      getAttributeNames: () => [...attrs.keys()],
      classList: { toggle: () => true }
    },
    head: { append: () => undefined },
    getElementById: () => null,
    createElement: () => ({ id: '', textContent: null })
  }
  return { doc, attrs }
}

const page = { background: '#ffffff', text: '#1d1c1d', mutedText: '#616061', onPrimary: '#ffffff' }
const BRANDS: Record<string, BrandThemeContract> = {
  paypal: { ...page, primary: '#002991', shell: '#ffffff', onShell: '#001435', surface: '#f5f7fa', accents: ['#3fb6ff'] },
  slack: {
    ...page,
    primary: '#611f69',
    shell: '#4a154b',
    onShell: '#ffffff',
    surface: '#f8f8f8',
    accents: ['#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a']
  },
  stripe: { ...page, primary: '#543afc', shell: '#ffffff', onShell: '#0a2540', surface: '#f6f9fc' },
  apple: { ...page, primary: '#000000', shell: '#f5f5f7', onShell: '#1d1d1f', surface: '#f5f5f7' },
  yellow: { ...page, primary: '#ffe01b', onPrimary: '#000000', shell: '#ffffff', onShell: '#111111', surface: '#fafafa' }
}

describe('brandVariant: a deterministic rotation', () => {
  it('neighbours always differ in silhouette and theme', () => {
    for (let n = 0; n < 60; n++) {
      const a = brandVariant(n)
      const b = brandVariant(n + 1)
      expect(a.silhouette, `slot ${n}`).not.toBe(b.silhouette)
      expect(a.theme, `slot ${n}`).not.toBe(b.theme)
    }
  })

  it('twelve slots in a row never repeat silhouette × theme × lead', () => {
    const keys = Array.from({ length: 12 }, (_, n) => brandVariant(n)).map((v) => `${v.silhouette}/${v.theme}/${v.lead}`)
    expect(new Set(keys).size).toBe(12)
  })

  it('only colours the brand owns lead: never the derived tertiary', () => {
    for (let n = 0; n < 36; n++) expect(brandVariant(n).lead).not.toBe('tertiary')
  })

  it('a string seed always lands on the same slot', () => {
    expect(brandVariant('recipe-42')).toEqual(brandVariant('recipe-42'))
    expect(brandVariant('recipe-42').index).toBe(brandVariant(brandVariant('recipe-42').index).index)
  })

  it('one coloured region: only the rail keeps the derived bar; the band and quiet looks fill nothing big', () => {
    for (let n = 0; n < 6; n++) {
      const v = brandVariant(n)
      expect(v.emphasis).toBe(v.silhouette === 'rail' ? 'bold' : 'quiet')
      expect(v.fills).toEqual(v.silhouette === 'quiet' ? expect.stringMatching(/^(tiles|cards)$/) : 'none')
    }
  })
})

describe('brandVariant: guardrails on real palettes', () => {
  it('skips a lead the brand cannot take', () => {
    expect(brandLeads(fromBrandThemeContract(BRANDS.apple).input)).toEqual(['primary'])
    expect(brandLeads(fromBrandThemeContract(BRANDS.stripe).input)).toEqual(['primary', 'tertiary'])
    expect(brandLeads(fromBrandThemeContract(BRANDS.slack).input)).toEqual(['primary', 'secondary', 'tertiary'])
    // A brand with no second colour of its own (Stripe here) stays primary-led.
    const wantsSecondary = Array.from({ length: 12 }, (_, n) => n).filter((n) => brandVariant(n).lead === 'secondary')
    expect(wantsSecondary.length).toBe(6)
    for (const n of wantsSecondary) expect(brandVariant(n, BRANDS.stripe).lead).toBe('primary')
    // Regression (review): raw slots keep their explicit secondary.
    const raw = { primary: '#000000', secondary: '#2563eb', onPrimary: '#ffffff', text: '#111111', background: '#ffffff' }
    expect(brandVariant(wantsSecondary[0], raw).lead).toBe('secondary')
    for (let n = 0; n < 36; n++) {
      expect(brandVariant(n, BRANDS.apple).lead).toBe('primary')
      expect(brandVariant(n, BRANDS.stripe).lead).toBe('primary')
    }
  })

  it.each(Object.keys(BRANDS))('%s: every slot keeps a neutral page and applies cleanly', (name) => {
    const contract = BRANDS[name]
    for (let n = 0; n < 36; n++) {
      const v = brandVariant(n, contract)
      const { doc, attrs } = fakeDocument()
      const palette = applyBrand(doc, contract, brandVariantOptions(v))
      expect(palette.adjustments.join(' '), `${name} slot ${n}`).not.toMatch(/no usable colour/)
      expect(attrs.has('data-page')).toBe(false)
      // The page stays the contract's white: no brand tint, no bright wash.
      const bg = toOklch(parseHex(palette.slots.background!)!)
      expect(bg.c, `${name} slot ${n}`).toBeLessThan(0.005)
      expect(bg.l).toBeGreaterThan(0.97)
      // No derived bar outside the rail: the band or the tiles are the region.
      if (contract.shell === '#ffffff' || contract.primary === '#000000') {
        // No coloured chrome of its own: the derived bar shows on the rail look only.
        expect(attrs.has('data-brand-shell'), `${name} slot ${n} ${v.silhouette}`).toBe(v.silhouette === 'rail')
      }
      if (v.silhouette !== 'quiet') expect([...attrs.keys()].some((k) => k.startsWith('data-fill-'))).toBe(false)
    }
  })
})
