import { describe, expect, it } from 'vitest'

import {
  applyBrand,
  brandHeader,
  brandTexture,
  BRAND_HEADERS,
  BRAND_TEXTURES,
  checkDialect,
  resolveBrandPalette,
  DIALECT_PRESETS,
  dialectAgentGuide,
  dialectAttributes,
  type BrandDocument,
  type BrandThemeContract
} from '../src/lib/brand-palette'

/** The five things applyBrand touches on a document, recorded. */
function fakeDocument() {
  const attrs = new Map<string, string>()
  const classes = new Set<string>()
  const styles: { id: string; textContent: string | null }[] = []
  const doc: BrandDocument = {
    documentElement: {
      setAttribute: (n, v) => void attrs.set(n, v),
      removeAttribute: (n) => void attrs.delete(n),
      getAttributeNames: () => [...attrs.keys()],
      classList: {
        toggle: (t, force) => {
          const on = force ?? !classes.has(t)
          if (on) classes.add(t)
          else classes.delete(t)
          return on
        }
      }
    },
    head: { append: (n) => void styles.push(n as { id: string; textContent: string | null }) },
    getElementById: (id) => styles.find((s) => s.id === id) ?? null,
    createElement: () => ({ id: '', textContent: null })
  }
  return { doc, attrs, classes, styles }
}

const slack: BrandThemeContract = {
  primary: '#611f69',
  onPrimary: '#ffffff',
  shell: '#4a154b',
  onShell: '#ffffff',
  background: '#ffffff',
  surface: '#f8f8f8',
  text: '#1d1c1d',
  mutedText: '#616061',
  accents: ['#36c5f0', '#2eb67d']
}

