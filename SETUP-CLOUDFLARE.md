# Deploying ui.trayo.ai

The repo is configured to build correctly **from the repository root**, which is
what Cloudflare's "import a repository" flow uses. You should not need to set a
root directory or a custom output directory.

## Build settings

| Field | Value |
|---|---|
| Build command | `pnpm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | *(leave empty — the repo root)* |

Everything else is read from `wrangler.jsonc`, which is committed:
the Worker name (`ui`) and the assets directory (`site/dist`).

No environment variables and no secrets are needed.

## Why it's wired this way

The repository root is the **component library**. The website is the `site/`
workspace. Two things make a root-level build work:

- **`pnpm-workspace.yaml` lists `site`.** Cloudflare runs
  `pnpm install --frozen-lockfile` at the root; without the workspace entry the
  site's dependencies are never installed and the build fails with
  `astro: not found`.
- **`wrangler.jsonc` points `assets.directory` at `site/dist`.** Left to
  auto-detect, Wrangler assumed the root was a Vite app, looked for `./dist`,
  and proposed SPA fallback routing — none of which is right here.

`pnpm run build` → `pnpm --filter trayo-ui-site build` → packs the vendor
tarball, then `astro build`.

> The site's `build` script calls `scripts/pack.sh` explicitly rather than
> relying on a `prebuild` hook: pnpm does not run pre/post scripts by default,
> so a `prebuild` would silently stop packing the tarball.

## Point ui.trayo.ai at it

In the project → **Settings** → **Domains & Routes** → add `ui.trayo.ai`.
`trayo.ai` is already a Cloudflare zone, so the DNS record and certificate are
created for you.

## Verify

```bash
curl -sI https://ui.trayo.ai/ | head -3
curl -s  https://ui.trayo.ai/llms.txt | head -5
curl -sI https://ui.trayo.ai/trayo-ui.tar.gz | head -3
npx degit trayoai/ui/src /tmp/vendor-check && ls /tmp/vendor-check
```

## After that

Every push to `main` rebuilds and redeploys. That is deliberate: `/llms.txt` and
`/trayo-ui.tar.gz` are both generated at build time from the current `src/`, so
the instructions an agent reads and the code it copies are always the same
commit.

## Notes

- **Nothing to configure for agents.** Unlike a Cloudflare *quick tunnel*
  (`*.trycloudflare.com`), a site on your own domain serves no AI-blocking
  `robots.txt` and no `x-robots-tag` header, so coding agents can read it. Do
  not add a `robots.txt` that disallows them.
- To reproduce a build exactly as CI does:
  `rm -rf node_modules site/node_modules && pnpm install --frozen-lockfile && pnpm run build`
