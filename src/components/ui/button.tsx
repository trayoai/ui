import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  // Icon sizing is NOT set here — it scales with the button `size` (below) so a
  // bare `<Icon/>` child auto-fits the button. The `:not([class*='size-'])`
  // guard means an explicit icon size still wins when a caller really needs it.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary action — the prototype's solid-accent pill (`.cta`,
        // next3.css:172). There is no rounded-md solid primary in the design.
        // The compact newsfeed/table CTA ("Reach out") is just this variant at
        // size="sm"; there is no separate `cta` variant.
        default:
          'rounded-full bg-accent-brand text-white shadow-sm hover:brightness-[1.07] border-none',
        // Danger semantic — red pill. Not in the prototype's vocabulary but
        // kept for delete/destructive affordance; pill-shaped for consistency.
        destructive:
          'rounded-full bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Secondary action — prototype `.cta.dr` "Deep research" (next3.css:266):
        // an outline-accent pill. Transparent fill + neutral hairline, readable
        // `accent-text` label; hover settles into the brand tint + accent line.
        // (The compact newsfeed sibling is just `secondary` at size="sm".)
        secondary:
          'rounded-full border border-border-strong bg-transparent text-accent-text hover:border-accent-line hover:bg-accent-soft',
        // Tertiary action — the de-emphasized neutral pill. Inherits the
        // former `ghost` look (prototype `.cta.ghost`, next3.css:262: transparent
        // fill, hairline border, neutral well hover) but with regular-weight,
        // muted (`text-secondary`) label + icon so it reads clearly softer than
        // the medium-weight primary/secondary CTAs; it brightens to primary on
        // hover. Replaces `ghost` across the system; doubles as the icon-button
        // style and the `outline`/Cancel replacement.
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
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        // Dense rows where vertical space is tight (compose CTAs in list/table
        // rows). Same scale the people/contacts "Reach out" pill renders at.
        xs: "h-7 rounded-md gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-5",
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
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
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
  }) {
  const Comp = asChild ? Slot : 'button'
  const spinner = <Loader2 className='animate-spin' aria-hidden />

  return (
    <Comp
      data-slot='button'
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
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
