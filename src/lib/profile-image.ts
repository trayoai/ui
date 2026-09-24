/**
 * Profile-image filtering helpers shared between the SPAs and (in spirit)
 * the server's `server/src/common/utils/image-utils.ts`. The server keeps a
 * byte-equivalent local copy because it is a NestJS runtime and does not
 * depend on `@trayo/shared` (pulling the React package server-side would
 * bring in JSX/DOM deps for no reason). If you change behavior here, update
 * the server file in the same commit.
 */

/**
 * LinkedIn serves generic person outlines from `static.licdn.com` (distinct
 * from real profile photos served from `media.licdn.com`). Treat them as
 * "no photo" so the placeholder fallback fires.
 */
export function isLinkedInSilhouette(url?: string | null): boolean {
  return !!url && url.includes('static.licdn.com')
}

/**
 * Returns the URL only if it points at storage we host (GCS bucket or our
 * `/storage/...` API proxy). External URLs (LinkedIn CDN, CoreSignal CDN,
 * etc.) expire silently, which is fine for the SPAs (an `onError` handler
 * falls back to the placeholder) but a problem for server-rendered HTML
 * embedded in emails or PDFs where there is no client-side recovery. Use
 * this in any context that needs a long-lived image URL.
 */
export function selfHostedImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (
    url.includes('storage.googleapis.com') ||
    url.includes('/storage/people/avatars/')
  )
    return url
  return undefined
}
