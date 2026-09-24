import { useState } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  AppShell,
  Badge,
  Body,
  Button,
  Company,
  CompanyCard,
  CompanyLogo,
  DataTable,
  EmptyState,
  Eyebrow,
  GradientText,
  Input,
  PageContainer,
  PageHeader,
  Person,
  PersonAvatar,
  PersonCard,
  SectionLabel,
  SectionTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatTile,
  Surface,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToneAvatar,
  Well,
  type Column,
  type CompanyLike,
  type PersonLike,
} from '../../src'

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
    linkedinUsername: 'danawhitfield',
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
    linkedinUsername: 'moyelaran',
    profileImageUrl: 'https://i.pravatar.cc/240?img=12',
  },
  {
    id: 'p-3',
    name: 'Priya Raghunathan',
    title: 'Chief Information Security Officer',
    company: 'Notion',
    companyDomain: 'notion.so',
    location: 'San Francisco, CA',
    linkedinUsername: 'praghunathan',
    // A LinkedIn CDN URL that refuses to load cross-origin — the built-in
    // fallback face takes over silently. This is the common real-world case.
    profileImageUrl: 'https://media.licdn.com/dms/image/v2/expired-profile.jpg',
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
    id: 'p-5',
    name: 'Amara Osei',
    title: 'Senior Manager, Sales Development',
    company: 'Stripe',
    companyDomain: 'stripe.com',
    location: 'London, UK',
    email: 'amara@stripe.com',
    phone: '+44 20 7555 0198',
    linkedinUsername: 'amaraosei',
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
 * Where the library itself (docs + source download) is published.
 *
 * `publish.sh` rewrites this literal in the built bundle once it knows the live
 * tunnel host, so the demo always links back to its sibling URL. Left as the
 * raw token in a local `pnpm demo`, where the link is just disabled.
 */
const LIBRARY_URL = 'REPLACE_LIB_URL'
const libraryHref = LIBRARY_URL.startsWith('http') ? LIBRARY_URL : null

export function Showcase() {
  const [dark, setDark] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(['p-2']))

  return (
    <div className={dark ? 'dark' : undefined}>
      <AppShell>
        <PageContainer width='wide'>
          <PageHeader
            title={
              <>
                Trayo <GradientText>GTM UI</GradientText>
              </>
            }
            subtitle='v0.1 — the component kit for apps built on the Trayo API'
            actions={
              <>
                {libraryHref && (
                  <Button variant='secondary' size='sm' asChild>
                    <a href={libraryHref}>
                      Get the library <ArrowRight />
                    </a>
                  </Button>
                )}
                <label className='flex cursor-pointer items-center gap-2 text-meta'>
                  Dark
                  <Switch checked={dark} onCheckedChange={setDark} />
                </label>
              </>
            }
          />

          {/* ------------------------------------------------ people */}
          <Section
            title='People'
            caption='The headline component. A person always gets a face: the real photo when it loads, otherwise one of the 50 built-in illustrated fallbacks, picked stably from the person id — never initials.'
          >
            <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
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

            <Surface className='mb-6'>
              <SectionLabel>Row variant — for lists and tables</SectionLabel>
              <div className='divide-y divide-border-subtle'>
                {PEOPLE.slice(0, 3).map((p) => (
                  <div key={p.id} className='py-2.5'>
                    <Person
                      person={p}
                      showContact
                      contacted={p.id === 'p-2'}
                    />
                  </div>
                ))}
              </div>
            </Surface>

            <div className='grid gap-4 md:grid-cols-2'>
              <Surface>
                <SectionLabel>Avatar sizes</SectionLabel>
                <div className='flex items-end gap-3'>
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
                    <div key={s} className='flex flex-col items-center gap-1.5'>
                      <PersonAvatar name='Dana Whitfield' personId='p-1' size={s} />
                      <span className='text-meta'>{s}</span>
                    </div>
                  ))}
                </div>
                <div className='mt-5'>
                  <SectionLabel>Fallback faces are stable per person</SectionLabel>
                  <div className='flex flex-wrap gap-1.5'>
                    {Array.from({ length: 16 }, (_, i) => (
                      <PersonAvatar key={i} name={`Person ${i}`} personId={`seed-${i}`} size='lg' />
                    ))}
                  </div>
                </div>
              </Surface>

              <Surface>
                <SectionLabel>Stacked variant</SectionLabel>
                <div className='grid grid-cols-2 gap-6 pt-2'>
                  <Person person={PEOPLE[3]} variant='stacked' showContact />
                  <Person person={PEOPLE[4]} variant='stacked' showContact />
                </div>
                <div className='mt-6'>
                  <SectionLabel>Tone avatars — for non-person identities</SectionLabel>
                  <div className='flex gap-2'>
                    {(['neutral', 'violet', 'teal', 'amber', 'rose', 'brand'] as const).map((t) => (
                      <ToneAvatar key={t} name='Ada Lovelace' tone={t} />
                    ))}
                  </div>
                </div>
              </Surface>
            </div>
          </Section>

          {/* ---------------------------------------------- companies */}
          <Section
            title='Companies'
            caption='Pass a domain and nothing else — the logo resolves through Trayo’s public logo proxy, with a warm initials tile for companies that have no mark.'
          >
            <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
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

            <div className='grid gap-4 md:grid-cols-2'>
              <Surface>
                <SectionLabel>Row variant</SectionLabel>
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
              </Surface>
              <Surface>
                <SectionLabel>Logo sizes and shapes</SectionLabel>
                <div className='flex items-end gap-3'>
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
                    <div key={s} className='flex flex-col items-center gap-1.5'>
                      <CompanyLogo name='Stripe' domain='stripe.com' size={s} />
                      <span className='text-meta'>{s}</span>
                    </div>
                  ))}
                </div>
                <div className='mt-5 flex items-center gap-3'>
                  <CompanyLogo name='Linear' domain='linear.app' size='xl' shape='circle' />
                  <CompanyLogo name='Acme Holdings' size='xl' />
                  <span className='text-meta'>
                    circle shape · and a company with no resolvable logo
                  </span>
                </div>
              </Surface>
            </div>
          </Section>

          {/* -------------------------------------------------- table */}
          <Section
            title='Tables'
            caption='DataTable is presentational: you own sorting, paging and selection state. Put a Person or Company in the identity column and the table reads as Trayo.'
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
                  onToggleAllPage: (on: boolean) =>
                    setSelected(on ? new Set(PEOPLE.map((p) => p.id!)) : new Set()),
                }}
              />
            </Surface>
          </Section>

          {/* ---------------------------------------------- controls */}
          <Section title='Buttons' caption='Pills at every size. Primary is the solid brand violet; secondary outlines it; tertiary recedes.'>
            <Surface>
              <div className='flex flex-col gap-5'>
                {(['default', 'secondary', 'tertiary', 'destructive', 'destructive-outline', 'quiet'] as const).map(
                  (v) => (
                    <div key={v} className='flex flex-wrap items-center gap-3'>
                      <span className='w-44 shrink-0 text-meta'>{v}</span>
                      {(['xs', 'sm', 'default', 'lg'] as const).map((s) => (
                        <Button key={s} variant={v} size={s}>
                          {s === 'default' ? 'Reach out' : 'Reach out'}
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
            </Surface>
          </Section>

          <Section title='Type, stats and empty states'>
            <div className='grid gap-4 lg:grid-cols-3'>
              <Surface>
                <SectionLabel>Type roles</SectionLabel>
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
              </Surface>

              <div className='flex flex-col gap-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <StatTile label='Accounts tracked' value='1,284' delta='+12%' />
                  <StatTile label='Signals this week' value='47' delta='-4%' />
                </div>
                <Surface>
                  <SectionLabel>Form controls</SectionLabel>
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
                    <div className='flex flex-wrap gap-1.5'>
                      <Badge variant='accent'>Accent</Badge>
                      <Badge variant='success'>Success</Badge>
                      <Badge variant='warning'>Warning</Badge>
                      <Badge variant='soft'>Soft tag</Badge>
                      <Badge variant='count'>12</Badge>
                    </div>
                  </div>
                </Surface>
              </div>

              <div className='flex flex-col gap-4'>
                <EmptyState
                  icon={<Search />}
                  title='No accounts match'
                  description='Widen the industry filter, or import a list to start tracking.'
                  action={
                    <Button size='sm'>
                      <Plus /> Import accounts
                    </Button>
                  }
                />
                <Surface>
                  <SectionLabel>Tabs and wells</SectionLabel>
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
                </Surface>
              </div>
            </div>
          </Section>

          <footer className='flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border-subtle pt-6 text-meta'>
            <span>
              Trayo GTM UI v0.1 · light and dark from one token set · Polymath
              headings, system body
            </span>
            {libraryHref && (
              <>
                <span aria-hidden>·</span>
                <a href={libraryHref} className='text-accent-text hover:underline'>
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
