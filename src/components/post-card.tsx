import * as React from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '../lib/cn'
import { Person, type PersonLike } from './person'
import { Surface } from './surfaces'
import { Button } from './ui/button'

export interface PostCardProps extends Omit<React.ComponentProps<typeof Surface>, 'title' | 'children'> {
  /** Who wrote it. Drawn as the lead of the card, at the larger face. */
  author: PersonLike
  /** The post's text, as it was written. Line breaks are kept. */
  text: string
  /** Names the panel. */
  title?: React.ReactNode
  /** When it was published, already formatted: `Published 21 September 2026`. */
  published?: React.ReactNode
  /** The post's own URL. Adds the link out in the header. */
  href?: string
  /** The label on that link. */
  linkLabel?: string
  /** A line under the text: when it was fetched, whether it is cut short. */
  note?: React.ReactNode
  /** Beside the author: one action or a score. */
  actions?: React.ReactNode
}

/** Past this many characters, or lines, the text is clamped behind a switch. */
const LONG_POST = 280
const LONG_POST_LINES = 4

/**
 * A post and the person who wrote it: the source a screen is built on, or
 * the post behind one row. The author leads at the larger face, the text
 * keeps its line breaks and is clamped to four lines until asked for, and
 * the link out sits in the header.
 */
export function PostCard({
  author,
  text,
  title = 'Source post',
  published,
  href,
  linkLabel = 'Open post',
  note,
  actions,
  ...props
}: PostCardProps) {
  const [open, setOpen] = React.useState(false)
  const long = text.length > LONG_POST || text.split('\n').length > LONG_POST_LINES
  return (
    <Surface
      title={title}
      description={published}
      actions={
        href != null && (
          <Button variant='secondary' size='sm' asChild>
            <a href={href} target='_blank' rel='noreferrer'>
              {linkLabel} <ExternalLink />
            </a>
          </Button>
        )
      }
      {...props}
    >
      <div className='flex flex-col gap-3'>
        <Person person={author} variant='lead' href={author.profileUrl ?? undefined} actions={actions} />
        <p
          className={cn(
            'text-body whitespace-pre-line text-text-primary',
            long && !open && 'line-clamp-4'
          )}
        >
          {text}
        </p>
        {(long || note != null) && (
          <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1'>
            {note != null && <span className='text-meta'>{note}</span>}
            {long && (
              <Button
                variant='quiet'
                size='sm'
                className='-mx-3'
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
              >
                {open ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Surface>
  )
}