describe('applyBrand', () => {
  it('does the whole sequence in one call and returns the palette', () => {
    const { doc, attrs, classes, styles } = fakeDocument()
    const palette = applyBrand(doc, slack)
    expect(styles).toHaveLength(1)
    expect(styles[0].id).toBe('trayo-brand')
    expect(styles[0].textContent).toMatch(/^html \{\n  --brand-primary: #611f69;/)
    expect(attrs.get('data-brand')).toBe('')
    expect(attrs.get('data-brand-shell')).toBe('')
    expect(attrs.get('data-brand-surfaces')).toBe('')
    expect(classes.has('dark')).toBe(palette.theme === 'dark')
    expect(palette.slots.shell).toBe('#4a154b')
  })

  it('theme: explicit light/dark wins over the recommendation', () => {
    const a = fakeDocument()
    applyBrand(a.doc, slack, { theme: 'light' })
    expect(a.classes.has('dark')).toBe(false)
    const b = fakeDocument()
    applyBrand(b.doc, slack, { theme: 'dark' })
    expect(b.classes.has('dark')).toBe(true)
  })

  it('dialect: a preset name or an object becomes data-dialect-* attributes; default axes are omitted', () => {
    const { doc, attrs } = fakeDocument()
    applyBrand(doc, slack, { dialect: 'editorial' })
    expect(attrs.get('data-dialect-callout')).toBe('bar-left')
    expect(attrs.get('data-dialect-table')).toBe('zebra')
    applyBrand(doc, slack, { dialect: { card: 'tinted', button: 'default' } })
    expect(attrs.get('data-dialect-card')).toBe('tinted')
    expect(attrs.has('data-dialect-button')).toBe(false)
    expect(attrs.has('data-dialect-callout')).toBe(false) // the previous dialect was cleared
  })

  it('is idempotent: a second call replaces the stylesheet and attributes', () => {
    const { doc, attrs, styles } = fakeDocument()
    applyBrand(doc, slack)
    applyBrand(doc, { primary: '#002991', emphasis: 'quiet' })
    expect(styles).toHaveLength(1)
    expect(styles[0].textContent).toMatch(/--brand-primary: #002991;/)
    expect(attrs.has('data-brand-shell')).toBe(false)
  })

  it('accepts raw slots and the canvas option', () => {
    const { doc, styles } = fakeDocument()
    const p = applyBrand(doc, { primary: '#611f69', background: '#ffffff' }, { canvas: 'vibrant' })
    expect(styles[0].textContent).toContain('--brand-background:')
    expect(p.slots.background).not.toBe('#ffffff')
  })

  it('a raw palette that also looks like a contract keeps its raw-only fields', () => {
    // Regression: emphasis 'quiet' was dropped on the way through the contract mapper.
    const { doc } = fakeDocument()
    const raw = {
      ...slack,
      shell: undefined,
      onShell: undefined,
      emphasis: 'quiet' as const,
      secondary: '#e01e5a',
      canvas: 'vibrant' as const
    }
    const viaApply = applyBrand(doc, raw)
    const direct = resolveBrandPalette(raw)
    expect(viaApply.slots.shell).toBeNull()
    expect(viaApply.slots.secondary).toBe('#e01e5a')
    expect(viaApply.tokens).toEqual(direct.tokens)
  })

  it('throws, applying nothing, on a bad contract', () => {
    const { doc, attrs, styles } = fakeDocument()
    expect(() => applyBrand(doc, { ...slack, primary: 'aubergine' })).toThrow(/invalid brand palette/)
    expect(styles).toHaveLength(0)
    expect(attrs.size).toBe(0)
  })
})

describe('brand texture', () => {
  const primaries = ['#635bff', '#15191e', '#00b3fe', '#171717', '#3ecf8e', '#c5b1f9', '#e4f222', '#7f3add', '#7a005d']
  const textureOf = (primary: string) => brandTexture(resolveBrandPalette({ primary }))

  it('applyBrand sets one of the three on the root, derived from the primary', () => {
    const { doc, attrs } = fakeDocument()
    const palette = applyBrand(doc, { primary: '#635bff' })
    expect(BRAND_TEXTURES).toContain(attrs.get('data-brand-texture'))
    expect(attrs.get('data-brand-texture')).toBe(brandTexture(palette))
  })

  it('is the same for a colour however it is written, and every time', () => {
    expect(textureOf('#635BFF')).toBe(textureOf('#635bff'))
    expect(textureOf('#635bff')).toBe(textureOf('#635bff'))
  })

  it('spreads brands across all three, so two apps do not share one by default', () => {
    expect(new Set(primaries.map(textureOf)).size).toBe(BRAND_TEXTURES.length)
  })

  it('the option overrides the derived one, and none is allowed', () => {
    const { doc, attrs } = fakeDocument()
    applyBrand(doc, { primary: '#635bff' }, { texture: 'dots' })
    expect(attrs.get('data-brand-texture')).toBe('dots')
    applyBrand(doc, { primary: '#635bff' }, { texture: 'none' })
    expect(attrs.get('data-brand-texture')).toBe('none')
  })

  it('a second brand replaces the first one\'s texture', () => {
    const { doc, attrs } = fakeDocument()
    applyBrand(doc, { primary: '#635bff' }, { texture: 'dots' })
    applyBrand(doc, { primary: '#15191e' })
    expect(attrs.get('data-brand-texture')).toBe(textureOf('#15191e'))
  })
})

describe('brand header', () => {
  const headerOf = (primary: string) => brandHeader(resolveBrandPalette({ primary }))

  it('applyBrand sets it on the root, derived from the primary', () => {
    const { doc, attrs } = fakeDocument()
    const palette = applyBrand(doc, { primary: '#635bff' })
    expect(BRAND_HEADERS).toContain(attrs.get('data-brand-header'))
    expect(attrs.get('data-brand-header')).toBe(brandHeader(palette))
  })

  it('a black or grey primary gets the plain header, never a grey band', () => {
    for (const grey of ['#000000', '#15191e', '#171717', '#222326', '#808080']) {
      expect(headerOf(grey)).toBe('plain')
    }
  })

  it('a primary with a hue gets the band or the card, and brands land on both', () => {
    const chromatic = ['#635bff', '#00b3fe', '#3ecf8e', '#c5b1f9', '#e4f222', '#e01e5a', '#fb0f01', '#4a8cff', '#7f3add']
    const styles = chromatic.map(headerOf)
    expect(styles).not.toContain('plain')
    expect(new Set(styles)).toEqual(new Set(['band', 'card']))
    // The band is the more common of the two.
    expect(styles.filter((s) => s === 'band').length).toBeGreaterThan(styles.filter((s) => s === 'card').length)
  })

  it('is the same for a colour however it is written', () => {
    expect(headerOf('#635BFF')).toBe(headerOf('#635bff'))
  })

  it('the option overrides the derived one, and a second brand replaces it', () => {
    const { doc, attrs } = fakeDocument()
    applyBrand(doc, { primary: '#15191e' }, { header: 'band' })
    expect(attrs.get('data-brand-header')).toBe('band')
    applyBrand(doc, { primary: '#15191e' })
    expect(attrs.get('data-brand-header')).toBe('plain')
  })
})

describe('dialect', () => {
  it('presets are valid and attributes omit defaults', () => {
    for (const [name, d] of Object.entries(DIALECT_PRESETS)) expect(checkDialect(d), name).toEqual([])
    expect(dialectAttributes(DIALECT_PRESETS.plain)).toEqual({})
    expect(dialectAttributes(DIALECT_PRESETS.tinted)).toMatchObject({ 'data-dialect-card': 'tinted' })
  })

  it('rejects unknown axes and options', () => {
    expect(checkDialect({ card: 'shiny' as never })).toEqual([expect.objectContaining({ axis: 'card' })])
    expect(checkDialect({ hat: 'tall' } as never)).toEqual([expect.objectContaining({ axis: 'hat' })])
  })

  it('the agent guide lists every axis and option', () => {
    const g = dialectAgentGuide()
    expect(g).toContain('callout: default | bar-left | bar-right | filled | outlined')
    expect(g).toContain('tile: default | tinted | big-number')
  })
})
