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
set -euo pipefail
cd "$(dirname "$0")"

SLUG=trayo-gtm-ui
OUT=.publish
STAGE=.stage

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

# --- publish -----------------------------------------------------------------
# First push, purely to learn the base URL the tunnel is currently handing out.
echo "→ publish (pass 1 — discover the host)"
URL=$(muxpad publish "$OUT" --name="$SLUG" | tail -1)
BASE="${URL%/}"
echo "   base: $BASE"

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
