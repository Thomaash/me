#!/usr/bin/env sh

cd './dist/me/' || exit 1

mkdir -p './old-files'

tar --create --exclude './old-files/**' --file './old-files/0.tar' './'

for i in $(seq 0 8); do
  stdout="$(curl "https://www.vycital.eu/me/old-files/${i}.tar" --no-progress-meter --write-out "%{http_code}" --output "./old-files/$(($i + 1)).tar")"
  if test "${stdout}" -ne 200; then
    printf 'Failed to download: %s.tar (%s)\n' "${i}" "${stdout}"
    rm "./old-files/$(($i + 1)).tar"
  else
    printf 'Downloaded: %s.tar\n' "${i}"
  fi
done

printf 'After build: %s\n' "$(find -type f | wc -l)"
for file in './old-files/'*'.tar'; do
  tar --extract --skip-old-files --file "${file}" --directory './'
  printf "After %s %s\n" "${file}" "$(find -type f | wc -l)"
done

