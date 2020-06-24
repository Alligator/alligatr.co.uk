#!/bin/sh

status=$(git status --porcelain)

if [ -n "$status" ]; then
  echo "there are changed files, you probably don't want to deploy"
  git status -s
  exit
fi

echo "$ lektor build"
lektor build

echo -n "\ndeploy? (y/n) "
read -r ans

if [ "$ans" = "y" ]; then
  echo "$ lektor deploy"
  lektor deploy
fi
