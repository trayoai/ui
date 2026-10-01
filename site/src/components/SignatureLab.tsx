import { useEffect, useState } from 'react'
import { Inbox, Plus, Sparkles, Upload } from 'lucide-react'
import {
  AppShell,
  AppShellNavLink,
  Badge,
  BrandMesh,
  Button,
  Callout,
  Company,
  DataTable,
  EmptyState,
  GradientText,
  PageContainer,
  PageHeader,
  Person,
  SectionLabel,
  SegmentedControl,
  StatGrid,
  StatTile,
  Surface,
  Switch,
  Toaster,
  cn,
  toast,
  applyBrand,
  FILL_PRESETS,
  fromBrandThemeContract,
  resolveBrandPalette,
  type Column,
  type CompanyLike,
  type PersonLike
} from '../../../src'
import { BRAND_OPTIONS, DEMO_BRANDS, ThemeSwitch, type DemoBrand } from './Showcase'

/**
 * The signature lab.
 *
 * Ohad's question: once a customer's colours are on every surface, what still
 * says "Trayo"? Colour cannot be the answer — the brand owns it — so each
 * candidate here is shape, texture, motion, type or a recurring element, and
 * each is a toggle so any brand × any signature can be compared and
 * screenshotted. The URL carries the state (`?brand=slack&dark=1&off=mesh`).
 */

type SignatureKey = 'paper' | 'mesh' | 'pill' | 'type' | 'motion' | 'faces' | 'mark'

const SIGNATURES: { key: SignatureKey; label: string; tell: string; note?: string }[] = [
  {
    key: 'paper',
    label: 'Paper & glow',
    tell: 'The fractal-noise grain and the warm corner glow on the page canvas, even on a brand\'s white.'
  },
  {
    key: 'mesh',
    label: 'Mesh band',
    tell: 'The drifting amber→pink mesh on heroes and empty states, in Trayo\'s own colours, never re-coloured.'
  },
  {
    key: 'pill',
    label: 'Pill geometry',
    tell: 'Pill buttons, pill nav links, the 8/10/12/16 radius ramp, dashed frames around empty states.',
    note: 'DNA check — never a brand option'
  },
  {
    key: 'type',
    label: 'Type voice',
    tell: 'Figtree headings, uppercase eyebrow labels, the Meta small print rhythm.',
    note: 'DNA check — never a brand option'
  },
  {
    key: 'motion',
    label: 'Motion',
    tell: 'Mesh drift, hover lift, transitions. The one tell a screenshot cannot show — watch the band.',
    note: 'Not visible in screenshots'
  },
  {
    key: 'faces',
    label: 'Faces & tiles',
    tell: 'The illustrated placeholder faces and the hairline logo tiles — what a GTM screen is full of.'
  },
  {
    key: 'mark',
    label: 'Explicit mark',
    tell: 'A small "Built with Trayo" mark in the top bar and footer. The baseline the others should beat.'
  }
]

const ALL_ON = Object.fromEntries(SIGNATURES.map((s) => [s.key, true])) as Record<SignatureKey, boolean>

/**
 * The cover: how the top of the screen carries colour. Same components,
 * different silhouette — what a thumbnail gallery reads before anything else.
 */
type Cover = 'hero' | 'band' | 'plain'
const COVERS: { value: Cover; label: string }[] = [
  { value: 'hero', label: 'Mesh hero' },
  { value: 'band', label: 'Solid band' },
  { value: 'plain', label: 'Plain' }
]

/**
 * Looks: where the brand's colour mass goes. Ohad's point: dozens of recipes
 * must look materially different with the brand used strongly, not only via
 * light/dark. Each look composes a cover, a layout, a canvas strength and a
 * fills; the generator rotates through them the way it rotates themes.
 */
type Look = 'band' | 'rail' | 'tiles' | 'wash' | 'split'
type FillName = keyof typeof FILL_PRESETS
type Lead = 'primary' | 'secondary' | 'tertiary'
const LOOKS: Record<Look, { label: string; cover: Cover; layout: 'top' | 'rail'; canvas: 'soft' | 'vibrant'; fills: FillName; panel?: boolean }> = {
  band: { label: 'Band', cover: 'band', layout: 'top', canvas: 'soft', fills: 'none' },
  rail: { label: 'Rail', cover: 'plain', layout: 'rail', canvas: 'soft', fills: 'none' },
  tiles: { label: 'Tiles', cover: 'plain', layout: 'top', canvas: 'soft', fills: 'tiles' },
  wash: { label: 'Wash', cover: 'hero', layout: 'top', canvas: 'vibrant', fills: 'none' },
  split: { label: 'Split', cover: 'band', layout: 'top', canvas: 'soft', fills: 'cards', panel: true }
}
const LOOK_OPTIONS = (Object.keys(LOOKS) as Look[]).map((value) => ({ value, label: LOOKS[value].label }))
const FILL_OPTIONS = (Object.keys(FILL_PRESETS) as FillName[]).map((value) => ({ value, label: value }))
const LEAD_OPTIONS: { value: Lead; label: string }[] = [
  { value: 'primary', label: 'Primary-led' },
  { value: 'secondary', label: 'Secondary-led' },
  { value: 'tertiary', label: 'Tertiary-led' }
]

