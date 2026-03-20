#!/usr/bin/env bash
# build.sh — Generate landing page HTML + compile Tailwind CSS
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

# Step 1: Generate HTML files + tailwind.config.js
node "${SCRIPT_DIR}/build.js"

# Step 2: Compile Tailwind CSS (production build, minified)
if [[ -f "${SCRIPT_DIR}/src/input.css" ]]; then
  echo "Compiling Tailwind CSS..."
  npx --yes tailwindcss@3 -i "${SCRIPT_DIR}/src/input.css" -o "${SCRIPT_DIR}/public/styles.css" --minify 2>/dev/null
  echo "Built: public/styles.css"
else
  echo "Warning: src/input.css not found, skipping Tailwind build" >&2
fi
