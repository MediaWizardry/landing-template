#!/usr/bin/env node
/**
 * build.js — Generate public/index.html from templates/index.html.tmpl + config.json
 *
 * Supports the full landing page schema:
 *   brand, hero, problem, solution, features, proof (stats), final_cta, footer
 *
 * Also supports legacy flat config format (product_name, tagline, primary_color, features[])
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
let html = fs.readFileSync(path.join(ROOT, 'templates', 'index.html.tmpl'), 'utf8');

// ═══════════════════════════════════════════════════════════
// Legacy config migration
// ═══════════════════════════════════════════════════════════

if (!config.brand && config.primary_color) {
  config.brand = {
    primary: config.primary_color,
    secondary: config.primary_color,
    accent: config.accent_color || config.primary_color,
    dark: '#0F172A',
    light: '#F8FAFC',
    font_heading: 'Inter',
    font_body: 'Inter'
  };
  config.meta_description = config.description || config.tagline || '';
  config.hero = {
    headline: config.product_name,
    subheadline: config.tagline || config.description || '',
    cta: config.cta
  };
  if (config.features && Array.isArray(config.features)) {
    config.features = {
      headline: 'Features',
      items: config.features
    };
  }
  config.footer = config.footer || { copyright: `${config.product_name} ${new Date().getFullYear()}` };
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

const brand = config.brand || {};
const C = {
  primary:   brand.primary   || '#6366F1',
  secondary: brand.secondary || '#EC4899',
  accent:    brand.accent    || '#F59E0B',
  dark:      brand.dark      || '#0F172A',
  light:     brand.light     || '#F8FAFC'
};
const fontHeading = brand.font_heading || 'Inter';
const fontBody    = brand.font_body    || 'Inter';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Convert {{gradient:some text}} markers to gradient-text spans */
function processGradient(text) {
  return String(text || '').replace(
    /\{\{gradient:(.*?)\}\}/g,
    '<span class="gradient-text">$1</span>'
  );
}

/** Build a CTA block (email form or link button) */
function buildCta(cta, large = false) {
  if (!cta || cta.type === 'none') return '';

  const py = large ? 'py-4' : 'py-3';
  const px = large ? 'px-8' : 'px-6';
  const sz = large ? 'text-lg' : 'text-base';
  const grad = `background: linear-gradient(135deg, ${C.primary}, ${C.secondary});`;
  const btnClass = `${px} ${py} rounded-xl font-semibold ${sz} text-white btn-glow transition-all hover:scale-[1.02] active:scale-[0.98]`;

  let out = '';

  if (cta.type === 'email') {
    out = `
      <form action="${esc(cta.action)}" method="POST" class="flex flex-col sm:flex-row gap-3 max-w-lg ${large ? 'mx-auto lg:mx-0' : ''}">
        <input type="email" name="email" placeholder="Enter your email" required
          class="flex-1 px-4 ${py} rounded-xl bg-white/5 border border-white/10 text-brand-light
                 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50
                 focus:border-brand-primary/50 ${sz}" />
        <button type="submit" class="${btnClass}" style="${grad}">${esc(cta.text)}</button>
      </form>`;
  } else {
    out = `
      <a href="${esc(cta.action)}" class="inline-block ${btnClass}" style="${grad}">${esc(cta.text)}</a>`;
  }

  if (cta.note) {
    out += `\n      <p class="text-sm text-gray-500 mt-4">${esc(cta.note)}</p>`;
  }
  return out;
}

