import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AppShell,
  Badge,
  BreakdownTiles,
  Button,
  ColumnChart,
  CompanyLogo,
  DistributionList,
  DivergingColumns,
  EntityStack,
  Funnel,
  HeroStat,
  MethodNote,
  PostCard,
  Ring,
  ShareRing,
  ShareTicks,
  Sparkline,
  Split,
  SplitBar,
  StatBand,
  Callout,
  Company,
  CompanyCard,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EntityList,
  Fact,
  FactList,
  Input,
  JobMove,
  Meta,
  PageContainer,
  PageHeader,
  Person,
  PersonBanner,
  PersonCard,
  PersonDialog,
  StatGrid,
  StatTile,
  Surface,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type Column,
  type CompanyLike,
  type PersonLike,
} from '../../../src'

/**
 * Every case renders a slot component at a fixed width with a child that has
 * broken it in a real app. e2e/layout.spec.ts fails when any descendant of a
 * `data-layout-case` box sticks out of that box sideways.
 */

const DANA: PersonLike = {
  id: 'p-1',
  name: 'Dana Whitfield',
  title: 'Group Head of Digital Workplace and Collaboration',
  company: 'Ramp',
  companyDomain: 'ramp.com',
  email: 'dana@ramp.com',
  profileUrl: 'https://ramp.com/team/dana',
}

// No email, phone or profile: the contact row renders nothing.
const JUSTIN: PersonLike = {
  id: 'p-2',
  name: 'Justin B.',
  title: 'Head of Digital Workplace & AI',
  company: 'Delta Dental Ins.',
}

// The cells the README documents for a table: a `md` person, an inline company.
const TABLE_COLUMNS: Column<PersonLike>[] = [
  { id: 'person', header: 'Person', accessor: (p) => <Person person={p} size='md' />, skeleton: 'person' },
  {
    id: 'company',
    header: 'Company',
    accessor: (p) => <Company company={{ name: p.company!, domain: p.companyDomain }} variant='inline' />,
    skeleton: 'company',
  },
]

// A short title: a table sizes its columns to their text and scrolls sideways
// when that is wider than the box, and this case is about image sizes.
const TABLE_ROW: PersonLike = { id: 'p-4', name: 'Dana Whitfield', title: 'CIO', company: 'Ramp', companyDomain: 'ramp.com' }

// A paragraph, where a card has room for a couple of sentences.
const LONG_SUMMARY =
  'As Group Head of Digital Workplace, she leads enterprise-wide collaboration strategy, governance, ' +
  'licensing and operations, and is directly responsible for platform selection, vendor consolidation ' +
  'and the rollout of AI assistants across forty thousand seats in eleven countries this fiscal year.'

const RAMP: CompanyLike = { name: 'Ramp', domain: 'ramp.com', industry: 'Fintech' }

const MOVE = {
  from: { company: { name: 'Stripe', domain: 'stripe.com' }, title: 'VP of Product, Billing' },
  to: { company: { name: 'Ramp', domain: 'ramp.com' }, title: 'Chief Product Officer' },
}

// Names and a title far longer than either layout has room for.
const LONG_MOVE = {
  from: {
    company: { name: 'Veritas Technologies International Holdings LLC', domain: 'veritas.com' },
    title: 'Senior Director, IT Employee Productivity Services (Acting)',
  },
  to: { company: { name: 'Ramp' } },
}

function Case({
  name,
  width,
  children,
}: {
  name: string
  width: number
  children: React.ReactNode
}) {
  return (
    <section className='mb-8'>
      <Meta className='mb-2 block'>
        {name} · {width}px
      </Meta>
      <div data-layout-case={name} style={{ width }}>
        {children}
      </div>
    </section>
  )
}

