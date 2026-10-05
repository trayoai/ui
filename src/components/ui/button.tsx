import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * The canonical Button variants — every value `variant` renders as:
 * `default | secondary | tertiary | quiet | destructive | destructive-outline | destructive-quiet`.
 * There is no `ghost`, `outline`, `link` or `primary` (see `BUTTON_VARIANT_ALIASES`).
 */
export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'quiet'
  | 'destructive'
  | 'destructive-outline'
  | 'destructive-quiet'

/** The canonical variant names, in the order the showcase renders them. */
export const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'default',
  'secondary',
  'tertiary',
  'quiet',
  'destructive',
  'destructive-outline',
  'destructive-quiet',
]

/**
 * shadcn names that are NOT Trayo variants. They are accepted so a build does
 * not fail on them, remapped to the closest canonical variant, and warned about
 * once per name in development. Write the canonical name.
 */
export type ButtonVariantAlias = 'ghost' | 'outline' | 'link' | 'primary'

export const BUTTON_VARIANT_ALIASES: Readonly<Record<ButtonVariantAlias, ButtonVariant>> = {
  ghost: 'tertiary',
  outline: 'secondary',
  link: 'quiet',
  primary: 'default',
}

const buttonVariants = cva(
  // Icon sizing is NOT set here — it scales with the button `size` (below) so a
  // bare `<Icon/>` child auto-fits the button. The `:not([class*='size-'])`
  // guard means an explicit icon size still wins when a caller really needs it.
  //
  // Every variant gives a little under the pointer (`active:scale`), so a
  // click is felt even on the bare `quiet` buttons. Hover glides in and out
  // over 300ms (ease-in-out, so it neither snaps on nor off); the press is quick
  // (`active:duration-100`) so a click still answers immediately.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out cursor-pointer active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      /** Full enum: default | secondary | tertiary | quiet | destructive | destructive-outline | destructive-quiet. */
      variant: {
        // Primary action — the solid-accent pill. There is no rounded-md solid
        // primary in the design. A compact in-row CTA is just this variant at
        // size="sm"; there is no separate `cta` variant.
        // `btn-solid` (styles/animations.css) adds the depth: top-lit sheen,
        // a shadow tinted with the fill, a 1px lift on hover.
        default:
          'btn-solid rounded-full bg-accent-brand text-accent-brand-foreground hover:brightness-[1.07] border-none',
        // Danger semantic — red pill, for delete/destructive affordances;
        // pill-shaped for consistency.
        destructive:
          'btn-solid btn-solid-danger rounded-full bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Secondary action — an outline-accent pill. Transparent fill + neutral hairline, readable
        // `accent-text` label; hover settles into the brand tint + accent line.
        // (The compact in-row sibling is just `secondary` at size="sm".)
        secondary:
          'rounded-full border border-border-strong bg-transparent text-accent-text hover:border-accent-line hover:bg-accent-soft',
        // Tertiary action — the de-emphasized neutral pill: transparent fill,
        // hairline border, neutral well hover, with a regular-weight,
        // muted (`text-secondary`) label + icon so it reads clearly softer than
        // the medium-weight primary/secondary CTAs; it brightens to primary on
        // hover. Use it in place of a `ghost` or `outline` button; it doubles as
        // the icon-button style and the Cancel button.
        tertiary:
          'rounded-full border border-border-strong bg-transparent font-normal text-text-secondary hover:bg-surface-well hover:text-text-primary',
        // Destructive action that must NOT pull the eye — row-level deletes and
        // removes, where a solid red `destructive` pill would out-shout the
        // row's real CTA. Same outline geometry as `tertiary`, tinted danger:
        // danger-hairline + danger label at rest, deepening to a danger wash on
        // hover. Three surfaces had hand-written this exact class string
        // (Signals delete, Lists row delete, audience-drawer remove) and one
        // carried the comment "no Button variant matches" — this is it.
        //
        // Use `destructive` (solid) for the confirming action in a dialog; use
        // this for the affordance that OPENS that confirmation.
        'destructive-outline':
          'rounded-full border border-destructive/30 bg-transparent font-normal text-destructive hover:border-destructive/55 hover:bg-destructive/10 hover:text-destructive',
        // Same danger hover as `destructive-outline`, but BARE at rest — just a
        // muted glyph, no ring, no fill. For destructive controls that are
        // already conditionally revealed: the Lists row delete and the
        // audience-drawer remove appear on row hover, and a red (or even
        // outlined) control arriving with the row reads as an alarm on every
        // pass of the mouse. The whole affordance only resolves once the
        // pointer is on the control itself.
        //
        // `border-transparent` rather than no border: the 1px is still reserved,
        // so the button does not resize when the hover ring appears.
        //
        // Pick by whether the control is always visible: `destructive-outline`
        // when it is (Signals' labelled Delete), this when it is not.
        'destructive-quiet':
          'rounded-full border border-transparent bg-transparent font-normal text-text-muted hover:border-destructive/55 hover:bg-destructive/10 hover:text-destructive',
        // The neutral sibling of `destructive-quiet` — same shape and the same
        // bare-until-hovered behaviour, without the danger reading. For chrome
        // controls that should recede until pointed at: drawer close buttons and
        // the like. `tertiary` is the icon-button style when the control should
        // be visible at rest; this is for when it should not compete.
        quiet:
          'rounded-full border border-transparent bg-transparent font-normal text-text-muted hover:border-border-strong hover:bg-surface-well hover:text-text-primary',
      },
      // Each size sets its own icon size so icons scale with the button.
      //
      // Padding is optical, not symmetric: an icon carries its own whitespace,
      // so the side it sits on is padded less and the text side keeps the full
      // amount — otherwise a leading icon leaves the label crowding the right
      // edge. `data-icon` (start | end | both) is set by <Button> from its
      // children; the `has-[>svg]` rule is the fallback for when it cannot
      // tell (`asChild`, or children with no bare text).
      size: {
        default:
          "h-9 px-4 py-2 data-[icon=start]:pl-3 data-[icon=end]:pr-3 data-[icon=both]:px-3 not-data-[icon]:has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8 rounded-md gap-1.5 px-3 data-[icon=start]:pl-2.5 data-[icon=start]:pr-3.5 data-[icon=end]:pl-3.5 data-[icon=end]:pr-2.5 data-[icon=both]:px-2.5 not-data-[icon]:has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        // Dense rows where vertical space is tight (compose CTAs in list/table
        // rows).
        xs: "h-7 rounded-md gap-1 px-2.5 data-[icon=start]:pr-3 data-[icon=end]:pl-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 rounded-md px-6 data-[icon=start]:pl-4 data-[icon=end]:pr-4 data-[icon=both]:px-4 not-data-[icon]:has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
        'icon-sm': "size-8 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    compoundVariants: [
      // The pill holds at EVERY size. The sm/lg size tokens re-declare
      // `rounded-md` and (being applied after the variant) would otherwise win,
      // leaving these variants rounded rectangles at those sizes — re-assert
      // rounded-full so the pill survives across the size scale.
      {
        variant: [
          'default',
          'secondary',
          'tertiary',
          'destructive',
          'destructive-outline',
          'destructive-quiet',
          'quiet',
        ],
        size: ['xs', 'sm', 'lg'],
        class: 'rounded-full',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Vite, webpack, esbuild, Next and Bun all substitute `process.env.NODE_ENV`
// at build time, so this is a literal `false` in a production bundle and the
// warning branch below folds away entirely. Deliberately NOT wrapped in a
// `typeof process` guard or a try/catch: either one hides the constant from the
// minifier and the warning text ships to production. (Every bundler that
// resolves this file's bare `@radix-ui/*` imports also defines this value.)
// It is read inside the alias branch, not at module load, so a runtime that
// does not define it can only fail on a `variant="ghost"` render, never on
// import.
declare const process: { env: { NODE_ENV?: string } }

const warnedAliases = new Set<string>()

/** Map an accepted alias to its canonical variant; warn once per alias in development. */
function resolveVariant(
  variant: ButtonVariant | ButtonVariantAlias | null | undefined
): ButtonVariant | null | undefined {
  if (variant && variant in BUTTON_VARIANT_ALIASES) {
    const alias = variant as ButtonVariantAlias
    const canonical = BUTTON_VARIANT_ALIASES[alias]
    if (process.env.NODE_ENV !== 'production' && !warnedAliases.has(alias)) {
      warnedAliases.add(alias)
      console.warn(
        `[trayo-ui] <Button variant="${alias}"> is not a Trayo variant; rendering it as ` +
          `variant="${canonical}". Use that name. The variants are: ${BUTTON_VARIANTS.join(' | ')}.`
      )
    }
    return canonical
  }
  return variant as ButtonVariant | null | undefined
}

type ButtonProps = React.ComponentProps<'button'> &
  Omit<VariantProps<typeof buttonVariants>, 'variant'> & {
    /**
     * `default | secondary | tertiary | quiet | destructive | destructive-outline | destructive-quiet`.
     * The shadcn names `ghost` → tertiary, `outline` → secondary, `link` → quiet
     * and `primary` → default are accepted but warn in development.
     */
    variant?: ButtonVariant | ButtonVariantAlias | null
    asChild?: boolean
    /**
     * Show an inline spinner and disable the button. The spinner replaces
     * nothing — it sits alongside the existing children so a label like
     * "Saving…" stays visible. Skipped when `asChild` is set, since Slot
     * requires a single child; pass your own spinner in that case.
     */
    loading?: boolean
    /**
     * Which side the loading spinner sits on. Defaults to `start` (leading) —
     * the system's standard. Use `end` to trail the label (e.g. to match a
     * trailing-icon button). Multi-state buttons should pin a width so the
     * spinner doesn't reflow the label (design rule #1).
     */
    loadingIconPosition?: 'start' | 'end'
  }

/**
 * Which side of the label an icon sits on, read from the children: an element
 * before bare text is a leading icon, one after it a trailing icon. Returns
 * undefined when there is no bare text to measure against (icon-only, or a
 * label wrapped in its own element), which leaves the symmetric fallback.
 */
function iconSide(
  children: React.ReactNode,
  spinner: 'start' | 'end' | null
): 'start' | 'end' | 'both' | undefined {
  const kids = React.Children.toArray(children).filter(
    (c) => !(typeof c === 'string' && c.trim() === '')
  )
  const hasText = kids.some((c) => typeof c === 'string' || typeof c === 'number')
  if (!hasText) return undefined
  const start = spinner === 'start' || React.isValidElement(kids[0])
  const end = spinner === 'end' || React.isValidElement(kids[kids.length - 1])
  return start && end ? 'both' : start ? 'start' : end ? 'end' : undefined
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingIconPosition = 'start',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const spinner = <Loader2 className='animate-spin' aria-hidden />

  return (
    <Comp
      data-slot='button'
      data-loading={loading || undefined}
      data-icon={
        asChild ? undefined : iconSide(children, loading ? loadingIconPosition : null)
      }
      className={cn(buttonVariants({ variant: resolveVariant(variant), size, className }))}
      disabled={loading || disabled}
      {...props}
    >
      {loading && !asChild ? (
        loadingIconPosition === 'end' ? (
          <>
            {children}
            {spinner}
          </>
        ) : (
          <>
            {spinner}
            {children}
          </>
        )
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
