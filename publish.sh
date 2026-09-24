#!/usr/bin/env bash
# Build and publish the public hackathon kit.
#
#   ./publish.sh
#
# Re-run this ANY time — notably if the Cloudflare quick-tunnel rotates its
# hostname, since every install command on the landing page and in llms.txt
# embeds the absolute base URL. One run re-stamps them all.
set -euo pipefail
cd "$(dirname "$0")"

SLUG=trayo-gtm-ui
OUT=.publish

echo "→ typecheck"
pnpm typecheck

echo "→ build showcase"
pnpm demo:build

echo "→ assemble $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/showcase" "$OUT/fonts"
npm pack --pack-destination "$OUT" >/dev/null
cp -R demo/dist/* "$OUT/showcase/"
cp -R src "$OUT/src"
cp README.md AGENTS.md package.json "$OUT/"
cp src/styles/fonts/*.woff2 "$OUT/fonts/"
cp public/index.html public/llms.txt "$OUT/"
tar -czf "$OUT/trayo-gtm-ui-src.tar.gz" src README.md AGENTS.md

echo "→ publish"
# First push with the placeholder still in place, purely to learn the base URL
# the tunnel is currently handing out.
URL=$(muxpad publish "$OUT" --name="$SLUG" | tail -1)
BASE="${URL%/}"
echo "   base: $BASE"

echo "→ stamp $BASE into the install commands and re-publish"
for f in "$OUT/index.html" "$OUT/llms.txt"; do
  # `|` as the sed delimiter: the replacement is a URL and contains slashes.
  sed -i '' "s|https://REPLACE_BASE|$BASE|g; s|<BASE_URL>|$BASE|g" "$f"
done
muxpad publish --update="$SLUG" "$OUT" >/dev/null

echo
echo "Published: $BASE/"
echo "  agent:    $BASE/llms.txt"
echo "  showcase: $BASE/showcase/"
echo "  tarball:  $BASE/trayo-gtm-ui-0.1.0.tgz"
