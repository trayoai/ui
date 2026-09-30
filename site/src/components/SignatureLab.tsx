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
  cn,
  type Column,
  type CompanyLike,
  type PersonLike
} from '../../../src'
import { BRAND_OPTIONS, ThemeSwitch, useDemoBrand, type DemoBrand } from './Showcase'

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
    tell: 'Pill buttons, pill nav links, the 8/10/12/16 radius ramp, dashed frames around empty states.'
  },
  {
    key: 'type',
    label: 'Type voice',
    tell: 'Figtree headings, uppercase eyebrow labels, the Meta small print rhythm.'
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
      <Button variant='secondary' size='sm'>
        Research <Sparkles />
      </Button>
    ),
    align: 'right',
    className: 'w-32'
  }
]

/* ------------------------------------------------------------- url state */

function readUrl(): { brand: DemoBrand; dark: boolean; off: SignatureKey[] } {
  const q = new URLSearchParams(window.location.search)
  const brand = BRAND_OPTIONS.some((b) => b.value === q.get('brand')) ? (q.get('brand') as DemoBrand) : 'slack'
  const off = (q.get('off') ?? '')
    .split(',')
    .filter((k): k is SignatureKey => SIGNATURES.some((s) => s.key === k))
  return { brand, dark: q.get('dark') === '1', off }
}

function writeUrl(brand: DemoBrand, dark: boolean, sig: Record<SignatureKey, boolean>) {
  const q = new URLSearchParams()
  q.set('brand', brand)
  if (dark) q.set('dark', '1')
  const off = SIGNATURES.filter((s) => !sig[s.key]).map((s) => s.key)
  if (off.length) q.set('off', off.join(','))
  window.history.replaceState(null, '', `?${q.toString()}`)
}

/* ------------------------------------------------------------------ page */

export function SignatureLab() {
  const [brand, setBrand] = useState<DemoBrand>('slack')
  const [dark, setDark] = useState(false)
  const [sig, setSig] = useState<Record<SignatureKey, boolean>>(ALL_ON)
  const [ready, setReady] = useState(false)
  useDemoBrand(brand, true)

  useEffect(() => {
    const { brand, dark, off } = readUrl()
    setBrand(brand)
    setDark(dark)
    setSig({ ...ALL_ON, ...Object.fromEntries(off.map((k) => [k, false])) })
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) writeUrl(brand, dark, sig)
  }, [ready, brand, dark, sig])

  const toggle = (key: SignatureKey) => (on: boolean) => setSig((s) => ({ ...s, [key]: on }))
  const dataAttrs = Object.fromEntries(SIGNATURES.map((s) => [`data-sig-${s.key}`, sig[s.key] ? 'on' : 'off']))

  return (
    <div className={dark ? 'dark' : undefined}>
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
            <SegmentedControl size='sm' aria-label='Customer brand' value={brand} onValueChange={setBrand} options={BRAND_OPTIONS} />
            <ThemeSwitch dark={dark} onChange={setDark} />
          </div>
        }
      >
        <PageContainer width='wide' className='flex flex-col gap-8'>
          {/* The lab's own controls: outside the experiment, so they keep the
              kit's pills whatever the toggles do. */}
          <Surface data-sig-controls='' className='flex flex-col gap-4 p-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <div className='text-card-title text-text-primary'>Signature lab</div>
                <p className='text-body max-w-2xl text-text-secondary'>
                  The customer's colours are on every surface below. Each toggle is one candidate for what still says
                  Trayo. Turn them off one at a time, or all at once, and compare. The URL carries the state.
                </p>
              </div>
              <div className='flex gap-2'>
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
          {sig.mesh && (
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
                <Button variant='secondary'>
                  <Upload /> Import
                </Button>
                <Button>
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
                  <Button size='sm'>Reach out</Button>
                  <Button size='sm' variant='tertiary'>
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
              action={<Button variant='secondary'>View sequence</Button>}
            />
            <Callout tone='note' title='How this was built'>
              Accounts come from <code>GET /v1/accounts</code>, ranked by fit; signals from <code>/v1/find</code>. Rows are
              refreshed nightly.
            </Callout>
          </section>

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
