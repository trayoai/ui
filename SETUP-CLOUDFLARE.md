# Deploying ui.trayo.ai (Cloudflare Pages)

One-time setup. `trayo.ai` is already a Cloudflare zone (www.trayo.ai is the
`trayo-website` Pages project), so this is a second Pages project on the same
zone and the DNS record is created for you.

## 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git** → pick **trayoai/ui**.

Set the build configuration exactly:

| Field | Value |
|---|---|
| Project name | `trayo-ui` |
| Production branch | `main` |
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| **Root directory** | `site` |

**Root directory = `site` is the one that is easy to miss.** The repo root is
the component library; the website is the `site/` subdirectory. Leave it blank
and the build fails immediately with "no package.json".

No environment variables and no secrets are needed.

Save and deploy. First build takes ~1–2 minutes and lands on
`trayo-ui.pages.dev`. Open it and confirm the page renders and `/demo` works.

## 2. Point ui.trayo.ai at it

In the new project → **Custom domains** → **Set up a custom domain** →
enter `ui.trayo.ai` → **Activate domain**.

Because `trayo.ai` is on Cloudflare, the CNAME is added for you and the
certificate issues automatically — usually under a minute, occasionally a few.

## 3. Verify

    curl -sI https://ui.trayo.ai/ | head -3
    curl -s  https://ui.trayo.ai/llms.txt | head -5
    curl -sI https://ui.trayo.ai/trayo-ui.tar.gz | head -3
    npx degit trayoai/ui/src /tmp/vendor-check && ls /tmp/vendor-check

## After that

Every push to `main` rebuilds and redeploys. That is deliberate: `/llms.txt`
and `/trayo-ui.tar.gz` are both generated at build time from the current
`src/`, so the instructions an agent reads and the code it copies are always
the same commit.

Pull requests get their own preview URL automatically.

## Notes

- **Nothing to configure for agents.** Unlike the Cloudflare *quick tunnel*
  (`*.trycloudflare.com`), a Pages site on your own domain serves no
  AI-blocking `robots.txt` and no `x-robots-tag` header, so coding agents can
  read it. Do not add a `robots.txt` that disallows them.
- If you later want the site to live somewhere other than `site/`, update the
  Root directory field — nothing in the repo hardcodes it.
