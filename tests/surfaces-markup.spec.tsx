import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { AppShell, AppShellNavLink, BrandBand, PageContainer } from '../src'

describe('AppShell rail', () => {
  it('renders a shell-region rail with the links, content beside it', () => {
    const html = renderToStaticMarkup(
      <AppShell brand="Acme" rail={<AppShellNavLink active>Accounts</AppShellNavLink>}>
        <PageContainer>content</PageContainer>
      </AppShell>
    )
    expect(html).toContain('data-slot="app-shell-rail"')
    expect(html).toContain('data-shell-region=""')
    expect(html).toMatch(/<nav aria-label="Sections"[^>]*>.*Accounts/)
    expect(html).toMatch(/data-slot="app-shell-body".*data-slot="page-container"/)
  })

  it('without a rail, children render directly (unchanged)', () => {
    const html = renderToStaticMarkup(
      <AppShell brand="Acme">
        <PageContainer>content</PageContainer>
      </AppShell>
    )
    expect(html).not.toContain('app-shell-rail')
    expect(html).not.toContain('app-shell-body')
  })
})

describe('BrandBand', () => {
  it('is a brand-filled section with the readable foreground', () => {
    const html = renderToStaticMarkup(<BrandBand>Headline</BrandBand>)
    expect(html).toContain('data-slot="brand-band"')
    expect(html).toContain('bg-accent-brand')
    expect(html).toContain('text-accent-brand-foreground')
  })
})
