#!/usr/bin/env bash
# Build and publish the two public URLs.
#
#   ./publish.sh
#
#   <host>/trayo-gtm-ui       the LIBRARY — docs, source download, browsable src
#   <host>/trayo-gtm-ui-demo  the DEMO    — the showcase page, on its own URL
#
# They cross-link, so each stamps the other's URL at publish time.
#
# Re-run this ANY time — notably if the Cloudflare quick tunnel rotates its
# hostname, since both pages embed absolute URLs. One run re-stamps everything.
#
# What the library URL serves is a VENDOR DROP, not an npm package: consumers
# copy trayo-ui.tar.gz into their own source tree. We deliberately do NOT ship
# an installable tarball, because `npm install <this-url>.tgz` records this
# temporary host in the consumer's package.json and breaks their project the
# day the tunnel dies.
set -euo pipefail
cd "$(dirname "$0")"

LIB_SLUG=trayo-gtm-ui
DEMO_SLUG=trayo-gtm-ui-demo
OUT=.publish
DEMO_OUT=.publish-demo
STAGE=.stage

echo "→ typecheck"
pnpm typecheck

echo "→ build showcase"
pnpm demo:build

echo "→ assemble $OUT (library) and $DEMO_OUT (demo)"
rm -rf "$OUT" "$DEMO_OUT" "$STAGE"
mkdir -p "$OUT/fonts" "$STAGE/trayo-ui"

# --- the demo is its own artifact, nothing but the built showcase ------------
cp -R demo/dist "$DEMO_OUT"

# --- the library kit ---------------------------------------------------------
# The vendor drop: `tar xz -C src` lands it at src/trayo-ui/. The docs ride
# along so the house rules end up inside the consumer's repo.
cp -R src/. "$STAGE/trayo-ui/"
cp README.md AGENTS.md "$STAGE/trayo-ui/"
tar -czf "$OUT/trayo-ui.tar.gz" -C "$STAGE" trayo-ui

# The 50 illustrated fallback faces, for consumers who would rather self-host
# them than hit app.trayo.ai.
tar -czf "$OUT/placeholder-faces.tar.gz" -C assets placeholder

cp -R src "$OUT/src"                        # browsable, one file at a time
cp README.md AGENTS.md "$OUT/"
cp src/styles/fonts/*.woff2 "$OUT/fonts/"
cp public/index.html public/llms.txt "$OUT/"

# A manifest, so an agent with no tar can walk the tree deterministically.
(cd "$OUT" && find src -type f | sort) > "$OUT/files.txt"

rm -rf "$STAGE"

# --- publish -----------------------------------------------------------------
# First push, purely to learn the base URL the tunnel is currently handing out.
echo "→ publish (pass 1 — discover the host)"
LIB_URL=$(muxpad publish "$OUT" --name="$LIB_SLUG" | tail -1)
LIB_BASE="${LIB_URL%/}"
HOST="${LIB_BASE%/$LIB_SLUG}"
DEMO_BASE="$HOST/$DEMO_SLUG"
echo "   library: $LIB_BASE"
echo "   demo:    $DEMO_BASE"

echo "→ stamp the cross-links"
# `|` as the sed delimiter: the replacements are URLs and contain slashes.
for f in "$OUT/index.html" "$OUT/llms.txt" "$OUT/README.md" "$OUT/AGENTS.md"; do
  sed -i '' "s|https://REPLACE_BASE|$LIB_BASE|g; s|<BASE_URL>|$LIB_BASE|g; s|REPLACE_DEMO_URL|$DEMO_BASE/|g" "$f"
done
# The demo's link back to the library is a string literal in the bundle, which
# survives minification intact.
grep -rl 'REPLACE_LIB_URL' "$DEMO_OUT" | while read -r f; do
  sed -i '' "s|REPLACE_LIB_URL|$LIB_BASE/|g" "$f"
done

echo "→ publish (pass 2 — stamped)"
muxpad publish --update="$LIB_SLUG" "$OUT" >/dev/null
muxpad publish "$DEMO_OUT" --name="$DEMO_SLUG" >/dev/null

echo
echo "LIBRARY   $LIB_BASE/"
echo "  agent:  $LIB_BASE/llms.txt"
echo "  vendor: $LIB_BASE/trayo-ui.tar.gz"
echo "DEMO      $DEMO_BASE/"
