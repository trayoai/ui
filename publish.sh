#!/usr/bin/env bash
# Build and publish the public kit — ONE URL.
#
#   ./publish.sh
#
#   <host>/trayo-gtm-ui        the library: docs, vendor drop, browsable source,
#                              and the live demo embedded on the page
#   <host>/trayo-gtm-ui/demo/  the same demo full-size (what the iframe loads)
#
# Re-run this ANY time — notably if the Cloudflare quick tunnel rotates its
# hostname, since the page embeds absolute URLs in its download commands.
#
# What this serves is a VENDOR DROP, not an npm package: consumers copy
# trayo-ui.tar.gz into their own source tree. We deliberately do NOT ship an
# installable tarball, because `npm install <this-url>.tgz` records this
# temporary host in the consumer's package.json and breaks their project the
# day the tunnel dies.
#
# `./publish.sh --base <url>` builds the kit stamped for an arbitrary host and
# stops before publishing to muxpad — used to produce the GitHub Pages copy,
# which is the link we actually hand out (a mainstream domain, reachable on
# networks that filter *.ts.net as VPN/remote-access).
set -euo pipefail
cd "$(dirname "$0")"

SLUG=trayo-gtm-ui
OUT=.publish
STAGE=.stage

BASE_OVERRIDE=""
if [ "${1:-}" = "--base" ]; then
  BASE_OVERRIDE="${2:?--base needs a URL}"
fi

echo "→ typecheck"
pnpm typecheck

echo "→ build demo"
pnpm demo:build

echo "→ assemble $OUT"
rm -rf "$OUT" "$STAGE"
mkdir -p "$OUT/fonts" "$OUT/demo" "$STAGE/trayo-ui"

# The vendor drop: `tar xz -C src` lands it at src/trayo-ui/. The docs ride
# along so the house rules end up inside the consumer's repo.
cp -R src/. "$STAGE/trayo-ui/"
cp README.md AGENTS.md "$STAGE/trayo-ui/"
tar -czf "$OUT/trayo-ui.tar.gz" -C "$STAGE" trayo-ui

# The 50 illustrated fallback faces, for consumers who would rather self-host
# them than hit app.trayo.ai.
tar -czf "$OUT/placeholder-faces.tar.gz" -C assets placeholder

cp -R demo/dist/. "$OUT/demo/"              # embedded by the landing page
cp -R src "$OUT/src"                        # browsable, one file at a time
cp README.md AGENTS.md "$OUT/"
cp src/styles/fonts/*.woff2 "$OUT/fonts/"
cp public/index.html public/llms.txt public/style.css "$OUT/"

# A manifest, so an agent with no tar can walk the tree deterministically.
(cd "$OUT" && find src -type f | sort) > "$OUT/files.txt"

rm -rf "$STAGE"

# --- stamped-for-another-host build, then stop -------------------------------
if [ -n "$BASE_OVERRIDE" ]; then
  BASE="${BASE_OVERRIDE%/}"
  echo "→ stamp $BASE (no muxpad publish)"
  for f in "$OUT/index.html" "$OUT/llms.txt" "$OUT/README.md" "$OUT/AGENTS.md"; do
    sed -i '' "s|https://REPLACE_BASE|$BASE|g; s|<BASE_URL>|$BASE|g; s|REPLACE_DEMO_URL|$BASE/demo/|g" "$f"
  done
  grep -rl 'REPLACE_LIB_URL' "$OUT/demo" | while read -r f; do
    sed -i '' "s|REPLACE_LIB_URL|$BASE/|g" "$f"
  done
  # GitHub Pages would otherwise run Jekyll and drop files it considers special.
  touch "$OUT/.nojekyll"
  echo "   built in $OUT, stamped for $BASE"
  exit 0
fi

# --- publish -----------------------------------------------------------------
# First push, purely to learn the host muxpad is currently handing out.
echo "→ publish (pass 1 — discover the host)"
URL=$(muxpad publish "$OUT" --name="$SLUG" | tail -1)
CF_BASE="${URL%/}"

# PREFER TAILSCALE FUNNEL OVER THE CLOUDFLARE QUICK TUNNEL.
#
# muxpad hands out a *.trycloudflare.com URL when its tunnel app is running,
# and Cloudflare makes that URL useless to coding agents:
#   - the zone-apex robots.txt (Cloudflare's, not ours — we serve a subpath and
#     cannot override /robots.txt) carries `Disallow: /` for ClaudeBot,
#     Claude-Web and anthropic-ai, among other AI agents;
#   - every response also carries `x-robots-tag: none`.
# A well-behaved fetcher obeys both and refuses to read the page, which is
# exactly what this kit exists to be read by.
#
# The same muxpad public server is already exposed over Tailscale Funnel, which
# serves no robots.txt (404) and sets no x-robots-tag. Same bytes, same server,
# reachable by agents. So we publish through muxpad as usual but STAMP the
# Funnel base into the docs.
# PREFER PORT 443. Funnel can also sit on 8443/10000, but plenty of corporate
# and guest networks allow only 80/443 outbound, so a :8443 link works on our
# machine and fails on a participant's. `sort` puts the portless origin first
# (":" sorts after the end of the string), so a 443 Funnel always wins.
TS_BIN=/Applications/Tailscale.app/Contents/MacOS/Tailscale
FUNNEL_BASE=""
if [ -x "$TS_BIN" ]; then
  # `funnel status` lists each public origin on a commented "#  - https://..."
  # line under "# Funnel on:".
  FUNNEL_BASE=$("$TS_BIN" funnel status 2>/dev/null \
    | grep -oE 'https://[a-z0-9.-]+\.ts\.net(:[0-9]+)?' | sort -u | head -1)
fi

if [ -n "$FUNNEL_BASE" ]; then
  BASE="$FUNNEL_BASE/$SLUG"
  echo "   base: $BASE  (Tailscale Funnel — agent-readable)"
  echo "   also: $CF_BASE/  (Cloudflare tunnel — blocked for AI agents by CF robots.txt)"
else
  BASE="$CF_BASE"
  echo "   base: $BASE"
  echo "   WARNING: no Tailscale Funnel found; falling back to the Cloudflare"
  echo "            tunnel, whose robots.txt blocks ClaudeBot and friends."
fi

echo "→ stamp $BASE and re-publish"
# `|` as the sed delimiter: the replacement is a URL and contains slashes.
for f in "$OUT/index.html" "$OUT/llms.txt" "$OUT/README.md" "$OUT/AGENTS.md"; do
  sed -i '' "s|https://REPLACE_BASE|$BASE|g; s|<BASE_URL>|$BASE|g; s|REPLACE_DEMO_URL|$BASE/demo/|g" "$f"
done
# The demo's footer link back to the library is a string literal in the bundle,
# which survives minification intact.
grep -rl 'REPLACE_LIB_URL' "$OUT/demo" | while read -r f; do
  sed -i '' "s|REPLACE_LIB_URL|$BASE/|g" "$f"
done

muxpad publish --update="$SLUG" "$OUT" >/dev/null

# The demo used to live on its own slug; it is embedded now, so retire it
# rather than leaving a stale copy to drift.
muxpad publish --rm "$SLUG-demo" >/dev/null 2>&1 || true

echo
echo "Published: $BASE/"
echo "  agent:   $BASE/llms.txt"
echo "  vendor:  $BASE/trayo-ui.tar.gz"
echo "  demo:    $BASE/demo/  (embedded on the page)"
echo
echo "Hand out the URL above. The Cloudflare mirror at $CF_BASE/ serves the"
echo "same bytes but Cloudflare's robots.txt blocks AI agents from reading it."