/** Un-brands the document (the Trayo option): what applyBrand set, removed. */
function clearBrand() {
  const root = document.documentElement
  for (const n of root.getAttributeNames()) if (n.startsWith('data-brand') || n.startsWith('data-fill-')) root.removeAttribute(n)
  document.getElementById('trayo-brand')?.remove()
}

/** The theme this brand reads best in, per the palette; light until the kit says otherwise. */
function recommendedDark(brand: DemoBrand): boolean {
  if (brand === 'trayo') return false
  const palette = resolveBrandPalette(fromBrandThemeContract(DEMO_BRANDS[brand]).input)
  return (palette as { theme?: string }).theme === 'dark'
}

/* ---------------------------------------------------------------- fixtures */

const PEOPLE: PersonLike[] = [
  { id: 'p-1', name: 'Dana Whitfield', title: 'VP of Revenue Operations' },
  { id: 'p-2', name: 'Tobias Lindqvist', title: 'Head of Sales, EMEA' },
  { id: 'p-3', name: 'Priya Raman', title: 'Director of Demand Generation' },
  { id: 'p-4', name: 'Marcus Chen', title: 'Chief Revenue Officer' }
]

const COMPANIES: CompanyLike[] = [
  { id: 'c-1', name: 'Ramp', domain: 'ramp.com', industry: 'Fintech', employeeCount: 1200, location: 'New York, NY' },
  { id: 'c-2', name: 'Vercel', domain: 'vercel.com', industry: 'Developer Tools', employeeCount: 650, location: 'San Francisco, CA' },
  { id: 'c-3', name: 'Notion', domain: 'notion.so', industry: 'Productivity', employeeCount: 800, location: 'San Francisco, CA' },
  { id: 'c-4', name: 'Linear', domain: 'linear.app', industry: 'Project Management', employeeCount: 90, location: 'Remote' },
  { id: 'c-5', name: 'Figma', domain: 'figma.com', industry: 'Design', employeeCount: 1400, location: 'San Francisco, CA' }
]

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
  { id: 'a-5', company: COMPANIES[4], owner: PEOPLE[0], score: 58, signals: 1, stage: 'Prospect', lastActivity: '2w ago' }
]

const STAGE_VARIANT = { Prospect: 'soft', Engaged: 'accent', 'Meeting booked': 'success' } as const

/** Every action on the sample screen is a stub; it says so with a preview toast. */
const preview = (title: string) => () =>
  toast({ variant: 'preview', title, description: 'Preview — nothing was sent.' })

const COLUMNS: Column<AccountRow>[] = [
  { id: 'account', header: 'Account', accessor: (r) => <Company company={r.company} size='md' />, className: 'min-w-[260px]' },
  {
    id: 'score',
    header: 'Fit',
    accessor: (r) => (
      <span className='flex items-center gap-2 tabular-nums'>
        <span className='h-1.5 w-12 overflow-hidden rounded-full bg-surface-well'>
          <span className='block h-full rounded-full bg-accent-brand' style={{ width: `${r.score}%` }} />
        </span>
        {r.score}
      </span>
    ),
    className: 'w-28'
  },
  {
    id: 'signals',
    header: 'Signals',
    accessor: (r) => <Badge variant='soft'>{r.signals}</Badge>,
    align: 'center',
    className: 'w-24'
  },
  { id: 'stage', header: 'Stage', accessor: (r) => <Badge variant={STAGE_VARIANT[r.stage]}>{r.stage}</Badge>, className: 'w-40' },
  { id: 'owner', header: 'Owner', accessor: (r) => <Person person={r.owner} size='sm' />, className: 'min-w-[200px]' },
  { id: 'activity', header: 'Last activity', accessor: (r) => <span className='text-meta'>{r.lastActivity}</span>, className: 'w-32' },
  {
    id: 'action',
    header: '',
    accessor: () => (
      <Button variant='secondary' size='sm' onClick={preview('Research account')}>
        Research <Sparkles />
      </Button>
    ),
    align: 'right',
    className: 'w-32'
  }
]

