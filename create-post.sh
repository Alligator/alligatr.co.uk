#!/bin/sh

echo -n "title: "
read -r title

echo -n "slug: "
read -r slug

dt=$(date -I)
mkdir "content/blog/$slug"

printf "title: %s\n---\nbody:\n---\ndate: %s" "$title" "$dt" >> "content/blog/$slug/contents.lr"

$EDITOR "content/blog/$slug/contents.lr"
