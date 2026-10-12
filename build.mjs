// Static build: node build.mjs  ->  dist/
// Pages are plain HTML at clean URLs (/projects/, /services/... ) per the brief's page inventory.
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { stories, bio } from './src/data/content.mjs';

const SITE = 'https://www.venessdesign.com.au'; // confirm preferred hostname before launch
const PHONE = '0403 082 845', TEL = '+61403082845', EMAIL = 'chris@venessdesign.com.au';

// Projects are image collections prepared by scripts/prepare-images.py (src/data/collections.json)
const collections = JSON.parse(readFileSync('src/data/collections.json', 'utf8'));
const serviceFor = { 'New home design': '/services/new-home-design/', 'Interior design': '/services/interior-design/' };
const projects = collections.map((c) => ({ ...c, service: serviceFor[c.type], cover: c.images[0] }));
const P = Object.fromEntries(projects.map((p) => [p.slug, p]));
const imgTag = (im, sizes, { eager = false, alt = im.alt } = {}) => `<img src="/assets/img/${im.id}-${im.widths.at(-1)}.webp" srcset="${im.widths.map((w) => `/assets/img/${im.id}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;

const services = [
  { path: '/services/new-home-design/', name: 'New home design', img: 'modern-farmhouse', short: 'A home designed around your site, your budget priorities and the way you live.' },
  { path: '/services/renovations-extensions/', name: 'Renovations & extensions', img: 'formal-garden-homes', short: 'Improve or extend the home you have, with a design that respects what is already there.' },
  { path: '/services/interior-design/', name: 'Interior design', img: 'living-spaces', short: 'Layouts, joinery and finishes that make the inside of your home work as well as it looks.' },
  { path: '/services/drafting-documentation/', name: 'Drafting & documentation', img: 'contemporary-family-homes', short: 'Clear, accurate drawings and documentation for approvals and construction.' },
];

const business = {
  '@type': ['ProfessionalService', 'LocalBusiness'], '@id': `${SITE}/#business`, name: 'Veness Design & Drafting', url: SITE + '/',
  description: 'Residential building designer for new homes, renovations, extensions and interiors in Bowral and the Southern Highlands, NSW.',
  telephone: '+61403082845', email: EMAIL, logo: `${SITE}/assets/logo-reversed.png`, image: `${SITE}/assets/img/country-homes-01-1536.webp`,
  founder: { '@type': 'Person', name: 'Chris Veness', jobTitle: 'Building designer' },
  areaServed: [{ '@type': 'City', name: 'Bowral' }, { '@type': 'AdministrativeArea', name: 'Southern Highlands, NSW' }],
  knowsAbout: ['Residential building design', 'New home design', 'Home renovations and extensions', 'Interior design', 'Drafting and documentation'],
};
const website = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE + '/', name: 'Veness Design & Drafting', inLanguage: 'en-AU', publisher: { '@id': `${SITE}/#business` } };
const ARR = '<i class="arr" aria-hidden="true">↗</i>';
const cut = (str, max = 155) => { if (str.length <= max) return str; const t = str.slice(0, max - 1); const i = Math.max(t.lastIndexOf('. '), t.lastIndexOf(', '), t.lastIndexOf(' ')); return t.slice(0, i).replace(/[,;:\s]+$/, '') + '.'; };
let lastCrumbs = null;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const nav = [['/projects/', 'Projects'], ['/services/', 'Services'], ['/our-process/', 'Our process'], ['/meet-chris/', 'Meet Chris']];

