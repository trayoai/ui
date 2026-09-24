/** "Ada Lovelace" → "AL"; "The Home Depot" → "HD". Max two letters. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const cleaned = name.replace(/^(the|a|an)\s+/i, '').trim()
  const parts = cleaned.split(/[\s.\-_]+/).filter(Boolean)
  const letters = parts
    .map((p) => p[0])
    .filter((c) => !!c && /[a-z0-9]/i.test(c))
    .slice(0, 2)
    .join('')
  return (letters || cleaned[0] || '?').toUpperCase()
}
