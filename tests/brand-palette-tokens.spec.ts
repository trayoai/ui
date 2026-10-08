import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { DIALECT_AXES } from '../src/lib/brand-palette'
import {
  BRAND_CHART_TOKENS,
  BRAND_CONTAINER_TOKENS,
  BRAND_MESH_TOKENS,
  BRAND_SHELL_TOKENS,
  BRAND_SLOTS,
  BRAND_SURFACE_TOKENS,
  BRAND_TOKENS,
  TRAYO_SURFACES
} from '../src/lib/brand-palette'

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
    const docs = css.slice(0, css.indexOf('[data-brand],'))
    for (const slot of Object.values(BRAND_SLOTS)) {
      // The four surface slots share one annotation; chart-2 stands for 2..5.
      const name = slot.cssVar.replace(/^--brand-chart-2$/, '--brand-chart-2..5')
      expect(docs, `${slot.cssVar} undocumented`).toMatch(
        new RegExp(`@slot [^\n]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      )
    }
  })

  it('reads only tokens the resolver emits, and uses every one of them', () => {
    const brandBlocks = stripComments(css.slice(css.indexOf('[data-brand],'), css.indexOf('@theme inline {')))
    const read = new Set([...brandBlocks.matchAll(/var\((--brand-[\w-]+)/g)].map((m) => m[1]))
    expect([...read].sort()).toEqual(
      [
        ...BRAND_TOKENS,
        ...BRAND_SHELL_TOKENS,
        ...BRAND_SURFACE_TOKENS,
        ...BRAND_CHART_TOKENS,
        ...BRAND_MESH_TOKENS,
        ...BRAND_CONTAINER_TOKENS
      ].sort()
    )
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

describe('brand shell glow', () => {
  it('is half as strong as Trayo\'s on a light branded page, and unchanged in dark', () => {
    expect(brandLight.get('--shell-glow-cool-alpha')).toBe('0.05')
    expect(brandDark.get('--shell-glow-cool-alpha')).toBe(dark.get('--shell-glow-cool-alpha'))
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

describe('what renders is what the resolver checked', () => {
  it('a shell region paints the opaque shell, not a translucent page tint', () => {
    expect(css).toMatch(
      /\[data-brand-shell\] \[data-shell-region\],\n\[data-brand-shell\]\[data-shell-region\] \{\n  background-color: var\(--brand-shell\);\n\}/
    )
  })

  it('dark chart-1 is the accent text tone (4.5:1 on the dark card), not the fill', () => {
    expect(brandDark.get('--chart-1')).toBe('var(--accent-text)')
  })

  it('no kit component puts a hard-coded white label on a brand fill', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = resolve(dir, f)
        return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : []
      })
    for (const file of walk(resolve(__dirname, '../src/components'))) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/'[^']*bg-accent-brand[^']*'/g)) {
        expect(m[0], file).not.toMatch(/\btext-white\b/)
      }
    }
  })
})

describe('complete override — [data-brand-surfaces]', () => {
  const surfacesLight = block(/\[data-brand-surfaces\],/)
  const surfacesDark = block(/\.dark\[data-brand-surfaces\],/)

  it('sets the surface ladder, text scale and borders from the surface tokens (light)', () => {
    for (const [token, from] of [
      ['--color-app-shell', '--brand-background'],
      ['--color-app-card', '--brand-surface'],
      ['--color-app-well', '--brand-well'],
      ['--color-app-row', '--brand-row'],
      ['--color-app-raised', '--brand-raised'],
      ['--text-primary', '--brand-text'],
      ['--text-secondary', '--brand-text-secondary'],
      ['--text-muted', '--brand-text-muted'],
      ['--border-subtle', '--brand-border-subtle'],
      ['--border-strong', '--brand-border-strong']
    ]) {
      expect(surfacesLight.get(token), token).toBe(`var(${from})`)
    }
  })

  it("light drop shadows use the brand's shadow ink; none keeps Trayo's sand", () => {
    for (const token of [
      '--shadow-card',
      '--shadow-card-float',
      '--shadow-card-raised',
      '--shadow-card-raised-up',
      '--shadow-toast',
      '--shadow-seg-active'
    ]) {
      expect(surfacesLight.get(token), token).toContain('rgb(var(--brand-shadow-rgb, 132 106 42) / ')
      expect(surfacesLight.get(token), token).not.toMatch(/rgba?\(\d/)
    }
  })

  it('dark tints only the ladder and restates text and borders with .dark values', () => {
    expect(surfacesDark.get('--color-app-shell')).toBe('var(--brand-background-dark)')
    expect(surfacesDark.get('--text-primary')).toBe(dark.get('--text-primary'))
    expect(surfacesDark.get('--border-subtle')).toBe(dark.get('--border-subtle'))
  })

  it('dark re-declares every token the light override sets, so the light block cannot win in dark', () => {
    // Both blocks match <html class="dark" data-brand-surfaces>; the light one
    // is later at equal specificity. Regression: dark text on dark cards (1.15:1).
    for (const token of surfacesLight.keys()) {
      expect(surfacesDark.has(token), `${token} not restated for dark`).toBe(true)
      if (!token.startsWith('--color-app-') && token !== '--gradient-shell') {
        expect(surfacesDark.get(token), token).toBe(dark.get(token) ?? root.get(token))
      }
    }
  })

  it.each([
    ['light', surfacesLight, [root, light]],
    ['dark', surfacesDark, [dark]]
  ] as const)('%s restates every token that aliases one it overrides', (_n, blockMap, scopes) => {
    const set = [...blockMap.keys()]
    for (const scope of scopes) {
      for (const [token, value] of scope) {
        if (blockMap.has(token)) continue
        const aliases = set.some((t) => value.includes(`var(${t})`) || value.includes(`var(${t},`))
        if (aliases) expect(blockMap.has(token), `${token} (${value}) not restated`).toBe(true)
      }
    }
  })

  it('chart series 2–5 come from the accents with Trayo fallbacks', () => {
    for (const n of [2, 3, 4, 5]) {
      expect(brandLight.get(`--chart-${n}`)).toMatch(
        new RegExp(`^var\\(--brand-chart-${n}, #[0-9a-f]{6}\\)$`)
      )
      expect(brandDark.get(`--chart-${n}`)).toMatch(
        new RegExp(`^var\\(--brand-chart-dark-${n}, #[0-9a-f]{6}\\)$`)
      )
    }
    expect(brandLight.get('--chart-2')).toContain(root.get('--chart-2'))
    expect(brandDark.get('--chart-2')).toContain(dark.get('--chart-2'))
  })
})