function layout({ path, title, desc, body, robots, bodyClass = '', ogImage, preload, ld = [] }) {
  const crumbs = lastCrumbs; lastCrumbs = null;
  const og = ogImage || P['country-homes'].cover;
  const ogUrl = `${SITE}/assets/img/${og.id}-${og.widths.at(-1)}.webp`;
  const pre = preload ? `<link rel="preload" as="image" fetchpriority="high" href="/assets/img/${preload.id}-${preload.widths.at(-1)}.webp" imagesrcset="${preload.widths.map((w) => `/assets/img/${preload.id}-${w}.webp ${w}w`).join(', ')}" imagesizes="(min-width: 900px) 56vw, 82vw">` : '';
  const graph = [...(path === '/' ? [business, website] : []), ...(crumbs && crumbs.length > 1 ? [{ '@type': 'BreadcrumbList', itemListElement: crumbs.map(([h, t], i) => ({ '@type': 'ListItem', position: i + 1, name: t, item: SITE + h })) }] : []), ...ld];
  const jsonld = graph.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>` : '';
  const cur = (p) => (path.startsWith(p) ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#080808"><meta name="color-scheme" content="dark">
<meta name="robots" content="${robots || 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Veness Design &amp; Drafting"><meta property="og:locale" content="en_AU">
<meta property="og:url" content="${SITE}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogUrl}"><meta property="og:image:width" content="${og.widths.at(-1)}"><meta property="og:image:height" content="${Math.round(og.widths.at(-1) * og.h / og.w)}"><meta property="og:image:alt" content="${og.alt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${ogUrl}"><meta name="twitter:image:alt" content="${og.alt}">
${pre}
<link rel="icon" href="/assets/favicon.png" type="image/png"><link rel="apple-touch-icon" href="/assets/favicon.png">
<link rel="preload" href="/assets/fonts/hanken-grotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
${jsonld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="/" aria-label="Veness Design &amp; Drafting, home"><img class="mark" src="/assets/logo-mark.png" width="400" height="455" alt=""><span class="lt"><b>VENESS</b> <span>DESIGN &amp; DRAFTING</span></span></a>
    <nav class="nav" aria-label="Main">
      ${nav.map(([h, t]) => `<a href="${h}"${cur(h)}>${t}</a>`).join('\n      ')}
      <a class="btn" href="/contact/">Discuss your project</a>
    </nav>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="drawer"><span>Menu</span><span class="bars" aria-hidden="true"></span></button>
  </div>
</header>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="wrap">
    <div class="drawer-head"><a class="logo" href="/" aria-label="Veness Design &amp; Drafting, home"><img class="mark" src="/assets/logo-mark.png" width="400" height="455" alt=""><span class="lt"><b>VENESS</b> <span>DESIGN &amp; DRAFTING</span></span></a><button class="menu-btn" type="button" data-close><span>Close</span><span aria-hidden="true" style="font-size:1.6rem;line-height:1">×</span></button></div>
    <nav aria-label="Menu"><ul>
      ${[...nav, ['/contact/', 'Contact']].map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('\n      ')}
    </ul></nav>
    <div class="drawer-actions"><a class="btn" href="/contact/">Discuss your project</a><a class="drawer-tel" href="tel:${TEL}">Call Chris ${PHONE}</a></div>
  </div>
</div>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div><a class="logo" href="/" aria-label="Veness Design &amp; Drafting, home"><img class="mark" src="/assets/logo-mark.png" width="400" height="455" alt=""><span class="lt"><b>VENESS</b> <span>DESIGN &amp; DRAFTING</span></span></a>
        <p class="small" style="margin-top:1.25rem">Residential building designer serving Bowral and the Southern Highlands, NSW.</p></div>
      <nav aria-label="Footer, pages"><h2>Explore</h2><ul>
        <li><a href="/projects/">Projects</a></li><li><a href="/services/">Services</a></li><li><a href="/our-process/">Our process</a></li><li><a href="/meet-chris/">Meet Chris</a></li><li><a href="/client-stories/">Client stories</a></li></ul></nav>
      <nav aria-label="Footer, services"><h2>Services</h2><ul>
        ${services.map((s) => `<li><a href="${s.path}">${s.name}</a></li>`).join('')}</ul></nav>
      <div><h2>Contact</h2><address><a href="tel:${TEL}">${PHONE}</a><a href="mailto:${EMAIL}">${EMAIL}</a><span class="small" style="margin-top:.5rem">Service area: Bowral and the Southern Highlands</span></address></div>
    </div>
    <div class="legal"><p>© <span id="yr">2026</span> Veness Design &amp; Drafting</p><p><a href="/privacy/">Privacy</a> · <a href="/contact/">Contact</a></p></div>
  </div>
</footer>
<script src="/main.js" defer></script>
</body>
</html>`;
}

/* ---------- Components ---------- */
const pcard = (p, cls = '', dim = false, eager = false, sizes = '(min-width: 900px) 40vw, 90vw', quiet = false) => `
<a class="pcard reveal ${cls}" href="/projects/${p.slug}/">
  <div class="frame">${imgTag(p.cover, sizes, { eager })}</div>
  <h3>${p.name}</h3>
  <p class="meta">${p.type}${quiet && p.status === 'Concept render' ? '' : `<span class="status">${p.status}</span>`}</p>
  ${dim && !(quiet && p.status === 'Concept render') ? `<div class="dim" aria-hidden="true"><i></i><span>${p.status.toUpperCase()}</span><i></i></div>` : ''}
</a>`;

const serviceRows = (lv = 3) => `<div class="rows">${services.map((s) => `
  <a class="row" href="${s.path}"><h${lv}>${s.name}</h${lv}><p>${s.short}</p><span class="thumb" aria-hidden="true">${imgTag(P[s.img].cover, '160px', { alt: '' })}</span><span class="go"><span class="t">Explore service</span>${ARR}</span></a>`).join('')}
</div>`;

