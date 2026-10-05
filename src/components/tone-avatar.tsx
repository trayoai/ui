import { useState } from 'react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { AVATAR_SIZES, type AvatarSize } from './person-avatar';

// Identity tones. The four hues and `neutral` are quiet: a tint of the tone
// on the card surface, with the initials in a darker (light theme) or lighter
// (dark theme) step of the same hue. `neutral` is a true grey — it is the
// default, so it recedes. `brand` is the one solid mark: the brand fill with
// its checked foreground, so it follows a customer palette.
//
// There is no green tone: green on a face-sized mark reads as status (the
// "contacted" check, success), not identity. `teal` is still accepted so
// existing callers keep compiling, and renders as `blue`.
export type AvatarTone = 'violet' | 'blue' | 'amber' | 'rose' | 'brand' | 'neutral' | 'teal';

const TINT =
  'bg-[color-mix(in_oklab,var(--tone)_18%,var(--surface-card))] text-[color:color-mix(in_oklab,var(--tone)_58%,var(--text-primary))]';

const TONE: Record<AvatarTone, string> = {
  violet: cn(TINT, '[--tone:var(--avatar-tone-violet)]'),
  blue: cn(TINT, '[--tone:var(--avatar-tone-blue)]'),
  teal: cn(TINT, '[--tone:var(--avatar-tone-blue)]'),
  amber: cn(TINT, '[--tone:var(--avatar-tone-amber)]'),
  rose: cn(TINT, '[--tone:var(--avatar-tone-rose)]'),
  neutral: cn(TINT, '[--tone:var(--text-secondary)]'),
  brand: 'bg-accent-brand text-accent-brand-foreground',
};

// Initials scale with the avatar, on the same steps as CompanyLogo.
const INITIALS_SIZE: Record<AvatarSize, string> = {
  xs: 'text-[9px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg',
  '2xl': 'text-2xl',
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
  size,
  src,
  className,
  ...props
}: {
  name: string;
  initials?: string;
  tone?: AvatarTone;
  /**
   * The shared avatar scale (`xs` 20px … `2xl` 80px), so a tone avatar lines
   * up with a `PersonAvatar` or `CompanyLogo` of the same size. Omitted, it
   * is the original 28px.
   */
  size?: AvatarSize;
  src?: string;
  className?: string;
} & Omit<ComponentProps<'span'>, 'children'>) {
  const [broken, setBroken] = useState(false);
  const base = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
    size ? cn(AVATAR_SIZES[size], INITIALS_SIZE[size]) : 'h-7 w-7 text-label',
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
    <span className={cn(base, TONE[tone])} {...props}>
      {initials ?? toInitials(name)}
    </span>
  );
}
