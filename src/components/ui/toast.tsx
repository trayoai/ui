'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, Check, FlaskConical, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './button'

/**
 * Toasts — transient confirmations that stack in the bottom-right corner.
 *
 * Dependency-free: a module-level store read through `useSyncExternalStore`,
 * so `toast()` can be called from anywhere (an event handler, a fetch
 * callback, a store) without threading a context through the tree.
 *
 *   <Toaster />                                   // once, inside <AppShell>
 *   toast({ title: 'Saved', description: '12 accounts updated' })
 *   toast({ variant: 'preview', description: 'Would push 3 accounts to Salesforce.' })
 *
 * The `preview` variant is the one to reach for when an action is stubbed —
 * "Push to Salesforce", "Send email", "Post to Slack" in a demo that has no
 * such integration wired. It carries the eyebrow "Preview - nothing was sent"
 * so the UI stays honest about what did and did not happen. Use it instead of
 * a silent success or a bespoke banner.
 */

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive' | 'preview'

export interface ToastOptions {
  /**
   * Stable id for dedupe and update. Calling `toast()` again with an id that is
   * already showing replaces that toast in place (and restarts its timer)
   * instead of stacking a second copy.
   */
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  /**
   * Small uppercase caption above the title. The `preview` variant defaults it
   * to "Preview - nothing was sent"; pass a string to override, or `null` to
   * hide it.
   */
  eyebrow?: React.ReactNode
  /** Replace the variant's leading glyph. `null` hides it. */
  icon?: React.ReactNode
  /** Milliseconds before auto-dismiss. Default 5000, or 10000 when there is an `action` so the button is reachable; `Infinity` keeps it until dismissed. */
  duration?: number
  /** One optional action button. The toast dismisses after `onClick`. */
  action?: { label: React.ReactNode; onClick: () => void }
}

interface ToastItem extends ToastOptions {
  id: string
  open: boolean
}

const DEFAULT_DURATION = 5000
/** With an action button the toast stays longer so the button is reachable (WCAG 2.2.1). */
const DEFAULT_ACTION_DURATION = 10000
/** Matches `toast-out` in styles/animations.css. */
const EXIT_MS = 180
/** A toast the pointer was just resting on gets at least this long once it leaves. */
const RESUME_FLOOR_MS = 1000
const MAX_VISIBLE = 5

/* ------------------------------------------------------------------ store */

type Entry = {
  item: ToastItem
  duration: number
  remaining: number
  deadline: number | null
  timer: ReturnType<typeof setTimeout> | null
}

const entries = new Map<string, Entry>()
const listeners = new Set<() => void>()
const EMPTY: ToastItem[] = []
let snapshot: ToastItem[] = EMPTY
let paused = false
let counter = 0

