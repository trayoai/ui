import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react'
import {
  AppShell,
  AppShellNavLink,
  Badge,
  Body,
  Button,
  Callout,
  CHART_MUTED,
  CHART_SEQUENTIAL,
  ChartLegend,
  Company,
  CompanyCard,
  CompanyLogo,
  Code,
  DataLabel,
  DataTable,
  chartColor,
  EmptyState,
  Eyebrow,
  Hero,
  Input,
  Meta,
  PageContainer,
  PageTitle,
  Person,
  PersonAvatar,
  PersonCard,
  SectionTitle,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatGrid,
  StatTile,
  Surface,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  ToneAvatar,
  Well,
  toast,
  usePagination,
  type Column,
  type SortState,
  type CompanyLike,
  type PersonLike,
  cn,
  brandAttributes,
  brandPaletteStyle,
  fromBrandThemeContract,
  resolveBrandPalette,
  type BrandThemeContract,
} from '../../../src'

/* --------------------------------------------------------------- fixtures */

const PEOPLE: PersonLike[] = [
  {
    id: 'p-1',
    name: 'Dana Whitfield',
    title: 'VP of Revenue Operations',
    company: 'Ramp',
    companyDomain: 'ramp.com',
    location: 'New York, NY',
    email: 'dana@ramp.com',
    profileUrl: 'https://ramp.com/team/dana',
    // A photo that loads — the component shows the real face.
    profileImageUrl: 'https://i.pravatar.cc/240?img=47',
  },
  {
    id: 'p-2',
    name: 'Marcus Oyelaran',
    title: 'Head of Security Engineering',
    company: 'Vercel',
    companyDomain: 'vercel.com',
    location: 'Remote — EU',
    email: 'marcus@vercel.com',
    phone: '+1 415 555 0142',
    profileUrl: 'https://vercel.com/team/marcus',
    profileImageUrl: 'https://i.pravatar.cc/240?img=12',
  },
  {
    id: 'p-3',
    name: 'Priya Raghunathan',
    title: 'Chief Information Security Officer',
    company: 'Notion',
    companyDomain: 'notion.so',
    location: 'San Francisco, CA',
    // A photo URL that no longer resolves — the built-in fallback face takes
    // over silently. This is the common real-world case.
    profileImageUrl: '/photo-that-no-longer-exists.jpg',
  },
  {
    id: 'p-4',
    name: 'Tobias Lindqvist',
    title: 'Director, Demand Generation',
    company: 'Linear',
    companyDomain: 'linear.app',
    location: 'Stockholm, SE',
    email: 'tobias@linear.app',
    profileImageUrl: 'https://i.pravatar.cc/240?img=68',
  },
  {
    // Shaped like a POST /v1/find contacts result, which spells the photo
    // `photoUrl` rather than `profileImageUrl`. Both resolve.
    id: 'p-6',
    name: 'Rafael Duarte',
    title: 'Director of Revenue Operations',
    company: 'Figma',
    companyDomain: 'figma.com',
    location: 'Lisbon, PT',
    photoUrl: 'https://i.pravatar.cc/240?img=33',
  },
  {
    id: 'p-5',
    name: 'Amara Osei',
    title: 'Senior Manager, Sales Development',
    company: 'Stripe',
    companyDomain: 'stripe.com',
    location: 'London, UK',
    email: 'amara@stripe.com',
    phone: '+44 20 7555 0198',
    profileUrl: 'https://stripe.com/team/amara',
  },
]

const COMPANIES: CompanyLike[] = [
  {
    id: 'c-1',
    name: 'Ramp',
    domain: 'ramp.com',
    industry: 'Fintech',
    employeeCount: 1200,
    location: 'New York, NY',
    description:
      'Corporate cards and spend management. Hiring aggressively into RevOps after a Series D, which is the opening: three ops roles posted in the last fortnight.',
  },
  {
    id: 'c-2',
    name: 'Vercel',
    domain: 'vercel.com',
    industry: 'Developer Tools',
    employeeCount: 650,
    location: 'San Francisco, CA',
    description:
      'Frontend cloud. A new Head of Security Engineering started six weeks ago — a fresh mandate and an unspent budget.',
  },
  {
    id: 'c-3',
    name: 'Notion',
    domain: 'notion.so',
    industry: 'Productivity Software',
    employeeCount: '501-1000',
    location: 'San Francisco, CA',
    description:
      'Connected workspace. Moved to a named-CISO structure this quarter; security tooling consolidation is in flight.',
  },
  {
    id: 'c-4',
    name: 'Linear',
    domain: 'linear.app',
    industry: 'Project Management',
    employeeCount: 90,
    location: 'Remote — Global',
    description:
      'Issue tracking for software teams. Opened a demand-gen function for the first time, so the GTM motion is being built from zero.',
  },
]

/* ------------------------------------------------------------------ table */

const PEOPLE_COLUMNS: Column<PersonLike>[] = [
  {
    id: 'person',
    header: 'Person',
    accessor: (p) => <Person person={p} size='md' />,
    className: 'min-w-[260px]',
    sortable: true,
  },
  {
    id: 'company',
    header: 'Company',
    accessor: (p) =>
      p.company ? (
        <Company
          company={{ name: p.company, domain: p.companyDomain }}
          variant='inline'
        />
      ) : null,
    className: 'w-56',
  },
  {
    id: 'location',
    header: 'Location',
    accessor: (p) => <span className='text-body-sm text-text-secondary'>{p.location}</span>,
    className: 'w-44 hidden lg:table-cell',
  },
  {
    id: 'reachable',
    header: 'Reachable',
    accessor: (p) =>
      p.email ? (
        <Badge variant='success'>
          <Check /> Email
        </Badge>
      ) : (
        <Badge variant='soft'>Needs enrichment</Badge>
      ),
    className: 'w-40',
  },
  {
    id: 'action',
    header: '',
    accessor: () => (
      <Button size='xs'>
        Reach out <ArrowRight />
      </Button>
    ),
    align: 'right',
    className: 'w-32',
  },
]


