import { useEffect, useState } from 'react'
import {
  AppShell,
  Badge,
  Button,
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
          {/* The same table loading and loaded: the placeholders are the cells' size. */}
          <Case name='table-loading' width={520}>
            <DataTable columns={TABLE_COLUMNS} rows={[]} getRowKey={(p) => p.id!} loading skeletonRows={1} />
          </Case>
          <Case name='table-loaded' width={520}>
            <DataTable columns={TABLE_COLUMNS} rows={[TABLE_ROW]} getRowKey={(p) => p.id!} />
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
