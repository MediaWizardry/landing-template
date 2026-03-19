#!/usr/bin/env bash
# build.sh — Generate public/index.html from templates/index.html.tmpl and config.json
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
CONFIG="${SCRIPT_DIR}/config.json"
TEMPLATE="${SCRIPT_DIR}/templates/index.html.tmpl"
OUTPUT="${SCRIPT_DIR}/public/index.html"

if [[ ! -f "$CONFIG" ]]; then
  echo "Error: config.json not found" >&2
  exit 1
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Error: templates/index.html.tmpl not found" >&2
  exit 1
fi

node -e '
const fs = require("fs");
const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
let html = fs.readFileSync(process.argv[2], "utf8");

// Simple replacements
html = html.replace(/\{\{PRODUCT_NAME\}\}/g, config.product_name);
html = html.replace(/\{\{TAGLINE\}\}/g, config.tagline);
html = html.replace(/\{\{DESCRIPTION\}\}/g, config.description);
html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, config.primary_color);
html = html.replace(/\{\{ACCENT_COLOR\}\}/g, config.accent_color);
html = html.replace(/\{\{COPYRIGHT\}\}/g, config.footer.copyright);

// CTA block
let ctaBlock = "";
const cta = config.cta;
if (cta && cta.type !== "none") {
  if (cta.type === "email") {
    ctaBlock = `<form action="${cta.action}" method="POST" class="flex flex-col sm:flex-row gap-3 justify-center">
      <input type="email" name="email" placeholder="Enter your email" required
        class="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-base w-full sm:w-80" />
      <button type="submit"
        class="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition text-base">${cta.text}</button>
    </form>`;
  } else {
    ctaBlock = `<a href="${cta.action}"
      class="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition text-lg">${cta.text}</a>`;
  }
}
html = html.replace(/\{\{CTA_BLOCK\}\}/g, ctaBlock);

// Features block
let featuresBlock = "";
if (config.features && config.features.length > 0) {
  featuresBlock = config.features.map(f => `
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold mb-3">${f.title}</h3>
          <p class="text-gray-600">${f.description}</p>
        </div>`).join("\n");
}
html = html.replace(/\{\{FEATURES_BLOCK\}\}/g, featuresBlock);

fs.writeFileSync(process.argv[3], html);
console.log("Built: " + process.argv[3]);
' "$CONFIG" "$TEMPLATE" "$OUTPUT"
