#!/bin/sh
# Builds the browser version into web/dist (needs Emscripten's emcc on PATH).
set -e
cd "$(dirname "$0")"
mkdir -p dist
emcc ../main.cpp -O2 -o dist/book-of-heroes.js \
  -sASYNCIFY -sEXIT_RUNTIME -sMODULARIZE -sEXPORT_NAME=BookOfHeroes \
  --js-library stdin.js --embed-file ../wizytowka.txt@wizytowka.txt
cp index.html dist/