/** Build Google Fonts link URL */
function buildFontLink() {
  const fonts = new Set([fontHeading, fontBody]);
  const params = [...fonts].map(f => {
    const urlName = f.replace(/\s+/g, '+');
    return `family=${urlName}:wght@400;500;600;700;800`;
  }).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// ═══════════════════════════════════════════════════════════
// Section builders
// ═══════════════════════════════════════════════════════════

function buildHero() {
  const h = config.hero || {};
  const hasCta = h.cta && h.cta.type !== 'none';
  const hasImage = !!h.image;

  const badge = h.badge
    ? `<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 glass">
            <span class="w-2 h-2 rounded-full animate-pulse-dot" style="background: ${C.primary};"></span>
            <span class="text-gray-300">${esc(h.badge)}</span>
          </div><br>`
    : '';

  const image = hasImage
    ? `<div class="animate-float mt-12 lg:mt-0" style="animation-delay: 0.3s;">
          <img src="${esc(h.image)}" alt="${esc(config.product_name)}"
            class="rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg mx-auto lg:max-w-none"
            loading="lazy" />
        </div>`
    : '';

  const layout = hasImage
    ? 'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'
    : 'max-w-4xl mx-auto text-center';

  const textAlign = hasImage ? '' : 'text-center';
  const ctaAlign = hasImage ? '' : 'flex justify-center';

  return `
  <!-- ═══ HERO ═══ -->
  <section class="mesh-bg min-h-screen flex items-center relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-20 md:py-28 w-full">
      <div class="${layout}">
        <div class="${textAlign}">
          ${badge}
          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            ${processGradient(h.headline || config.product_name)}
          </h1>
          <p class="text-lg sm:text-xl text-gray-400 leading-relaxed mb-8 ${hasImage ? 'max-w-xl' : 'max-w-2xl mx-auto'}">
            ${esc(h.subheadline || config.meta_description || '')}
          </p>
          ${hasCta ? `<div class="${ctaAlign}">${buildCta(h.cta, true)}</div>` : ''}
        </div>
        ${image}
      </div>
    </div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
         style="background: linear-gradient(135deg, ${C.primary}, ${C.secondary});"></div>
    <div class="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
         style="background: ${C.accent};"></div>
  </section>`;
}

function buildProblem() {
  const p = config.problem;
  if (!p || !p.points || p.points.length === 0) return '';

  const cols = Math.min(p.points.length, 3);
  const points = p.points.map((pt, i) => `
        <div class="glass rounded-2xl p-6 card-hover reveal" style="transition-delay: ${i * 0.1}s;">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl"
               style="background: ${C.primary}15;">${pt.icon || ''}</div>
          <h3 class="font-heading text-lg font-semibold mb-2">${esc(pt.title)}</h3>
          <p class="text-gray-400 leading-relaxed">${esc(pt.description)}</p>
        </div>`).join('\n');

  return `
  <!-- ═══ PROBLEM ═══ -->
  <section class="section-alt py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16 reveal">
        ${p.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(p.label)}</span>` : ''}
        <h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-4">${processGradient(p.headline)}</h2>
        ${p.description ? `<p class="text-gray-400 text-lg max-w-2xl mx-auto">${esc(p.description)}</p>` : ''}
      </div>
      <div class="grid md:grid-cols-${cols} gap-6">
        ${points}
      </div>
    </div>
  </section>`;
}

function buildSolution() {
  const s = config.solution;
  if (!s) return '';

  const bullets = (s.bullets || []).map(b => `
            <li class="flex items-start gap-3">
              <svg class="w-6 h-6 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="${C.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span class="text-gray-300">${esc(b)}</span>
            </li>`).join('\n');

  const image = s.image
    ? `<div class="reveal" style="transition-delay: 0.2s;">
          <img src="${esc(s.image)}" alt="${esc(config.product_name)}"
            class="rounded-2xl shadow-2xl shadow-black/40 animate-float w-full" loading="lazy" />
        </div>`
    : '';

  return `
  <!-- ═══ SOLUTION ═══ -->
  <section class="mesh-bg py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="${s.image ? 'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center' : 'max-w-3xl mx-auto text-center'}">
        <div class="reveal">
          ${s.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(s.label)}</span>` : ''}
          <h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-6">${processGradient(s.headline)}</h2>
          <p class="text-gray-400 text-lg leading-relaxed mb-8">${esc(s.description)}</p>
          ${bullets ? `<ul class="space-y-4">${bullets}</ul>` : ''}
        </div>
        ${image}
      </div>
    </div>
  </section>`;
}

function buildFeatures() {
  const f = config.features;
  if (!f) return '';
  const items = f.items || [];
  if (items.length === 0) return '';

  const cols = items.length <= 2 ? items.length : items.length === 4 ? 2 : 3;
  const cards = items.map((feat, i) => `
        <div class="glass rounded-2xl p-6 card-hover reveal" style="transition-delay: ${i * 0.08}s;">
          ${feat.icon ? `<div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl" style="background: ${C.primary}15;">${feat.icon}</div>` : ''}
          <h3 class="font-heading text-lg font-semibold mb-2">${esc(feat.title)}</h3>
          <p class="text-gray-400 leading-relaxed">${esc(feat.description)}</p>
        </div>`).join('\n');

  return `
  <!-- ═══ FEATURES ═══ -->
  <section class="section-alt py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16 reveal">
        ${f.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(f.label)}</span>` : ''}
        ${f.headline ? `<h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-4">${processGradient(f.headline)}</h2>` : ''}
        ${f.description ? `<p class="text-gray-400 text-lg max-w-2xl mx-auto">${esc(f.description)}</p>` : ''}
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-${cols} gap-6">
        ${cards}
      </div>
    </div>
  </section>`;
}

function buildStats() {
  const p = config.proof;
  if (!p || !p.stats || p.stats.length === 0) return '';

  const cols = Math.min(p.stats.length, 4);
  const items = p.stats.map((s, i) => `
        <div class="reveal" style="transition-delay: ${(i * 0.1).toFixed(1)}s;">
          <div class="font-heading text-4xl sm:text-5xl font-extrabold gradient-text mb-2">${esc(s.value)}</div>
          <div class="text-gray-400 text-sm sm:text-base">${esc(s.label)}</div>
        </div>`).join('\n');

  return `
  <!-- ═══ SOCIAL PROOF ═══ -->
  <section class="py-16 sm:py-20 px-6 sm:px-8" style="background: linear-gradient(135deg, ${C.primary}08, ${C.secondary}08);">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-${cols} gap-8 text-center">
        ${items}
      </div>
    </div>
  </section>`;
}

function buildFinalCta() {
  const fc = config.final_cta;
  if (!fc) return '';

  return `
  <!-- ═══ FINAL CTA ═══ -->
  <section class="mesh-bg py-20 sm:py-28 px-6 sm:px-8 relative overflow-hidden">
    <div class="max-w-3xl mx-auto text-center relative z-10 reveal">
      <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
        ${processGradient(fc.headline)}
      </h2>
      <p class="text-gray-400 text-lg mb-10 max-w-xl mx-auto">${esc(fc.subheadline || '')}</p>
      <div class="flex justify-center">
        ${buildCta(fc.cta, true)}
      </div>
    </div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
         style="background: linear-gradient(135deg, ${C.primary}, ${C.secondary});"></div>
  </section>`;
}

function buildFooter() {
  const f = config.footer || {};
  const copyright = f.copyright || `${config.product_name} ${new Date().getFullYear()}`;

  const logo = fs.existsSync(path.join(ROOT, 'public', 'assets', 'logo.png'))
    ? `<img src="assets/logo.png" alt="${esc(config.product_name)}" class="h-6 w-auto opacity-70" />`
    : `<span class="font-heading font-bold gradient-text">${esc(config.product_name)}</span>`;

  const links = (f.links || []).map(l =>
    `<a href="${esc(l.url)}" class="text-gray-500 hover:text-gray-300 transition">${esc(l.text)}</a>`
  ).join('\n          ');

  return `
  <!-- ═══ FOOTER ═══ -->
  <footer class="border-t border-white/5 py-8 px-6 sm:px-8" style="background-color: ${C.dark};">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
      <div class="flex items-center gap-3">
        ${logo}
        <span>&copy; ${esc(copyright)}</span>
      </div>
      ${links ? `<div class="flex items-center gap-6">${links}</div>` : ''}
    </div>
  </footer>`;
}

// ═══════════════════════════════════════════════════════════
// Assemble
// ═══════════════════════════════════════════════════════════

// Simple replacements
html = html.replace(/\{\{PRODUCT_NAME\}\}/g, esc(config.product_name));
html = html.replace(/\{\{META_DESCRIPTION\}\}/g, esc(config.meta_description || ''));
html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, C.primary);
html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, C.secondary);
html = html.replace(/\{\{COLOR_ACCENT\}\}/g, C.accent);
html = html.replace(/\{\{COLOR_DARK\}\}/g, C.dark);
html = html.replace(/\{\{COLOR_LIGHT\}\}/g, C.light);
html = html.replace(/\{\{FONT_HEADING\}\}/g, fontHeading);
html = html.replace(/\{\{FONT_BODY\}\}/g, fontBody);
html = html.replace(/\{\{FONT_LINK\}\}/g, buildFontLink());

// Section replacements
html = html.replace('{{HERO_SECTION}}', buildHero());
html = html.replace('{{PROBLEM_SECTION}}', buildProblem());
html = html.replace('{{SOLUTION_SECTION}}', buildSolution());
html = html.replace('{{FEATURES_SECTION}}', buildFeatures());
html = html.replace('{{STATS_SECTION}}', buildStats());
html = html.replace('{{FINAL_CTA_SECTION}}', buildFinalCta());
html = html.replace('{{FOOTER_SECTION}}', buildFooter());

// Write output
const outPath = path.join(ROOT, 'public', 'index.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`Built: ${outPath}`);
