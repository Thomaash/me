#!/usr/bin/env sh

# Prepare dirs
repo=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d)

# Build
cd "$repo"
npm run build
rsync -r '.git' "$tmp"

# Copy
cd "$tmp"
git checkout gh-pages
git pull
rm -rf *
rsync -r "$repo/dist/" '.'

# Commit
git add .
git commit -m 'Update GitHub pages'

# Push
git push

# Clean up
rm -rf "$tmp"

