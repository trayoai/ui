'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './button'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

const dialogSizeClasses = {
  // Semantic sizes — prefer these. They describe the dialog's PURPOSE, not a
  // raw width, so dialogs of the same kind stay consistent:
  //   small  — confirms & simple single-column forms
  //   medium — richer / multi-section forms (tabs, several field groups)
  //   large  — data / preview tables (CSV importers, multi-row pickers)
  small: 'sm:max-w-lg',
  medium: 'sm:max-w-3xl',
  large: 'sm:max-w-5xl',
  // Raw t-shirt scale — retained for back-compat with existing dialogs; reach
  // for a semantic size above for new work.
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  '6xl': 'sm:max-w-6xl',
  full: 'sm:max-w-[90vw]',
} as const

type DialogSize = keyof typeof dialogSizeClasses

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = 'lg',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: DialogSize
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        className={cn(
          // Padding steps with the shell gutter (TRA-1498: `<main>` runs
          // `p-4 md:p-6`), so a dialog is not the one surface that keeps its
          // desktop inset on a phone.
          //
          // CAVEAT for callers: this is a RESPONSIVE pair, and tailwind-merge
          // keys on the modifier — a bare `p-0` override replaces `p-4` but
          // NOT `md:p-6`, so a full-bleed dialog must pass `p-0 md:p-0`.
          'bg-surface-dialog data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border-subtle p-4 shadow-lg duration-200 md:p-6',
          dialogSizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          // Same control as the drawer header's close (DrawerShell) — a bare
          // 28px `quiet` circle with a muted glyph that resolves on hover — so
          // every dismissable surface reads the same. The `quiet` variant
          // exists for exactly this chrome, so compose the Button rather than
          // re-skinning the raw Radix close.
          <DialogPrimitive.Close data-slot='dialog-close' asChild>
            <Button
              variant='quiet'
              size='xs'
              className='absolute end-4 top-4 size-7 p-0'
              title='Close'
            >
              <span className='sr-only'>Close</span>
              <X />
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('flex flex-col gap-2 text-center sm:text-start', className)}
      {...props}
    />
  )
}

/**
 * Scrollable body region — the design-system base for dialog content (TRA base
 * dialog). Encapsulates the max-height + vertical scroll + inner spacing that
 * every feature dialog used to hand-roll as
 * `flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4`. Pair with a
 * `DialogContent` that caps total height (e.g. `max-h-[90vh] overflow-hidden`)
 * so a long body scrolls within the shell while the header/footer stay pinned.
 * Override the default cap via `className` (e.g. `max-h-[70vh]`).
 */
function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-body'
      className={cn(
        'flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4',
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('text-card-title', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('text-text-muted text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
