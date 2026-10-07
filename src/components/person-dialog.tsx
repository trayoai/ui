'use client'

import * as React from 'react'
import { PersonBanner, type PersonLike } from './person'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

export interface PersonDialogProps {
  person: PersonLike
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens the dialog — usually a `<Button>` or a table row action. */
  trigger?: React.ReactNode
  /** The banner's one action: a default `<Button>`. */
  actions?: React.ReactNode
  /** Under the body: the secondary actions, as a row that wraps. */
  footer?: React.ReactNode
  contacted?: boolean
  /**
   * Defaults to `2xl` (672px), wider than a plain dialog's `lg`: the banner
   * gives up most of its width to the avatar and the action, and at 512px a
   * title with a company beside it truncates.
   */
  size?: React.ComponentProps<typeof DialogContent>['size']
  /** The body. It scrolls when it is taller than the dialog allows. */
  children?: React.ReactNode
}

/**
 * A dialog about one person: the `<PersonBanner>` at the top with the close
 * button clear of it, a scrolling body, and a row of secondary actions.
 *
 * Use this instead of placing a `<PersonBanner>` in a `<DialogContent>` by
 * hand. The person's name is the dialog's accessible title, so no separate
 * `DialogTitle` is needed.
 *
 *   <PersonDialog person={p} open={open} onOpenChange={setOpen}
 *     actions={<Button>Add to sequence</Button>}
 *     footer={<Button size='sm' variant='secondary'>Draft intro email</Button>}>
 *     <JobMove from={…} to={…} />
 *   </PersonDialog>
 */
export function PersonDialog({
  person,
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  actions,
  footer,
  contacted,
  size = '2xl',
  children,
}: PersonDialogProps) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger != null && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent data-person-dialog size={size} aria-describedby={undefined}>
        <DialogTitle className='sr-only'>{person.name}</DialogTitle>
        <PersonBanner person={person} actions={actions} contacted={contacted} />
        {children != null && <DialogBody className='py-0'>{children}</DialogBody>}
        {footer != null && (
          <div data-slot='person-dialog-footer' className='flex flex-wrap items-center gap-2'>
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
