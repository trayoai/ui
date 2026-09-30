import { describe, expect, it } from 'vitest'

import {
  CONTRACT_FIELDS_NOT_APPLIED,
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
      secondary: '#36c5f0',
      shell: '#4a154b',
      onShell: '#ffffff'
    })
    expect(checkBrandPalette(input)).toEqual([])
    expect(resolveBrandPalette(input).tokens['--brand-shell']).toBe('#4a154b')
  })

  it('keeps Trayo page, cards and text, and says so', () => {
    const { notes } = fromBrandThemeContract(slack)
    for (const field of CONTRACT_FIELDS_NOT_APPLIED) {
      expect(notes.some((n) => n.startsWith(`${field} `))).toBe(true)
    }
    expect(notes.join(' ')).toMatch(/3 further accent\(s\) are not applied/)
  })

  it('drops a light shell or one that is the page colour', () => {
    // #ffddee: light by the resolver's measure (OKLCH), not by RGB luma; the
    // mapper used to keep it and the resolver then threw.
    for (const shell of ['#ffffff', '#f7f7f7', '#ffddee']) {
      const { input, notes } = fromBrandThemeContract({ ...slack, shell, background: '#f7f7f7' })
      expect(input.shell).toBeNull()
      expect(input.onShell).toBeNull()
      expect(notes.join(' ')).toMatch(/Trayo top bar is kept/)
      expect(() => resolveBrandPalette(input)).not.toThrow()
    }
  })

  it('skips an accent equal to primary, and has no secondary without accents', () => {
    expect(fromBrandThemeContract({ ...slack, accents: ['#611f69', '#2eb67d'] }).input.secondary).toBe(
      '#2eb67d'
    )
    expect(fromBrandThemeContract({ ...slack, accents: undefined }).input.secondary).toBeNull()
  })

  it('passes an unreadable primary through so the check reports the agent value', () => {
    const { input } = fromBrandThemeContract({ ...slack, primary: 'aubergine' })
    expect(checkBrandPalette(input)).toEqual([
      expect.objectContaining({ slot: 'primary', message: expect.stringContaining('"aubergine"') })
    ])
  })
})
