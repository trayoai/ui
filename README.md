# Trayo GTM UI

Trayo's UI component library for go-to-market applications built on the
[Trayo API](https://api.trayo.ai). Drop it into an app and the result looks like
Trayo: the same colours, type, surfaces, buttons and tables — and the same
treatment of the two things a GTM app shows constantly, **people** and
**companies**, complete with real avatars and real company logos.

There is no server-side logic here. These are presentational components. They do
not fetch, authenticate, or know anything about your data layer.

**v0.1** — the surface is stable enough to build on; expect additions.

**[See every component rendered, light and dark →](REPLACE_DEMO_URL)**

---

## Copy these files into your project

This library is **vendored, not installed.** You copy the source into your
application and it becomes yours — yours to read, yours to edit, and with no
dependency on wherever you got it from.

If you were handed a temporary URL to fetch it from, that URL is a delivery
mechanism and nothing more. **Never `npm install` from it**: that writes a
disappearing host into your `package.json` as a dependency spec, and every
future install, CI run and fresh clone breaks the day it goes away.

### 1. Drop in the source

From your project root:

```bash
mkdir -p src/trayo-ui
curl -L <BASE_URL>/trayo-ui.tar.gz | tar xz -C src
```

You get `src/trayo-ui/` holding `index.ts`, `components/`, `lib/` and `styles/`
(Polymath woff2 included), plus a copy of this README and AGENTS.md.

`src/trayo-ui/` is the location assumed throughout; put it anywhere your project
keeps source and adjust the import paths to match.

### 2. Install the real dependencies

Ordinary public npm packages — these are permanent:

```bash
npm install react react-dom clsx tailwind-merge lucide-react \
  class-variance-authority tailwindcss @tailwindcss/vite \
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover \
  @radix-ui/react-progress @radix-ui/react-scroll-area @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-tooltip
```

Requires **Tailwind CSS v4** and **React 18 or 19**.

### 3. Wire up the CSS

In your CSS entry, in this order:

```css
@import 'tailwindcss';
@import './trayo-ui/styles/trayo-ui.css';
```

That single stylesheet brings the design tokens, the type roles, the Polymath
heading font and the animations. Tailwind must come first — the stylesheet
extends its theme.

No `@source` directive is needed: the components sit inside your own source
tree, which Tailwind v4 already scans.

Light is the default. Add `class="dark"` to `<html>` for the dark palette — the
whole token set flips; no component needs changing.

---

## The 30-second version

```tsx
import { AppShell, PageContainer, PageHeader, Person, CompanyCard, Button } from './trayo-ui'

export default function App() {
  return (
    <AppShell>
      <PageContainer>
        <PageHeader title="Target accounts" actions={<Button>Import</Button>} />
        <CompanyCard company={{ name: 'Ramp', domain: 'ramp.com', industry: 'Fintech' }} />
        <Person person={{ id: 'p-1', name: 'Dana Whitfield', title: 'VP RevOps', company: 'Ramp', companyDomain: 'ramp.com' }} />
      </PageContainer>
    </AppShell>
  )
}
```

`AppShell` is what makes a page look like Trayo rather than a default Tailwind
page — it paints the warm shell gradient, the fractal grain and the corner
glows. Wrap your app in it once.

---

## People and companies

These two are the reason this library exists. **Whenever you render a person or
a company, use them** instead of assembling an avatar and a name by hand.

### `<Person>` / `<PersonCard>`

A person always gets a **face**. The resolution chain is the whole point:

1. the real photo, if `profileImageUrl` loads and isn't a LinkedIn generic
   silhouette;
2. otherwise one of Trayo's **50 illustrated placeholder faces**, chosen stably
   from the person's id — the same person gets the same face everywhere, forever.

It never degrades to initials.

```tsx
<Person person={apiPerson} />                        // row — lists and tables
<Person person={apiPerson} variant="inline" />        // avatar + name, in a sentence
<Person person={apiPerson} variant="stacked" />       // centred, for a tile
<Person person={apiPerson} showContact contacted />   // email/phone/LinkedIn glyphs + a "we reached out" check
<PersonCard person={apiPerson} summary="…" tags={['CISO']} footer={<Button size="sm">Reach out</Button>} />
```

`PersonLike` is a loose superset of a `GET /v1/people` row, so an API response
passes straight through. Everything but `name` is optional.

> **On real photos.** The Trayo API publishes `profileImageUrl` as the raw
> upstream URL, which is often a LinkedIn CDN link that refuses cross-origin
> hotlinks. When it fails, the fallback face takes over silently — your UI never
> breaks. If you run an image proxy that can fetch those URLs server-side, wire
> it up once and more real photos will resolve:
>
> ```tsx
> <TrayoUIProvider personImageProxy={(url) => `/api/img?u=${encodeURIComponent(url)}`}>
> ```

### `<Company>` / `<CompanyCard>`

Pass a **domain** and nothing else. The logo resolves through Trayo's public
logo proxy (`/api/brand-image` — logo.dev with a favicon fallback, no API key
needed), landing on a warm initials tile for companies with no mark.

```tsx
<Company company={{ name: 'Ramp', domain: 'ramp.com' }} />
<Company company={apiAccount} variant="inline" />     // logo + name, for a table cell
<Company company={apiAccount} showWebsite />          // + industry · headcount · location · site
<CompanyCard company={apiAccount} summary="…" tags={['Series D']} footer={<Button size="sm">Research</Button>} />
```

`CompanyLike` is a loose superset of a `/v1` account. A published `logoUrl`
works too, but `domain` alone is the common and better case.

### The avatars on their own

```tsx
<PersonAvatar name="Dana Whitfield" personId="p-1" src={photo} size="lg" contacted />
<CompanyLogo name="Ramp" domain="ramp.com" size="md" />
<ToneAvatar name="Ada Lovelace" tone="violet" />   // non-person identities: teams, workspaces, bots
```

Sizes: `xs sm md lg xl 2xl`.

### What resolves over the network

Both image paths point at **Trayo production**, not at whatever host you
downloaded this from, so they keep working indefinitely:

| | |
|---|---|
| company logos | `https://api.trayo.ai/api/brand-image?domain=…` (public, no key, rate-limited per caller) |
| fallback faces | `https://app.trayo.ai/images/placeholder/NN.png` |

To self-host the faces, copy the 50 PNGs into your static directory and point
the library at them:

```tsx
<TrayoUIProvider placeholderFaceBase="/images/placeholder">
```

---

## Tables

`DataTable` is presentational — **you** own sorting, paging and selection state;
it renders and reflects them. Put a `<Person>` or `<Company>` in the identity
column and the table immediately reads as Trayo.

```tsx
const columns: Column<Row>[] = [
  { id: 'person',  header: 'Person',  accessor: (r) => <Person person={r} />, sortable: true },
  { id: 'company', header: 'Company', accessor: (r) => <Company company={r.account} variant="inline" />, className: 'w-56' },
  { id: 'act',     header: '',        accessor: () => <Button size="xs">Reach out</Button>, align: 'right' },
]

<DataTable
  columns={columns}
  rows={rows}
  getRowKey={(r) => r.id}
  sort={sort}
  onSortChange={setSort}
  loading={isLoading}                 // renders skeleton rows, never a false "empty"
  empty={<EmptyState title="No results" />}
  selection={{ selectedKeys, onToggleRow, onToggleAllPage }}
  layout="fixed"                      // makes the per-column `width` hints authoritative
/>
```

The raw `Table` / `TableRow` / `TableCell` primitives are exported too, for
tables that don't fit the `DataTable` shape.

---

## Everything else

| What | Components |
|---|---|
| Page scaffolding | `AppShell` `PageContainer` `PageHeader` `Surface` `Well` |
| Decorative | `BrandMesh` (drifting brand gradient) `GradientText` |
| States | `EmptyState` `StatTile` `Skeleton` `Progress` |
| Type | `PageTitle` `SectionTitle` `CardTitle` `EntityName` `Body` `Meta` `Eyebrow` `SectionLabel` `Code` |
| Controls | `Button` `Input` `Textarea` `Select` `Checkbox` `Switch` `Label` `Tabs` |
| Display | `Badge` `TagChip` `Card` `Separator` `Tooltip` `ScrollArea` |
| Overlays | `Dialog` `Popover` `DropdownMenu` |

### Buttons

Pills at every size. `default` is the solid brand violet (one per screen area);
`secondary` outlines it; `tertiary` recedes; `quiet` is bare until hovered.
Sizes `xs sm default lg icon icon-sm`.

```tsx
<Button loading>Saving…</Button>              {/* the primitive owns the spinner */}
<Button variant="secondary">Research <Sparkles /></Button>
```

Never hand-roll a spinner swap inside a `<Button>` — pass `loading`.
Action glyphs (`Plus`, `Check`) lead; directional ones (`ArrowRight`,
`ExternalLink`) trail. Icons scale with the button size automatically — don't
size them per instance.

---

## House rules

Follow these and the result stays on-brand. Break them and it drifts.

1. **No raw colours.** No `#hex`, no `rgb()`, no Tailwind ramp classes
   (`text-blue-400`, `bg-slate-800`). Use the semantic classes:
   - surfaces — `bg-surface-shell` `bg-surface-card` `bg-surface-well` `bg-surface-row`
   - text — `text-text-primary` `text-text-secondary` `text-text-muted`
   - borders — `border-border-subtle` `border-border-strong`
   - brand — `bg-accent-brand` (fill) `text-accent-text` (readable) `bg-accent-soft` `border-accent-line`
   - status — `text-success-text` `bg-warning-soft` `border-*-line`

   These flip between light and dark on their own. A hand-written `dark:`
   override to patch a colour is the tell that you should have used a token.

2. **Two type vocabularies, never mixed.** *Content* (titles, names, body, meta,
   labels) uses a **role class**: `text-page-title` `text-section`
   `text-card-title` `text-name` `text-body` `text-meta` `text-label`
   `text-eyebrow` `text-code`. Roles carry the Polymath heading font —
   `text-[16px] font-semibold` silently drops it. *Controls* (buttons, inputs,
   badges, tabs) use the plain Tailwind scale (`text-sm font-medium`).

3. **Never arbitrary type.** No `text-[13px]`, `tracking-[0.07em]`,
   `leading-[1.55]`. The ramp is 11/12/13/14/16/18/24/40/56 and it is enough.

4. **Compose, don't fork.** Build from these components. If you find yourself
   writing a second bespoke `<button className="rounded-full …">` or a second
   hand-rolled `<table>`, that is the moment to use the primitive instead.

5. **Use `cn()`** (exported) to merge classes — it knows about the role classes,
   which plain `clsx` does not.

You own these files now, so editing them is fair game. Prefer extending a
variant over forking a component, and keep the token vocabulary intact — that
is what holds the aesthetic together.

---

## Configuration

Everything works with no provider. Wrap only to override:

```tsx
<TrayoUIProvider
  brandImageOrigin="https://api.trayo.ai"          // the company-logo proxy
  personImageProxy={(url) => `/api/img?u=${url}`}  // make more real photos load
  placeholderFaceBase="/images/placeholder"        // self-host the fallback faces
>
```

---

## Developing the library itself

(Only relevant in the library's own repository, not in a consuming app.)

```bash
pnpm install
pnpm demo        # showcase at http://127.0.0.1:5177
pnpm demo:build  # static showcase in demo/dist
pnpm typecheck
./publish.sh     # build + publish the public kit, stamping the live base URL
```

`demo/src/Showcase.tsx` renders every component in both themes and is the
fastest usage reference.
