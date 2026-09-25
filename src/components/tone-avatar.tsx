import { useState } from 'react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

// Identity tones. Each maps to a
// theme-invariant gradient token; white initials sit on top. `neutral` is the
// generic identity gradient; `brand` reuses the amber→pink hero gradient.
export type AvatarTone = 'violet' | 'teal' | 'amber' | 'rose' | 'brand' | 'neutral';

const TONE_GRADIENT: Record<AvatarTone, string> = {
  violet: 'bg-[image:var(--gradient-avatar-violet)]',
  teal: 'bg-[image:var(--gradient-avatar-teal)]',
  amber: 'bg-[image:var(--gradient-avatar-amber)]',
  rose: 'bg-[image:var(--gradient-avatar-rose)]',
  brand: 'bg-[image:var(--gradient-cta)]',
  neutral: 'bg-[image:var(--gradient-avatar)]',
};

// "The Home Depot" → "HD"; "Ada Lovelace" → "AL".
function toInitials(name: string): string {
  return name
    .replace(/^The\s+/i, '')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ToneAvatar({
  name,
  initials,
  tone = 'neutral',
  src,
  className,
  ...props
}: {
  name: string;
  initials?: string;
  tone?: AvatarTone;
  src?: string;
  className?: string;
} & Omit<ComponentProps<'span'>, 'children'>) {
  const [broken, setBroken] = useState(false);
  const base = cn(
    'inline-flex h-7 w-7 items-center justify-center rounded-full text-label font-semibold text-white select-none',
    className,
  );
  if (src && !broken) {
    return (
      <span className={base} {...props}>
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full rounded-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={cn(base, TONE_GRADIENT[tone])} {...props}>
      {initials ?? toInitials(name)}
    </span>
  );
}
