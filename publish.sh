#!/usr/bin/env bash
# Build and publish the public kit.
#
#   ./publish.sh
#
# Re-run this ANY time — notably if the Cloudflare quick-tunnel rotates its
# hostname, since the landing page and llms.txt embed the absolute base URL in
# their download commands. One run re-stamps them all.
#
# What we publish is a VENDOR DROP, not an npm package: consumers copy
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

echo "→ build showcase"
pnpm demo:build

echo "→ assemble $OUT"
rm -rf "$OUT" "$STAGE"
mkdir -p "$OUT/showcase" "$OUT/fonts" "$STAGE/trayo-ui"

# The vendor drop: `tar xz -C src` lands it at src/trayo-ui/. The docs ride
# along so the house rules end up inside the consumer's repo.
cp -R src/. "$STAGE/trayo-ui/"
cp README.md AGENTS.md "$STAGE/trayo-ui/"
tar -czf "$OUT/trayo-ui.tar.gz" -C "$STAGE" trayo-ui

# The 50 illustrated fallback faces, for consumers who would rather self-host
# them than hit app.trayo.ai.
tar -czf "$OUT/placeholder-faces.tar.gz" -C assets placeholder

cp -R demo/dist/. "$OUT/showcase/"
cp -R src "$OUT/src"                        # browsable, one file at a time
cp README.md AGENTS.md "$OUT/"
cp src/styles/fonts/*.woff2 "$OUT/fonts/"
cp public/index.html public/llms.txt "$OUT/"

# A manifest, so an agent with no tar can walk the tree deterministically.
(cd "$OUT" && find src -type f | sort) > "$OUT/files.txt"

rm -rf "$STAGE"

echo "→ publish"
# First push with the placeholder still in place, purely to learn the base URL
# the tunnel is currently handing out.
URL=$(muxpad publish "$OUT" --name="$SLUG" | tail -1)
BASE="${URL%/}"
echo "   base: $BASE"

echo "→ stamp $BASE into the download commands and re-publish"
for f in "$OUT/index.html" "$OUT/llms.txt" "$OUT/README.md" "$OUT/AGENTS.md"; do
  # `|` as the sed delimiter: the replacement is a URL and contains slashes.
  sed -i '' "s|https://REPLACE_BASE|$BASE|g; s|<BASE_URL>|$BASE|g" "$f"
done
muxpad publish --update="$SLUG" "$OUT" >/dev/null

echo
echo "Published: $BASE/"
echo "  agent:    $BASE/llms.txt"
echo "  vendor:   $BASE/trayo-ui.tar.gz"
echo "  showcase: $BASE/showcase/"
