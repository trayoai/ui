#!/usr/bin/env bash
# Build the vendor drop that ui.trayo.ai serves at /trayo-ui.tar.gz.
#
# Runs as `prebuild`, so the tarball is always regenerated from the CURRENT
# source on every deploy — it cannot go stale relative to the repo.
set -euo pipefail
cd "$(dirname "$0")/.."
STAGE=$(mktemp -d)
mkdir -p "$STAGE/trayo-ui" public
cp -R ../src/. "$STAGE/trayo-ui/"
cp ../README.md ../AGENTS.md "$STAGE/trayo-ui/"
tar -czf public/trayo-ui.tar.gz -C "$STAGE" trayo-ui
rm -rf "$STAGE"
echo "packed public/trayo-ui.tar.gz"
