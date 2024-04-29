#!/bin/bash

# First of all check if make is installed
if ! [ -x "$(command -v make)" ]; then
  echo 'Error: make is not installed.' >&2
  xcode-select --install
fi
