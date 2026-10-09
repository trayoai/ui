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
  'Rendering a person? Use `<Person>` or `<PersonCard>`. Never hand-assemble an avatar and a name — a person always gets a face, never initials. Email, phone and LinkedIn rows are `<PersonContactLinks>`, not your own icon row. The one person a page or drawer is about gets `<PersonBanner>` at the top: one per screen, never in a list. Its `actions` slot takes one default `<Button>` (the primary; the band inverts it to read on the fill), not a `tertiary` one. Its `tone` is `solid` (default) | `soft` | `plain`: use `soft` or `plain` when the page already has a brand block, and `size="compact"` in a drawer or side panel. In a dialog, use `<PersonDialog>`: it places the banner and keeps the close button clear of it. The one person a panel is about (a post\'s author, an account\'s owner) is `<Person variant="lead">`, not a list row with a bigger `size`. A post with its author is `<PostCard author text>`.',
  'Rendering a company? Use `<Company>` or `<CompanyCard>`. Pass `domain` and the logo resolves itself; never hand-write a logo `<img>`. Industry, headcount and location under a company are `<CompanyMeta>`.',
  // Page
  'Wrap the app in `<AppShell>`. Without it the page reads as generic Tailwind. View switching goes in `<AppShell nav={…}>` as `<AppShellNavLink>`s; a filter group ("All 59 · Red 3 · Amber 7") is a `<SegmentedControl>` with `count`s; a row of `<StatTile>`s sits in a `<StatGrid>` (the next rule says when to use one). Do not hand-roll a top bar, a pill group or the stat grid classes. A panel with a name (a table, a chart, a list) is `<Surface title description actions>`, with `padded={false}` around a `DataTable`, never a hand-built card header.',
  'Pick the summary by the shape of the numbers, not by habit: four equal `<StatTile>`s on every screen is what makes two tools look like the same tool. One figure that matters: `<HeroStat>`. Stages of one pipeline (pulled, passed, reachable): `<Funnel>`. A few plain counts: `<StatBand>`, with an `<EntityStack>` of the logos or faces a count is made of. Figures with a change or a trend: `<StatBand headed>` with a `<Sparkline>` or `<Ring>`. A count per company: `<BreakdownTiles>` (pass `onValueChange` and it is also the filter) or `<DistributionList>`. Parts of a whole: `<ShareTicks>`, `<ShareRing>`, or `<SplitBar>` for two. Joined against left per period: `<DivergingColumns>`. A score on a row: `<Meter mark>`. Independent KPIs with a change: `<StatGrid>`. One summary pattern per page, and none when the table already shows the count. Counts that only say how the run was made go in `<PageHeader stats>` or a `<MethodNote>`, not on tiles. Put the summary beside something with `<Split aside>` (`ratio` `2:1` | `3:1` | `3:2` | `1:1`) so the page is not one full-width stack. Never hand-draw a bar list, a ring or a funnel from `<Progress>` and divs. Their bars are a thin solid bar with the remainder hatched; `bar="solid"` gives a flat track instead. One bar style for the whole app.',
  '`<GradientText>` is for one phrase in a hero and `<BrandMesh>` for one hero or empty state. Neither belongs on a data screen: not on the page title, not behind a table or a stat strip. A tool is not a landing page; `<PageHeader>` with a plain title is the default. A tool\'s main screen takes `<PageHeader size="lead">` (40px, an `eyebrow` above, a one-sentence `subtitle` below) so it reads in a screenshot; inner views keep the default size and `size="large"` is the step between. The title is three to six words. `variant` is `plain` | `card` | `band` (the brand container): pick one for the whole app, and never put a `band` header and a solid `<PersonBanner>` on one screen.',
  'Use the provided components before writing your own.',
  'The kit does the layout; slots take content-sized children. A `<Button>` sizes to its label: do not give one `w-full` or `flex-1` in a row with siblings, because a button cannot shrink and pushes out of its container. A card `footer` takes a bare `<Button>`: the card makes it compact and secondary and keeps it at the right, at the width of its label. Never `w-full` there, and never a solid primary on every card. A job change is `<JobMove from to>`. A list of people or companies goes in `<EntityList>`, which owns the row spacing and dividers, never a hand-spaced stack. A list of labelled points (why now, fit, evidence) is `<FactList>` with a `<Fact label>` each, never a `<Meta>` label over a `<Body>` paragraph: the label must be darker than the text it heads. A label for a person or company ("Left", "Owner") goes on its own line above the entity in `text-meta`, never inline beside the logo or avatar. A row of chips or buttons that may not fit gets `flex flex-wrap gap-2`. Size a dialog with its `size` prop, never a `max-w-*` class. Content in a dialog that can run long (a list of events, a table) goes in a `<DialogBody>` between the header and the footer, so the body scrolls and the footer and the close button stay on screen.',
  'Explanatory notes — "how this was built", coverage caveats, data limits, a target met — go in `<Callout>` (tones `note` `info` `success` `warning` `destructive`), not a hand-made bordered div or a `Surface` + `SectionLabel` + `Body` stack. Its `texture` is `diagonal` (default) | `dots` | `wash` | `none`: one for the whole app. How the data was made, when it has numbers (rows returned, kept, sources), is a `<MethodNote>`: `points` as figures, `flow` for a sequence, the prose as children behind its switch.',
  'Stubbed or demo actions (Push to Salesforce, Send email, Post to Slack with no integration wired) confirm with `toast({ variant: \'preview\', title, description })` from a single `<Toaster />` mounted inside `<AppShell>`. It says "Preview - nothing was sent". Never a bespoke toast component, never a silent success.',
  'Any list that can exceed ~50 rows is paged: pass DataTable\'s `pagination` prop (client-side without `total`, server-side with it), or render `<Pagination>` under a card grid. Never render a long list in full. The other end: a short list with nothing to sort, select or page uses `<DataTable variant="simple">` in a padded `<Surface>` (not `padded={false}`), with `onRowClick` in place of a button on every row. A table with six rows or fewer draws its people and companies large on its own (64px face, larger name); `scale="default"` or `scale="large"` pins the size when a filter moves the list across six rows. Never pass `size` to the `<Person>` in a cell to get there. A list with no columns to align is an `<EntityList>`.',
  // Colour and type
  'No raw colours. Not `#hex`, not `bg-slate-800`. Use `bg-surface-card`, `text-text-secondary`, `border-border-subtle`, `bg-accent-brand` — they flip light/dark themselves.',
  'Content uses type roles (`text-page-title`, `text-name`, `text-body`, `text-meta`). Controls use `text-sm font-medium`. Never `text-[15px]`.',
  'Body copy is `<Body>` (the `text-body` role, `--text-sm`). `<Meta>` (`text-meta`, `--text-xs`, muted) is only for timestamps, counts and secondary attributes — never for a paragraph, a summary or the main line of a card. If most of a screen is set in Meta, the screen is wrong: promote it to Body. Name the role, never the pixel size. Faces and logos carry a screen and text stays short: leave `size` off so people and companies render at the kit\'s sizes, and never shrink one to fit more text. A card `summary` is one or two sentences (it clamps at three lines), a tag is one to three words (a card shows three and counts the rest), and a reason or note is a sentence, not a paragraph.',
  'Charts use the chart tokens: series colour from `bg-chart-1`…`bg-chart-5` (or `CHART_COLORS[i]` / `chartColor(i)` for an inline SVG fill), intensity from `CHART_SEQUENTIAL`, out-of-scope marks from `CHART_MUTED`, labels with `<DataLabel>` (`text-data-label`, `--text-caption` — the only role below Meta, chart labels only) and a `<ChartLegend>` for two or more series. Use the built charts before drawing one: `<ColumnChart>`, `<Sparkline>`, `<Ring>`, `<DivergingColumns>` and the share components. One colour per series; several colours only where colour marks a segment of a whole. Never a raw hex, never `text-[10px]` / `text-[Npx]`.',
  // Controls and helpers
  'Button variants are exactly `default | secondary | tertiary | quiet | destructive | destructive-outline | destructive-quiet`. There is no `ghost`, `outline`, `link` or `primary`; those are accepted and remapped (ghost -> tertiary, outline -> secondary, link -> quiet, primary -> default) but warn in development. Write the canonical name.',
  '`<Button loading>` — do not swap in your own spinner.',
  'Use `cn()` from the library, not bare `clsx`.',
] as const

