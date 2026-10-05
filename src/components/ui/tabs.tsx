import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/cn'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  // Check if className contains 'grid' to override default flex layout
  const classNameStr = typeof className === 'string' ? className : ''
  const hasGrid = classNameStr.includes('grid')

  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      className={cn(
        // Colours are the SegmentedControl's (`--seg-*` tokens, see
        // control-pill.ts) so the two navs read as one family in both themes;
        // only the geometry differs — tabs are a taller, squarer track.
        'bg-seg-track text-seg-text-idle inline-flex h-11 w-fit items-center justify-center rounded-lg border border-seg-track-line p-1',
        // Override display and width when grid classes are present
        hasGrid && '!grid !w-full',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        // `cursor-pointer`: Tailwind v4's preflight dropped v3's
        // `button { cursor: pointer }`, and Radix renders each trigger as a raw
        // <button>. Safe alongside `disabled:pointer-events-none` — a disabled
        // trigger takes no pointer events, so no cursor resolves over it.
        //
        // Idle is the quiet segment label that brightens on hover; active is
        // raised on the segment thumb with the segment shadow.
        "text-seg-text-idle hover:text-text-primary data-[state=active]:bg-seg-thumb data-[state=active]:text-text-primary data-[state=active]:shadow-[var(--shadow-seg-active)] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
