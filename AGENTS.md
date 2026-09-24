# AGENTS.md — building a GTM app with @trayo/gtm-ui

You are building a go-to-market application against the Trayo API. This library
is the UI layer. Read `README.md` for the full surface; this file is the short,
directive version.

## The rules that matter most

1. **Rendering a person? Use `<Person>` or `<PersonCard>`.** Never assemble an
   `<img>` + a name yourself. The component handles the photo, the
   cross-origin failures, and the illustrated fallback face. A person must
   always end up with a face, never initials.

2. **Rendering a company? Use `<Company>` or `<CompanyCard>`.** Pass the
   `domain`; the logo resolves itself through Trayo's public proxy. Never
   hand-write a logo `<img>` or an initials tile.

3. **Wrap the app in `<AppShell>`.** It paints the branded canvas. Without it
   the page reads as generic Tailwind no matter what else you use.

4. **Use the exported components before writing your own.** A bespoke button,
   table, card, badge, dialog or empty state is drift. Check the table in
   `README.md` first.

5. **No raw colours, ever.** Not `#hex`, not `rgb()`, not `bg-slate-800` or
   `text-blue-400`. Use `bg-surface-card`, `text-text-secondary`,
   `border-border-subtle`, `bg-accent-brand`, `text-success-text`, and their
   siblings. They handle light and dark themselves.

6. **Type roles for content, the Tailwind scale for controls.** Content gets
   `text-page-title` / `text-section` / `text-card-title` / `text-name` /
   `text-body` / `text-meta` / `text-eyebrow`. Controls get `text-sm
   font-medium`. Never `text-[15px]` or `tracking-[0.04em]`.

7. **`<Button loading>`** — do not swap in your own spinner.

8. **`cn()` from this package**, not bare `clsx`, when merging classes.

## API shapes map straight through

`PersonLike` and `CompanyLike` are loose supersets of `GET /v1/people` and
`GET /v1/accounts` rows. Pass the API object directly; every field but `name`
is optional and missing ones simply don't render.

```tsx
const { data } = await fetch('/v1/people?limit=25').then(r => r.json())
return data.map(p => <Person key={p.id} person={p} showContact />)
```

## Setup checklist

- [ ] Tailwind v4 installed
- [ ] `@import 'tailwindcss';` then `@import '@trayo/gtm-ui/styles';` in the CSS entry
- [ ] `@source '../node_modules/@trayo/gtm-ui/src';` so Tailwind generates the library's utilities
- [ ] The app wrapped in `<AppShell>`, content in a `<PageContainer>`
- [ ] `class="dark"` on `<html>` only if you want the dark palette; light is the default
