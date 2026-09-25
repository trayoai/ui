#!/usr/bin/env bash
# Install the kit into a brand-new app exactly as README.md tells people to,
# then typecheck and build that app.
#
# The install command is read out of README.md itself, so a dependency the
# components import but the README forgets fails here. Run it locally with
# `pnpm check:consumer`; CI runs it on every pull request.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$(mktemp -d)"
trap 'rm -rf "$APP"' EXIT
echo "consumer app: $APP"
cd "$APP"

# 1. "Drop in the source" — what `npx degit trayoai/ui/src src/trayo-ui` does,
#    taken from this checkout so the pull request's own code is what gets tested.
mkdir -p src
cp -R "$ROOT/src" src/trayo-ui

# 2. "Install the real dependencies" — the README's own command, verbatim.
INSTALL_CMD="$(python3 - "$ROOT/README.md" <<'PY'
import re, sys
readme = open(sys.argv[1]).read()
section = readme.split('### 2. Install the real dependencies', 1)[1]
block = re.search(r'```bash\n(.*?)```', section, re.S).group(1)
print(block.replace('\\\n', ' ').strip())
PY
)"
case "$INSTALL_CMD" in
  "npm install "*) ;;
  *) echo "README install step is not an npm install command: $INSTALL_CMD" >&2; exit 1 ;;
esac
echo "README install: $INSTALL_CMD"

# The list must match what src/ actually imports, in both directions. npm may
# hoist a forgotten package in as someone else's dependency and let the build
# pass by luck, so compare the lists directly instead of relying on the build.
python3 - "$ROOT/src" "$INSTALL_CMD" <<'PY'
import os, re, sys
src, cmd = sys.argv[1], sys.argv[2]
# Packages the app itself needs even though no file under src/ imports them.
APP_LEVEL = {'react-dom', 'tailwindcss', '@tailwindcss/vite'}

def base(spec):
    if spec.startswith('@'):
        scope, rest = spec.split('/', 1)
        return scope + '/' + re.split(r'[/@]', rest)[0]
    return re.split(r'[/@]', spec)[0]

listed = {base(p) for p in cmd.split()[2:]}
imported = set()
for d, _, files in os.walk(src):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            text = open(os.path.join(d, f)).read()
            for spec in re.findall(r'''from\s+['"]([^'".][^'"]*)['"]''', text):
                imported.add(base(spec))

missing = sorted(imported - listed)
unused = sorted(listed - imported - APP_LEVEL)
if missing:
    print('README install step is missing packages src/ imports:', ' '.join(missing), file=sys.stderr)
if unused:
    print('README install step lists packages nothing in src/ imports:', ' '.join(unused), file=sys.stderr)
if missing or unused:
    sys.exit(1)
print(f'install list matches src/ imports ({len(imported)} packages)')
PY
npm init -y >/dev/null
npm pkg set type=module
$INSTALL_CMD --no-audit --no-fund --loglevel=error
# The app's own tooling, which the README assumes a Vite + TypeScript app has.
npm install --save-dev --no-audit --no-fund --loglevel=error \
  vite @vitejs/plugin-react typescript @types/react@^19 @types/react-dom@^19

# 3. "Wire up the CSS" — Tailwind first, then the kit's one stylesheet.
cat > src/index.css <<'CSS'
@import 'tailwindcss';
@import './trayo-ui/styles/trayo-ui.css';
CSS

cat > src/vite-env.d.ts <<'TS'
/// <reference types="vite/client" />
TS

# An app that touches every family of export: entities, the table, surfaces,
# type roles, primitives (incl. an asChild trigger on Button) and config.
cat > src/main.tsx <<'TSX'
import './index.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AppShell, PageContainer, PageHeader, EmptyState, StatTile, Surface,
  Person, PersonCard, Company, CompanyCard, CompanyLogo, PersonAvatar,
  DataTable, Badge, Button, Input, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Dialog, DialogContent, DialogTitle, DialogTrigger,
  PageTitle, Meta, TrayoUIProvider, cn,
  type Column, type CompanyLike, type PersonLike, type SortState,
} from './trayo-ui'

type Row = { id: string; company: CompanyLike; owner: PersonLike; stage: string }

const rows: Row[] = [
  {
    id: 'a1',
    company: { name: 'Ramp', domain: 'ramp.com', industry: 'Fintech' },
    owner: { id: 'p1', name: 'Dana Whitfield', title: 'VP RevOps' },
    stage: 'Open',
  },
]

const columns: Column<Row>[] = [
  { id: 'account', header: 'Account', accessor: (r) => <Company company={r.company} />, sortable: true },
  { id: 'owner', header: 'Owner', accessor: (r) => <Person person={r.owner} variant='inline' /> },
  { id: 'stage', header: 'Stage', accessor: (r) => <Badge variant='accent'>{r.stage}</Badge> },
]

function App() {
  const [sort, setSort] = useState<SortState>({ key: 'account', dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  return (
    <TrayoUIProvider>
      <TooltipProvider>
        <AppShell>
          <PageContainer>
            <PageHeader title='Accounts' actions={<Button>Import</Button>} />
            <PageTitle>Accounts</PageTitle>
            <Meta className={cn('mt-1')}>1 account</Meta>
            <Surface>
              <StatTile label='Accounts' value={rows.length} />
            </Surface>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              sort={sort}
              onSortChange={setSort}
              empty={<EmptyState title='No accounts' />}
              selection={{
                selectedKeys: selected,
                onToggleRow: (k, on) =>
                  setSelected((s) => { const n = new Set(s); if (on) n.add(k); else n.delete(k); return n }),
                onToggleAllPage: (on) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set()),
              }}
            />
            <CompanyCard company={rows[0].company} />
            <PersonCard person={rows[0].owner} />
            <CompanyLogo name='Ramp' domain='ramp.com' />
            <PersonAvatar name='Dana Whitfield' personId='p1' />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='secondary'>Hover</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip</TooltipContent>
            </Tooltip>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='tertiary'>Open</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
            <Input placeholder='Search' />
            <Select>
              <SelectTrigger><SelectValue placeholder='Stage' /></SelectTrigger>
              <SelectContent><SelectItem value='open'>Open</SelectItem></SelectContent>
            </Select>
            <Tabs defaultValue='a'>
              <TabsList><TabsTrigger value='a'>A</TabsTrigger></TabsList>
              <TabsContent value='a'>A</TabsContent>
            </Tabs>
          </PageContainer>
        </AppShell>
      </TooltipProvider>
    </TrayoUIProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
TSX

cat > index.html <<'HTML'
<!doctype html>
<html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
HTML

cat > vite.config.ts <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
TS

cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
JSON

echo "--- typecheck"
npx tsc --noEmit
echo "--- build"
npx vite build --logLevel warn

# The stylesheet must have come through: tokens, type roles and the heading font.
CSS_OUT="$(ls dist/assets/*.css)"
for needle in '--surface-card' '.text-page-title' 'Figtree'; do
  grep -qF -- "$needle" "$CSS_OUT" || { echo "built CSS is missing $needle" >&2; exit 1; }
done
ls dist/assets/*.woff2 >/dev/null 2>&1 || { echo "no heading font emitted" >&2; exit 1; }
echo "consumer check passed"