export const INVENTORY = [
  { group: 'Entities', items: 'Person (variants row, inline, stacked, lead), PersonCard, PersonBanner (tones solid, soft, plain; size compact), PersonContactLinks, Company, CompanyCard, CompanyMeta, PostCard (a post and its author), EntityList (a spaced, divided list of Person or Company rows), FactList and Fact (labelled points: why now, fit, evidence), JobMove (left one company, joined another), PersonAvatar, CompanyLogo, ToneAvatar' },
  { group: 'Tables', items: 'DataTable (sortable, selectable, paged via `pagination`, skeleton loading; `variant="simple"` or `"large"` and `hideHeader` for a short list in a card), Pagination + usePagination, and the raw Table primitives' },
  { group: 'Page scaffolding', items: 'AppShell (with brand / nav / actions top bar), AppShellNavLink, PageContainer, PageHeader (size default / large / lead; eyebrow, icon, stats; variant plain / card / band), Split (a main column and an aside), Surface (title / description / icon / actions for a framed panel), IconTile, Well, StatGrid' },
  { group: 'Summaries', items: 'HeroStat (one headline figure with a reading, a chart and supporting figures), StatBand (figures on one sheet; `headed` for titled cells), EntityStack (a pile of logos or faces with +N), Funnel, SplitBar, Meter (a score against a pass mark), MethodNote (how the data was made, as steps or sources)' },
  { group: 'Breakdowns and small charts', items: 'BreakdownTiles (a tile per company, usable as a filter), DistributionList, ShareTicks, ShareRing, DivergingColumns, ColumnChart, Sparkline, Ring' },
  { group: 'Decorative', items: 'BrandMesh, GradientText' },
  { group: 'States', items: 'EmptyState, StatTile, Callout (tones; textures diagonal, dots, wash, none), Skeleton, Progress' },
  { group: 'Type', items: 'PageTitle, SectionTitle, CardTitle, EntityName, Body, Meta, Eyebrow, SectionLabel, DataLabel' },
  { group: 'Controls', items: 'Button, Input, Textarea, Select, Checkbox, Switch, Label, Tabs, SegmentedControl' },
  { group: 'Display', items: 'Badge, TagChip, Card, Separator, Tooltip, ScrollArea' },
  { group: 'Overlays', items: 'Dialog (with DialogBody for content that scrolls), PersonDialog (a dialog about one person: banner, body, footer actions), Popover, DropdownMenu' },
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
