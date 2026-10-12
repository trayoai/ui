import * as React from 'react'

/**
 * Whether a component is inside a dialog. `<DialogContent>` sets it, and a
 * component that has a large, page-sized layout reads it to draw its compact
 * one: a dialog is a narrower, denser place than the page behind it, and it
 * usually has the subject at full size in its own header already.
 */
export const InDialogContext = React.createContext(false)

export function useInDialog(): boolean {
  return React.useContext(InDialogContext)
}
