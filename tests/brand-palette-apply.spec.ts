import { describe, expect, it } from 'vitest'

import {
  applyBrand,
  checkFills,
  FILL_PRESETS,
  fillsAttributes,
  resolveBrandPalette,
  type BrandDocument,
  type BrandThemeContract
} from '../src/lib/brand-palette'

/** The things applyBrand touches on a document, recorded. */
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

  it('fills: a preset name or a list becomes data-fill-* attributes, cleared on the next call', () => {
    const { doc, attrs } = fakeDocument()
    applyBrand(doc, slack, { fills: 'tiles' })
    expect(attrs.has('data-fill-tiles')).toBe(true)
    expect(attrs.has('data-fill-table-head')).toBe(true)
    expect(attrs.has('data-fill-cards')).toBe(false)
    applyBrand(doc, slack, { fills: ['cards'] })
    expect(attrs.has('data-fill-cards')).toBe(true)
    expect(attrs.has('data-fill-tiles')).toBe(false)
    applyBrand(doc, slack)
    expect([...attrs.keys()].some((k) => k.startsWith('data-fill-'))).toBe(false)
  })

  it('lead: the secondary leads and the former primary becomes the decoration', () => {
    const { doc } = fakeDocument()
    const led = applyBrand(doc, slack, { lead: 'secondary' })
    expect(led.slots.primary).toBe('#36c5f0')
    expect(led.slots.secondary).toBe('#611f69')
    expect(led.adjustments.join(' ')).toMatch(/lead 'secondary': #36c5f0 leads/)
  })

  it('is idempotent: a second call replaces the stylesheet and attributes', () => {
    const { doc, attrs, styles } = fakeDocument()
    applyBrand(doc, slack)
    applyBrand(doc, { primary: '#002991', emphasis: 'quiet' })
    expect(styles).toHaveLength(1)
    expect(styles[0].textContent).toMatch(/--brand-primary: #002991;/)
    expect(attrs.has('data-brand-shell')).toBe(false)
  })

  it('a raw palette that also looks like a contract keeps its raw-only fields', () => {
    const { doc } = fakeDocument()
    const raw = {
      ...slack,
      shell: undefined,
      onShell: undefined,
      emphasis: 'quiet' as const,
      secondary: '#e01e5a',
      canvas: 'vibrant' as const,
      lead: 'secondary' as const
    }
    const viaApply = applyBrand(doc, raw)
    const direct = resolveBrandPalette(raw)
    expect(viaApply.slots.shell).toBeNull()
    expect(viaApply.slots.primary).toBe('#e01e5a')
    expect(viaApply.tokens).toEqual(direct.tokens)
  })

  it('accepts raw slots and the canvas option', () => {
    const { doc, styles } = fakeDocument()
    const p = applyBrand(doc, { primary: '#611f69', background: '#ffffff' }, { canvas: 'vibrant' })
    expect(styles[0].textContent).toContain('--brand-background:')
    expect(p.slots.background).not.toBe('#ffffff')
  })

  it('throws, applying nothing, on a bad contract', () => {
    const { doc, attrs, styles } = fakeDocument()
    expect(() => applyBrand(doc, { ...slack, primary: 'aubergine' })).toThrow(/invalid brand palette/)
    expect(styles).toHaveLength(0)
    expect(attrs.size).toBe(0)
  })
})

describe('fills', () => {
  it('presets are valid; attributes are one per target', () => {
    for (const [name, f] of Object.entries(FILL_PRESETS)) expect(checkFills(f), name).toEqual([])
    expect(fillsAttributes(FILL_PRESETS.none)).toEqual({})
    expect(fillsAttributes(FILL_PRESETS.all)).toEqual({
      'data-fill-cards': '',
      'data-fill-tiles': '',
      'data-fill-table-head': ''
    })
  })

  it('rejects an unknown target and skips it in attributes', () => {
    expect(checkFills(['rows' as never])).toEqual([expect.objectContaining({ target: 'rows' })])
    expect(fillsAttributes(['rows' as never, 'tiles'])).toEqual({ 'data-fill-tiles': '' })
  })
})
