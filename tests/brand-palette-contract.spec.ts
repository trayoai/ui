import { describe, expect, it } from 'vitest'

import { parseHex, toOklch } from '../src/lib/brand-palette/color'

const rgb = (hex: string) => parseHex(hex)!

import {
  CONTRACT_SURFACE_FIELDS,
  checkBrandPalette,
  fromBrandThemeContract,
  resolveBrandPalette,
  type BrandThemeContract
} from '../src/lib/brand-palette'

// Shape of a brand-research agent's output (the brand theme contract).
const slack: BrandThemeContract = {
  primary: '#611F69',
  onPrimary: '#ffffff',
  shell: '#4A154B',
  onShell: '#ffffff',
  background: '#ffffff',
  surface: '#f8f8f8',
  text: '#1d1c1d',
  mutedText: '#616061',
  accents: ['#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a']
}

describe('fromBrandThemeContract', () => {
  it('maps primary, on-colours, shell and the first accent onto the slots', () => {
    const { input } = fromBrandThemeContract(slack)
    expect(input).toEqual({
      primary: '#611f69',
      onPrimary: '#ffffff',
      primaryDark: null,
      accents: ['#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a'],
      shell: '#4a154b',
      onShell: '#ffffff',
      background: '#ffffff',
      surface: '#f8f8f8',
      text: '#1d1c1d',
      mutedText: '#616061'
    })
    expect(checkBrandPalette(input)).toEqual([])
    expect(resolveBrandPalette(input).tokens['--brand-shell']).toBe('#4a154b')
  })

  it("surfaces: 'trayo' keeps Trayo page, cards and text, and says so", () => {
    const { notes } = fromBrandThemeContract(slack, { surfaces: 'trayo' })
    for (const field of CONTRACT_SURFACE_FIELDS) {
      expect(notes.some((n) => n.startsWith(`${field} `))).toBe(true)
    }
    expect(notes.join(' ')).not.toMatch(/accent/)
    expect(
      fromBrandThemeContract({ ...slack, accents: [...slack.accents!, '#123456'] }).notes.join(' ')
    ).toMatch(/1 accent\(s\) beyond the fourth/)
  })

  it('drops a light shell or one that is the page colour', () => {
    // #ffddee: light by the resolver's measure (OKLCH), not by RGB luma; the
    // mapper used to keep it and the resolver then threw.
    for (const shell of ['#ffffff', '#f7f7f7', '#ffddee']) {
      const { input, notes } = fromBrandThemeContract({ ...slack, shell, background: '#f7f7f7' })
      expect(input.shell).toBeNull()
      expect(input.onShell).toBeNull()
      expect(notes.join(' ')).toMatch(
        /it is left out \(with emphasis 'bold' the bar takes a deep step of the primary/
      )
      expect(() => resolveBrandPalette(input)).not.toThrow()
    }
  })

  it('accents become chart series 2–5; the first is the secondary; primary and neutrals are skipped', () => {
    const p = resolveBrandPalette(fromBrandThemeContract(slack).input)
    expect(p.tokens['--brand-chart-2']).toBeDefined()
    expect(p.tokens['--brand-chart-5']).toBeDefined()
    expect(p.slots.secondary).toBe('#36c5f0')
    const q = resolveBrandPalette(
      fromBrandThemeContract({ ...slack, accents: ['#611f69', '#777777', '#2eb67d'] }).input
    )
    expect(q.slots.accents).toEqual(['#2eb67d'])
    expect(q.slots.secondary).toBe('#2eb67d')
    // Series 3–5 are filled from Trayo's palette once a brand has any accent.
    expect(q.tokens['--brand-chart-3']).toBeDefined()
    expect(q.tokens['--brand-chart-3']).not.toBe(q.tokens['--brand-chart-2'])
    expect(
      resolveBrandPalette(fromBrandThemeContract({ ...slack, accents: undefined }).input).slots.secondary
    ).toBeNull()
  })

  it('passes the dark page and card through with the surface override, and drops them without it', () => {
    const contract = { ...slack, backgroundDark: '#000000', surfaceDark: '#111111' }
    const brand = fromBrandThemeContract(contract).input
    expect(brand.backgroundDark).toBe('#000000')
    expect(brand.surfaceDark).toBe('#111111')
    const trayo = fromBrandThemeContract(contract, { surfaces: 'trayo' }).input
    expect(trayo.backgroundDark).toBeUndefined()
    expect(trayo.surfaceDark).toBeUndefined()
  })

  it('passes the page and text through by default: the company styling is the canvas', () => {
    const { input, notes } = fromBrandThemeContract(slack)
    expect(input).toMatchObject({
      background: '#ffffff',
      surface: '#f8f8f8',
      text: '#1d1c1d',
      mutedText: '#616061'
    })
    expect(notes.join(' ')).not.toMatch(/not applied/)
    const p = resolveBrandPalette(input)
    // A white page takes the brand's hue as a soft tint; cards a fainter one.
    expect(p.slots.background).not.toBe('#ffffff')
    expect(toOklch(rgb(p.slots.background!)).c).toBeGreaterThanOrEqual(0.004)
    expect(toOklch(rgb(p.slots.background!)).c).toBeLessThanOrEqual(0.012)
    expect(p.tokens['--brand-surface']).not.toBe('#f8f8f8')
  })

  it("surfaces: 'trayo' drops them and says so", () => {
    const { input, notes } = fromBrandThemeContract(slack, { surfaces: 'trayo' })
    expect(input.background).toBeUndefined()
    for (const f of CONTRACT_SURFACE_FIELDS) expect(notes.some((n) => n.startsWith(`${f} `))).toBe(true)
  })

  it('passes an unreadable primary through so the check reports the agent value', () => {
    const { input } = fromBrandThemeContract({ ...slack, primary: 'aubergine' })
    expect(checkBrandPalette(input)).toEqual([
      expect.objectContaining({ slot: 'primary', message: expect.stringContaining('"aubergine"') })
    ])
  })
})