/* ------------------------------------------------------- accounts table */

type AccountRow = {
  id: string
  company: CompanyLike
  owner: PersonLike
  score: number
  signals: number
  stage: 'Prospect' | 'Engaged' | 'Meeting booked'
  lastActivity: string
}

const ACCOUNTS: AccountRow[] = [
  { id: 'a-1', company: COMPANIES[0], owner: PEOPLE[0], score: 92, signals: 7, stage: 'Meeting booked', lastActivity: '2h ago' },
  { id: 'a-2', company: COMPANIES[1], owner: PEOPLE[1], score: 86, signals: 4, stage: 'Engaged', lastActivity: 'Yesterday' },
  { id: 'a-3', company: COMPANIES[2], owner: PEOPLE[2], score: 74, signals: 3, stage: 'Engaged', lastActivity: '3d ago' },
  { id: 'a-4', company: COMPANIES[3], owner: PEOPLE[3], score: 61, signals: 2, stage: 'Prospect', lastActivity: '1w ago' },
  { id: 'a-5', company: { id: 'c-5', name: 'Figma', domain: 'figma.com', industry: 'Design', employeeCount: 1400, location: 'San Francisco, CA' }, owner: PEOPLE[4], score: 58, signals: 1, stage: 'Prospect', lastActivity: '2w ago' },
]

// A realistic list is longer than one screen, so the table demo pages. The
// five fixtures repeat with drifting scores so every page looks different.
const STAGES: AccountRow['stage'][] = ['Prospect', 'Engaged', 'Meeting booked']
const ACTIVITY = ['2h ago', 'Yesterday', '3d ago', '1w ago', '2w ago', '1mo ago']
const MANY_ACCOUNTS: AccountRow[] = Array.from({ length: 62 }, (_, i) => {
  const base = ACCOUNTS[i % ACCOUNTS.length]
  return {
    ...base,
    id: `a-${i + 1}`,
    owner: PEOPLE[(i * 3) % PEOPLE.length],
    score: Math.max(12, base.score - ((i * 7) % 60)),
    signals: (i * 5) % 9,
    stage: STAGES[(i * 2) % STAGES.length],
    lastActivity: ACTIVITY[i % ACTIVITY.length],
  }
})

function sortAccounts(rows: AccountRow[], sort: SortState): AccountRow[] {
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (sort.key === 'account') return a.company.name.localeCompare(b.company.name) * dir
    if (sort.key === 'signals') return (a.signals - b.signals) * dir
    return (a.score - b.score) * dir
  })
}

const STAGE_VARIANT = {
  'Meeting booked': 'success',
  Engaged: 'accent',
  Prospect: 'soft',
} as const

// A score reads faster as a filled bar than as a bare number, and the bar uses
// the brand accent so the eye lands on the best accounts first.
function ScoreCell({ value }: { value: number }) {
  return (
    <span className='flex items-center gap-2'>
      <span className='h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-surface-well'>
        <span className='block h-full rounded-full bg-accent-brand' style={{ width: `${value}%` }} />
      </span>
      <span className='text-body-sm tabular-nums text-text-secondary'>{value}</span>
    </span>
  )
}

const ACCOUNT_COLUMNS: Column<AccountRow>[] = [
  {
    id: 'account',
    header: 'Account',
    accessor: (r) => <Company company={r.company} showWebsite />,
    className: 'min-w-[260px]',
    sortable: true,
  },
  {
    id: 'score',
    header: 'Fit',
    accessor: (r) => <ScoreCell value={r.score} />,
    className: 'w-40',
    sortable: true,
  },
  {
    id: 'signals',
    header: 'Signals',
    accessor: (r) => <Badge variant='count'>{r.signals}</Badge>,
    align: 'center',
    className: 'w-24',
    sortable: true,
  },
  {
    id: 'stage',
    header: 'Stage',
    accessor: (r) => <Badge variant={STAGE_VARIANT[r.stage]}>{r.stage}</Badge>,
    className: 'w-40',
  },
  {
    id: 'owner',
    header: 'Owner',
    accessor: (r) => <Person person={r.owner} variant='inline' />,
    className: 'w-48 hidden lg:table-cell',
  },
  {
    id: 'last',
    header: 'Last activity',
    accessor: (r) => <span className='text-meta'>{r.lastActivity}</span>,
    className: 'w-32 hidden xl:table-cell',
  },
  {
    id: 'act',
    header: '',
    accessor: () => (
      <Button size='xs' variant='secondary'>
        Research <Sparkles />
      </Button>
    ),
    align: 'right',
    className: 'w-32',
  },
]

/* --------------------------------------------------------------- sections */

function Section({
  title,
  caption,
  children,
}: {
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <section className='mb-14'>
      <div className='mb-4'>
        <SectionTitle>{title}</SectionTitle>
        {caption && <Body className='mt-1 max-w-2xl'>{caption}</Body>}
      </div>
      {children}
    </section>
  )
}

/**
 * The showcase's own masthead. Not `<PageHeader>`: that one sets the subtitle
 * inline after an in-app title, which is right for a product screen but reads
 * as one run-on sentence at the top of a specimen page. Here the name leads at
 * hero size, the version is a badge beside it, the tagline sits underneath,
 * and a hairline separates the masthead from the first section.
 */
