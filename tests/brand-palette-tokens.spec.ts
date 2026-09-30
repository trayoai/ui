import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BRAND_SHELL_TOKENS, BRAND_SLOTS, BRAND_TOKENS, TRAYO_SURFACES } from '../src/lib/brand-palette'

/**
 * The brand-slot contract between tokens.css (what Trayo UI reads) and
 * lib/brand-palette (what the resolver writes). Each side names the other's
 * tokens, so a rename on one side fails here instead of rendering violet.
 */
const css = readFileSync(resolve(__dirname, '../src/styles/tokens.css'), 'utf8')
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')

function block(selectorStart: RegExp): Map<string, string> {
  const m = new RegExp(`(^|\\n)${selectorStart.source}[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(css)
  if (!m) throw new Error(`no block for ${selectorStart}`)
  const map = new Map<string, string>()
  for (const d of stripComments(m[2]).matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    map.set(d[1], d[2].replace(/\s+/g, ' ').trim())
  }
  return map
}

const root = block(/:root\s*/)
const light = block(/\.light\s*/)
const dark = block(/\.dark\s*/)
const brandLight = block(/\[data-brand\],/)
const brandDark = block(/\.dark\[data-brand\],/)

describe('brand slots — tokens.css ⇄ lib/brand-palette', () => {
  it('documents every slot with an @slot annotation', () => {
    for (const slot of Object.values(BRAND_SLOTS)) {
      expect(css).toContain(`@slot ${slot.cssVar}`)
    }
  })

  it('reads only tokens the resolver emits, and uses every one of them', () => {
    const brandBlocks = stripComments(css.slice(css.indexOf('[data-brand],'), css.indexOf('@theme inline {')))
    const read = new Set([...brandBlocks.matchAll(/var\((--brand-[\w-]+)/g)].map((m) => m[1]))
    expect([...read].sort()).toEqual([...BRAND_TOKENS, ...BRAND_SHELL_TOKENS].sort())
  })

  it.each([
    ['light', brandLight],
    ['dark', brandDark]
  ])('the %s brand block re-declares every token that chains from the accent', (_name, brand) => {
    // A token like `--primary: var(--accent-brand)` resolves on the element
    // that declares it, so a branded element must declare it again.
    const chained = [...root.entries()]
      .filter(([, v]) => /var\(--(accent-|primary|ring|color-brand)/.test(v))
      .map(([k]) => k)
    expect(chained.length).toBeGreaterThan(5)
    for (const token of [...chained, '--accent-brand', '--accent-text', '--accent-soft', '--accent-line']) {
      expect(brand.has(token), `${token} missing`).toBe(true)
    }
  })

  it('every -rgb channel read has a fallback, so a primary-only brand keeps its backgrounds', () => {
    const brandBlocks = stripComments(css.slice(css.indexOf('[data-brand],'), css.indexOf('@theme inline {')))
    const reads = [...brandBlocks.matchAll(/var\((--brand-[\w-]+-rgb)(\)|,)/g)]
    expect(reads.length).toBeGreaterThan(0)
    for (const m of reads) expect(m[2], `${m[1]} has no fallback`).toBe(',')
  })

  it('a shell region re-themes the text scale and restates the tokens that alias it', () => {
    const region = block(/\[data-brand-shell\] \[data-shell-region\],/)
    for (const token of [
      '--surface-sidebar',
      '--text-primary',
      '--text-secondary',
      '--text-muted',
      '--text-secondary-card',
      '--text-muted-card',
      '--text-secondary-raised',
      '--text-muted-raised',
      '--muted-foreground',
      '--border-subtle',
      '--accent-text',
      '--accent-soft'
    ]) {
      expect(region.has(token), `${token} missing`).toBe(true)
    }
  })

  it('the shell exit only applies under a branded shell (unbranded sidebars keep their menu tokens)', () => {
    const selectors = [...stripComments(css).matchAll(/(^|\n)([^{}\n]*\[data-shell-exit\][^{}]*)\{/g)].map(
      (m) => m[2].trim()
    )
    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) expect(selector.startsWith('[data-brand-shell]')).toBe(true)
  })

  it('a shell exit restores, from the branded root, every token the shell region overrides', () => {
    const region = block(/\[data-brand-shell\] \[data-shell-region\],/)
    const capture = block(/\[data-brand-shell\](?= \{)/)
    const exit = block(/\[data-brand-shell\] \[data-shell-region\] \[data-shell-exit\]\s*/)
    for (const token of region.keys()) {
      const page = `--page${token.slice(1)}`
      expect(capture.get(page), `${page} not captured`).toBe(`var(${token})`)
      expect(exit.get(token), `${token} not restored`).toBe(`var(${page})`)
    }
  })

  it('dark tooltips stay the Trayo neutral grey under a brand', () => {
    expect(brandDark.get('--tooltip')).toBe(dark.get('--tooltip'))
    expect(brandDark.get('--tooltip-foreground')).toBe(dark.get('--tooltip-foreground'))
  })

  it('keeps --gradient-cta (Trayo DNA) out of the brand blocks', () => {
    expect(brandLight.has('--gradient-cta')).toBe(false)
    expect(brandDark.has('--gradient-cta')).toBe(false)
    expect(brandLight.get('--gradient-brand')).toMatch(/var\(--brand-primary\)/)
  })
})

describe('Trayo defaults are unchanged without data-brand', () => {
  it('shell cool glow keeps its prior light and dark values', () => {
    expect(root.get('--shell-glow-cool-rgb')).toBe('123 93 243')
    expect(root.get('--shell-glow-cool-alpha')).toBe('0.10')
    expect(light.get('--shell-glow-cool-rgb')).toBe('123 93 243')
    expect(light.get('--shell-glow-cool-alpha')).toBe('0.10')
    expect(dark.get('--shell-glow-cool-rgb')).toBe('132 92 255')
    expect(dark.get('--shell-glow-cool-alpha')).toBe('0.12')
  })

  it('brand mesh keeps its violet and lavender layers', () => {
    expect(root.get('--mesh-cool-rgb')).toBe('132 92 255')
    expect(root.get('--mesh-cool-2-rgb')).toBe('205 129 255')
  })

  it('no hard-coded violet is left in the shell glow or the mesh', () => {
    const decor = css.slice(css.indexOf('.app-shell-bg {'), css.indexOf('@keyframes brand-mesh-flow'))
    expect(decor).not.toMatch(/rgba\((132, 92, 255|123, 93, 243|205, 129, 255)/)
  })
})

describe('TRAYO_SURFACES mirrors tokens.css', () => {
  it.each([
    ['light', root, TRAYO_SURFACES.light],
    ['dark', dark, TRAYO_SURFACES.dark]
  ] as const)('%s surfaces and text', (_name, scope, surfaces) => {
    expect(scope.get('--color-app-shell')?.toLowerCase()).toBe(surfaces.shell)
    expect(scope.get('--color-app-well')?.toLowerCase()).toBe(surfaces.well)
    expect(scope.get('--color-app-card')?.toLowerCase()).toBe(surfaces.card)
    expect(scope.get('--color-app-raised')?.toLowerCase()).toBe(surfaces.raised)
    expect(scope.get('--text-primary')?.toLowerCase()).toBe(surfaces.text)
  })
})

describe('shell region restates every token that aliases what it overrides', () => {
  // A token like `--seg-thumb: var(--surface-card)` resolves where it is
  // declared (:root), so without a restatement the brand switcher in the top
  // bar kept a cream thumb under white shell text.
  const region = block(/\[data-brand-shell\] \[data-shell-region\],/)
  const overridden = [...region.keys()]
  it.each([
    [':root', root],
    ['.light', light],
    ['.dark', dark]
  ] as const)('%s', (_name, scope) => {
    for (const [token, value] of scope) {
      if (region.has(token)) continue
      const aliases = overridden.some((t) => value.includes(`var(${t})`) || value.includes(`var(${t},`))
      if (aliases) expect(region.has(token), `${token} (${value}) not restated`).toBe(true)
    }
  })
})
