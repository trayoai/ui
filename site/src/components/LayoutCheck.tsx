import { useEffect, useState } from 'react'
import {
  AppShell,
  Badge,
  Button,
  Callout,
  CompanyCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EntityList,
  Input,
  JobMove,
  Meta,
  PageContainer,
  Person,
  PersonBanner,
  PersonCard,
  PersonDialog,
  Surface,
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
          <Case name='person-card-full-width-footer' width={320}>
            <PersonCard
              person={DANA}
              footer={
                <Button size='sm' variant='secondary' className='w-full'>
                  Draft intro
                </Button>
              }
            />
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
          <Case name='company-card-full-width-footer' width={320}>
            <CompanyCard
              company={RAMP}
              footer={
                <Button size='sm' variant='secondary' className='w-full'>
                  Research
                </Button>
              }
            />
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