function DemoHeader({ compact }: { compact?: boolean }) {
  const Title = compact ? PageTitle : Hero
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle',
        compact ? 'mb-6 pb-5' : 'mb-10 pb-8'
      )}
    >
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-3'>
          {/* 32px — the hero role's own narrow-viewport step, used at every
              width: the 40px hero dwarfed the specimens beneath it. Marked
              important because the role's own minted `text-hero` utility
              sets font-size later in the same layer. */}
          <Title className={compact ? undefined : '[font-size:var(--text-hero-sm)]!'}>
            Trayo <span className='text-accent-brand'>GTM UI</span>
          </Title>
          <Badge variant='accent'>v0.1</Badge>
        </div>
        <Body className='mt-2'>The component kit for apps built on the Trayo API.</Body>
      </div>
    </header>
  )
}

/**
 * Light/dark toggle for the demo: a sun and a moon either side of the switch,
 * so both ends are named and the current one is lit. The icons are shortcuts
 * straight to their theme; the switch stays the single keyboard stop.
 */
export function ThemeSwitch({
  dark,
  onChange,
}: {
  dark: boolean
  onChange: (dark: boolean) => void
}) {
  const icon = (active: boolean) =>
    cn(
      'grid size-6 cursor-pointer place-items-center rounded-full transition-colors [&>svg]:size-4',
      active ? 'text-accent-text' : 'text-text-muted hover:text-text-secondary'
    )
  return (
    <div className='flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-1.5 py-1'>
      <button
        type='button'
        tabIndex={-1}
        aria-label='Light theme'
        className={icon(!dark)}
        onClick={() => onChange(false)}
      >
        <Sun />
      </button>
      <Switch
        checked={dark}
        onCheckedChange={onChange}
        aria-label='Dark theme'
        // The library's off-state track is --input (the 14% hairline), which
        // all but vanishes on a card; the strong border tone and a lifted
        // thumb keep the control visible before it has ever been pressed.
        className='data-[state=unchecked]:bg-border-strong dark:data-[state=unchecked]:bg-border-strong [&>span]:shadow-sm'
      />
      <button
        type='button'
        tabIndex={-1}
        aria-label='Dark theme'
        className={icon(dark)}
        onClick={() => onChange(true)}
      >
        <Moon />
      </button>
    </div>
  )
}

/**
 * Names the specimen that follows it. The old single uppercase-violet line did
 * two jobs at once; here the component name is the short eyebrow and what it
 * demonstrates is plain sentence-case copy beside it. The only accent is the
 * dot, so violet stays for things you can press.
 */
function SpecimenLabel({
  name,
  children,
  className,
}: {
  name: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5', className)}>
      <span className='flex items-center gap-2 self-center'>
        <span aria-hidden className='size-1.5 rounded-full bg-accent-brand' />
        <Eyebrow className='font-medium text-text-primary'>{name}</Eyebrow>
      </span>
      {children && <Meta className='text-text-secondary'>{children}</Meta>}
    </div>
  )
}

/**
 * The stage a specimen sits on: a dashed, unfilled frame whose header row names what
 * is shown and which component to import, so the thing inside reads as an
 * exhibit rather than a live product screen. `min-w-0` lets a wide table
 * inside scroll within its own card instead of widening the grid column.
 *
 * What goes inside: a component that is already a card or table sits on the
 * stage directly; loose items (sizes, variants, badges) go on a `<Panel>` so
 * there is exactly one card between the frame and the specimen.
 */
function Specimen({
  name,
  note,
  component,
  className,
  children,
}: {
  name: string
  note?: React.ReactNode
  component: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <figure
      className={cn(
        'relative flex min-w-0 flex-col rounded-[calc(var(--radius)+6px)] p-2',
        className
      )}
    >
      {/* The dashed outline is an SVG rect, not a CSS border, for the same
          reason as the site's Install block: CSS can't set the dash length.
          This matches its 2px-dash / 8px-gap rhythm, in a themed stroke. */}
      <svg
        aria-hidden
        className='pointer-events-none absolute inset-0 size-full overflow-visible'
      >
        <rect
          x='0.5'
          y='0.5'
          width='calc(100% - 1px)'
          height='calc(100% - 1px)'
          rx='17.5'
          fill='none'
          stroke='var(--text-muted)'
          strokeDasharray='2 8'
        />
      </svg>
      <figcaption className='relative flex flex-wrap items-center justify-between gap-2 px-2 pt-1 pb-2.5'>
        <SpecimenLabel name={name} className='mb-0'>
          {note}
        </SpecimenLabel>
        <Code className='rounded-md bg-surface-card px-1.5 py-0.5'>
          {component}
        </Code>
      </figcaption>
      {children}
    </figure>
  )
}

/** The card a set of loose specimens sits on, filling its stage. */
function Panel({ className, ...props }: React.ComponentProps<typeof Surface>) {
  return <Surface className={cn('flex-1', className)} {...props} />
}

/* ---------------------------------------------------------------- charts */

// Spelled out so Tailwind sees each class literally.
const CHART_SWATCHES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
const SEQ_SWATCHES = [
  'bg-chart-seq-1',
  'bg-chart-seq-2',
  'bg-chart-seq-3',
  'bg-chart-seq-4',
  'bg-chart-seq-5',
]

const SIGNAL_SERIES = [
  { id: 'hiring', name: 'Hiring surge', values: [18, 24, 21, 30] },
  { id: 'funding', name: 'Funding round', values: [6, 9, 7, 12] },
  { id: 'leader', name: 'New security leader', values: [11, 8, 14, 16] },
] as const
const SIGNAL_WEEKS = ['W36', 'W37', 'W38', 'W39']
/** A quarter that is out of scope for the ICP, drawn in the neutral fill. */
const OUT_OF_SCOPE_WEEK = 1