/* ------------------------------------------------------------- url state */

function readUrl(): {
  brand: DemoBrand
  dark: boolean | null
  cover: Cover | null
  look: Look
  fills: FillName | null
  lead: Lead
  off: SignatureKey[]
} {
  const q = new URLSearchParams(window.location.search)
  const brand = BRAND_OPTIONS.some((b) => b.value === q.get('brand')) ? (q.get('brand') as DemoBrand) : 'slack'
  const off = (q.get('off') ?? '')
    .split(',')
    .filter((k): k is SignatureKey => SIGNATURES.some((s) => s.key === k))
  const cover = COVERS.some((c) => c.value === q.get('cover')) ? (q.get('cover') as Cover) : null
  const look = q.get('look') && q.get('look')! in LOOKS ? (q.get('look') as Look) : 'band'
  const fills = q.get('fills') && q.get('fills')! in FILL_PRESETS ? (q.get('fills') as FillName) : null
  const lead = LEAD_OPTIONS.some((l) => l.value === q.get('lead')) ? (q.get('lead') as Lead) : 'primary'
  // No `dark` param: the brand's own recommendation decides.
  const dark = q.has('dark') ? q.get('dark') === '1' : null
  return { brand, dark, cover, look, fills, lead, off }
}

function writeUrl(
  brand: DemoBrand,
  dark: boolean,
  look: Look,
  cover: Cover,
  fills: FillName,
  lead: Lead,
  sig: Record<SignatureKey, boolean>
) {
  const q = new URLSearchParams()
  q.set('brand', brand)
  q.set('dark', dark ? '1' : '0')
  q.set('look', look)
  if (cover !== LOOKS[look].cover) q.set('cover', cover)
  if (fills !== LOOKS[look].fills) q.set('fills', fills)
  if (lead !== 'primary') q.set('lead', lead)
  const off = SIGNATURES.filter((s) => !sig[s.key]).map((s) => s.key)
  if (off.length) q.set('off', off.join(','))
  window.history.replaceState(null, '', `?${q.toString()}`)
}

/* ------------------------------------------------------------------ page */

