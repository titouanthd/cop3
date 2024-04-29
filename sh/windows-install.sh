#!/bin/bash
# Install dependencies for Windows
# check if chocolatey is installed
if ! [ -x "$(command -v choco)" ]; then
  # install chocolatey
  echo 'Error: chocolatey is not installed.' >&2
  exit 1
fi

# check if make is installed
if ! [ -x "$(command -v make)" ]; then
  echo 'Error: make is not installed.' >&2
  choco install make
fi
