#!/usr/bin/env bash
# The build works and keeps the files that are shared by link (posters, PDFs, the share image).
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm build > /tmp/nelli-build.log 2>&1 || { tail -30 /tmp/nelli-build.log; echo "FAIL: pnpm build"; exit 1; }
for f in index.html assets/posters/dec25-06.webp assets/docs/brahmakalasha-invitation-english.pdf assets/img/og.jpg assets/img/upi-qr.png favicon.ico robots.txt sitemap.xml; do
  [ -e "dist/$f" ] || { echo "FAIL: dist/$f missing"; exit 1; }
done
echo "PASS: build and shared files"
