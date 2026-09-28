/**
 * Shared content for the site.
 *
 * Split by AUDIENCE, deliberately:
 *   - INSTALL_STEPS / INVENTORY  — rendered by BOTH the human page and
 *     /llms.txt. These must never drift, which is why they live here once.
 *   - RULES                      — /llms.txt ONLY. Imperative do-this-not-that
 *     guidance is for a coding agent; on a page people read it just sounds like
 *     someone shouting rules at them.
 *   - VALUE / DOCS               — the human page ONLY. An agent does not need
 *     to be sold anything.
 *
 * The site rebuilds on every push, so what an agent reads is always what the
 * current source does.
 */

export const REPO = 'trayoai/ui'
export const SITE = 'https://ui.trayo.ai'

/** Where consumers are told to put the library inside their own project. */
export const VENDOR_DIR = 'src/trayo-ui'

export const INSTALL_STEPS = [
  {
    title: 'Copy the components into your project',
    body:
      'The library is vendored, not installed — the files become yours, with no dependency on this site. ' +
      '`degit` pulls the directory without any git history.',
    code: `npx degit ${REPO}/src ${VENDOR_DIR}`,
    alt: {
      label: 'No npx? Grab the tarball instead:',
      code: `mkdir -p ${VENDOR_DIR}\ncurl -L ${SITE}/trayo-ui.tar.gz | tar xz -C src`,
    },
  },
  {
    title: 'Install the real dependencies',
    body: 'Ordinary public npm packages. Requires Tailwind CSS v4 and React 19 (React 18 is not supported).',
    code: `npm install react@^19 react-dom@^19 clsx tailwind-merge lucide-react \\
  class-variance-authority tailwindcss @tailwindcss/vite \\
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog \\
  @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover \\
  @radix-ui/react-scroll-area @radix-ui/react-select \\
  @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch \\
  @radix-ui/react-tabs @radix-ui/react-tooltip`,
  },
  {
    title: 'Wire up the CSS',
    body:
      'Tailwind first — the stylesheet extends its theme. No `@source` directive is needed: ' +
      'the components now sit in your own source tree, which Tailwind v4 already scans.',
    code: `@import "tailwindcss";\n@import "./trayo-ui/styles/trayo-ui.css";`,
  },
  {
    title: 'Build something',
    body:
      'Light is the default; add `class="dark"` to `<html>` for the dark palette. ' +
      'The whole token set flips — no component changes.',
    code: `import { AppShell, PageContainer, PageHeader, Person, CompanyCard, Button } from './trayo-ui'

export default function App() {
  return (
    <AppShell>
      <PageContainer>
        <PageHeader title="Target accounts" actions={<Button>Import</Button>} />
        <CompanyCard company={{ name: 'Ramp', domain: 'ramp.com', industry: 'Fintech' }} />
        <Person person={{ id: 'p-1', name: 'Dana Whitfield', title: 'VP RevOps',
                          company: 'Ramp', companyDomain: 'ramp.com' }} />
      </PageContainer>
    </AppShell>
  )
}`,
  },
] as const

/** Page-only: why this matters, in the builder's terms — not the developer's. */
export const VALUE = [
  {
    icon: 'palette',
    title: 'It looks like it came from Trayo',
    body:
      'The same design system the Trayo app is built from — the colours, the type, the surfaces, ' +
      'the density. What you build reads as part of the product your team already uses, not as a ' +
      'separate thing bolted on beside it.',
  },
  {
    icon: 'eye',
    title: 'Credible before anyone clicks',
    body:
      'Most internal tools are judged on the first screenshot, in a thread, by people who will ' +
      'never open them. This is the difference between something that gets adopted and something ' +
      'that gets politely ignored.',
  },
  {
    icon: 'shield',
    title: 'The hard parts are already right',
    body:
      'People and companies are what a GTM screen is full of, and they are fiddly: faces, logos, ' +
      'fallbacks, dense tables that stay legible. Those are solved here, so the quality does not ' +
      'depend on how much time you had.',
  },
  {
    icon: 'layers',
    title: 'Consistent across everything you build',
    body:
      'The second tool matches the first, and the fifth matches both — without anyone maintaining ' +
      'a style guide. Colour, type and dark mode all come from one token set.',
  },
] as const