const steps = [
  ['Discuss your ideas', 'We talk about your property, what you want to change and what matters most.'],
  ['Agree the brief and scope', 'We settle what the project includes, and what it does not, before design begins.'],
  ['Develop the design', 'Plans and options are refined with you, with the reasoning explained along the way.'],
  ['Prepare the agreed documentation', 'Drawings and documents are prepared for the approvals your project needs.'],
];
const stepsHtml = () => `<ol class="steps">${steps.map(([h, p]) => `<li class="step reveal"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>`;

let fid = 0;
const form = () => { const id = 'f' + ++fid; return `
<form class="form" id="${id}" data-enquiry data-endpoint="/api/enquiry" novalidate aria-labelledby="${id}-t">
  <h3 id="${id}-t" style="font-size:1.375rem">Send a project enquiry</h3>
  <div class="summary" role="alert"></div>
  <div class="row2">
    <div class="field"><label for="${id}-name">Name</label><input id="${id}-name" name="name" autocomplete="name" required><p class="err" id="${id}-name-e"></p></div>
    <div class="field"><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email" required><p class="err" id="${id}-email-e"></p></div>
  </div>
  <div class="row2">
    <div class="field"><label for="${id}-phone">Phone <span class="opt">(optional)</span></label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel"><p class="err" id="${id}-phone-e"></p></div>
    <div class="field"><label for="${id}-suburb">Property suburb</label><input id="${id}-suburb" name="suburb" autocomplete="address-level2" required><p class="err" id="${id}-suburb-e"></p></div>
  </div>
  <div class="field"><label for="${id}-type">Project type</label>
    <select id="${id}-type" name="type" required><option value="">Choose one</option><option>New home</option><option>Renovation/extension</option><option>Interiors</option><option>Drafting/documentation</option><option>Not sure yet</option></select><p class="err" id="${id}-type-e"></p></div>
  <div class="field"><label for="${id}-message">About your project</label><textarea id="${id}-message" name="message" required></textarea><p class="err" id="${id}-message-e"></p></div>
  <div class="field"><fieldset class="radios" style="border:0;padding:0;margin:0"><legend style="font-weight:500;font-size:1.0625rem;margin-bottom:.25rem">Preferred contact <span class="opt" style="color:var(--text-2);font-weight:400">(optional)</span></legend>
    <label><input type="radio" name="contact" value="Email"> Email</label><label><input type="radio" name="contact" value="Phone"> Phone</label></fieldset></div>
  <div class="hp" aria-hidden="true"><label>Leave this empty <input name="company" tabindex="-1" autocomplete="off"></label></div>
  <p class="small">Chris will use these details only to reply to your enquiry. See the <a href="/privacy/">privacy notice</a>. You won’t be added to any mailing list.</p>
  <button class="btn" type="submit"><span class="spin" aria-hidden="true"></span><span class="lbl">Send project enquiry</span></button>
  <div class="status-box ok" role="status"><p><strong>Thank you. Your project enquiry has been received.</strong></p></div>
  <div class="status-box fail" role="alert"><p><strong>We couldn’t send your enquiry.</strong> Please try again, or call Chris on <a href="tel:${TEL}">${PHONE}</a>. Your message has been kept.</p></div>
</form>`; };

const enquirySection = (cls = 'rule-top') => `
<section class="section ${cls}" id="enquiry" aria-labelledby="enq-h">
  <div class="wrap enquiry">
    <div class="reveal">
      <h2 id="enq-h">Let’s talk about your home.</h2>
      <p class="lede" style="margin-top:1.5rem">Tell me where your property is and what you’d like to create or change. You don’t need to have all the answers before we speak.</p>
      <div class="contact-list"><a href="tel:${TEL}">${PHONE}</a><a href="mailto:${EMAIL}">${EMAIL}</a><small>Serving Bowral and the Southern Highlands.</small></div>
    </div>
    <div class="reveal d1">${form()}</div>
  </div>
</section>`;

const ctaBand = (h = 'Have a project in mind?') => `
<section class="section cta-band" aria-labelledby="cta-h"><div class="wrap inner"><h2 id="cta-h">${h}</h2><div class="actions"><a class="btn" href="/contact/">Discuss your project ${ARR}</a><a class="tlink" href="tel:${TEL}">Call ${PHONE}</a></div></div></section>`;

const head = (crumbs, h1, lede) => (lastCrumbs = crumbs, `
<div class="wrap page-head">
  ${crumbs ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map(([h, t], i) => (i === crumbs.length - 1 ? `<li aria-current="page">${t}</li>` : `<li><a href="${h}">${t}</a></li>`)).join('')}</ol></nav>` : ''}
  <h1>${h1}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}
</div>`);

const pages = {};

