#!/usr/bin/env bash
# Publish the placeholder faces at ui.trayo.ai/faces/v1/, the library's default
# face base (src/lib/placeholder-faces.ts).
#
# assets/placeholder/ is the only committed copy; this copies it into the site's
# public dir at build time, so the served files cannot drift from the repo.
#
# v1 is immutable (see public/_headers): never change a file under it. A new set
# goes in as v2 beside it, with the default base bumped in the library.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf public/faces
mkdir -p public/faces/v1
cp ../assets/placeholder/*.png public/faces/v1/
echo "published $(ls public/faces/v1 | wc -l | tr -d ' ') faces to public/faces/v1"