function emit() {
  snapshot = Array.from(entries.values(), (e) => e.item)
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY

function clearTimer(entry: Entry) {
  if (entry.timer != null) clearTimeout(entry.timer)
  entry.timer = null
  entry.deadline = null
}

function schedule(entry: Entry) {
  clearTimer(entry)
  if (paused || !entry.item.open || !Number.isFinite(entry.remaining)) return
  entry.deadline = Date.now() + entry.remaining
  entry.timer = setTimeout(() => dismiss(entry.item.id), entry.remaining)
}

function remove(id: string) {
  const entry = entries.get(id)
  if (!entry) return
  clearTimer(entry)
  entries.delete(id)
  emit()
}

/** Dismiss one toast, or every toast when called with no id. */
function dismiss(id?: string) {
  if (id === undefined) {
    for (const key of Array.from(entries.keys())) dismiss(key)
    return
  }
  const entry = entries.get(id)
  if (!entry || !entry.item.open) return
  clearTimer(entry)
  entry.item = { ...entry.item, open: false }
  // Keep it mounted through the exit animation, then drop it.
  entry.timer = setTimeout(() => remove(id), EXIT_MS)
  emit()
}

function pauseAll() {
  if (paused) return
  paused = true
  const now = Date.now()
  for (const entry of entries.values()) {
    if (!entry.item.open || entry.deadline == null) continue
    entry.remaining = Math.max(0, entry.deadline - now)
    clearTimer(entry)
  }
}

function resumeAll() {
  if (!paused) return
  paused = false
  for (const entry of entries.values()) {
    if (!entry.item.open || !Number.isFinite(entry.remaining)) continue
    entry.remaining = Math.max(entry.remaining, RESUME_FLOOR_MS)
    schedule(entry)
  }
}

function show(options: ToastOptions): string {
  const id = options.id ?? `toast-${++counter}`
  const duration = options.duration ?? (options.action ? DEFAULT_ACTION_DURATION : DEFAULT_DURATION)
  const item: ToastItem = { ...options, id, open: true }
  const existing = entries.get(id)
  if (existing) {
    // Update in place: same slot in the stack, fresh content, fresh timer.
    clearTimer(existing)
    existing.item = item
    existing.duration = duration
    existing.remaining = duration
    schedule(existing)
  } else {
    const entry: Entry = { item, duration, remaining: duration, deadline: null, timer: null }
    entries.set(id, entry)
    // Oldest open toasts make room once the stack is full.
    const open = Array.from(entries.values()).filter((e) => e.item.open)
    for (const stale of open.slice(0, Math.max(0, open.length - MAX_VISIBLE))) {
      dismiss(stale.item.id)
    }
    schedule(entry)
  }
  emit()
  return id
}

/**
 * Show a toast. Returns its id, for `toast.dismiss(id)` or a later update via
 * `toast({ id, ... })`. Works outside React; `<Toaster />` must be mounted for
 * anything to render.
 */
export const toast = Object.assign(show, { dismiss })

/** Hook flavour of the same API, for components that prefer it. */
export function useToast() {
  return React.useMemo(() => ({ toast, dismiss }), [])
}

/* --------------------------------------------------------------- rendering */

const VARIANT: Record<
  ToastVariant,
  { icon: React.ReactNode; tone: string; eyebrow?: string }
> = {
  default: {
    icon: <Info />,
    tone: 'bg-surface-well text-text-secondary',
  },
  success: {
    icon: <Check />,
    tone: 'bg-success-soft text-success-text',
  },
  warning: {
    icon: <AlertTriangle />,
    tone: 'bg-warning-soft text-warning-text',
  },
  destructive: {
    icon: <AlertCircle />,
    tone: 'bg-destructive/10 text-destructive',
  },
  preview: {
    icon: <FlaskConical />,
    tone: 'bg-accent-soft text-accent-text',
    eyebrow: 'Preview - nothing was sent',
  },
}

function ToastCard({ item }: { item: ToastItem }) {
  const variant = VARIANT[item.variant ?? 'default']
  const eyebrow = item.eyebrow === undefined ? variant.eyebrow : item.eyebrow
  const icon = item.icon === undefined ? variant.icon : item.icon

  return (
    <div
      data-slot='toast'
      data-variant={item.variant ?? 'default'}
      data-state={item.open ? 'open' : 'closed'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-[var(--radius)] border border-border-subtle bg-surface-card bg-[image:var(--gradient-card)] p-3 pr-2 shadow-[var(--shadow-card-hover)]',
        item.open ? 'animate-toast-in' : 'animate-toast-out'
      )}
    >
      {icon != null && (
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5',
            variant.tone
          )}
        >
          {icon}
        </span>
      )}
      <div className='flex min-w-0 flex-1 flex-col gap-0.5 py-0.5'>
        {eyebrow != null && eyebrow !== false && (
          <span className='text-eyebrow'>{eyebrow}</span>
        )}
        {item.title != null && (
          <span className='text-name text-text-primary'>{item.title}</span>
        )}
        {item.description != null && (
          <p className='text-body-sm text-text-secondary'>{item.description}</p>
        )}
        {item.action && (
          <div className='mt-1.5'>
            <Button
              variant='secondary'
              size='xs'
              onClick={() => {
                item.action?.onClick()
                dismiss(item.id)
              }}
            >
              {item.action.label}
            </Button>
          </div>
        )}
      </div>
      {/* Same bare `quiet` circle as the Dialog close, so every dismissable
          surface reads the same. */}
      <Button
        variant='quiet'
        size='xs'
        className='-mt-0.5 size-7 shrink-0 p-0'
        title='Dismiss'
        onClick={() => dismiss(item.id)}
      >
        <span className='sr-only'>Dismiss</span>
        <X />
      </Button>
    </div>
  )
}

/**
 * The toast viewport. Mount it once, inside `<AppShell>` (so it inherits the
 * theme). Fixed bottom-right on desktop, full-width at the bottom on narrow
 * screens. A polite live region, so screen readers announce new toasts
 * without interrupting. Hovering or focusing the stack pauses auto-dismiss.
 */
export function Toaster({ className, ...props }: React.ComponentProps<'div'>) {
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <div
      data-slot='toaster'
      role='status'
      aria-live='polite'
      aria-atomic='false'
      onMouseEnter={pauseAll}
      onMouseLeave={resumeAll}
      onFocus={pauseAll}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resumeAll()
      }}
      className={cn(
        'pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96',
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
