import { describe, expect, it } from 'vitest'

import {
  applyBrand,
  checkDialect,
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

  it('throws, applying nothing, on a bad contract', () => {
    const { doc, attrs, styles } = fakeDocument()
    expect(() => applyBrand(doc, { ...slack, primary: 'aubergine' })).toThrow(/invalid brand palette/)
    expect(styles).toHaveLength(0)
    expect(attrs.size).toBe(0)
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
