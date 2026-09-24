/**
 * SINGLE SOURCE OF TRUTH for the install instructions.
 *
 * Both the human page (`pages/index.astro`) and the agent-facing plain-text
 * doc (`pages/llms.txt.ts`) render from this file, so the two can never drift.
 * The site rebuilds on every push to the repo, which means what an agent reads
 * is always what the current source does.
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
    body: 'Ordinary public npm packages. Requires Tailwind CSS v4 and React 18 or 19.',
    code: `npm install react react-dom clsx tailwind-merge lucide-react \\
  class-variance-authority tailwindcss @tailwindcss/vite \\
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog \\
  @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover \\
  @radix-ui/react-progress @radix-ui/react-scroll-area @radix-ui/react-select \\
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

export const RULES = [
  'Rendering a person? Use `<Person>` or `<PersonCard>`. Never hand-assemble an avatar and a name — a person always gets a face, never initials.',
  'Rendering a company? Use `<Company>` or `<CompanyCard>`. Pass `domain` and the logo resolves itself; never hand-write a logo `<img>`.',
  'Wrap the app in `<AppShell>`. Without it the page reads as generic Tailwind.',
  'Use the provided components before writing your own.',
  'No raw colours. Not `#hex`, not `bg-slate-800`. Use `bg-surface-card`, `text-text-secondary`, `border-border-subtle`, `bg-accent-brand` — they flip light/dark themselves.',
  'Content uses type roles (`text-page-title`, `text-name`, `text-body`, `text-meta`). Controls use `text-sm font-medium`. Never `text-[15px]`.',
  '`<Button loading>` — do not swap in your own spinner.',
  'Use `cn()` from the library, not bare `clsx`.',
] as const

export const INVENTORY = [
  { group: 'Entities', items: 'Person, PersonCard, Company, CompanyCard, PersonAvatar, CompanyLogo, ToneAvatar' },
  { group: 'Tables', items: 'DataTable (sortable, selectable, skeleton loading) and the raw Table primitives' },
  { group: 'Page scaffolding', items: 'AppShell, PageContainer, PageHeader, Surface, Well' },
  { group: 'Decorative', items: 'BrandMesh, GradientText' },
  { group: 'States', items: 'EmptyState, StatTile, Skeleton, Progress' },
  { group: 'Type', items: 'PageTitle, SectionTitle, CardTitle, EntityName, Body, Meta, Eyebrow, SectionLabel' },
  { group: 'Controls', items: 'Button, Input, Textarea, Select, Checkbox, Switch, Label, Tabs' },
  { group: 'Display', items: 'Badge, TagChip, Card, Separator, Tooltip, ScrollArea' },
  { group: 'Overlays', items: 'Dialog, Popover, DropdownMenu' },
] as const

/**
 * The two field-name asymmetries in the Trayo API that silently break UIs.
 * Worth stating on the page: reading only one spelling is the usual reason
 * every avatar falls back to the placeholder face.
 */
export const API_NOTES = [
  {
    title: 'A person’s photo has two names',
    body:
      '`GET /v1/people` returns `profileImageUrl`, but a `POST /v1/find` contacts result carries `photoUrl` — ' +
      'which is also the field you send when creating a person. `<Person>` reads both (plus `imageUrl` / `avatarUrl`), ' +
      'so pass the API object straight through rather than remapping it.',
  },
  {
    title: 'So does their LinkedIn',
    body:
      '`linkedinUsername` on read, `linkedinUrl` on write and in find results. Both are accepted.',
  },
  {
    title: 'Images resolve from Trayo production',
    body:
      'Company logos come from `api.trayo.ai/api/brand-image` (public, no key) and the 50 illustrated fallback faces ' +
      'from `app.trayo.ai/images/placeholder/`. A raw `media.licdn.com` photo URL refuses cross-origin hotlinks and ' +
      'will land on the fallback face — that is what the `personImageProxy` hook is for.',
  },
] as const