/** The rendered width of an element, so an SVG can be laid out in real pixels. */
function useMeasuredWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * Grouped bars in plain SVG — what an agent's own chart should look like:
 * every fill is `chartColor(i)` or `CHART_MUTED`, every label is a
 * `<DataLabel as="text">`, the key is a `<ChartLegend>`, and the axis and
 * grid are border tokens. Nothing here is a hex or a `text-[Npx]`.
 *
 * The SVG is sized in PIXELS from the measured container, not scaled through
 * a fixed viewBox: a scaled viewBox scales the text with it, and an 11px
 * label drawn at 1.8× is no longer 11px.
 */
function SignalsBarChart() {
  const [wrapRef, W] = useMeasuredWidth<HTMLDivElement>(420)
  const H = 180
  const PAD = { t: 8, r: 8, b: 24, l: 28 }
  const max = 32
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const groupW = plotW / SIGNAL_WEEKS.length
  const gap = 4
  // Bars fill about two thirds of their group, within a sane range.
  const barW = Math.max(12, Math.min(32, Math.floor((groupW * 0.66) / SIGNAL_SERIES.length) - gap))
  const groupInner = SIGNAL_SERIES.length * barW + (SIGNAL_SERIES.length - 1) * gap
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH
  const ticks = [0, 8, 16, 24, 32]

  return (
    <div ref={wrapRef} className='flex flex-col gap-3'>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className='block'
        role='img'
        aria-label='Signals per week by type, four weeks'
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? 'stroke-border-strong' : 'stroke-border-subtle'}
            />
            <DataLabel as='text' x={PAD.l - 6} y={y(t) + 3.5} textAnchor='end'>
              {t}
            </DataLabel>
          </g>
        ))}
        {SIGNAL_WEEKS.map((week, wi) => {
          const x0 = PAD.l + wi * groupW + (groupW - groupInner) / 2
          const muted = wi === OUT_OF_SCOPE_WEEK
          return (
            <g key={week}>
              {SIGNAL_SERIES.map((s, si) => {
                const v = s.values[wi]
                const x = x0 + si * (barW + gap)
                return (
                  <rect
                    key={s.id}
                    x={x}
                    y={y(v)}
                    width={barW}
                    height={y(0) - y(v)}
                    rx={2}
                    fill={muted ? CHART_MUTED : chartColor(si)}
                  />
                )
              })}
              <DataLabel
                as='text'
                x={x0 + groupInner / 2}
                y={H - PAD.b + 14}
                textAnchor='middle'
                className={muted ? 'text-text-muted' : 'text-text-secondary'}
              >
                {week}
                {muted ? ' · n/a' : ''}
              </DataLabel>
            </g>
          )
        })}
      </svg>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2'>
        <ChartLegend
          swatch='square'
          items={[
            ...SIGNAL_SERIES.map((s, i) => ({ label: s.name, color: chartColor(i) })),
            { label: 'Outside ICP', color: CHART_MUTED },
          ]}
        />
        {/* An intensity key is a ramp strip, not a legend: the steps have no names. */}
        <div className='flex items-center gap-1.5'>
          <DataLabel>low</DataLabel>
          <span className='flex gap-px'>
            {CHART_SEQUENTIAL.map((c) => (
              <span key={c} aria-hidden className='size-2.5 rounded-xs' style={{ background: c }} />
            ))}
          </span>
          <DataLabel>high momentum</DataLabel>
        </div>
      </div>
    </div>
  )
}

/**
 * Where the library itself (docs + source download) is published.
 *
 * `publish.sh` rewrites this literal in the built bundle once it knows the live
 * tunnel host, so the demo always links back to its sibling URL. Left as the
 * raw token in a local `pnpm demo`, where the link is just disabled.
 */
const LIBRARY_URL = 'REPLACE_LIB_URL'
const libraryHref = LIBRARY_URL.startsWith('http') ? LIBRARY_URL : null

/** The filter group demonstrated by the segmented control. */
const BANDS = [
  { value: 'all', label: 'All', count: 59 },
  { value: 'red', label: 'Red', count: 3 },
  { value: 'amber', label: 'Amber', count: 7 },
  { value: 'green', label: 'Green', count: 49 },
] as const
type Band = (typeof BANDS)[number]['value']

/**
 * Customer palettes for the brand switcher, in the brand theme contract shape a
 * brand-research agent writes. The kit maps them onto its slots: page, cards
 * and text stay Trayo's; primary, accents and (Slack) the top bar change.
 */
export const DEMO_BRANDS: Record<Exclude<DemoBrand, 'trayo'>, BrandThemeContract> = {
  paypal: {
    primary: '#002991', onPrimary: '#ffffff', shell: '#ffffff', onShell: '#001435',
    background: '#ffffff', surface: '#f5f7fa', text: '#001435', mutedText: '#545d68',
    accents: ['#3fb6ff'],
  },
  slack: {
    primary: '#611f69', onPrimary: '#ffffff', shell: '#4a154b', onShell: '#ffffff',
    background: '#ffffff', surface: '#f8f8f8', text: '#1d1c1d', mutedText: '#616061',
    accents: ['#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a'],
  },
  stripe: {
    primary: '#543afc', onPrimary: '#ffffff', shell: '#ffffff', onShell: '#0a2540',
    background: '#ffffff', surface: '#f6f9fc', text: '#0a2540', mutedText: '#425466',
  },
  apple: {
    primary: '#000000', onPrimary: '#ffffff', shell: '#f5f5f7', onShell: '#1d1d1f',
    background: '#ffffff', surface: '#f5f5f7', text: '#1d1d1f', mutedText: '#6e6e73',
  },
}
export type DemoBrand = 'trayo' | 'paypal' | 'slack' | 'stripe' | 'apple'
export const BRAND_OPTIONS: { value: DemoBrand; label: string }[] = [
  { value: 'trayo', label: 'Trayo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'slack', label: 'Slack' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'apple', label: 'Apple' },
]

/**
 * Applies a demo brand the way an app does: the resolved tokens and the
 * data-brand attributes on <html>, so portaled popovers follow too.
 */
export function useDemoBrand(brand: DemoBrand, full: boolean) {
  useEffect(() => {
    if (brand === 'trayo') return
    const root = document.documentElement
    const palette = resolveBrandPalette(
      fromBrandThemeContract(DEMO_BRANDS[brand], { surfaces: full ? 'brand' : 'trayo' }).input
    )
    const attrs = brandAttributes(palette)
    const style = brandPaletteStyle(palette)
    for (const [k, v] of Object.entries(attrs)) root.setAttribute(k, v)
    for (const [k, v] of Object.entries(style)) root.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(attrs)) root.removeAttribute(k)
      for (const k of Object.keys(style)) root.style.removeProperty(k)
    }
  }, [brand, full])
}