describe('mesh warm layers', () => {
  it('route through variables with Trayo defaults, and take the brand under data-brand', () => {
    expect(root.get('--mesh-warm-rgb')).toBe('255 161 130')
    expect(root.get('--mesh-warm-2-rgb')).toBe('255 123 49')
    expect(root.get('--mesh-warm-3-rgb')).toBe('253 220 152')
    const mesh = css.slice(css.indexOf('.brand-mesh::before'), css.indexOf('@keyframes brand-mesh-flow'))
    expect(mesh).not.toMatch(/rgba\((255, 161, 130|255, 123, 49|253, 220, 152)/)
    expect(brandLight.get('--mesh-warm-rgb')).toBe('var(--brand-mesh-warm-rgb, 255 161 130)')
  })
})

describe('containers and dialects', () => {
  it('container tokens have Trayo defaults, brand overrides and utilities', () => {
    expect(root.get('--container')).toMatch(/^#/)
    expect(dark.get('--container')).toMatch(/^#/)
    expect(brandLight.get('--container')).toBe('var(--brand-container, var(--accent-soft))')
    expect(brandDark.get('--container')).toBe('var(--brand-container-dark, var(--accent-soft))')
    expect(css).toMatch(/--color-container: var\(--container\);/)
    expect(css).toMatch(/--color-container-foreground: var\(--container-foreground\);/)
  })

  it('every dialect option except default has a rule', () => {
    const rules = css.slice(css.indexOf('DIALECTS —'), css.indexOf('@theme inline {'))
    for (const [axis, def] of Object.entries(DIALECT_AXES)) {
      for (const opt of def.options) {
        if (opt === 'default') continue
        expect(rules, `${axis}=${opt}`).toContain(`[data-dialect-${axis}='${opt}']`)
      }
    }
  })
})

describe('dialect rules keep interaction states', () => {
  const rules = css.slice(css.indexOf('DIALECTS —'), css.indexOf('@theme inline {'))
  it('zebra and cards fills leave hover and selected rows to the table', () => {
    expect(rules).toMatch(
      /zebra'\] \[data-slot='table-body'\] \[data-slot='table-row'\]:nth-child\(even\):not\(:hover\):not\(\[data-state='selected'\]\)/
    )
    expect(rules).toMatch(
      /cards'\] \[data-slot='table-body'\] \[data-slot='table-row'\]\[data-state='selected'\]/
    )
  })
  it('soft and outline buttons draw a focus ring', () => {
    expect(rules).toMatch(/button='soft'\] \[data-slot='button'\]\.bg-accent-brand:focus-visible/)
    expect(rules).toMatch(/button='outline'\] \[data-slot='button'\]\.bg-accent-brand:focus-visible/)
  })
  it('dense sets the cell height, not extra padding', () => {
    expect(rules).toMatch(
      /dense'\] \[data-slot='table-cell'\] \{ height: 2\.25rem; padding-top: 0; padding-bottom: 0; \}/
    )
  })
})