export const RULES = [
  // Entities
  'Rendering a person? Use `<Person>` or `<PersonCard>`. Never hand-assemble an avatar and a name — a person always gets a face, never initials. Email, phone and LinkedIn rows are `<PersonContactLinks>`, not your own icon row.',
  'Rendering a company? Use `<Company>` or `<CompanyCard>`. Pass `domain` and the logo resolves itself; never hand-write a logo `<img>`. Industry, headcount and location under a company are `<CompanyMeta>`.',
  // Page
  'Wrap the app in `<AppShell>`. Without it the page reads as generic Tailwind. View switching goes in `<AppShell nav={…}>` as `<AppShellNavLink>`s; a filter group ("All 59 · Red 3 · Amber 7") is a `<SegmentedControl>` with `count`s; a row of `<StatTile>`s sits in a `<StatGrid>`. Do not hand-roll a top bar, a pill group or the stat grid classes.',
  '`<GradientText>` is for one phrase in a hero and `<BrandMesh>` for one hero or empty state. Neither belongs on a data screen: not on the page title, not behind a table or a stat strip. A tool is not a landing page; `<PageHeader>` with a plain title is the default.',
  'Use the provided components before writing your own.',
  'Explanatory notes — "how this was built", coverage caveats, data limits, a target met — go in `<Callout>` (tones `note` `info` `success` `warning` `destructive`), not a hand-made bordered div or a `Surface` + `SectionLabel` + `Body` stack.',
  'Stubbed or demo actions (Push to Salesforce, Send email, Post to Slack with no integration wired) confirm with `toast({ variant: \'preview\', title, description })` from a single `<Toaster />` mounted inside `<AppShell>`. It says "Preview - nothing was sent". Never a bespoke toast component, never a silent success.',
  'Any list that can exceed ~50 rows is paged: pass DataTable\'s `pagination` prop (client-side without `total`, server-side with it), or render `<Pagination>` under a card grid. Never render a long list in full.',
  // Colour and type
  'No raw colours. Not `#hex`, not `bg-slate-800`. Use `bg-surface-card`, `text-text-secondary`, `border-border-subtle`, `bg-accent-brand` — they flip light/dark themselves.',
  'Content uses type roles (`text-page-title`, `text-name`, `text-body`, `text-meta`). Controls use `text-sm font-medium`. Never `text-[15px]`.',
  'Body copy is `<Body>` (the `text-body` role, `--text-sm`). `<Meta>` (`text-meta`, `--text-xs`, muted) is only for timestamps, counts and secondary attributes — never for a paragraph, a summary or the main line of a card. If most of a screen is set in Meta, the screen is wrong: promote it to Body. Name the role, never the pixel size.',
  'Charts use the chart tokens: series colour from `bg-chart-1`…`bg-chart-5` (or `CHART_COLORS[i]` / `chartColor(i)` for an inline SVG fill), intensity from `CHART_SEQUENTIAL`, out-of-scope marks from `CHART_MUTED`, labels with `<DataLabel>` (`text-data-label`, `--text-caption` — the only role below Meta, chart labels only) and a `<ChartLegend>` for two or more series. Never a raw hex, never `text-[10px]` / `text-[Npx]`.',
  // Controls and helpers
  'Button variants are exactly `default | secondary | tertiary | quiet | destructive | destructive-outline | destructive-quiet`. There is no `ghost`, `outline`, `link` or `primary`; those are accepted and remapped (ghost -> tertiary, outline -> secondary, link -> quiet, primary -> default) but warn in development. Write the canonical name.',
  '`<Button loading>` — do not swap in your own spinner.',
  'Use `cn()` from the library, not bare `clsx`.',
] as const

export const INVENTORY = [
  { group: 'Entities', items: 'Person, PersonCard, PersonContactLinks, Company, CompanyCard, CompanyMeta, PersonAvatar, CompanyLogo, ToneAvatar' },
  { group: 'Tables', items: 'DataTable (sortable, selectable, paged via `pagination`, skeleton loading), Pagination + usePagination, and the raw Table primitives' },
  { group: 'Page scaffolding', items: 'AppShell (with brand / nav / actions top bar), AppShellNavLink, PageContainer, PageHeader, Surface, Well, StatGrid' },
  { group: 'Decorative', items: 'BrandMesh, GradientText' },
  { group: 'States', items: 'EmptyState, StatTile, Callout, Skeleton, Progress' },
  { group: 'Type', items: 'PageTitle, SectionTitle, CardTitle, EntityName, Body, Meta, Eyebrow, SectionLabel, DataLabel' },
  { group: 'Controls', items: 'Button, Input, Textarea, Select, Checkbox, Switch, Label, Tabs, SegmentedControl' },
  { group: 'Display', items: 'Badge, TagChip, Card, Separator, Tooltip, ScrollArea' },
  { group: 'Overlays', items: 'Dialog, Popover, DropdownMenu' },
  { group: 'Feedback', items: 'Toaster, toast() — variants default, success, warning, destructive, preview' },
  { group: 'Charts', items: 'ChartLegend, DataLabel, CHART_COLORS, CHART_SEQUENTIAL, CHART_MUTED, chartColor(i), chartSequential(t)' },
] as const

/**
 * Field-name asymmetries in the Trayo API that silently break UIs. Documented
 * because reading only one spelling is the usual reason avatars fall back.
 */
export const API_NOTES = [
  {
    title: 'A person’s photo has two names',
    body:
      '`GET /v1/people` returns `profileImageUrl`, but a `POST /v1/find` contacts result carries `photoUrl` — ' +
      'which is also the field you send when creating a person. `<Person>` reads both (plus `imageUrl` / `avatarUrl`), ' +
      'so pass the API object straight through rather than remapping it.',
  },
] as const
