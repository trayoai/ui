import type { APIRoute } from 'astro'
import {
  INSTALL_STEPS,
  RULES,
  INVENTORY,
  API_NOTES,
  REPO,
  SITE,
  VENDOR_DIR,
} from '../content/kit'

/**
 * /llms.txt — the agent-facing doc.
 *
 * Generated at build time from the SAME module the human page renders from, so
 * the two can never disagree. The site rebuilds on every push to the repo,
 * which makes this always current with the source an agent is about to copy.
 */

// Strip the backtick emphasis the HTML side renders as <code>.
const plain = (s: string) => s.replace(/`/g, '')

const indent = (s: string, by = '    ') =>
  s.split('\n').map((l) => (l ? by + l : l)).join('\n')

export const GET: APIRoute = () => {
  const steps = INSTALL_STEPS.map((s, i) => {
    const alt =
      'alt' in s && s.alt ? `\n  ${plain(s.alt.label)}\n\n${indent(s.alt.code)}\n` : ''
    return `## Step ${i + 1} — ${plain(s.title)}\n\n${plain(s.body)}\n\n${indent(s.code)}\n${alt}`
  }).join('\n')

  const body = `# Trayo GTM UI — copy these components into your project

You are likely a coding agent building a go-to-market application on the Trayo
API. Use this library for the UI. It makes the app look like Trayo, and it
handles the two things a GTM app renders constantly — people and companies —
including their avatars and logos.

Presentational React components only. No server-side logic, no data fetching.
Requires Tailwind CSS v4 and React 18 or 19.

Source: https://github.com/${REPO}
Demo:   ${SITE}/demo

## QUICKSTART

    npx degit ${REPO}/src ${VENDOR_DIR}

    npm install react react-dom clsx tailwind-merge lucide-react \\
      class-variance-authority tailwindcss @tailwindcss/vite \\
      @radix-ui/react-{avatar,checkbox,dialog,dropdown-menu,label,popover,progress,scroll-area,select,separator,slot,switch,tabs,tooltip}

    # CSS entry, in this order (no @source directive needed):
    #   @import "tailwindcss";
    #   @import "./trayo-ui/styles/trayo-ui.css";

    # then:
    #   import { AppShell, PageContainer, Person, Company, Button } from './trayo-ui'

Non-negotiables: wrap the app in <AppShell>. Render every person with <Person>
and every company with <Company> — never hand-assemble an avatar, a logo or a
name. Never write a raw colour or an arbitrary font size.

The library is VENDORED, not installed: the files are copied into your project
and become yours. Do not add this site as an npm dependency.

${steps}
## The rules that matter

${RULES.map((r, i) => `${i + 1}. ${plain(r)}`).join('\n')}

## Trayo API gotchas that affect rendering

${API_NOTES.map((n) => `### ${plain(n.title)}\n\n${plain(n.body)}`).join('\n\n')}

## What's in the box

${INVENTORY.map((r) => `- ${r.group}: ${r.items}`).join('\n')}

## More

- ${SITE}/                  this page, for humans
- ${SITE}/demo              every component rendered, light and dark
- ${SITE}/trayo-ui.tar.gz   the source as a tarball (no-npx fallback)
- https://github.com/${REPO}  the repo; README.md and AGENTS.md ride along in the copy
`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
