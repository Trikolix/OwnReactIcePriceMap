#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Kandidaten: unreferenzierte JS/JSX-Dateien in src (heuristisch) =="
for file in $(rg --files src | rg '\.(js|jsx)$' || true); do
  base="$(basename "$file")"
  case "$base" in
    App.jsx|index.jsx|reportWebVitals.jsx|setupTests.jsx)
      continue
      ;;
  esac

  refs="$( (rg -n --fixed-strings "$base" src || true) | wc -l | tr -d ' ')"
  if [[ "$refs" -eq 1 ]]; then
    echo "$file"
  fi
done

echo
echo "== Kandidaten: Backend-Top-Level-Endpunkte ohne Frontend-Referenz =="
tmp_all="$(mktemp)"
tmp_used="$(mktemp)"
trap 'rm -f "$tmp_all" "$tmp_used"' EXIT

rg --files backend | rg '\.php$' | sed 's#^backend/##' | sort -u > "$tmp_all"
rg -o '/[A-Za-z0-9_./-]+\.php' src | awk -F: '{print $2}' | sed 's#^/##' | sort -u > "$tmp_used"
comm -23 "$tmp_all" "$tmp_used" | rg -v '^(lib/|Database/|SQL-Queries/|Skripte/|evaluators/|awards/|event2026/bootstrap\.php|db_connect\.php$)' || true
