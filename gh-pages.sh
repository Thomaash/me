#!/usr/bin/env sh

printf '\n%s\n' 'Getting Git path...'
repo=$(git rev-parse --show-toplevel)
if [ -z "$repo" ]; then
  exit 1
fi

printf '\n%s\n' 'Getting tmp dir...'
tmp=$(mktemp -d)
if [ -z "$tmp" ]; then
  exit 2
fi

if [ "$1" = '--ci' ]; then
  # This was already done in the previous job in CI.
  :
else
  printf '\n%s\n' 'Building...'
  cd "$repo" || exit 3
  npm run build || exit 4

  printf '\n%s\n' 'Testing...'
  npm run test || exit 5
fi

printf '\n%s\n' 'Copying...'
rsync -r '.git' "$tmp" || exit 6
cd "$tmp" || exit 7
git checkout gh-pages || exit 8
git pull || exit 9
rm -rf * || exit 10
rsync -r "$repo/dist/" '.' || exit 11

printf '\n%s\n' 'Commiting...'
git add . || exit 12
git commit --allow-empty -m 'chore: update GitHub Pages [ci skip]' || exit 13

printf '\n%s\n' 'Pushing...'
git push || exit 14

printf '\n%s\n' 'Cleaning up...'
rm -rf "$tmp" || exit 15