export function LayoutCheck() {
  // `?dialog=<mode>` opens one dialog case; read after mount so the server
  // and client render the same markup.
  const [dialog, setDialog] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setDialog(new URLSearchParams(window.location.search).get('dialog'))
    setReady(true)
  }, [])

  return (
    <AppShell>
      <PageContainer>
        <div data-layout-ready={ready ? '' : undefined}>
          <Case name='page-header-band-stats' width={320}>
            <PageHeader
              variant='band'
              size='lead'
              eyebrow='Software Development · 501-1000 employees · San Francisco'
              title='Airtable buying committee'
              subtitle="6 people Trayo put in front of Ramp's finance pitch."
              stats={[
                { label: 'Screened', value: 18 },
                { label: 'Shortlisted', value: 6 },
                { label: 'Work emails', value: '6/6' },
                { label: 'Phones', value: '5/6' },
              ]}
              actions={<Button variant='secondary'>Account brief</Button>}
            />
          </Case>
          <Case name='page-header-card-actions' width={320}>
            <PageHeader
              variant='card'
              size='large'
              icon={<Users />}
              title='Competitor gripe radar'
              subtitle='LinkedIn posts naming a competitor and a pain, refreshed daily.'
              actions={
                <>
                  <Badge variant='success'>21 new this week</Badge>
                  <Button variant='secondary'>Last 30 days</Button>
                </>
              }
            />
          </Case>
          <Case name='hero-stat-narrow' width={320}>
            <HeroStat
              title='Gripes kept'
              description='From 264 posts read, 8 Sept to 8 Oct'
              value='1,204'
              chip={<Badge variant='warning'>10 hot</Badge>}
              reading='Firebase and MongoDB Atlas draw 14 of the 20.'
              media={
                <ColumnChart
                  items={[7, 4, 6, 3, 0, 5, 2].map((value, i) => ({ label: `${8 + i * 7} September`, value }))}
                />
              }
              figures={[
                { label: 'Posts read', value: 264, hint: '6 searches' },
                { label: 'Hot', value: 10, hint: 'vendor and a pain', share: 0.5 },
                { label: 'Named accounts', value: 16, hint: '2 with a committee', share: 0.76 },
              ]}
            />
          </Case>
          <Case name='stat-band-narrow' width={320}>
            <StatBand
              items={[
                {
                  label: 'Accounts imported from the ranked search',
                  value: '12,480',
                  hint: '0 duplicates',
                  media: (
                    <EntityStack max={3}>
                      {['ramp.com', 'stripe.com', 'notion.so', 'linear.app', 'figma.com'].map((d) => (
                        <CompanyLogo key={d} name={d} domain={d} size='xs' />
                      ))}
                    </EntityStack>
                  ),
                },
                { label: 'On the list', value: 34, icon: <Users /> },
              ]}
            />
          </Case>
          <Case name='stat-band-headed-narrow' width={320}>
            <StatBand
              headed
              items={[
                {
                  icon: <Users />,
                  label: 'Contacts per account, across every imported account',
                  value: '12,480',
                  delta: '+12%',
                  hint: 'against the previous run of the same search',
                  media: <Sparkline area values={[4, 6, 5, 9, 7, 11]} />,
                },
                { icon: <Users />, label: 'Coverage', value: '53%', media: <Ring value={0.53} /> },
              ]}
            />
          </Case>
          <Case name='breakdown-tiles-narrow' width={260}>
            <BreakdownTiles
              items={[
                { label: 'MongoDB Atlas Enterprise Advanced', value: 1204, hint: 'mostly cost and lock-in', company: { name: 'MongoDB', domain: 'mongodb.com' } },
                { label: 'Firebase', value: 7, company: { name: 'Firebase', domain: 'firebase.com' } },
              ]}
            />
          </Case>
          <Case name='funnel-narrow' width={240}>
            <Funnel
              stages={[
                { label: 'Commenters on the source post', value: 10480, hint: 'author and colleagues excluded' },
                { label: 'Passed the ICP', value: 5, hint: 'pass mark 55' },
              ]}
            />
          </Case>
          <Case name='split-bar-narrow' width={220}>
            <SplitBar
              start={{ label: 'Kept on the worklist', value: 1204, hint: 'cleared the pass mark' }}
              end={{ label: 'Dropped', value: 5, hint: 'a reason for each one' }}
            />
          </Case>
          <Case name='distribution-list-narrow' width={300}>
            <DistributionList
              items={[
                { label: 'MongoDB Atlas Enterprise Advanced', value: 1204, detail: 'mostly cost and lock-in · 4 hot', company: { name: 'MongoDB', domain: 'mongodb.com' } },
                { label: 'Others', value: 2, detail: 'Appwrite, PlanetScale', muted: true },
              ]}
            />
          </Case>
          <Case name='share-ring-narrow' width={240}>
            <ShareRing
              label='Commenters'
              value='12,480'
              segments={[
                { label: 'Strong fit with a verified work email', value: 2, hint: '20%' },
                { label: 'Dropped', value: 5, hint: '50%', muted: true },
              ]}
            />
          </Case>
          <Case name='share-ticks-narrow' width={240}>
            <ShareTicks
              segments={[
                { label: 'Buying authority', value: 35 },
                { label: 'Distributed-workforce signal', value: 25 },
                { label: 'Engagement quality', value: 15 },
              ]}
            />
          </Case>
          <Case name='diverging-columns-narrow' width={280}>
            <DivergingColumns
              upLabel='Joined a tracked account'
              downLabel='Left a tracked account'
              items={['May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((label, i) => ({
                label,
                up: 1200 + i,
                down: 800 - i,
              }))}
            />
          </Case>
          <Case name='method-note-flow-narrow' width={300}>
            <MethodNote
              icon={<Users />}
              title='How this list was built, and where each row came from'
              summary='6 LinkedIn topic searches through Trayo, narrowed to buyers complaining.'
              flow
              points={[
                { value: 300, label: 'rows returned' },
                { value: 91, label: 'name a vendor and a pain, in the same post' },
                { value: 20, label: 'kept after reading' },
              ]}
            >
              Posts written by people who work at those vendors were dropped.
            </MethodNote>
          </Case>
          <Case name='method-note-sources-narrow' width={300}>
            <MethodNote
              title='Where the competitor list came from'
              points={[
                { value: 12, label: 'Ranked roster', detail: 'Ranked by Trayo from the workspace positioning.' },
                { value: 4, label: 'From the ICP competitor terms', detail: 'The names developers actually complain about.' },
              ]}
            />
          </Case>
          <Case name='person-lead-narrow' width={300}>
            <Person person={DANA} variant='lead' showContact actions={<Button size='sm'>Contact details</Button>} />
          </Case>
          <Case name='post-card-narrow' width={320}>
            <PostCard
              author={DANA}
              published='Published 21 September 2026'
              href='https://example.com/post'
              linkLabel='Open on LinkedIn'
              note='Comments last loaded by Trayo on 23 September 2026'
              text={LONG_SUMMARY + ' ' + LONG_SUMMARY}
            />
          </Case>
          {(['solid', 'soft', 'plain'] as const).map((tone) => (
            <Case key={tone} name={`person-banner-compact-${tone}`} width={300}>
              <PersonBanner
                size='compact'
                tone={tone}
                person={DANA}
                actions={<Button size='sm'>Contact details</Button>}
              />
            </Case>
          ))}
          <Case name='split-narrow-page' width={320}>
            <Split aside={<Surface title='Aside'>One third</Surface>}>
              <Surface title='Main'>Two thirds</Surface>
            </Split>
          </Case>
          {/* `layout='fixed'`, as an app's table has: an auto-layout table grows
              to its longest cell and scrolls sideways instead of truncating. */}
          {([['few', 3], ['many', 7]] as const).map(([name, n]) => (
            <Case key={name} name={`table-${name}-rows`} width={520}>
              <Surface>
                <DataTable
                  variant='simple'
                  layout='fixed'
                  columns={[{ id: 'person', header: 'Person', accessor: (p: PersonLike) => <Person person={p} /> }]}
                  rows={Array.from({ length: n }, (_, i) => ({
                    ...DANA,
                    id: `row-${i}`,
                    // Longer than the column at any font: the row must truncate.
                    title: `${DANA.title}, Europe, Middle East and Africa`,
                  }))}
                  getRowKey={(p) => p.id!}
                />
              </Surface>
            </Case>
          ))}
          <Case name='table-few-rows-loading' width={520}>
            <Surface>
              <DataTable
                variant='simple'
                layout='fixed'
                columns={[{ id: 'person', header: 'Person', skeleton: 'person' as const, accessor: (p: PersonLike) => <Person person={p} /> }]}
                rows={[]}
                getRowKey={(p) => p.id!}
                loading
                skeletonRows={3}
              />
            </Surface>
          </Case>
          <Case name='table-few-rows-pinned-size' width={520}>
            <Surface>
              <DataTable
                variant='simple'
                layout='fixed'
                columns={[{ id: 'person', header: 'Person', accessor: (p: PersonLike) => <Person person={p} size='md' /> }]}
                rows={[DANA]}
                getRowKey={(p) => p.id!}
              />
            </Surface>
          </Case>
          <Case name='person-card-long-text' width={320}>
            <PersonCard
              person={DANA}
              summary={LONG_SUMMARY}
              tags={['VP of Infrastructure', 'Grounded', 'Microsoft Azure', 'Windows 365', 'Security']}
            />
          </Case>
          <Case name='person-card-formatted-text' width={320}>
            <PersonCard
              person={DANA}
              summary={
                <>
                  As Group Head of Digital Workplace, she leads enterprise-wide collaboration strategy, governance,
                  licensing and operations, and is directly responsible for platform selection, vendor
                  consolidation and the rollout of <strong>AI assistants across forty thousand seats</strong>.
                </>
              }
            />
          </Case>
          <Case name='person-card-short-text' width={320}>
            <PersonCard person={JUSTIN} summary='Owns the collaboration budget.' tags={['CIO']} />
          </Case>
          <Case name='company-card-long-text' width={320}>
            <CompanyCard
              company={RAMP}
              summary={LONG_SUMMARY}
              tags={['Series D', 'Fintech', 'Hiring', 'New CFO', 'Expanding']}
            />
          </Case>
          {/* The width of the band inside a default PersonDialog, and a phone. */}
          <Case name='person-banner-dialog-width' width={620}>
            <PersonBanner
              person={{ ...DANA, company: 'Prudential Financial', companyDomain: 'prudential.com' }}
              actions={<Button>Draft in Outlook</Button>}
            />
          </Case>
          <Case name='person-banner-narrow' width={340}>
            <PersonBanner
              person={{ ...DANA, company: 'Prudential Financial', companyDomain: 'prudential.com' }}
              actions={<Button>Draft in Outlook</Button>}
            />
          </Case>
          <Case name='fact-list' width={420}>
            <FactList title='Why now'>
              <Fact label='FDA Approval'>
                Moderna announced that the FDA approved supplemental licence applications for the
                2026-2027 formulas.
              </Fact>
              <Fact label='Clinical Trial Results'>
                Moderna and Merck announced positive Phase 3 results.
              </Fact>
              <Fact label='New Vaccine Approval'>The FDA approved a new seasonal vaccine.</Fact>
            </FactList>
          </Case>
          {/* Rows side by side: one must not sit lower than the other. */}
          <Case name='rows-side-by-side' width={520}>
            <div className='grid grid-cols-2 gap-4'>
              <Person person={DANA} />
              <Person person={JUSTIN} />
            </div>
          </Case>
          {/* The same table loading and loaded: the placeholders are the cells' size.
              Its cells pin their sizes, so the table pins its scale too. */}
          <Case name='table-loading' width={520}>
            <DataTable scale='default' columns={TABLE_COLUMNS} rows={[]} getRowKey={(p) => p.id!} loading skeletonRows={1} />
          </Case>
          <Case name='table-loaded' width={520}>
            <DataTable scale='default' columns={TABLE_COLUMNS} rows={[TABLE_ROW]} getRowKey={(p) => p.id!} />
          </Case>
          <Case name='person-row' width={384}>
            <Person person={DANA} />
          </Case>
          <Case name='person-card-bare-footer-button' width={320}>
            <PersonCard person={DANA} footer={<Button className='w-full'>Draft intro</Button>} />
          </Case>
          <Case name='person-card-explicit-footer-button' width={320}>
            <PersonCard
              person={DANA}
              footer={
                <>
                  <Button size='sm' variant='secondary'>
                    Skip
                  </Button>
                  <Button variant='default'>Draft intro</Button>
                </>
              }
            />
          </Case>
          <Case name='person-card-wrapped-footer-button' width={320}>
            <TooltipProvider>
              <PersonCard
                person={DANA}
                footer={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button>Draft intro</Button>
                    </TooltipTrigger>
                    <TooltipContent>Opens a draft</TooltipContent>
                  </Tooltip>
                }
              />
            </TooltipProvider>
          </Case>
          <Case name='person-card-long-footer-label' width={320}>
            <PersonCard
              person={DANA}
              footer={<Button size='sm'>Draft a warm introduction email</Button>}
            />
          </Case>
          <Case name='person-card-no-contact' width={320}>
            <PersonCard person={JUSTIN} footer={<Button size='sm'>Draft intro</Button>} />
          </Case>
          <Case name='company-card-bare-footer-button' width={320}>
            <CompanyCard company={RAMP} footer={<Button className='w-full'>Research</Button>} />
          </Case>
          <Case name='surface-header-wide-actions' width={384}>
            <Surface
              title='Matched companies'
              description='200 shown · largest employer first'
              actions={
                <div className='flex flex-wrap items-center gap-2'>
                  <Input placeholder='Filter by name or city' className='h-8 w-52' />
                  <Input placeholder='Industry' className='h-8 w-44' />
                </div>
              }
            >
              Body
            </Surface>
          </Case>
          <Case name='callout-action-narrow' width={384}>
            <Callout
              title='The where clause'
              action={<Button variant='quiet'>How this was built</Button>}
            >
              Industry in “financial services”, “banking”, “insurance” · headquarters in the United
              States.
            </Callout>
          </Case>
          <Case name='entity-list' width={420}>
            <EntityList>
              {[DANA, JUSTIN, { ...DANA, id: 'p-3', name: 'Tracy Strong' }].map((p) => (
                <Person
                  key={p.id}
                  person={p}
                  actions={<Badge variant='secondary'>Chief Information Officer</Badge>}
                />
              ))}
            </EntityList>
          </Case>
          <Case name='clickable-rows' width={720}>
            <EntityList>
              <Person person={DANA} showContact onClick={() => {}} actions={<Badge variant='secondary'>IT</Badge>} />
              <Person
                person={{ ...DANA, id: 'p-4', name: 'Tracy Strong', title: 'CIO' }}
                showContact
                onClick={() => {}}
                actions={<Badge variant='secondary'>Engineering leadership</Badge>}
              />
              <Company company={RAMP} onClick={() => {}} />
            </EntityList>
          </Case>
          <Case name='page-sections' width={720}>
            <PageContainer>
              <PageHeader title='Buying group' />
              <StatGrid>
                <StatTile label='Contacts' value='93' />
                <StatTile label='Employers' value='24' />
              </StatGrid>
              <Surface title='Contacts' description='14 matching'>
                <Person person={DANA} />
              </Surface>
              <Callout tone='note' title='Exact title matching is literal'>
                Rows that matched the string but not the seat are marked.
              </Callout>
            </PageContainer>
          </Case>
          <Case name='job-move-wide' width={560}>
            <JobMove from={LONG_MOVE.from} to={LONG_MOVE.to} />
          </Case>
          <Case name='job-move-narrow' width={360}>
            <JobMove from={LONG_MOVE.from} to={LONG_MOVE.to} />
          </Case>

          {/* What an app writes by hand: a title for screen readers, then the
              banner. The close button must not land on the band. */}
          <Dialog open={dialog === 'banner'}>
            <DialogContent aria-describedby={undefined}>
              <DialogTitle className='sr-only'>{DANA.name}</DialogTitle>
              <PersonBanner person={DANA} actions={<Button>Add to sequence</Button>} />
            </DialogContent>
          </Dialog>

          <PersonDialog
            person={DANA}
            open={dialog === 'person'}
            actions={<Button>Add to sequence</Button>}
            footer={
              <>
                <Button size='sm' variant='secondary'>
                  Push to Salesforce
                </Button>
                <Button size='sm' variant='secondary'>
                  Draft intro email
                </Button>
                <Button size='sm' variant='secondary'>
                  Post to #new-logos
                </Button>
              </>
            }
          >
            <JobMove from={MOVE.from} to={MOVE.to} />
            <Meta>Detected by Trayo on 26 Sep.</Meta>
          </PersonDialog>

          {/* A long, truncating row must not widen the dialog's other children. */}
          <Dialog open={dialog === 'long-row'}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{RAMP.name}</DialogTitle>
                <DialogDescription>
                  Everything here came back from the company record.
                </DialogDescription>
              </DialogHeader>
              <CompanyCard company={RAMP} tags={['privately held', 'Founded 2019']} />
              {/* In a plain wrapper, as an app's section of rows is: the
                  wrapper has no `min-w-0`, so the row's full text width
                  reaches the dialog's column. */}
              <div>
                <Person
                  person={{
                    ...DANA,
                    title:
                      'Chief Information Security Officer (CISO) of Ramp Business Corporation Bank (in formation)',
                  }}
                  actions={<Badge variant='secondary'>Chief Information Security Officer</Badge>}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageContainer>
    </AppShell>
  )
}