/* ---------- Home ---------- */
pages['/'] = layout({
  path: '/', title: 'Building Designer Bowral & Southern Highlands | Veness',
  desc: 'Residential building design in Bowral and the Southern Highlands. Explore new homes, renovations and extensions with Chris Veness. Discuss your project.',
  preload: P['country-homes'].cover,
  body: `
<section class="hero" aria-labelledby="h1"><div class="wrap">
  <p class="eyebrow"><span>Residential building designer <span aria-hidden="true">|</span> Bowral &amp; Southern Highlands</span></p>
  <h1 id="h1">Residential design for the way you live.</h1>
  <div class="hero-row">
    <p>New homes, renovations and extensions shaped around your site, your priorities and the way you want to live.</p>
    <div class="actions"><a class="btn" href="/contact/">Discuss your project ${ARR}</a><a class="tlink" href="/projects/">Explore projects</a></div>
  </div>
</div></section>

<section class="work" aria-labelledby="work-h">
  <div class="wrap work-head"><h2 id="work-h">Selected projects</h2>
    <div class="car-ctl"><span class="car-count" aria-hidden="true"><b id="car-n">5</b> / 9</span></div></div>
  <div class="carousel" role="region" aria-roledescription="carousel" aria-label="Selected projects" tabindex="0">
    <ul class="car-track">
      ${['formal-garden-homes', 'contemporary-family-homes', 'modern-farmhouse', 'hillside-residences', 'country-homes', 'bowral-streetscapes', 'living-spaces', 'kitchen-and-dining', 'studies-and-nooks'].map((k) => P[k]).map((p) => { const feat = p.slug === 'country-homes'; return `<li class="car-item${feat ? ' feature' : ''}"${feat ? ' data-start' : ''}>${pcard(p, feat ? 'feature' : '', feat, feat, '(min-width: 900px) 56vw, 82vw', true).replace(' reveal', '')}</li>`; }).join('')}
    </ul>
  </div>
  <div class="wrap stagger-foot"><a class="tlink" href="/projects/">View all projects ${ARR}</a></div>
</section>

<section class="section rule-top" aria-labelledby="chris-h"><div class="wrap split">
  <div class="col-a reveal"><figure class="portrait-img"><img src="/assets/chris-veness.webp" width="322" height="405" alt="Chris Veness, wearing glasses and a light blue shirt" loading="lazy" decoding="async"></figure></div>
  <div class="col-b reveal d1">
    <p class="eyebrow">Meet Chris</p>
    <h2 id="chris-h">A personal approach to your home.</h2>
    <p class="lede">I’m Chris Veness. I take time to understand what you need from your home, explore the possibilities with you and explain the decisions along the way.</p>
    <a class="tlink" href="/meet-chris/">Meet Chris ${ARR}</a>
  </div>
</div></section>

<section class="section rule-top" aria-labelledby="help-h"><div class="wrap">
  <h2 id="help-h" style="margin-bottom:clamp(2rem,1.5rem + 2vw,3.5rem)" class="reveal">How I can help.</h2>
  <div class="reveal d1">${serviceRows()}</div>
</div></section>

<section class="section rule-top" aria-labelledby="proc-h"><div class="wrap">
  <h2 id="proc-h" class="reveal" style="margin-bottom:clamp(2rem,1.5rem + 2vw,3.5rem)">Know what happens next.</h2>
  ${stepsHtml()}
  <p class="note">Your proposal will set out the services, fees and consultants relevant to your project.</p>
  <a class="tlink" href="/our-process/">Read about our process ${ARR}</a>
</div></section>

<section class="section rule-top" aria-labelledby="ev-h"><div class="wrap">
  <h2 id="ev-h" class="sr" style="position:absolute;left:-9999px">Client feedback</h2>
  <div class="testi reveal" data-testimonials aria-roledescription="carousel" aria-label="Client feedback">
    <p class="eyebrow">Client stories</p>
    <div class="testi-stage">${stories.map((st, i) => `
      <figure class="testi-item" id="t-panel-${i}" role="tabpanel" aria-labelledby="t-tab-${i}"${i ? ' data-later' : ''}>
        <blockquote>“${st.excerpt}”</blockquote>
        <figcaption><b>${st.by}, ${st.place}</b><span>${st.title}</span></figcaption>
        <a class="tlink" href="/client-stories/#${st.slug}">Read the full story ${ARR}</a>
      </figure>`).join('')}
    </div>
    <div class="testi-ctl" role="tablist" aria-label="Choose a client story">
      ${stories.map((st, i) => `<button class="testi-tab" type="button" role="tab" id="t-tab-${i}" aria-controls="t-panel-${i}" aria-selected="${i === 0}"><span class="bar" aria-hidden="true"></span><span class="who">${st.by}</span><span class="where">${st.place}</span></button>`).join('')}
    </div>
  </div>
</div></section>

${enquirySection()}`,
});

/* ---------- Projects ---------- */
const group = (type) => projects.filter((p) => p.type === type);
pages['/projects/'] = layout({
  path: '/projects/', title: 'Projects | Veness Design & Drafting, Bowral',
  desc: 'Residential design by Chris Veness for Bowral and the Southern Highlands: new home concepts and interior design, grouped by style.',
  body: `${head([['/', 'Home'], ['/projects/', 'Projects']], 'Projects', 'Homes and interiors, grouped by style. Each group shows its status, so you can tell a concept render from a completed build.')}
${[['New homes', 'New home design'], ['Interiors', 'Interior design']].map(([h, t], gi) => `
<section class="wrap" aria-labelledby="g${gi}" style="padding-bottom:var(--section)"><h2 id="g${gi}" style="font-size:var(--fs-h3);margin-bottom:2rem;border-top:1px solid var(--rule);padding-top:2rem">${h} <span class="count">${group(t).length} groups</span></h2>
<ul class="grid-3">${group(t).map((p, i) => `<li>${pcard(p, '', false, gi === 0 && i === 0, '(min-width: 900px) 30vw, 90vw')}<p class="small" style="margin-top:.5rem">${p.images.length} ${p.images.length === 1 ? 'design' : 'designs'}</p></li>`).join('')}</ul></section>`).join('')}
${ctaBand()}`,
});

