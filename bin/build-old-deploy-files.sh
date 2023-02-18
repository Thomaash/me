#!/usr/bin/env sh

cd './dist/' || exit 1

mkdir -p './old-files'
rm './old-files/'*

tar --create --verbose --exclude './old-files/**' --file './old-files/0.tar' './'

for i in $(seq 0 8); do
  if test "$(curl "https://vycital.eu/me/old-files/${i}.tar"  --write-out "%{http_code}" --output "./old-files/$((i + 1)).tar")" -ne 200; then
    rm "./old-files/$((i + 1)).tar"
  fi
done

for file in './old-files/'*'.tar'; do
  tar --extract --verbose --skip-old-files --file "${file}" --directory './dist'
done

