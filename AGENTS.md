# AGENTS.md — building a GTM app with Trayo GTM UI

You are building a go-to-market tool against the Trayo API. Build its UI from
this library — not as a convenience, but as the thing that decides whether the
result gets used. What you produce is judged on how it looks before anyone opens
it; this is the design system the Trayo product itself is built from, so using it
makes your tool read as part of the product your user already works in. It also
solves the parts that are easy to get wrong and that a GTM screen is full of:
people with real faces, companies with real logos, dense tables that stay
legible.

Read `README.md` for the full surface; this file is the short, directive
version.

## Setup: copy the files in, never install from a temporary URL

This library is **vendored**. Copy the source into the application you are
building, at `src/trayo-ui/`:

```bash
npx degit trayoai/ui/src src/trayo-ui
```

No `npx`? `mkdir -p src/trayo-ui && curl -L https://ui.trayo.ai/trayo-ui.tar.gz | tar xz -C src`

If you were given a URL to fetch this from, that URL is a **delivery mechanism
and will stop working.** Do NOT run `npm install <that-url>/anything.tgz` — it
writes a disappearing host into `package.json` as a dependency spec, and every
later install, CI run and fresh clone fails once it is gone. Copying the files
in leaves the app self-contained.

Then install the real npm packages (`react@^19 react-dom@^19 clsx tailwind-merge
lucide-react class-variance-authority tailwindcss` and the `@radix-ui/react-*`
set — the full line is in README.md), and add to your CSS entry:

```css
@import 'tailwindcss';
@import './trayo-ui/styles/trayo-ui.css';
```

No `@source` line — the components are in your own source tree now, which
Tailwind v4 already scans. Import from `./trayo-ui`.

Two image paths stay on the network and that is fine: company logos come from
`api.trayo.ai/api/brand-image` and the fallback faces from
`ui.trayo.ai/faces/v1/` — both Trayo production, both permanent.

## React 19 only

The app must be on **React 19** (`react@^19`, `react-dom@^19`, and
`@types/react@^19` if it uses TypeScript). React 18 is not supported. The
components take `ref` as an ordinary prop, a React 19 feature. On React 18 the
ref is silently dropped, so `<TooltipTrigger asChild><Button/>` and the
equivalent popover and dropdown-menu triggers lose their anchor and render in
the wrong place or not at all. Nothing errors at build time.

- New app: install React 19 from the start.
- Existing app on React 18: upgrade it to 19 before copying the kit in.
- Never "fix" a version conflict by downgrading React, and never add
  `forwardRef` wrappers to make the kit run on 18.

## The rules that matter most

1. **Rendering a person? Use `<Person>` or `<PersonCard>`.** Never assemble an
   `<img>` + a name yourself. The component handles the photo, the
   cross-origin failures, and the illustrated fallback face. A person must
   always end up with a face, never initials.

2. **Rendering a company? Use `<Company>` or `<CompanyCard>`.** Pass the
   `domain`; the logo resolves itself. Never hand-write a logo `<img>` or an
   initials tile.

3. **Wrap the app in `<AppShell>`.** It paints the branded canvas. Without it
   the page reads as generic Tailwind no matter what else you use.

4. **Use the provided components before writing your own.** A bespoke button,
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

8. **`cn()` from `./trayo-ui`**, not bare `clsx`, when merging classes.

9. **Body is the default; Meta is for the small print.** `<Body>`
   (`text-body`, `--text-sm`) for paragraphs, summaries and the main line of a
   card. `<Meta>` (`text-meta`, `--text-xs`, muted) only for timestamps, counts
   and secondary attributes. A screen set mostly in Meta reads as grey and
   unfinished. Name the role, never the pixel size.

10. **A tool is not a landing page.** `<GradientText>` is for one phrase in a
    hero; `<BrandMesh>` for one hero or empty state. Not on a page title, not
    behind a table or a stat strip. `<PageHeader>` with a plain title is the
    default.

11. **Notes go in `<Callout>`.** "How this was built", a coverage caveat, a
    data limit, a target met: `<Callout tone="note|info|success|warning|destructive">`,
    never a hand-made bordered div.

