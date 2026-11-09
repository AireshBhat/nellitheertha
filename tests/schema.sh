#!/usr/bin/env bash
# A bad edit to the programme data must stop the build, so the live site stays on its last good version.
set -uo pipefail
cd "$(dirname "$0")/.."
out=$(PROGRAMME_FILE=tests/fixtures/bad-programme.json pnpm astro build --outDir /tmp/nelli-schema-dist 2>&1); code=$?
if [ $code -eq 0 ]; then echo "FAIL: the build accepted a programme day with no date"; exit 1; fi
echo "$out" | grep -q "date" || { echo "FAIL: the build failed, but not on the missing date:"; echo "$out" | tail -15; exit 1; }
echo "PASS: a programme day with no date stops the build"