export function SignatureLab() {
  const [brand, setBrand] = useState<DemoBrand>('slack')
  const [dark, setDark] = useState(false)
  const [sig, setSig] = useState<Record<SignatureKey, boolean>>(ALL_ON)
  const [look, setLookState] = useState<Look>('band')
  const [cover, setCover] = useState<Cover>(LOOKS.band.cover)
  const [fills, setFills] = useState<FillName>(LOOKS.band.fills)
  const [lead, setLead] = useState<Lead>('primary')
  const [ready, setReady] = useState(false)
  // A look sets its cover and fills; either can then be changed on its own.
  const setLook = (next: Look) => {
    setLookState(next)
    setCover(LOOKS[next].cover)
    setFills(LOOKS[next].fills)
  }

  // Brand the document the way an app does — one call — so the lab shows
  // exactly what applyBrand produces, fills, lead and canvas included.
  useEffect(() => {
    if (!ready) return
    if (brand === 'trayo') {
      clearBrand()
      document.documentElement.classList.toggle('dark', dark)
      return
    }
    applyBrand(document, DEMO_BRANDS[brand], { theme: dark ? 'dark' : 'light', fills, lead, canvas: LOOKS[look].canvas })
  }, [ready, brand, dark, fills, lead, look])

  useEffect(() => {
    const { brand, dark, cover, look, fills, lead, off } = readUrl()
    setBrand(brand)
    setDark(dark ?? recommendedDark(brand))
    setLookState(look)
    setCover(cover ?? LOOKS[look].cover)
    setFills(fills ?? LOOKS[look].fills)
    setLead(lead)
    setSig({ ...ALL_ON, ...Object.fromEntries(off.map((k) => [k, false])) })
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) writeUrl(brand, dark, look, cover, fills, lead, sig)
  }, [ready, brand, dark, look, cover, fills, lead, sig])
  // Switching brand follows its theme recommendation; the switch still overrides.
  const pickBrand = (next: DemoBrand) => {
    setBrand(next)
    setDark(recommendedDark(next))
  }

  const toggle = (key: SignatureKey) => (on: boolean) => setSig((s) => ({ ...s, [key]: on }))
  const dataAttrs = Object.fromEntries(SIGNATURES.map((s) => [`data-sig-${s.key}`, sig[s.key] ? 'on' : 'off']))

  const layout = LOOKS[look].layout
  const showPanel = LOOKS[look].panel === true
  return (
    <div>
      <AppShell
        {...dataAttrs}
        width='wide'
        brand={
          <>
            <span>Acme GTM</span>
            {sig.mark && <TrayoMark />}
          </>
        }
        nav={
          <>
            <AppShellNavLink active>Accounts</AppShellNavLink>
            <AppShellNavLink>People</AppShellNavLink>
            <AppShellNavLink>Signals</AppShellNavLink>
          </>
        }
        actions={
          <div data-sig-controls='' className='flex items-center gap-2'>
            <SegmentedControl size='sm' aria-label='Customer brand' value={brand} onValueChange={pickBrand} options={BRAND_OPTIONS} />
            <ThemeSwitch dark={dark} onChange={setDark} />
          </div>
        }
      >
        <Toaster />
        <PageContainer width='wide' className='flex flex-col gap-8'>
          {/* The lab's own controls: outside the experiment, so they keep the
              kit's pills whatever the toggles do. */}
          <Surface data-sig-controls='' className='flex flex-col gap-4 p-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <div className='text-card-title text-text-primary'>Signature lab</div>
                <p className='text-body max-w-2xl text-text-secondary'>
                  The customer's colours are on every surface below; nothing else changes for a brand. Each toggle removes
                  one Trayo tell so its contribution can be judged — the type and pill toggles are DNA checks, not options.
                  Looks, fills and lead vary where the colour goes. The URL carries the state.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <SegmentedControl size='sm' aria-label='Look' value={look} onValueChange={setLook} options={LOOK_OPTIONS} />
                <SegmentedControl size='sm' aria-label='Cover' value={cover} onValueChange={setCover} options={COVERS} />
                <SegmentedControl size='sm' aria-label='Fills' value={fills} onValueChange={setFills} options={FILL_OPTIONS} />
                <SegmentedControl size='sm' aria-label='Lead' value={lead} onValueChange={setLead} options={LEAD_OPTIONS} />
                <Button variant='tertiary' size='sm' onClick={() => setSig(ALL_ON)}>
                  All on
                </Button>
                <Button
                  variant='tertiary'
                  size='sm'
                  onClick={() => setSig(Object.fromEntries(SIGNATURES.map((s) => [s.key, false])) as typeof ALL_ON)}
                >
                  All off
                </Button>
              </div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {SIGNATURES.map((s) => (
                <label
                  key={s.key}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-[var(--radius)] border border-border-subtle p-3 transition-colors',
                    sig[s.key] ? 'bg-accent-soft/40' : 'bg-surface-well'
                  )}
                >
                  <Switch checked={sig[s.key]} onCheckedChange={toggle(s.key)} aria-label={s.label} className='mt-0.5' />
                  <span className='flex flex-col gap-0.5'>
                    <span className='text-sm font-medium text-text-primary'>
                      {s.label}
                      {s.note && <span className='text-meta ml-2 font-normal'>{s.note}</span>}
                    </span>
                    <span className='text-meta'>{s.tell}</span>
                  </span>
                </label>
              ))}
            </div>
          </Surface>

          {/* ---- the experiment: a typical GTM screen under the brand ---- */}
          <div className={cn('flex gap-6', layout === 'rail' ? 'items-start' : 'flex-col')}>
          {layout === 'rail' && (
            <aside
              data-shell-region=''
              className='sticky top-20 flex w-56 shrink-0 flex-col gap-1 self-start rounded-[var(--radius)] bg-surface-sidebar p-3 text-text-primary'
            >
              <div className='mb-2 px-2 text-name'>Acme GTM</div>
              {['Accounts', 'People', 'Signals', 'Sequences', 'Reports'].map((item, i) => (
                <a
                  key={item}
                  href='#'
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium',
                    i === 0 ? 'bg-accent-soft text-accent-text' : 'text-text-secondary hover:bg-surface-well'
                  )}
                >
                  {item}
                </a>
              ))}
            </aside>
          )}
          <div className='flex min-w-0 flex-1 flex-col gap-8'>
          {cover === 'band' && (
            <section className='rounded-[calc(var(--radius)+4px)] bg-accent-brand px-8 py-12 text-accent-brand-foreground'>
              <div className='flex flex-col gap-2'>
                <span className='text-eyebrow opacity-80' style={{ color: 'inherit' }}>
                  This week
                </span>
                <h1 className='text-page-title' style={{ color: 'inherit' }}>
                  14 accounts moved — 3 booked meetings
                </h1>
                <p className='text-body max-w-xl opacity-85' style={{ color: 'inherit' }}>
                  Signals from job changes, funding and hiring, ranked by fit. Reach out while it is warm.
                </p>
              </div>
            </section>
          )}
          {cover === 'hero' && sig.mesh && (
            <BrandMesh
              className='rounded-[calc(var(--radius)+4px)] px-8 py-12'
              // Pinned to Trayo's own mesh colours: this band is the one place
              // the brand's palette is deliberately not applied.
              style={{ '--mesh-cool-rgb': '132 92 255', '--mesh-cool-2-rgb': '205 129 255' } as React.CSSProperties}
            >
              <div className='relative flex flex-col gap-2'>
                <span className='text-eyebrow'>This week</span>
                <h1 className='text-page-title text-text-primary'>
                  14 accounts <GradientText>moved</GradientText> — 3 booked meetings
                </h1>
                <p className='text-body max-w-xl text-text-secondary'>
                  Signals from job changes, funding and hiring, ranked by fit. Reach out while it is warm.
                </p>
              </div>
            </BrandMesh>
          )}

          <PageHeader
            title='Accounts'
            subtitle='62 accounts in your ICP, sorted by fit score.'
            actions={
              <>
                <Button variant='secondary' onClick={preview('Import accounts')}>
                  <Upload /> Import
                </Button>
                <Button onClick={preview('Add accounts')}>
                  <Plus /> Add accounts
                </Button>
              </>
            }
          />

          <StatGrid columns={4}>
            <StatTile label='Accounts' value='62' delta='+8' hint='in ICP' />
            <StatTile label='Signals this week' value='23' delta='+12%' />
            <StatTile label='Meetings booked' value='3' hint='from 9 replies' />
            <StatTile label='Coverage' value='71%' delta='-2%' hint='with a champion' />
          </StatGrid>

          <section className='flex flex-col gap-2'>
            <SectionLabel>Account table</SectionLabel>
            <DataTable columns={COLUMNS} rows={ACCOUNTS} getRowKey={(r) => r.id} />
          </section>

          <section className='grid gap-4 md:grid-cols-3'>
            {PEOPLE.slice(0, 3).map((p, i) => (
              <Surface key={p.id} className='flex flex-col gap-3 p-4'>
                <Person person={{ ...p, company: COMPANIES[i].name }} size='lg' showContact />
                <div className='flex gap-2'>
                  <Button size='sm' onClick={preview(`Reach out to ${p.name}`)}>
                    Reach out
                  </Button>
                  <Button size='sm' variant='tertiary' onClick={preview(`Snoozed ${p.name}`)}>
                    Not now
                  </Button>
                </div>
              </Surface>
            ))}
          </section>

          <section className='grid gap-4 md:grid-cols-2'>
            <EmptyState
              icon={<Inbox />}
              title='No replies yet'
              description='Outreach went to 9 people this morning. Replies land here as they come in.'
              action={
                <Button variant='secondary' onClick={preview('View sequence')}>
                  View sequence
                </Button>
              }
            />
            <Callout tone='note' title='How this was built'>
              Accounts come from <code>GET /v1/accounts</code>, ranked by fit; signals from <code>/v1/find</code>. Rows are
              refreshed nightly.
            </Callout>
          </section>

          {showPanel && (
            <aside className='rounded-[var(--radius)] bg-container-tertiary p-5 text-container-tertiary-foreground'>
              <div className='text-eyebrow' style={{ color: 'inherit' }}>Signals this week</div>
              <ul className='mt-2 grid gap-2 md:grid-cols-3'>
                {['Ramp opened a Berlin office', 'Vercel hired a VP Sales', 'Notion raised a Series D'].map((s) => (
                  <li key={s} className='rounded-lg bg-container px-3 py-2 text-sm text-container-foreground'>
                    {s}
                  </li>
                ))}
              </ul>
            </aside>
          )}
          </div>
          </div>

          <footer className='flex items-center justify-between border-t border-border-subtle pt-4 text-meta'>
            <span>Acme GTM · internal</span>
            {sig.mark && (
              <span className='flex items-center gap-1.5'>
                Built with <TrayoMark />
              </span>
            )}
          </footer>
        </PageContainer>
      </AppShell>
    </div>
  )
}

/** The explicit mark: a small wordmark that takes no brand colour. */
function TrayoMark() {
  return (
    <span
      data-sig-controls=''
      className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-card px-2 py-0.5 text-xs font-semibold text-text-primary'
    >
      <span aria-hidden className='size-2 rounded-full' style={{ background: 'var(--gradient-cta)' }} />
      Trayo
    </span>
  )
}
