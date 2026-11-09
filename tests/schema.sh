#!/usr/bin/env bash
# A bad edit to the programme data must stop the build, so the live site stays on its last good version.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
check() { # fixture, text the error must contain, description
  out=$(PROGRAMME_FILE="tests/fixtures/$1" pnpm astro build --outDir /tmp/nelli-schema-dist 2>&1); code=$?
  if [ $code -eq 0 ]; then echo "FAIL: the build accepted $3"; fail=1; return; fi
  if ! echo "$out" | grep -q "$2"; then echo "FAIL: the build failed on $3, but not with \"$2\":"; echo "$out" | grep -iE "error|programme" | head -5; fail=1; return; fi
  echo "PASS: $3 stops the build"
}
check bad-programme.json "date" "a programme day with no date"
check gap-programme.json "2026-12-23" "a programme with 23 December missing"
check weekday-programme.json "weekday" "a weekday that does not match its date"
exit $fail
