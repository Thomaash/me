#!/usr/bin/env sh
# Safe helper to move frontend files into the front workspace using git mv.
# Run from repo root: ./bin/move-frontend-to-front.sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

DEST="front"
mkdir -p "$DEST"

items="
index.html
src
public
vite.config.js
tests
cypress.config.js
tests/unit
tests/e2e
tests/unit/support
tests/e2e/support
tests/unit/fixtures
tests/e2e/fixtures
tests/unit/unit
tests/e2e/e2e
"
echo "Moving frontend candidates into ./$DEST (only existing paths will be moved)"
for item in $items; do
  if [ -e "$item" ]; then
    # Use git mv when possible to preserve history, fall back to mv
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git mv -f "$item" "$DEST/" || mv -f "$item" "$DEST/"
      echo "moved: $item -> $DEST/"
    else
      mv -f "$item" "$DEST/"
      echo "moved (no git): $item -> $DEST/"
    fi
  else
    echo "skip (not found): $item"
  fi
done

echo "Done. Review 'git status' and any path-based configs. Then run:"
echo "  npm run bootstrap"
echo "  npm run install:front"
echo "Then start frontend: npm run dev:front"
