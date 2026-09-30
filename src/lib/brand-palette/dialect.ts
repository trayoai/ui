/**
 * Dialects: component-level choices an app commits to once, applied
 * everywhere by the kit. Two apps in different dialects feel like different
 * products at full size — a callout with its bar on the left vs a filled one,
 * lifted cards vs flat, zebra rows vs lined — while one app stays consistent
 * (an LLM building a screen must not mix them; the dialect decides).
 *
 * Each axis is one `data-dialect-<axis>` attribute on `<html>` that tokens.css
 * reads. Axes not set keep the kit's default. None of these touch the Trayo
 * signature (pill buttons, type roles, faces, grain).
 */

export const DIALECT_AXES = {
  callout: {
    options: ['default', 'bar-left', 'bar-right', 'filled', 'outlined'],
    role: "How a Callout carries its tone: the kit's tinted panel, a thick accent bar on the left or right, a filled container, or an outline only."
  },
  card: {
    options: ['default', 'flat', 'hairline', 'lifted', 'tinted'],
    role: "Surfaces, cards and stat tiles: the kit's gradient with a hairline, flat white, a stronger hairline, a lifted shadow, or the brand container tint."
  },
  table: {
    options: ['default', 'zebra', 'cards', 'dense', 'tinted-head'],
    role: 'DataTable rows: lined (default), alternating zebra rows, each row as a card, a denser row height, or a header row in the brand container tint.'
  },
  button: {
    options: ['default', 'soft', 'outline'],
    role: "The primary action's emphasis app-wide: a solid brand pill, a soft tinted pill, or an outlined pill."
  },
  tile: {
    options: ['default', 'tinted', 'big-number'],
    role: 'Stat tiles: the card look, the brand container tint, or a larger headline number.'
  }
} as const

export type DialectAxis = keyof typeof DIALECT_AXES
export type DialectOption<A extends DialectAxis> = (typeof DIALECT_AXES)[A]['options'][number]
export type Dialect = { [A in DialectAxis]?: DialectOption<A> }

/** Named dialects a generator can rotate through; `plain` is the kit as shipped. */
export const DIALECT_PRESETS: Record<'plain' | 'editorial' | 'tinted' | 'compact', Dialect> = {
  plain: {},
  editorial: { callout: 'bar-left', card: 'lifted', table: 'zebra', button: 'soft', tile: 'big-number' },
  tinted: { callout: 'filled', card: 'tinted', table: 'tinted-head', button: 'default', tile: 'tinted' },
  compact: { callout: 'outlined', card: 'hairline', table: 'dense', button: 'outline', tile: 'default' }
}

/** Problems with a dialect an agent wrote, each naming the axis. */
export function checkDialect(dialect: Dialect): { axis: string; message: string }[] {
  const problems: { axis: string; message: string }[] = []
  for (const [axis, value] of Object.entries(dialect)) {
    const known = DIALECT_AXES[axis as DialectAxis]
    if (!known) problems.push({ axis, message: `unknown dialect axis ${JSON.stringify(axis)}` })
    else if (!(known.options as readonly string[]).includes(value as string)) {
      problems.push({
        axis,
        message: `${axis} must be one of ${known.options.join(', ')}, got ${JSON.stringify(value)}`
      })
    }
  }
  return problems
}

/** The `data-dialect-*` attributes for `<html>`; axes left at `default` are omitted. */
export function dialectAttributes(dialect: Dialect): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const [axis, value] of Object.entries(dialect)) {
    if (value && value !== 'default') attrs[`data-dialect-${axis}`] = value
  }
  return attrs
}

/** Documentation for an agent choosing a dialect, built from the catalogue. */
export function dialectAgentGuide(): string {
  const lines = [
    'Choose ONE dialect for the whole app and never mix options within it. Answer with JSON, e.g. {"callout":"bar-left","card":"lifted","table":"zebra","button":"soft","tile":"big-number"}, or a preset name: ' +
      Object.keys(DIALECT_PRESETS).join(', ') +
      '.',
    ''
  ]
  for (const [axis, def] of Object.entries(DIALECT_AXES)) {
    lines.push(`${axis}: ${def.options.join(' | ')}`)
    lines.push(`  ${def.role}`)
  }
  return lines.join('\n')
}
