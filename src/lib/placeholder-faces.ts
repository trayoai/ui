import { fnv1a } from './hash'

/**
 * The 50 illustrated placeholder faces — Trayo's built-in fallback for a person
 * with no usable photo. NOT initials: a person always gets a face.
 *
 * They are served from ui.trayo.ai by default, which is deliberately
 * bundler-agnostic: the library works unchanged in Vite, Next, Remix or a plain
 * script tag with no asset pipeline, no `import.meta.glob`, no config.
 *
 * The path is versioned: the files under `/faces/v1/` never change, so they are
 * cached for a year. A redesigned set ships as `/faces/v2/` beside it, and a
 * copy of this library that points at v1 keeps rendering the faces it shipped
 * with.
 *
 * To self-host instead, copy the PNGs into your own static directory and set
 * the base:
 *
 *   npx degit trayoai/ui/assets/placeholder public/images/placeholder
 *   <TrayoUIProvider placeholderFaceBase="/images/placeholder">
 */
export const DEFAULT_PLACEHOLDER_FACE_BASE = 'https://ui.trayo.ai/faces/v1'

export const PLACEHOLDER_FACE_COUNT = 50

/**
 * Pick a stable face for a person. The same key always yields the same face
 * (FNV-1a mod 50), so a person looks identical on every screen and across
 * reloads. Pass the person's Trayo id when you have one; a name works too.
 */
export function placeholderFaceIndex(key: string): number {
  return fnv1a(key) % PLACEHOLDER_FACE_COUNT
}

/** `01.png` … `50.png` — the filename for a key. */
export function placeholderFaceFilename(key: string): string {
  return `${String(placeholderFaceIndex(key) + 1).padStart(2, '0')}.png`
}

/** URL of the placeholder face for `key`, under `base` (defaults to the CDN). */
export function placeholderFaceUrl(key: string, base?: string): string {
  const root = base ?? DEFAULT_PLACEHOLDER_FACE_BASE
  const trimmed = root.endsWith('/') ? root.slice(0, -1) : root
  return `${trimmed}/${placeholderFaceFilename(key)}`
}
