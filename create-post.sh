#!/bin/sh

echo -n "title: "
read -r title

slug=$(echo "$title" | tr A-Z a-z | sed "s/ /-/g")
echo "slug will be $slug"

echo -n "is this ok? (y/n) "
read -r ans

if [ "$ans" = "n" ]; then
  exit
fi

dt=$(date -I)
mkdir "content/blog/$slug"

printf "title: %s\n---\nbody:\n---\ndate: %s" "$title" "$dt" >> "content/blog/$slug/contents.lr"

$EDITOR "content/blog/$slug/contents.lr"
