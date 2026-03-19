#!/usr/bin/env bash
# build.sh — Generate public/index.html from templates/index.html.tmpl and config.json
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [[ ! -f "${SCRIPT_DIR}/config.json" ]]; then
  echo "Error: config.json not found" >&2
  exit 1
fi

if [[ ! -f "${SCRIPT_DIR}/templates/index.html.tmpl" ]]; then
  echo "Error: templates/index.html.tmpl not found" >&2
  exit 1
fi

node "${SCRIPT_DIR}/build.js"
