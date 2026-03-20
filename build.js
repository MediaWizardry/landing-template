#!/usr/bin/env node
/**
 * build.js — Generate landing page from templates/index.html.tmpl + config.json
 *
 * Generates:
 *   public/index.html      — main landing page
 *   public/privacy.html    — privacy policy
 *   public/terms.html      — terms of service
 *   public/site.webmanifest — PWA manifest
 *   public/robots.txt      — search engine directives
 *   public/_headers         — security headers
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
// SVG Icon Library (Lucide-style, 24x24 viewBox, stroke-based)
// ═══════════════════════════════════════════════════════════

const ICONS = {
  search:   `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  shield:   `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  zap:      `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  chart:    `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  globe:    `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
  lock:     `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  message:  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  bell:     `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  cpu:      `<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>`,
  layers:   `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
  target:   `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  users:    `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  rocket:   `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>`,
  star:     `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  clock:    `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  code:     `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
  eye:      `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  filter:   `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
  key:      `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>`,
  link:     `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
  mail:     `<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>`,
  monitor:  `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  trending: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  brain:    `<path d="M12 2a5 5 0 0 0-4.9 4A4 4 0 0 0 4 10a4 4 0 0 0 1.2 2.9A4.5 4.5 0 0 0 4 15.5 4.5 4.5 0 0 0 8.5 20H12"/><path d="M12 2a5 5 0 0 1 4.9 4A4 4 0 0 1 20 10a4 4 0 0 1-1.2 2.9 4.5 4.5 0 0 1 1.2 2.6 4.5 4.5 0 0 1-4.5 4.5H12"/><line x1="12" y1="2" x2="12" y2="20"/>`,
  plug:     `<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/>`,
  alert:    `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  check:    `<polyline points="20 6 9 17 4 12"/>`,
  cloud:    `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>`,
  hash:     `<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>`,
  signal:   `<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/>`,
  default:  `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
};

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
const domain      = config.domain      || '';
const canonicalUrl = domain ? `https://${domain}/` : '';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function processGradient(text) {
  return String(text || '').replace(
    /\{\{gradient:(.*?)\}\}/g,
    '<span class="gradient-text">$1</span>'
  );
}

function renderIcon(iconKey, color) {
  const paths = ICONS[iconKey] || ICONS['default'];
  return `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function buildCta(cta, large = false) {
  if (!cta || cta.type === 'none') return '';
  const py = large ? 'py-4' : 'py-3';
  const px = large ? 'px-8' : 'px-6';
  const sz = large ? 'text-lg' : 'text-base';
  const grad = `background: linear-gradient(135deg, ${C.primary}, ${C.secondary});`;
  const btnClass = `${px} ${py} rounded-xl font-semibold ${sz} text-white btn-glow transition-all hover:scale-[1.02] active:scale-[0.98]`;

  let out = '<div>';
  if (cta.type === 'email') {
    out += `
      <form action="${esc(cta.action)}" method="POST" class="flex flex-col sm:flex-row gap-3 max-w-lg ${large ? 'mx-auto lg:mx-0' : ''}">
        <input type="email" name="email" placeholder="Enter your email" required
          class="flex-1 px-4 ${py} rounded-xl bg-white/5 border border-white/10 text-brand-light
                 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50
                 focus:border-brand-primary/50 ${sz}" />
        <button type="submit" class="${btnClass}" style="${grad}">${esc(cta.text)}</button>
      </form>`;
  } else {
    out += `
      <a href="${esc(cta.action)}" class="inline-block ${btnClass}" style="${grad}">${esc(cta.text)}</a>`;
  }
  if (cta.note) {
    out += `\n      <p class="text-sm text-gray-500 mt-4">${esc(cta.note)}</p>`;
  }
  out += '</div>';
  return out;
}

function buildFontLink() {
  const fonts = new Set([fontHeading, fontBody]);
  const params = [...fonts].map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700;800`).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function buildJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.product_name,
    description: config.meta_description || '',
    url: canonicalUrl || undefined
  };
  return `<script type="application/ld+json">\n  ${JSON.stringify(data)}\n  </script>`;
}

function logoImg(cssClass = 'h-8 w-auto') {
  const logoPath = path.join(ROOT, 'public', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    return `<img src="/assets/logo.png" alt="${esc(config.product_name)}" class="${cssClass}" />`;
  }
  return `<span class="font-heading font-bold text-xl gradient-text">${esc(config.product_name)}</span>`;
}

// ═══════════════════════════════════════════════════════════
// Section builders
// ═══════════════════════════════════════════════════════════

function buildHero() {
  const h = config.hero || {};
  const hasImage = !!h.image;
  const hasCta = h.cta && h.cta.type !== 'none';

  const badge = h.badge
    ? `<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 glass">
            <span class="w-2 h-2 rounded-full animate-pulse-dot" style="background: ${C.primary};"></span>
            <span class="text-gray-300">${esc(h.badge)}</span>
          </div><br>`
    : '';

  const image = hasImage
    ? `<div class="animate-float mt-12 lg:mt-0" style="animation-delay: 0.3s;">
          <img src="${esc(h.image)}" alt="${esc(config.product_name)}"
            class="rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg mx-auto lg:max-w-none" />
        </div>`
    : '';

  const layout = hasImage
    ? 'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'
    : 'max-w-4xl mx-auto text-center';

  const ctaAlign = hasImage ? '' : 'flex justify-center';

  // Build nav links from available sections
  const navLinks = [];
  if (config.problem) navLinks.push({ text: config.problem.label || 'Problem', id: 'problem' });
  if (config.solution) navLinks.push({ text: config.solution.label || 'Solution', id: 'solution' });
  if (config.features) navLinks.push({ text: config.features.label || 'Features', id: 'features' });
  if (config.use_cases) navLinks.push({ text: config.use_cases.label || 'Use Cases', id: 'use-cases' });

  const navHtml = navLinks.map(l =>
    `<a href="#${l.id}" class="text-gray-400 hover:text-white transition text-sm">${esc(l.text)}</a>`
  ).join('\n          ');

  const header = `
  <!-- ═══ HEADER ═══ -->
  <header id="site-header" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style="background: transparent;">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3">
        ${logoImg('h-8 w-auto')}
        <span class="font-heading font-semibold text-lg">${esc(config.product_name)}</span>
      </a>
      <nav class="hidden md:flex items-center gap-8">
        ${navHtml}
        ${hasCta ? `<a href="#final-cta" class="px-5 py-2 rounded-lg font-medium text-sm text-white transition hover:opacity-90" style="background: linear-gradient(135deg, ${C.primary}, ${C.secondary});">${esc(h.cta?.text || 'Get Started')}</a>` : ''}
      </nav>
    </div>
  </header>`;

  return `${header}
  <!-- ═══ HERO ═══ -->
  <section id="hero" class="mesh-bg min-h-screen flex items-center relative overflow-hidden pt-20">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-20 md:py-28 w-full">
      <div class="${layout}">
        <div>
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
        <div class="glass rounded-2xl p-6 card-hover reveal" style="transition-delay: ${(i * 0.1).toFixed(1)}s;">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
               style="background: ${C.primary}15;">${renderIcon(pt.icon || 'alert', C.primary)}</div>
          <h3 class="font-heading text-lg font-semibold mb-2">${esc(pt.title)}</h3>
          <p class="text-gray-400 leading-relaxed">${esc(pt.description)}</p>
        </div>`).join('\n');

  return `
  <!-- ═══ PROBLEM ═══ -->
  <section id="problem" class="section-alt py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16 reveal">
        ${p.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(p.label)}</span>` : ''}
        <h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-4">${processGradient(p.headline)}</h2>
        ${p.description ? `<p class="text-gray-400 text-lg max-w-2xl mx-auto">${esc(p.description)}</p>` : ''}
      </div>
      <div class="grid md:grid-cols-${cols} gap-6">${points}
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
            class="rounded-2xl shadow-2xl shadow-black/40 animate-float w-full" />
        </div>`
    : '';

  return `
  <!-- ═══ SOLUTION ═══ -->
  <section id="solution" class="mesh-bg py-20 sm:py-28 px-6 sm:px-8">
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
        <div class="glass rounded-2xl p-6 card-hover reveal" style="transition-delay: ${(i * 0.08).toFixed(2)}s;">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style="background: ${C.primary}15;">
            ${renderIcon(feat.icon || 'default', C.primary)}
          </div>
          <h3 class="font-heading text-lg font-semibold mb-2">${esc(feat.title)}</h3>
          <p class="text-gray-400 leading-relaxed">${esc(feat.description)}</p>
        </div>`).join('\n');

  return `
  <!-- ═══ FEATURES ═══ -->
  <section id="features" class="section-alt py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16 reveal">
        ${f.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(f.label)}</span>` : ''}
        ${f.headline ? `<h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-4">${processGradient(f.headline)}</h2>` : ''}
        ${f.description ? `<p class="text-gray-400 text-lg max-w-2xl mx-auto">${esc(f.description)}</p>` : ''}
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-${cols} gap-6">${cards}
      </div>
    </div>
  </section>`;
}

function buildUseCases() {
  const uc = config.use_cases;
  if (!uc || !uc.items || uc.items.length === 0) return '';

  const cards = uc.items.map((item, i) => `
        <div class="glass rounded-2xl p-8 card-hover reveal flex gap-6 items-start" style="transition-delay: ${(i * 0.1).toFixed(1)}s;">
          <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style="background: ${C.primary}15;">
            ${renderIcon(item.icon || 'target', C.primary)}
          </div>
          <div>
            <h3 class="font-heading text-xl font-semibold mb-2">${esc(item.title)}</h3>
            <p class="text-gray-400 leading-relaxed">${esc(item.description)}</p>
          </div>
        </div>`).join('\n');

  return `
  <!-- ═══ USE CASES ═══ -->
  <section id="use-cases" class="mesh-bg py-20 sm:py-28 px-6 sm:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-16 reveal">
        ${uc.label ? `<span class="text-sm font-semibold tracking-widest uppercase gradient-text">${esc(uc.label)}</span>` : ''}
        ${uc.headline ? `<h2 class="font-heading text-3xl sm:text-4xl font-bold mt-3 mb-4">${processGradient(uc.headline)}</h2>` : ''}
        ${uc.description ? `<p class="text-gray-400 text-lg max-w-2xl mx-auto">${esc(uc.description)}</p>` : ''}
      </div>
      <div class="space-y-4">${cards}
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
      <div class="grid grid-cols-2 md:grid-cols-${cols} gap-8 text-center">${items}
      </div>
    </div>
  </section>`;
}

function buildFinalCta() {
  const fc = config.final_cta;
  if (!fc) return '';
  return `
  <!-- ═══ FINAL CTA ═══ -->
  <section id="final-cta" class="mesh-bg py-20 sm:py-28 px-6 sm:px-8 relative overflow-hidden">
    <div class="max-w-3xl mx-auto text-center relative z-10 reveal">
      <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
        ${processGradient(fc.headline)}
      </h2>
      <p class="text-gray-400 text-lg mb-10 max-w-xl mx-auto">${esc(fc.subheadline || '')}</p>
      <div class="flex justify-center">${buildCta(fc.cta, true)}</div>
    </div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
         style="background: linear-gradient(135deg, ${C.primary}, ${C.secondary});"></div>
  </section>`;
}

function buildFooter() {
  const f = config.footer || {};
  const copyright = f.copyright || `${config.product_name} ${new Date().getFullYear()}`;

  const links = [
    ...(f.links || []),
    { text: 'Privacy', url: '/privacy' },
    { text: 'Terms', url: '/terms' }
  ];
  // Deduplicate by url
  const seen = new Set();
  const uniqueLinks = links.filter(l => {
    const key = l.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const linksHtml = uniqueLinks.map(l =>
    `<a href="${esc(l.url)}" class="text-gray-500 hover:text-gray-300 transition">${esc(l.text)}</a>`
  ).join('\n          ');

  return `
  <!-- ═══ FOOTER ═══ -->
  <footer class="border-t border-white/5 py-8 px-6 sm:px-8" style="background-color: ${C.dark};">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
      <div class="flex items-center gap-3">
        ${logoImg('h-10 w-auto opacity-70')}
        <span>&copy; ${esc(copyright)}</span>
      </div>
      <div class="flex items-center gap-6">${linksHtml}</div>
    </div>
  </footer>`;
}

// ═══════════════════════════════════════════════════════════
// Assemble main page
// ═══════════════════════════════════════════════════════════

// Title suffix: use meta_description first sentence, truncate to 60 chars at word boundary
const rawSuffix = (config.meta_description || config.hero?.subheadline || '').split(/[.!?—–]/)[0].trim();
const metaTitleSuffix = rawSuffix.length <= 60 ? rawSuffix : rawSuffix.slice(0, 57).replace(/\s+\S*$/, '') + '...';

html = html.replace(/\{\{PRODUCT_NAME\}\}/g, esc(config.product_name));
html = html.replace(/\{\{META_TITLE_SUFFIX\}\}/g, esc(metaTitleSuffix));
html = html.replace(/\{\{META_DESCRIPTION\}\}/g, esc(config.meta_description || ''));
html = html.replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl);
html = html.replace(/\{\{COLOR_PRIMARY\}\}/g, C.primary);
html = html.replace(/\{\{COLOR_SECONDARY\}\}/g, C.secondary);
html = html.replace(/\{\{COLOR_ACCENT\}\}/g, C.accent);
html = html.replace(/\{\{COLOR_DARK\}\}/g, C.dark);
html = html.replace(/\{\{COLOR_LIGHT\}\}/g, C.light);
html = html.replace(/\{\{FONT_HEADING\}\}/g, fontHeading);
html = html.replace(/\{\{FONT_BODY\}\}/g, fontBody);
html = html.replace(/\{\{FONT_LINK\}\}/g, buildFontLink());
html = html.replace(/\{\{JSON_LD\}\}/g, buildJsonLd());

html = html.replace('{{HERO_SECTION}}', buildHero());
html = html.replace('{{PROBLEM_SECTION}}', buildProblem());
html = html.replace('{{SOLUTION_SECTION}}', buildSolution());
html = html.replace('{{FEATURES_SECTION}}', buildFeatures());
html = html.replace('{{USE_CASES_SECTION}}', buildUseCases());
html = html.replace('{{STATS_SECTION}}', buildStats());
html = html.replace('{{FINAL_CTA_SECTION}}', buildFinalCta());
html = html.replace('{{FOOTER_SECTION}}', buildFooter());

// Write main page
const pubDir = path.join(ROOT, 'public');
fs.mkdirSync(path.join(pubDir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(pubDir, 'index.html'), html);
console.log('Built: public/index.html');

// ═══════════════════════════════════════════════════════════
// Generate legal pages
// ═══════════════════════════════════════════════════════════

function buildLegalPage(title, content) {
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} — ${esc(config.product_name)}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/assets/favicon.png" sizes="32x32" type="image/png">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        colors: { brand: { primary: '${C.primary}', dark: '${C.dark}', light: '${C.light}' } },
        fontFamily: { body: ['"${fontHeading}"', 'system-ui', 'sans-serif'] }
      }}
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${buildFontLink()}" rel="stylesheet">
</head>
<body class="font-body bg-brand-dark text-brand-light antialiased">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <a href="/" class="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition mb-8">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Back to ${esc(config.product_name)}
    </a>
    <h1 class="text-3xl font-bold mb-8">${esc(title)}</h1>
    <div class="prose prose-invert prose-gray max-w-none text-gray-400 leading-relaxed space-y-4">
      ${content}
    </div>
    <p class="text-sm text-gray-600 mt-12">Last updated: ${new Date().toISOString().split('T')[0]}</p>
  </div>
</body>
</html>`;
}

const privacyContent = `
<p>This Privacy Policy describes how ${esc(config.product_name)} ("we", "us", or "our") collects, uses, and protects your information when you visit our website.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Information We Collect</h2>
<p>We may collect your email address if you voluntarily submit it through our website forms (e.g., waitlist signup). We also collect standard web analytics data such as page views, browser type, and referring pages.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">How We Use Your Information</h2>
<p>We use the information we collect to communicate with you about our product, send updates you have opted in to receive, and improve our website experience.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Data Protection</h2>
<p>We implement appropriate security measures to protect your personal information. We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Cookies</h2>
<p>Our website may use cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Contact</h2>
<p>If you have questions about this Privacy Policy, please contact us through the information provided on our website.</p>`;

const termsContent = `
<p>These Terms of Service ("Terms") govern your use of the ${esc(config.product_name)} website. By accessing our website, you agree to these Terms.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Use of Service</h2>
<p>You agree to use our website only for lawful purposes and in accordance with these Terms. You may not use our website in any way that could damage, disable, or impair the service.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Intellectual Property</h2>
<p>All content, features, and functionality of our website are owned by ${esc(config.product_name)} and are protected by copyright, trademark, and other intellectual property laws.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Disclaimer</h2>
<p>Our website is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the operation of our website or the information, content, or materials included.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Limitation of Liability</h2>
<p>${esc(config.product_name)} shall not be liable for any damages arising from the use of our website.</p>
<h2 class="text-xl font-semibold text-brand-light mt-8 mb-3">Changes to Terms</h2>
<p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website.</p>`;

fs.writeFileSync(path.join(pubDir, 'privacy.html'), buildLegalPage('Privacy Policy', privacyContent));
console.log('Built: public/privacy.html');

fs.writeFileSync(path.join(pubDir, 'terms.html'), buildLegalPage('Terms of Service', termsContent));
console.log('Built: public/terms.html');

// ═══════════════════════════════════════════════════════════
// Generate site.webmanifest
// ═══════════════════════════════════════════════════════════

const manifest = {
  name: config.product_name,
  short_name: config.product_name,
  icons: [
    { src: '/assets/logo.png', sizes: '512x512', type: 'image/png' }
  ],
  theme_color: C.dark,
  background_color: C.dark,
  display: 'standalone'
};
fs.writeFileSync(path.join(pubDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('Built: public/site.webmanifest');

// ═══════════════════════════════════════════════════════════
// Generate robots.txt
// ═══════════════════════════════════════════════════════════

const robotsTxt = `User-agent: *
Allow: /
${canonicalUrl ? `Sitemap: ${canonicalUrl}sitemap.xml` : ''}
`;
fs.writeFileSync(path.join(pubDir, 'robots.txt'), robotsTxt.trim() + '\n');
console.log('Built: public/robots.txt');

// ═══════════════════════════════════════════════════════════
// Generate _headers (Cloudflare Pages security headers)
// ═══════════════════════════════════════════════════════════

const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;
fs.writeFileSync(path.join(pubDir, '_headers'), headers.trim() + '\n');
console.log('Built: public/_headers');

console.log('Done.');