/* ---------- Project detail ---------- */
for (const p of projects) {
  const svc = services.find((s) => s.path === p.service);
  const others = projects.filter((x) => x !== p && x.type === p.type).slice(0, 3);
  pages[`/projects/${p.slug}/`] = layout({
    path: `/projects/${p.slug}/`, title: `${p.name} | ${p.type} | Veness`,
    desc: cut(`${p.name}, ${p.type.toLowerCase()} by Chris Veness. ${p.blurb}`), ogImage: p.cover, preload: p.cover,
    ld: [{ '@type': 'CollectionPage', name: p.name, url: `${SITE}/projects/${p.slug}/`, description: p.blurb, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#business` }, primaryImageOfPage: { '@type': 'ImageObject', contentUrl: `${SITE}/assets/img/${p.cover.id}-${p.cover.widths.at(-1)}.webp`, description: p.cover.alt } }],
    body: `${head([['/', 'Home'], ['/projects/', 'Projects'], [`/projects/${p.slug}/`, p.name]], p.name)}
<div class="wrap"><p style="margin-top:-1.5rem;color:var(--text-2)">${p.type}<span class="status">${p.status}</span></p>
  <div class="hero-img" style="margin-top:2rem">${imgTag(p.cover, '(min-width: 1440px) 1320px, 100vw', { eager: true })}</div>
  <dl class="facts"><div><dt>Project type</dt><dd>${p.type}</dd></div><div><dt>Status</dt><dd>${p.status}</dd></div><div><dt>Location</dt><dd>Southern Highlands (suburb to be confirmed)</dd></div></dl>
</div>
<section class="section--tight"><div class="wrap prose">
  <div class="two-col"><div class="l"><h2>Overview</h2></div><div class="r"><p>${p.blurb}</p>${p.status === 'Concept render' ? '<p>These images are concept renders. They show design intent and are not completed buildings.</p>' : ''}</div></div>
</div></section>
${p.images.length > 1 ? `<section class="wrap" aria-labelledby="gal-h" style="padding-bottom:var(--section)"><h2 id="gal-h" style="font-size:var(--fs-h3);margin-bottom:2rem">More views</h2>
  <ul class="gallery">${p.images.slice(1).map((im, i) => `<li class="reveal"><figure>${imgTag(im, '(min-width: 900px) 48vw, 100vw')}<figcaption>${p.name} · view ${i + 2} of ${p.images.length}</figcaption></figure></li>`).join('')}</ul></section>` : ''}
<section class="section--tight rule-top"><div class="wrap prose">
  <div class="two-col"><div class="l"><h2>Client brief</h2></div><div class="r"><div class="pending"><span class="tag">CONTENT NEEDED</span><p style="margin:0">Chris to supply: what the client asked for and the problem the design solved.</p></div></div></div>
  <div class="two-col" style="margin-top:3rem"><div class="l"><h2>Key design decisions</h2></div><div class="r"><div class="pending"><span class="tag">CONTENT NEEDED</span><p style="margin:0">Chris to supply: the decisions that shaped the design, and why.</p></div></div></div>
  <div class="two-col" style="margin-top:3rem"><div class="l"><h2>Chris’s scope</h2></div><div class="r"><div class="pending"><span class="tag">CONTENT NEEDED</span><p style="margin:0">Chris to supply: which services were provided on this project.</p></div></div></div>
  <div class="two-col" style="margin-top:3rem"><div class="l"><h2>Related service</h2></div><div class="r"><a class="tlink" href="${svc.path}">${svc.name} ${ARR}</a></div></div>
</div></section>
<section class="section rule-top"><div class="wrap"><h2 style="font-size:var(--fs-h3);margin-bottom:2rem">More ${p.type === 'Interior design' ? 'interiors' : 'homes'}</h2><ul class="grid-3">${others.map((o) => `<li>${pcard(o, '', false, false, '(min-width: 900px) 30vw, 90vw')}</li>`).join('')}</ul></div></section>
${ctaBand('Thinking about something similar?')}`,
  });
}

/* ---------- Services ---------- */
pages['/services/'] = layout({
  path: '/services/', title: 'Services | Building Designer Bowral | Veness',
  desc: 'New home design, renovations and extensions, interior design and drafting for homeowners in Bowral and the Southern Highlands.',
  body: `${head([['/', 'Home'], ['/services/', 'Services']], 'How I can help.', 'Four ways to work together, depending on where your project is up to. Not sure which fits? Start with a conversation.')}
<section class="wrap" style="padding-bottom:var(--section)">${serviceRows(2)}</section>${ctaBand('Not sure where to start?')}`,
});

const svcPages = {
  'new-home-design': {
    title: 'New Home Design Bowral & Southern Highlands | Veness', h1: 'New home design in Bowral and the Southern Highlands',
    desc: 'Custom new home design for Bowral and the Southern Highlands. Work directly with building designer Chris Veness from first idea to documentation.',
    lede: 'A new home should fit your block, your climate and the way you live day to day. I design it with you, step by step.',
    who: 'Homeowners building on a block they own or are about to buy, whether that is a small suburban lot or acreage in the Southern Highlands.',
    solve: ['Making the most of aspect, views and slope', 'Balancing what you want with what your budget allows', 'Understanding what approvals your site is likely to need', 'Turning a rough brief into clear plans a builder can price'],
    scope: ['Site analysis and design brief', 'Concept plans and options', 'Developed design, including materials and finishes', 'Drawings and documentation for the agreed approval pathway'],
    proj: P['modern-farmhouse'],
    faqs: [['Do I need a block before we talk?', 'No. It can help to talk early, even while you are choosing a site.'], ['Will you help me find a builder?', 'Your proposal will set out what is and is not included. Builder selection is discussed at the brief stage.']],
  },
  'renovations-extensions': {
    title: 'Home Extension & Renovation Design Bowral | Veness', h1: 'Renovation and extension design in the Southern Highlands',
    desc: 'Home extension and renovation design in Bowral and the Southern Highlands. Improve the home you have with building designer Chris Veness.',
    lede: 'The best renovations respect what is already good about a house and fix what is not. I help you work out which is which.',
    who: 'Owners of existing homes who need more space, better flow, more light, or a home that suits the next stage of life.',
    solve: ['Adding rooms without losing the garden or the character', 'Opening up dark or cramped layouts', 'Working out what can change and what is best left alone', 'Planning work so you understand scope before you commit'],
    scope: ['Measured survey and review of the existing home', 'Concept options and a recommended direction', 'Developed design and materials', 'Drawings and documentation for the agreed approval pathway'],
    proj: null,
    faqs: [['Can I stay in the house during the work?', 'That depends on the scope and your builder. We can discuss it early so the design suits how you need to live.'], ['How do I know what approvals I need?', 'It depends on your property and the work. Chris will explain the likely pathway once he understands your project.']],
  },
  'interior-design': {
    title: 'Interior Design Bowral & Southern Highlands | Veness', h1: 'Interior design for homes in Bowral and the Southern Highlands',
    desc: 'Residential interior and joinery design in Bowral and the Southern Highlands with Chris Veness. Layouts, kitchens and finishes that work.',
    lede: 'Good interiors start with how you use each room. Layout, joinery and materials all follow from that.',
    who: 'Homeowners updating a kitchen, bathroom or living areas, or finishing the inside of a new build or extension.',
    solve: ['Kitchens and bathrooms that are hard to use', 'Storage that never seems to be enough', 'Choosing materials and finishes that work together', 'Getting joinery drawn clearly so it is built as designed'],
    scope: ['Layout planning and joinery design', 'Material and finish selection', 'Joinery drawings and documentation', 'Coordination with your builder or joiner as agreed'],
    proj: P['living-spaces'],
    faqs: [['Do you do interiors on their own?', 'Please confirm with Chris which interior services are currently offered before enquiring.'], ['Can you work with my builder?', 'Yes. The proposal sets out how design and site coordination are shared.']],
  },
  'drafting-documentation': {
    title: 'Drafting Services & House Plans Bowral | Veness', h1: 'Drafting and documentation in Bowral and the Southern Highlands',
    desc: 'Drafting services and house plans in Bowral and the Southern Highlands. Clear, accurate drawings and documentation from Veness Design & Drafting.',
    lede: 'Clear drawings make approvals smoother and building easier to price. I prepare documentation that says what it needs to say.',
    who: 'Owners and builders who already have a design and need it drawn and documented, or who need plans updated for an approval.',
    solve: ['Turning sketches or ideas into accurate plans', 'Preparing drawings for a council or certifier', 'Updating existing plans for changes', 'Producing documents a builder can quote from'],
    scope: ['Existing conditions drawings', 'Plans, elevations and sections', 'Construction documentation as agreed', 'Coordination with consultants named in your proposal'],
    proj: P['contemporary-family-homes'],
    faqs: [['What is a DA, CDC and CC?', 'In NSW a project may need a Development Application (DA), a Complying Development Certificate (CDC) and/or a Construction Certificate (CC). Which applies depends on your property and the work. Approvals are issued by the relevant authority or certifier, not by the designer.'], ['Are engineers and other consultants included?', 'Consultant costs and coordination responsibilities are set out in your proposal so there are no surprises.']],
  },
};
const heroOf = { 'new-home-design': ['country-homes', 2], 'interior-design': ['living-spaces', 1], 'drafting-documentation': ['contemporary-family-homes', 3] };
for (const [slug, s] of Object.entries(svcPages)) {
  const path = `/services/${slug}/`;
  const name = services.find((x) => x.path === path).name;
  pages[path] = layout({
    path, title: s.title, desc: cut(s.desc),
    ld: [{ '@type': 'Service', name, serviceType: name, url: SITE + path, description: s.lede, provider: { '@id': `${SITE}/#business` }, areaServed: [{ '@type': 'City', name: 'Bowral' }, { '@type': 'AdministrativeArea', name: 'Southern Highlands, NSW' }] }],
    body: `${head([['/', 'Home'], ['/services/', 'Services'], [path, name]], s.h1, s.lede)}
<section class="section--tight"><div class="wrap prose">
  ${heroOf[slug] ? `<div class="hero-img" style="margin-bottom:3.5rem">${imgTag(P[heroOf[slug][0]].images[heroOf[slug][1]], '(min-width: 1440px) 1320px, 100vw', { eager: true })}</div>` : ''}
  <div class="two-col"><div class="l"><h2>Who it helps</h2></div><div class="r"><p>${s.who}</p></div></div>
  <div class="two-col" style="margin-top:3.5rem"><div class="l"><h2>Problems I can help solve</h2></div><div class="r"><ul>${s.solve.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
  <div class="two-col" style="margin-top:3.5rem"><div class="l"><h2>What’s typically included</h2></div><div class="r"><ul>${s.scope.map((x) => `<li>${x}</li>`).join('')}</ul><p>Your proposal sets out exactly which services, fees and consultants apply to your project.</p></div></div>
  <div class="two-col" style="margin-top:3.5rem"><div class="l"><h2>Related project</h2></div><div class="r">${s.proj ? `<div style="max-width:560px">${pcard(s.proj, '', false, false, '(min-width: 900px) 40vw, 90vw')}</div>` : '<div class="pending"><span class="tag">CONTENT NEEDED</span><p style="margin:0">Chris to supply a renovation or extension example.</p></div>'}</div></div>
  <div class="two-col" style="margin-top:3.5rem"><div class="l"><h2>How we work together</h2></div><div class="r"><p>We start with a conversation, agree the brief and scope, then develop the design with you. You’re asked for decisions at clear points, and each one is explained. <a href="/our-process/" style="color:var(--text)">See the full process</a>.</p></div></div>
  <div class="two-col faq" style="margin-top:3.5rem"><div class="l"><h2>Common questions</h2></div><div class="r">${s.faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}<p class="small" style="margin-top:1rem">General guidance only. The right approval pathway is specific to each project.</p></div></div>
</div></section>${ctaBand()}`,
  });
}

/* ---------- Process ---------- */
pages['/our-process/'] = layout({
  path: '/our-process/', title: 'Our Process | Veness Design & Drafting',
  desc: 'How a project with Chris Veness works, from the first conversation through design to documentation, and who is responsible for what.',
  body: `${head([['/', 'Home'], ['/our-process/', 'Our process']], 'Know what happens next.', 'Every project is different, but the way we work together follows four clear stages.')}
<div class="wrap" style="padding-bottom:var(--section)"><div class="hero-img">${imgTag(P['studies-and-nooks'].cover, '(min-width: 1440px) 1320px, 100vw')}</div></div>
<section class="section--tight"><div class="wrap prose">
  ${[
    ['Discuss your ideas', 'We talk about your property, what you would like to create or change, and what matters most to you. It helps to bring any photos, sketches or notes, but you don’t need to have answers.', 'You: share your ideas and any site information you have. Chris: listens, asks questions and explains what is possible.'],
    ['Agree the brief and scope', 'We agree what the project includes, and what it does not, in a written proposal. It sets out the services, fees and consultants relevant to your project.', 'You: review and confirm the proposal. Chris: explains each item in plain language.'],
    ['Develop the design', 'Concept plans and options are refined with you. Each decision is explained so you can make it with confidence.', 'You: give feedback at agreed points. Chris: develops the design and coordinates with named consultants.'],
    ['Prepare the agreed documentation', 'Drawings and documents are prepared for the approvals your project needs. The applicable pathway depends on your property and the work, and approvals are issued by the relevant authority or certifier.', 'You: confirm final details. Chris: prepares documentation as set out in your proposal.'],
  ].map(([h, p, r], i) => `<div class="two-col" style="padding-block:2.5rem;border-top:1px solid var(--rule)"><div class="l"><p class="eyebrow" style="margin-bottom:.5rem">Step ${i + 1}</p><h2 style="margin:0">${h}</h2></div><div class="r"><p>${p}</p><p><strong>Who does what.</strong> ${r}</p></div></div>`).join('')}
  <p class="note" style="border-top:1px solid var(--rule);padding-top:2rem">Your proposal will set out the services, fees and consultants relevant to your project. Not every project follows the same approval route.</p>
</div></section>${ctaBand()}`,
});

/* ---------- Meet Chris ---------- */
pages['/meet-chris/'] = layout({
  path: '/meet-chris/', title: 'Meet Chris Veness, Building Designer | Veness',
  desc: 'Meet Chris Veness, founder of Veness Design & Drafting: a personal, honest approach to new homes, renovations and extensions in the Southern Highlands.',
  ld: [{ '@type': 'Person', name: 'Chris Veness', jobTitle: 'Building designer', url: `${SITE}/meet-chris/`, worksFor: { '@id': `${SITE}/#business` } }],
  body: `${head([['/', 'Home'], ['/meet-chris/', 'Meet Chris']], 'A personal approach to your home.')}
<section class="section--tight"><div class="wrap split">
  <div class="col-b prose"><p class="lede" style="color:var(--text)">${bio.lede}</p>
    ${bio.sections.map((sec) => `<h2>${sec.h}</h2>${sec.paras.map((t) => `<p>${t}</p>`).join('')}`).join('')}
    <p class="lede" style="color:var(--text);margin-top:2.5rem;border-top:1px solid var(--rule);padding-top:2rem">${bio.closing}</p>
    <div class="actions" style="margin-top:2rem"><a class="btn" href="/contact/">Discuss your project ${ARR}</a><a class="tlink" href="/client-stories/">Read client stories</a></div></div>
  <div class="col-a" style="align-self:start;position:sticky;top:calc(var(--header-h) + 1.5rem)"><figure class="portrait-img"><img src="/assets/chris-veness.webp" width="322" height="405" alt="Chris Veness, wearing glasses and a light blue shirt" loading="lazy" decoding="async"></figure></div>
</div></section>${ctaBand()}`,
});

/* ---------- Client stories ---------- */
pages['/client-stories/'] = layout({
  path: '/client-stories/', title: 'Client Stories | Veness Design & Drafting',
  desc: 'What homeowners and business owners in Bowral and the Southern Highlands say about working with Chris Veness.',
  body: `${head([['/', 'Home'], ['/client-stories/', 'Client stories']], 'Client stories.', 'In their own words: clients who have worked with Chris on a new home, an extension and a renovation.')}
<section class="section--tight"><div class="wrap">
  ${stories.map((st) => `<article class="story rule-top" aria-labelledby="${st.slug}">
    <div class="two-col"><div class="l"><h2 id="${st.slug}">${st.title}</h2><p class="small" style="margin-top:.75rem">${st.by}, ${st.place}</p><p style="margin-top:1rem"><a class="tlink" href="${st.service}">${services.find((x) => x.path === st.service).name} ${ARR}</a></p></div>
    <div class="r"><blockquote class="story-q">${st.paras.map((t, i) => `<p>${i === 0 ? '“' : ''}${t}${i === st.paras.length - 1 ? '”' : ''}</p>`).join('')}<footer>${st.by}, ${st.place}</footer></blockquote></div></div>
  </article>`).join('')}
  <p class="note rule-top" style="padding-top:2rem">Want to know more about the person behind these projects? <a class="tlink" href="/meet-chris/">Meet Chris ${ARR}</a></p>
</div></section>${ctaBand()}`,
});

/* ---------- Contact ---------- */
pages['/contact/'] = layout({
  path: '/contact/', title: 'Contact | Discuss Your Project | Veness',
  desc: 'Contact Chris Veness about a new home, renovation, extension or drafting project in Bowral and the Southern Highlands.',
  body: `${head([['/', 'Home'], ['/contact/', 'Contact']], 'Discuss your project.')}
${enquirySection('')}
<section class="section--tight rule-top"><div class="wrap two-col prose"><div class="l"><h2>What happens next</h2></div><div class="r"><p>Chris reads every enquiry and will get in touch to talk through your project. The first conversation is about your property, your ideas and whether working together makes sense. There’s no need to prepare anything formal.</p></div></div></section>`,
});

/* ---------- Privacy ---------- */
pages['/privacy/'] = layout({
  path: '/privacy/', title: 'Privacy | Veness Design & Drafting', desc: 'How Veness Design & Drafting collects and uses information from project enquiries.',
  body: `${head([['/', 'Home'], ['/privacy/', 'Privacy']], 'Privacy.')}
<section class="section--tight"><div class="wrap prose" style="max-width:48rem"><div class="pending" style="margin-bottom:2rem"><span class="tag">DRAFT: CONFIRM BEFORE LAUNCH</span><p style="margin:0">This wording must be checked against the enquiry handling, hosting and analytics actually used, and approved by Chris.</p></div>
<h2>What we collect</h2><p>When you send a project enquiry we collect the details you enter: your name, email, optional phone number, property suburb, project type, message and preferred contact method.</p>
<h2>How we use it</h2><p>We use these details only to reply to your enquiry and discuss your project. We don’t add you to a mailing list or ask for marketing consent through the enquiry form.</p>
<h2>Who sees it</h2><p>Your enquiry is delivered to the Veness business inbox. [Hosting, form service and retention period to be confirmed.]</p>
<h2>Contact</h2><p>To ask about or request deletion of your details, email <a href="mailto:${EMAIL}" style="color:var(--text)">${EMAIL}</a>.</p></div></section>`,
});

/* ---------- 404 ---------- */
pages['/404.html'] = layout({
  path: '/404.html', title: 'Page not found | Veness', desc: 'That page could not be found.', robots: 'noindex',
  body: `<section class="center-page"><div class="wrap page-head"><h1>We can’t find that page.</h1><p class="lede">It may have moved. Try one of these instead.</p><div class="actions" style="margin-top:2rem"><a class="btn" href="/projects/">View projects</a><a class="btn btn--outline" href="/contact/">Contact Chris</a></div></div></section>`,
});

/* ---------- Write ---------- */
rmSync('dist', { recursive: true, force: true });
for (const [p, html] of Object.entries(pages)) {
  const out = p.endsWith('.html') ? join('dist', p) : join('dist', p, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}
cpSync('src/assets', 'dist/assets', { recursive: true });
cpSync('src/styles.css', 'dist/styles.css');
cpSync('src/main.js', 'dist/main.js');
const urls = Object.keys(pages).filter((p) => !p.endsWith('.html'));
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('Built', Object.keys(pages).length, 'pages');