export function Showcase({ compact = false }: { compact?: boolean } = {}) {
  const [dark, setDark] = useState(false)
  const [brand, setBrand] = useState<DemoBrand>('trayo')
  // Full (the default for a customer build): the company's surfaces too.
  // Off = accent-only, the page stays Trayo's cream.
  const [fullBrand, setFullBrand] = useState(true)
  useDemoBrand(brand, fullBrand)
  // Each brand reads best in one theme (a dark primary on a dark bar → dark);
  // follow it on switch, the theme switch still overrides.
  useEffect(() => {
    if (brand === 'trayo') return
    setDark(resolveBrandPalette(fromBrandThemeContract(DEMO_BRANDS[brand]).input).theme === 'dark')
  }, [brand])
  const [selected, setSelected] = useState<Set<string>>(new Set(['p-2']))
  const [sort, setSort] = useState<SortState>({ key: 'score', dir: 'desc' })
  const [band, setBand] = useState<Band>('all')
  // Sort the whole list, then let the table page it (client-side: no `total`).
  const sortedAccounts = useMemo(() => sortAccounts(MANY_ACCOUNTS, sort), [sort])
  const accountPaging = usePagination(sortedAccounts.length, { pageSize: 10 })

  return (
    <div className={dark ? 'dark' : undefined}>
      {/* The demo runs inside the kit's own top bar: brand on the left, the
          view links on the right, the theme switch as the bar's action. */}
      <AppShell
        className={compact ? 'min-h-0' : undefined}
        width='wide'
        brand={
          <>
            <span>
              Trayo <span className='text-accent-text'>GTM UI</span>
            </span>
            <Badge variant='soft'>demo</Badge>
          </>
        }
        nav={
          <>
            <AppShellNavLink active>Components</AppShellNavLink>
            <AppShellNavLink href='/signature' target='_top'>
              Signature lab
            </AppShellNavLink>
            <AppShellNavLink href={libraryHref ?? 'https://ui.trayo.ai'} target='_top'>
              Get the library
            </AppShellNavLink>
          </>
        }
        actions={
          <>
            <SegmentedControl
              size='sm'
              aria-label='Customer brand'
              value={brand}
              onValueChange={setBrand}
              options={BRAND_OPTIONS}
            />
            <label className='flex items-center gap-1.5 text-sm text-text-secondary'>
              <Switch
                checked={fullBrand}
                onCheckedChange={setFullBrand}
                disabled={brand === 'trayo'}
                aria-label='Brand surfaces too'
              />
              Full
            </label>
            <ThemeSwitch dark={dark} onChange={setDark} />
          </>
        }
      >
        <Toaster />
        <PageContainer width='wide' className={compact ? 'py-6' : undefined}>
          <DemoHeader compact={compact} />

          {/* -------------------------------------------------- table */}
          <Section
            title='Tables'
            caption='DataTable is the workhorse — most GTM screens are a table. It is presentational: you own sorting, selection and the page, and it renders and reflects them — including the paging control, so a long list is never rendered in full. Put a Company or Person in the identity column and the whole table reads as Trayo.'
          >
            <Specimen
              name='Account table'
              note='Sortable and paged — 62 accounts, ten to a page, with a fit score, signal counts and owners.'
              component='<DataTable pagination>'
              className='mb-8'
            >
              <Surface padded={false} className='overflow-hidden p-1'>
                <DataTable
                  columns={ACCOUNT_COLUMNS}
                  rows={sortedAccounts}
                  getRowKey={(r) => r.id}
                  sort={sort}
                  onSortChange={setSort}
                  pagination={{
                    page: accountPaging.page,
                    pageSize: accountPaging.pageSize,
                    onPageChange: accountPaging.setPage,
                    pageSizeOptions: [10, 25, 50],
                    onPageSizeChange: accountPaging.setPageSize,
                  }}
                  layout='fixed'
                  tableClassName='min-w-[1040px]'
                />
              </Surface>
            </Specimen>

            <Specimen
              name='People table'
              note='Row selection, contact status and per-row actions.'
              component='<DataTable>'
              className='mb-8'
            >
              <Surface padded={false} className='overflow-hidden p-1'>
                <DataTable
                  columns={PEOPLE_COLUMNS}
                  rows={PEOPLE}
                  getRowKey={(p) => p.id!}
                  count={PEOPLE.length}
                  layout='fixed'
                  tableClassName='min-w-[860px]'
                  selection={{
                    selectedKeys: selected,
                    onToggleRow: (key, on) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (on) next.add(key)
                        else next.delete(key)
                        return next
                      }),
                    // The table hands over the keys on the current page, so
                    // this stays correct if the list is ever paged.
                    onToggleAllPage: (on, pageKeys) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        for (const key of pageKeys) {
                          if (on) next.add(key)
                          else next.delete(key)
                        }
                        return next
                      }),
                  }}
                />
              </Surface>
            </Specimen>

            <div className='grid gap-4 lg:grid-cols-2'>
              <Specimen
                name='Loading'
                note='Skeleton rows, never a false “empty”.'
                component='<DataTable loading>'
              >
                <Surface padded={false} className='flex-1 overflow-hidden p-1'>
                  <DataTable
                    columns={PEOPLE_COLUMNS.slice(0, 2)}
                    rows={[]}
                    getRowKey={(p) => p.id!}
                    loading
                    skeletonRows={4}
                    layout='fixed'
                    tableClassName='min-w-[420px]'
                  />
                </Surface>
              </Specimen>
              <Specimen
                name='Empty'
                note='Your own message and call to action.'
                component='<EmptyState>'
              >
                <Surface padded={false} className='overflow-hidden p-1'>
                  <DataTable
                    columns={PEOPLE_COLUMNS.slice(0, 2)}
                    rows={[]}
                    getRowKey={(p) => p.id!}
                    empty={
                      <EmptyState
                        icon={<Search />}
                        title='No people match'
                        description='Widen the filters, or import a list to get started.'
                        action={<Button size='sm'><Plus /> Import people</Button>}
                        className='border-0'
                      />
                    }
                    layout='fixed'
                    tableClassName='min-w-[420px]'
                  />
                </Surface>
              </Specimen>
            </div>
          </Section>

          {/* ------------------------------------------------ people */}
          <Section
            title='People'
            caption='The headline component. A person always gets a face: the real photo when it loads, otherwise one of the 50 built-in illustrated fallbacks, picked stably from the person id — never initials. The photo is read from profileImageUrl OR photoUrl, because the Trayo API returns the first and find results carry the second.'
          >
            <Specimen
              name='Person card'
              note='Photo, company, summary, tags and one footer action.'
              component='<PersonCard>'
              className='mb-8'
            >
              <div className='grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3'>
                <PersonCard
                  person={PEOPLE[0]}
                  tags={['RevOps', 'Decision maker', 'Series D']}
                  summary='Owns the revenue tooling budget. Three ops roles posted in the last fortnight — she is building the team that would run this.'
                  footer={
                    <Button size='sm'>
                      Draft outreach <ArrowRight />
                    </Button>
                  }
                />
                <PersonCard
                  person={PEOPLE[1]}
                  contacted
                  tags={['Security', 'New in role']}
                  summary='Six weeks into a new mandate. Already replied once — keep the follow-up short and concrete.'
                  footer={
                    <Button size='sm' variant='secondary'>
                      View thread
                    </Button>
                  }
                />
                <PersonCard
                  person={PEOPLE[2]}
                  tags={['CISO', 'No photo on file']}
                  summary='No photo resolved for this profile, so the built-in fallback face carries the card. It never falls back to initials.'
                  footer={
                    <Button size='sm' variant='tertiary'>
                      Enrich contact
                    </Button>
                  }
                />
              </div>
            </Specimen>

            <Specimen
              name='Person row'
              note='For lists and tables, with contact actions.'
              component='<Person>'
              className='mb-8'
            >
              <Panel className='py-1.5'>
                <div className='divide-y divide-border-subtle'>
                  {PEOPLE.slice(0, 3).map((p) => (
                    <div key={p.id} className='py-2.5'>
                      <Person person={p} showContact contacted={p.id === 'p-2'} />
                    </div>
                  ))}
                </div>
              </Panel>
            </Specimen>

            <div className='grid gap-4 md:grid-cols-2'>
              <Specimen name='Avatar sizes' note='xs to 2xl.' component='<PersonAvatar>'>
                <Panel>
                  <div className='flex items-end gap-3'>
                    {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
                      <div key={s} className='flex flex-col items-center gap-1.5'>
                        <PersonAvatar name='Dana Whitfield' personId='p-1' size={s} />
                        <span className='text-meta'>{s}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Specimen>

              <Specimen
                name='Tone avatars'
                note='For non-person identities.'
                component='<ToneAvatar>'
              >
                <Panel className='flex items-center'>
                  <div className='flex gap-2'>
                    {(['neutral', 'violet', 'teal', 'amber', 'rose', 'brand'] as const).map((t) => (
                      <ToneAvatar key={t} name='Ada Lovelace' tone={t} />
                    ))}
                  </div>
                </Panel>
              </Specimen>

              <Specimen
                name='Fallback faces'
                note='Stable per person, never initials.'
                component='<PersonAvatar>'
              >
                <Panel>
                  <div className='flex flex-wrap gap-1.5'>
                    {Array.from({ length: 26 }, (_, i) => (
                      <PersonAvatar key={i} name={`Person ${i}`} personId={`seed-${i}`} size='lg' />
                    ))}
                  </div>
                </Panel>
              </Specimen>

              <Specimen
                name='Stacked person'
                note='For grids and profile headers.'
                component="<Person variant='stacked'>"
              >
                <Panel>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <Person person={PEOPLE[3]} variant='stacked' showContact />
                    <Person person={PEOPLE[4]} variant='stacked' showContact />
                  </div>
                </Panel>
              </Specimen>
            </div>
          </Section>

          {/* ---------------------------------------------- companies */}
          <Section
            title='Companies'
            caption='Pass a domain and nothing else — the logo resolves through Trayo’s public logo proxy, with a warm initials tile for companies that have no mark.'
          >
            <Specimen
              name='Company card'
              note='Logo, firmographics, summary and one footer action.'
              component='<CompanyCard>'
              className='mb-8'
            >
              <div className='grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4'>
                {COMPANIES.map((c) => (
                  <CompanyCard
                    key={c.id}
                    company={c}
                    summary={c.description}
                    tags={c.id === 'c-1' ? ['Series D', 'Hiring RevOps'] : undefined}
                    footer={
                      <Button size='sm' variant='secondary'>
                        Research <Sparkles />
                      </Button>
                    }
                  />
                ))}
              </div>
            </Specimen>

            <div className='grid gap-4 md:grid-cols-2'>
              <Specimen
                name='Company row'
                note='With a website link and a row action.'
                component='<Company>'
              >
                <Panel className='py-1.5'>
                  <div className='divide-y divide-border-subtle'>
                    {COMPANIES.map((c) => (
                      <div key={c.id} className='py-2.5'>
                        <Company
                          company={c}
                          showWebsite
                          actions={
                            <Button size='xs' variant='tertiary'>
                              <Plus /> Track
                            </Button>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Panel>
              </Specimen>

              <Specimen
                name='Logo sizes and shapes'
                note='Square, circle, or an initials tile.'
                component='<CompanyLogo>'
              >
                <Panel>
                  <div className='flex items-end gap-3'>
                    {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
                      <div key={s} className='flex flex-col items-center gap-1.5'>
                        <CompanyLogo name='Stripe' domain='stripe.com' size={s} />
                        <span className='text-meta'>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className='mt-5 flex items-end gap-3'>
                    <div className='flex flex-col items-center gap-1.5'>
                      <CompanyLogo name='Linear' domain='linear.app' size='xl' shape='circle' />
                      <span className='text-meta'>circle</span>
                    </div>
                    <div className='flex flex-col items-center gap-1.5'>
                      <CompanyLogo name='Acme Holdings' size='xl' />
                      <span className='text-meta'>no logo</span>
                    </div>
                  </div>
                </Panel>
              </Specimen>
            </div>
          </Section>

          {!compact && (
            <>
            {/* ---------------------------------------------- controls */}
            <Section title='Buttons' caption='Pills at every size. Primary is the solid brand violet; secondary outlines it; tertiary recedes.'>
              <Specimen
                name='Button'
                note='Six variants at four sizes, plus loading, disabled and icon-only.'
                component='<Button>'
              >
                <Panel>
                  <div className='flex flex-col gap-5'>
                    {(['default', 'secondary', 'tertiary', 'destructive', 'destructive-outline', 'quiet'] as const).map(
                      (v) => (
                        <div key={v} className='flex flex-wrap items-center gap-3'>
                          <span className='w-44 shrink-0 text-meta'>{v}</span>
                          {(['xs', 'sm', 'default', 'lg'] as const).map((s) => (
                            <Button key={s} variant={v} size={s}>
                              Reach out
                            </Button>
                          ))}
                          <Button variant={v} loading>
                            Saving…
                          </Button>
                          <Button variant={v} disabled>
                            Disabled
                          </Button>
                          <Button variant={v} size='icon'>
                            <Plus />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </Panel>
              </Specimen>
            </Section>

            {/* ---------------------------------------------- feedback */}
            <Section
              title='Feedback'
              caption='One <Toaster /> inside the shell; toast() from anywhere. Stubbed actions use the preview variant so a demo never claims it sent something it did not.'
            >
              <Specimen
                name='Toast'
                note='Five variants. Hover the stack to pause auto-dismiss.'
                component='toast()'
              >
                <Panel>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        toast({
                          title: 'List saved',
                          description: '12 accounts added to Q3 targets.',
                        })
                      }
                    >
                      Default
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        toast({
                          variant: 'success',
                          title: 'Email found',
                          description: 'dana@ramp.com verified by two providers.',
                        })
                      }
                    >
                      Success
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        toast({
                          variant: 'warning',
                          title: 'Enrichment throttled',
                          description: 'Provider quota resets in 40 minutes.',
                        })
                      }
                    >
                      Warning
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        toast({
                          variant: 'destructive',
                          title: 'Export failed',
                          description: 'The CSV could not be written.',
                          action: { label: 'Retry', onClick: () => undefined },
                        })
                      }
                    >
                      Destructive
                    </Button>
                    <Button
                      onClick={() =>
                        toast({
                          variant: 'preview',
                          title: 'Push to Salesforce',
                          description: 'Would create 3 leads under the Ramp account.',
                        })
                      }
                    >
                      Preview <ArrowRight />
                    </Button>
                  </div>
                </Panel>
              </Specimen>
            </Section>

            {/* ------------------------------------------------ charts */}
            <Section
              title='Charts'
              caption='Five categorical hues in a fixed order, one sequential ramp for intensity, one neutral for out-of-scope. Labels are the 11px data-label role — the only size below Meta.'
            >
              <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
                <Specimen
                  name='Chart tokens'
                  note='Classes where you can, CHART_COLORS[i] for SVG props.'
                  component='bg-chart-1 … CHART_SEQUENTIAL'
                >
                  <Panel>
                    <div className='flex flex-col gap-4'>
                      <div>
                        <Meta as='div' className='mb-1.5'>
                          Categorical · chart-1 … chart-5
                        </Meta>
                        <div className='flex gap-1.5'>
                          {CHART_SWATCHES.map((c) => (
                            <span key={c} className={cn('h-8 flex-1 rounded-sm', c)} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Meta as='div' className='mb-1.5'>
                          Sequential · chart-seq-1 … chart-seq-5
                        </Meta>
                        <div className='flex gap-1.5'>
                          {SEQ_SWATCHES.map((c) => (
                            <span key={c} className={cn('h-8 flex-1 rounded-sm', c)} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Meta as='div' className='mb-1.5'>
                          Muted · outside ICP, not tracked, other
                        </Meta>
                        <span className='block h-8 w-1/5 rounded-sm bg-chart-muted' />
                      </div>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen
                  name='Bar chart'
                  note='Inline SVG: chartColor(i) fills, DataLabel ticks, a legend for the key.'
                  component='<DataLabel> <ChartLegend>'
                >
                  <Panel>
                    <SignalsBarChart />
                  </Panel>
                </Specimen>
              </div>
            </Section>

            {/* ------------------------------------ type, stats, states */}
            {/* Masonry columns: each stage sizes to its own content, so a
                short specimen never stretches to match a tall neighbour. */}
            <Section title='Type, stats and empty states'>
              <Specimen
                name='Stat strip'
                note='Five tiles: one column each from md up, two on a phone with the odd last tile spanning both. A hint sits beside the number.'
                component='<StatGrid> <StatTile hint>'
                className='mb-4'
              >
                <StatGrid>
                  <StatTile label='Accounts tracked' value='317' hint='283 with events' />
                  <StatTile label='At risk' value='3' delta='+1' hint='$2.6M ARR' />
                  <StatTile label='Signals this week' value='47' delta='-4%' />
                  <StatTile label='Meetings booked' value='12' delta='+3' />
                  <StatTile label='Reply rate' value='18%' delta='+2.1%' />
                </StatGrid>
              </Specimen>

              <div className='gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid'>
                <Specimen name='Type roles' note='Content roles, one per job.' component='text-page-title …'>
                  <Panel>
                    <div className='flex flex-col gap-2'>
                      <span className='text-page-title text-text-primary'>Page title · 24</span>
                      <span className='text-section text-text-primary'>Section · 18</span>
                      <span className='text-card-title text-text-primary'>Card title · 18</span>
                      <span className='text-name text-text-primary'>Entity name · 14</span>
                      <span className='text-body text-text-secondary'>Body copy · 14</span>
                      <span className='text-meta'>Meta · 12</span>
                      <Eyebrow>Eyebrow · 12 uppercase</Eyebrow>
                      <span className='text-code text-text-secondary'>text-code · 13 mono</span>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen
                  name='Segmented control'
                  note='A filter group with counts; arrow keys move the selection.'
                  component='<SegmentedControl>'
                >
                  <Panel>
                    <div className='flex flex-col items-start gap-3'>
                      <SegmentedControl
                        aria-label='Health band'
                        value={band}
                        onValueChange={setBand}
                        options={BANDS}
                      />
                      <SegmentedControl
                        aria-label='Health band, small'
                        size='sm'
                        value={band}
                        onValueChange={setBand}
                        options={BANDS}
                      />
                      <Meta>
                        Showing {BANDS.find((b) => b.value === band)?.count} accounts
                      </Meta>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen name='Form controls' note='Pill-shaped fields.' component='<Input> <Select>'>
                  <Panel>
                    <div className='flex flex-col gap-3'>
                      <Input placeholder='Search accounts…' />
                      <Select defaultValue='ciso'>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ciso'>New security leader</SelectItem>
                          <SelectItem value='funding'>Funding round</SelectItem>
                          <SelectItem value='hiring'>Hiring surge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen name='Badges' note='Status, tags and counts.' component='<Badge>'>
                  <Panel>
                    <div className='flex flex-wrap gap-1.5'>
                      <Badge variant='accent'>Accent</Badge>
                      <Badge variant='success'>Success</Badge>
                      <Badge variant='warning'>Warning</Badge>
                      <Badge variant='soft'>Soft tag</Badge>
                      <Badge variant='count'>12</Badge>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen name='Callouts' note='A note, a caveat, a result.' component='<Callout>'>
                  <Panel>
                    <div className='flex flex-col gap-2'>
                      <Callout
                        title='How this was built'
                        action={
                          <a href='#method' className='text-meta text-accent-text underline-offset-4 hover:underline'>
                            Full method
                          </a>
                        }
                      >
                        Every row came back from the Trayo API; nothing here is hand-typed.
                      </Callout>
                      <Callout tone='warning' icon={<AlertTriangle />} title='Post coverage is incomplete'>
                        Only public posts from the last 30 days were read.
                      </Callout>
                      <Callout tone='success' icon={<CheckCircle2 />} title='Target met' compact>
                        81 accounts cleared the bar.
                      </Callout>
                    </div>
                  </Panel>
                </Specimen>

                <Specimen name='Empty state' note='A line of copy and one action.' component='<EmptyState>'>
                  <Panel padded={false}>
                    <EmptyState
                      icon={<Search />}
                      title='No accounts match'
                      description='Widen the industry filter, or import a list to start tracking.'
                      action={
                        <Button size='sm'>
                          <Plus /> Import accounts
                        </Button>
                      }
                      className='border-0'
                    />
                  </Panel>
                </Specimen>

                <Specimen name='Tabs and wells' note='Switch a view; inset a detail.' component='<Tabs> <Well>'>
                  <Panel>
                    <Tabs defaultValue='people'>
                      <TabsList>
                        <TabsTrigger value='people'>
                          <Users /> People
                        </TabsTrigger>
                        <TabsTrigger value='companies'>
                          <Building2 /> Companies
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value='people'>
                        <Well className='mt-3'>
                          <Person person={PEOPLE[4]} size='md' showContact />
                        </Well>
                      </TabsContent>
                      <TabsContent value='companies'>
                        <Well className='mt-3'>
                          <Company company={COMPANIES[3]} showWebsite />
                        </Well>
                      </TabsContent>
                    </Tabs>
                  </Panel>
                </Specimen>
              </div>
            </Section>

            </>
          )}

          <footer className='flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border-subtle pt-6 text-meta'>
            <span>
              Trayo GTM UI v0.1 · light and dark from one token set · Figtree
              headings, system body
            </span>
            {libraryHref && (
              <>
                <span aria-hidden>·</span>
                <a
                  href={libraryHref}
                  // This page is embedded in an iframe on the library page;
                  // _top so the link replaces the whole window rather than
                  // loading the library page inside this frame.
                  target='_top'
                  className='text-accent-text hover:underline'
                >
                  Get the library
                </a>
              </>
            )}
          </footer>
        </PageContainer>
      </AppShell>
    </div>
  )
}
