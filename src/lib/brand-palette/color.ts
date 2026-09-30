/**
 * Colour maths for brand palettes: hex parsing, OKLCH conversion with gamut
 * mapping, and WCAG 2 contrast. Dependency-free on purpose, so the server can
 * run the same checks when it stores a tenant palette.
 */

export type RGB = readonly [number, number, number]

export interface OKLCH {
  l: number
  c: number
  h: number
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `#abc`, `#aabbcc` (with or without `#`) → channels in 0..1, or null. */
export function parseHex(value: string): RGB | null {
  const m = HEX.exec(value.trim())
  if (!m) return null
  const digits = m[1].length === 3 ? [...m[1]].map((d) => d + d).join('') : m[1]
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as unknown as RGB
}

export function toHex(rgb: RGB): string {
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

/** `#aabbcc` → `"170 187 204"`, for `rgb(var(--x) / 0.4)`. */
export function toRgbChannels(rgb: RGB): string {
  return rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255)).join(' ')
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** WCAG 2 relative luminance. */
export function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio, 1..21. */
export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** `fg` at `alpha` over an opaque `bg`, as the browser composites it in sRGB. */
export function composite(fg: RGB, alpha: number, bg: RGB): RGB {
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as unknown as RGB
}

export function toOklch(rgb: RGB): OKLCH {
  const [r, g, b] = rgb.map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h }
}

function oklchToLinear({ l: L, c, h }: OKLCH): [number, number, number] {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}

const inGamut = (lin: number[]) => lin.every((c) => c >= -1e-4 && c <= 1 + 1e-4)

/** OKLCH → sRGB, lowering chroma (never lightness or hue) until it fits. */
export function fromOklch(color: OKLCH): RGB {
  const l = Math.min(1, Math.max(0, color.l))
  let lin = oklchToLinear({ ...color, l })
  if (!inGamut(lin)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid
      else hi = mid
    }
    lin = oklchToLinear({ l, c: lo, h: color.h })
  }
  return lin.map((c) => fromLinear(Math.min(1, Math.max(0, c)))) as unknown as RGB
}

/**
 * Moves `rgb`'s OKLCH lightness toward black (`'darker'`) or white
 * (`'lighter'`) in small steps, keeping its hue, until `ok` holds. Returns the
 * input when it already holds, and the extreme when nothing on the way does.
 */
export function shiftLightnessUntil(
  rgb: RGB,
  direction: 'darker' | 'lighter',
  ok: (candidate: RGB) => boolean
): RGB {
  if (ok(rgb)) return rgb
  const start = toOklch(rgb)
  const step = direction === 'darker' ? -0.005 : 0.005
  for (let l = start.l + step; l >= 0 && l <= 1; l += step) {
    // Check the colour as it will be written (8-bit hex): rounding after the
    // check can drop a 4.5:1 pass to 4.47.
    const candidate = quantize(fromOklch({ ...start, l }))
    if (ok(candidate)) return candidate
  }
  return quantize(fromOklch({ ...start, l: direction === 'darker' ? 0 : 1 }))
}

/** Rounds each channel to the 8-bit value hex output will carry. */
export function quantize(rgb: RGB): RGB {
  return rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255) / 255) as unknown as RGB
}
