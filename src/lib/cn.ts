import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The design foundation ships a role typography vocabulary as custom classes
// (.text-card-title / .text-meta / .text-eyebrow / … — see styles/typography.css).
// tailwind-merge doesn't know these, so by default it misclassifies them and
// drops the role class when a `text-{color}` is also present (e.g.
// `cn('text-eyebrow', 'text-accent-brand')` collapsed to just `text-accent-brand`).
// Register the roles in the `font-size` group so they (a) only conflict with each
// other and other sizes, and (b) coexist with text-color / text-align utilities.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'hero',
            'page-title',
            'section',
            'card-title',
            'name',
            'body',
            'meta',
            'label',
            'eyebrow',
            'code',
            '2xs', // smallest scale step (avatar/badge micro-chrome)
            'caption', // 11px control caption (table headers, count chips)
            'dense', // 13px compact-table/tab-strip step (no Tailwind default)
            'name-sm', // 13px compact entity-name role (dense tables)
            'body-sm', // 13px compact body role (dense tables)
          ],
        },
      ],
    },
  },
})

/**
 * Merge Tailwind class names while resolving conflicts.
 *
 * Used by every shadcn/Radix UI primitive in @trayo/shared/components/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