12. **Stubbed actions confirm with a preview toast.** One `<Toaster />` inside
    `<AppShell>`; `toast({ variant: 'preview', title, description })` says
    "Preview - nothing was sent". Never a bespoke toast, never a silent success.

13. **Page scaffolding is provided.** View links in `<AppShell nav>` as
    `<AppShellNavLink>`s; filter groups are a `<SegmentedControl>` with counts;
    stat strips sit in a `<StatGrid>`. Contact rows are `<PersonContactLinks>`,
    firmographics are `<CompanyMeta>`.

14. **Long lists are paged.** Over ~50 rows, pass DataTable's `pagination`
    prop (client-side without `total`, server-side with it) or render
    `<Pagination>`. Never render a long list in full.

15. **Charts use the chart tokens.** `bg-chart-1`…`5` / `CHART_COLORS[i]`
    for series, `CHART_SEQUENTIAL` for intensity, `CHART_MUTED` for
    out-of-scope, `<DataLabel>` (`text-data-label`) for labels, `<ChartLegend>`
    for the key.
    Never a hex, never `text-[10px]`.

16. **Button variants are** `default | secondary | tertiary | quiet |
    destructive | destructive-outline | destructive-quiet`. `ghost`, `outline`,
    `link` and `primary` are remapped with a dev warning; write the real name.

17. **Building for a specific company? Use its brand, through the contract.**
    Write (or receive) the brand theme contract — `primary` is the colour the
    company is known for, not the first colour a logo API lists; `shell` only
    if its product chrome is coloured; `accents[]` for chart series 2–5 — and
    map it with `fromBrandThemeContract(contract)`. The company's styling is
    the canvas (page, cards, text too); the kit supplies the language. Pass
    `{ surfaces: 'trayo' }` only when the page should stay the kit's cream. Run `checkBrandPalette`, then `resolveBrandPalette`,
    then call `applyBrand(document, contract, { theme, fills, lead })` once
    at the app root — it writes the stylesheet, the attributes and the dark
    class (README "Customer brand"). The brand is its COLOURS only: never
    change fonts, type roles, radius, spacing or the components for a brand.
    Vary where the colour goes — `fills` (none | tiles | cards | all),
    `lead` (primary | secondary | tertiary), `page` (default | canvas |
    inverse), the theme, `<AppShell rail>` and a `<BrandBand>` headline —
    once per app, never per screen. Keep it calm: leave `canvas` at its
    neutral default and give a screen one coloured region (bar or rail, or a
    band), as shipped products do. Generating many apps? Take the choices
    from `brandVariant(index, contract)` + `brandVariantOptions` instead of
    picking them yourself. For the brand on a surface use `bg-container
    text-container-foreground`, never a hand-mixed tint. Never hand-set
    `--brand-*` or `--accent-*`, and never adjust a colour for contrast — the
    resolver does. Status colours, type, radius and the warm glow stay the
    kit's in every brand.

The files are yours once copied, so editing them is allowed. Prefer extending a
variant over forking a component, and keep the token vocabulary intact.

## API shapes map straight through

A person's photo arrives under two different names depending on the endpoint —
`profileImageUrl` from `GET /v1/people`, `photoUrl` from `POST /v1/find`.
`<Person>` reads both, so pass the API object through unchanged rather than
remapping it. If you build the object by hand, do not drop the photo field.

`PersonLike` and `CompanyLike` are loose supersets of `GET /v1/people` and
`GET /v1/accounts` rows. Pass the API object directly; every field but `name`
is optional and missing ones simply don't render.

```tsx
const { data } = await fetch('/v1/people?limit=25').then(r => r.json())
return data.map(p => <Person key={p.id} person={p} showContact />)
```

## Setup checklist

- [ ] Source copied to `src/trayo-ui/` (NOT installed from a URL)
- [ ] npm dependencies installed; Tailwind v4; React 19 (not 18)
- [ ] `@import 'tailwindcss';` then `@import './trayo-ui/styles/trayo-ui.css';`
- [ ] The app wrapped in `<AppShell>`, content in a `<PageContainer>`
- [ ] `class="dark"` on `<html>` only if you want the dark palette; light is the default
- [ ] For a customer build: brand resolved and applied on `<html>` (rule 17)
