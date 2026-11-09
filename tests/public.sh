#!/usr/bin/env bash
# The repository is public: no internal working notes, names or paths in any tracked file.
cd "$(dirname "$0")/.."
hits=$(git ls-files -z | grep -zv -e '^tests/public.sh$' -e '\.webp$' -e '\.png$' -e '\.jpg$' -e '\.pdf$' -e '\.woff2$' -e '\.ttf$' -e '\.ico$' \
  | xargs -0 grep -n -I -E 'Asper9|Kimi|Moonwater|Throwaway|throwaway|Pass 01|pass-01|docs/research|explorations/|Claude' 2>/dev/null)
if [ -n "$hits" ]; then echo "$hits" | cut -c1-160; echo "FAIL: internal notes in tracked files"; exit 1; fi
echo "PASS: no internal notes in tracked files"
