const $ = (id) => document.getElementById(id);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 900px)').matches;
const flag = (iso2, w = 80) => `https://flagcdn.com/w${w}/${iso2}.png`;
const missionByIso = new Map(MISSIONS.map((m) => [m.iso2, m]));
const isoOf = (f) => f.properties.ISO_A2_EH.toLowerCase();
const namePt = (f) => f.properties.NAME_PT;

/* ---------- Globo ---------- */
const hero = $('inicio');
const stage = $('stage');
const wrap = document.querySelector('.globe-wrap');
const panel = $('panel');
const hint = document.querySelector('.hint');
const hintDefault = hint.textContent;
const HOME = { lat: -5, lng: -20, altitude: 2.3 };
let features = [];
let labels = [];
let selected = null;

const globe = new Globe($('globe'))
  .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .backgroundColor('rgba(0,0,0,0)')
  .atmosphereColor('#8fb4ff')
  .atmosphereAltitude(0.2)
  .polygonsTransitionDuration(500)
  .onPolygonClick((f) => focusCountry(f))
  // Borda dourada grossa: linhas de polígono no WebGL têm sempre 1px, então desenhamos o contorno como path.
  .pathPointLat((p) => p[1])
  .pathPointLng((p) => p[0])
  .pathPointAlt(0.027)
  .pathColor(() => '#d4af37')
  .pathStroke(2.5)
  .pathTransitionDuration(0)
  // Nomes dos países e pino são elementos HTML (a fonte 3D do three.js não tem acentos).
  .htmlElement((d) => d.el)
  .htmlAltitude((d) => (d.pin ? 0.03 : 0.012))
  .htmlTransitionDuration(0)
  .pointOfView(HOME);

const controls = globe.controls();
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = 0.35;
controls.enableZoom = true;
controls.minDistance = 130; // altitude mínima 0.3 (raio do globo = 100)
controls.maxDistance = 500;
// Roda do mouse só dá zoom com Ctrl/⌘ (ou pinça do trackpad); sem isso a página rola normalmente.
wrap.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation(); }, { capture: true });

function zoomBy(factor) {
  const pov = globe.pointOfView();
  globe.pointOfView({ ...pov, altitude: Math.min(4, Math.max(0.3, pov.altitude * factor)) }, reduceMotion ? 0 : 400);
}
$('zoom-in').addEventListener('click', () => zoomBy(0.7));
$('zoom-out').addEventListener('click', () => zoomBy(1 / 0.7));

const pinEl = document.createElement('div');
pinEl.className = 'pin';
pinEl.innerHTML = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill="#d4af37"/><circle cx="12" cy="12" r="4.5" fill="#0a0f1e"/></svg>';

function paint() {
  globe
    .polygonCapColor((f) => (f === selected ? 'rgba(212,175,55,0.3)' : missionByIso.has(isoOf(f)) ? 'rgba(212,175,55,0.08)' : 'rgba(0,0,0,0)'))
    .polygonStrokeColor((f) => (f === selected ? '#d4af37' : 'rgba(255,255,255,0.14)'))
    .polygonSideColor((f) => (f === selected ? 'rgba(212,175,55,0.35)' : 'rgba(0,0,0,0)')) // laterais só no país selecionado
    .polygonAltitude((f) => (f === selected ? 0.025 : 0.005));
}

function sizeGlobe() {
  globe.width(wrap.clientWidth).height(wrap.clientHeight);
}
addEventListener('resize', sizeGlobe);
sizeGlobe();
paint();

// Distância da câmera para o globo inteiro caber em w x h (a câmera tem FOV vertical fixo).
function fitAltitude(w, h) {
  const k = ((0.86 * Math.min(w, h)) / h) * Math.tan((globe.camera().fov * Math.PI) / 360);
  return Math.max(1.6, 1 / Math.sin(Math.atan(k)) - 1);
}

// Desktop: o globo encolhe para a metade esquerda e o painel ocupa a direita, sem sobrepor.
function layout(focused) {
  if (isMobile()) {
    gsap.set(wrap, { clearProps: 'width' });
    sizeGlobe();
    return wrap.clientWidth;
  }
  const w = stage.clientWidth * (focused ? 0.5 : 1);
  gsap.to(wrap, { width: w, duration: reduceMotion ? 0 : 0.9, ease: 'power3.inOut', onUpdate: sizeGlobe, onComplete: () => gsap.set(wrap, { width: focused ? '50%' : '100%' }) });
  return w;
}

const outerRings = (f) => {
  const g = f.geometry;
  return (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((p) => p[0]);
};
const labelPoint = (f) => ({ lat: f.properties.LABEL_Y, lng: f.properties.LABEL_X });

function updateLabels({ altitude }) {
  labels.forEach((d) => d.el.classList.toggle('is-far', altitude > d.showAt));
}
globe.onZoom(updateLabels);

function renderHtml() {
  globe.htmlElementsData(selected ? [...labels, { ...labelPoint(selected), el: pinEl, pin: true }] : labels);
}

// Natural Earth: traz o nome em português (NAME_PT) e o ponto ideal para o rótulo (LABEL_X/Y).
fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson')
  .then((r) => r.json())
  .then((geo) => {
    features = geo.features.filter((f) => /^[A-Z]{2}$/.test(f.properties.ISO_A2_EH) && f.properties.ISO_A2_EH !== 'AQ');
    labels = features.map((f) => {
      const mission = missionByIso.has(isoOf(f));
      const el = document.createElement('div');
      el.className = mission ? 'country-label' : 'country-label minor';
      el.textContent = namePt(f);
      // Países com missão sempre aparecem; os demais surgem com o zoom, os maiores primeiro (MIN_LABEL baixo).
      return { ...labelPoint(f), el, showAt: mission ? Infinity : Math.max(0.35, 2 - 0.3 * f.properties.MIN_LABEL) };
    });
    globe.polygonsData(features);
    paint();
    renderHtml();
    updateLabels(globe.pointOfView());
  })
  .catch(() => { hint.textContent = 'Não foi possível carregar os países. Recarregue a página.'; });

function focusCountry(f) {
  if (!f) return;
  const mission = missionByIso.get(isoOf(f));
  selected = f;
  paint();
  globe.pathsData(outerRings(f));
  renderHtml();
  controls.autoRotate = false;

  if (mission) {
    hint.textContent = hintDefault;
    hint.classList.remove('warn');
    showPanel(mission);
  } else {
    hidePanel();
    hint.textContent = `Ainda não temos missão em ${namePt(f)}. Ore conosco por esta nação.`;
    hint.classList.add('warn');
  }
  const w = layout(!!mission);
  globe.pointOfView({ ...labelPoint(f), altitude: fitAltitude(w, wrap.clientHeight) }, reduceMotion ? 0 : 1600);
}

const photoFigures = (m) => m.photos.map((p) => {
  const fig = document.createElement('figure');
  const img = document.createElement('img');
  img.src = p.src;
  img.alt = p.caption;
  img.loading = 'lazy';
  img.draggable = false;
  const cap = document.createElement('figcaption');
  cap.textContent = p.caption;
  fig.append(img, cap);
  return fig;
});

function showPanel(m) {
  $('panel-flag').src = flag(m.iso2);
  $('panel-flag').alt = `Bandeira de ${m.name}`;
  $('panel-name').textContent = m.name;
  $('panel-summary').textContent = m.summary;
  $('panel-photos').replaceChildren(...photoFigures(m));
  panel.hidden = false;
  hero.classList.add('is-focused');
  if (!reduceMotion) {
    gsap.fromTo(panel.children, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, delay: 0.35 });
  }
  if (isMobile()) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
}

function hidePanel() {
  panel.hidden = true;
  hero.classList.remove('is-focused');
}

function resetGlobe() {
  selected = null;
  paint();
  globe.pathsData([]);
  renderHtml();
  hidePanel();
  layout(false);
  hint.textContent = hintDefault;
  hint.classList.remove('warn');
  controls.autoRotate = !reduceMotion;
  globe.pointOfView({ ...globe.pointOfView(), altitude: HOME.altitude }, reduceMotion ? 0 : 1000);
}

$('panel-close').addEventListener('click', resetGlobe);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected) resetGlobe(); });

/* ---------- Busca ---------- */
function findCountry(text) {
  const q = norm(text);
  if (!q) return null;
  const by = (fn) => features.find((f) => fn(norm(namePt(f))));
  return by((n) => n === q) || by((n) => n.startsWith(q));
}

/* Lista suspensa: sem texto mostra os países com missões; digitando, filtra esses e sugere os demais países. */
const input = $('country');
const list = $('country-list');
let options = [];
let active = -1;

function suggestions(text) {
  const q = norm(text);
  const match = (name) => !q || norm(name).includes(q);
  const missions = MISSIONS.filter((m) => match(m.name)).map((m) => ({ name: m.name, iso2: m.iso2, mission: true }));
  if (!q) return missions;
  const others = features
    .filter((f) => !missionByIso.has(isoOf(f)) && match(namePt(f)))
    .map((f) => ({ name: namePt(f), iso2: isoOf(f), mission: false }))
    .sort((a, b) => norm(b.name).startsWith(q) - norm(a.name).startsWith(q) || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, 6);
  return [...missions, ...others];
}

function openList() {
  options = suggestions(input.value);
  active = -1;
  input.removeAttribute('aria-activedescendant');
  if (!options.length) return closeList();
  const item = (o, i) => `<li role="option" id="opt-${i}" data-i="${i}" aria-selected="false"><img src="${flag(o.iso2, 40)}" alt="" width="22">${o.name}</li>`;
  const missions = options.map((o, i) => (o.mission ? item(o, i) : '')).join('');
  const others = options.map((o, i) => (o.mission ? '' : item(o, i))).join('');
  list.innerHTML =
    (missions ? `<li class="combo-group" role="presentation">Países com missões</li>${missions}` : '') +
    (others ? `<li class="combo-group" role="presentation">Outros países</li>${others}` : '');
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

function closeList() {
  list.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
  active = -1;
}

function setActive(i) {
  list.querySelector('[aria-selected="true"]')?.setAttribute('aria-selected', 'false');
  active = (i + options.length) % options.length;
  const el = $(`opt-${active}`);
  el.setAttribute('aria-selected', 'true');
  el.scrollIntoView({ block: 'nearest' });
  input.setAttribute('aria-activedescendant', el.id);
}

function choose(o) {
  input.value = o.name;
  closeList();
  focusCountry(features.find((f) => isoOf(f) === o.iso2));
}

input.addEventListener('focus', openList);
input.addEventListener('input', openList);
input.addEventListener('blur', closeList);
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (list.hidden) openList();
    if (options.length) setActive(active + (e.key === 'ArrowDown' ? 1 : -1));
  } else if (e.key === 'Enter' && active >= 0) {
    e.preventDefault();
    choose(options[active]);
  } else if (e.key === 'Escape') {
    closeList();
  }
});
list.addEventListener('mousedown', (e) => e.preventDefault()); // mantém o foco no campo
list.addEventListener('click', (e) => {
  const li = e.target.closest('[data-i]');
  if (li) choose(options[li.dataset.i]);
});
$('country-toggle').addEventListener('mousedown', (e) => e.preventDefault());
$('country-toggle').addEventListener('click', () => {
  if (!list.hidden) return closeList();
  if (document.activeElement === input) openList();
  else input.focus(); // o foco já abre a lista
});

$('search').addEventListener('submit', (e) => {
  e.preventDefault();
  closeList();
  const f = findCountry(input.value);
  if (f) {
    focusCountry(f);
  } else {
    hint.textContent = 'País não encontrado. Tente outro nome.';
    hint.classList.add('warn');
  }
});

/* ---------- Galeria (carrossel) ---------- */
// Arrastar com o mouse; no toque o navegador já rola sozinho.
function dragScroll(el) {
  let down = false, moved = false, startX = 0, startLeft = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('is-dragging'); }
    if (moved) el.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    el.classList.remove('is-dragging');
  });
  // Um arraste não conta como clique no card.
  el.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

const gallery = $('gallery');
const detail = $('gallery-detail');
let openCard = null;
let openScroll = 0;

function setCardOpen(card, open) {
  card.setAttribute('aria-expanded', open);
  card.querySelector('.gallery-link').textContent = open ? 'Fechar ↑' : 'Ver fotos e detalhes ↓';
}

function toggleDetail(card, m) {
  if (openCard === card) return closeDetail();
  if (openCard) setCardOpen(openCard, false);
  openCard = card;
  openScroll = gallery.scrollLeft;
  setCardOpen(card, true);
  detail.innerHTML = `
    <div class="gallery-detail-top">
      <div class="gallery-detail-head"><img src="${flag(m.iso2)}" alt="Bandeira de ${m.name}"><h3>${m.name}</h3></div>
      <p class="swipe-hint" aria-hidden="true">Arraste as fotos <span class="swipe-arrow">→</span></p>
    </div>
    <p>${m.summary}</p>
    <div class="gallery-detail-photos carousel"></div>`;
  const photos = detail.querySelector('.gallery-detail-photos');
  photos.replaceChildren(...photoFigures(m));
  dragScroll(photos);
  gsap.killTweensOf(detail);
  detail.hidden = false;
  if (reduceMotion) return ScrollTrigger.refresh(); // a altura da página mudou
  gsap.fromTo(detail, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'height', onComplete: () => ScrollTrigger.refresh() });
}

// Fecha (minimiza) as fotos do país aberto.
function closeDetail() {
  if (!openCard) return;
  setCardOpen(openCard, false);
  openCard = null;
  const done = () => { detail.hidden = true; gsap.set(detail, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); };
  if (reduceMotion) return done();
  gsap.killTweensOf(detail);
  gsap.to(detail, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: done });
}

// Arrastar o carrossel de países para o lado minimiza as fotos abertas.
gallery.addEventListener('scroll', () => {
  if (openCard && Math.abs(gallery.scrollLeft - openScroll) > 60) closeDetail();
}, { passive: true });
dragScroll(gallery);

gallery.replaceChildren(...MISSIONS.map((m) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'gallery-card reveal';
  card.setAttribute('aria-controls', 'gallery-detail');
  card.setAttribute('aria-expanded', 'false');
  card.innerHTML = `
    <img class="cover" src="${m.photos[0].src}" alt="" loading="lazy" draggable="false">
    <div class="gallery-body">
      <div class="gallery-name"><img src="${flag(m.iso2)}" alt="Bandeira de ${m.name}"> ${m.name}</div>
      <p>${m.summary}</p>
      <span class="gallery-link">Ver fotos e detalhes ↓</span>
    </div>`;
  card.addEventListener('click', () => toggleDetail(card, m));
  return card;
}));

/* ---------- Projeto ---------- */
const projects = $('projects');
projects.replaceChildren(...PROJECTS.map((p) => {
  const pct = Math.min(100, Math.round((p.raised / p.total) * 100));
  const card = document.createElement('article');
  card.className = 'build-card reveal';
  card.innerHTML = `
    <img src="${p.image}" alt="${p.title}" loading="lazy" draggable="false">
    <div class="build-body">
      <h3>${p.title}</h3>
      <p>${p.text}</p>
      <dl class="build-stats">
        <div><dt>Valor da obra</dt><dd>${brl.format(p.total)}</dd></div>
        <div><dt>Já arrecadado</dt><dd class="gold">${brl.format(p.raised)}</dd></div>
        <div><dt>Falta arrecadar</dt><dd>${brl.format(Math.max(0, p.total - p.raised))}</dd></div>
      </dl>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Arrecadado">
        <span data-pct="${pct}"></span>
      </div>
      <p class="progress-label">${pct}% da meta</p>
      <a href="#contribuir" class="btn">Contribuir</a>
    </div>`;
  return card;
}));
dragScroll(projects);

/* ---------- Contribuir ---------- */
const ICON_YES = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#22c55e"/><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NO = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#ef4444"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
document.querySelectorAll('.give-card[data-tier]').forEach((card) => {
  const tier = Number(card.dataset.tier);
  card.querySelector('.benefits').innerHTML = BENEFITS.map((b) => {
    const yes = tier >= b.tier;
    return `<li class="${yes ? 'yes' : 'no'}">${yes ? ICON_YES : ICON_NO}<span>${b.text}<span class="sr-only">${yes ? ' (incluso)' : ' (não incluso)'}</span></span></li>`;
  }).join('');
});
$('pix-qr').src = PIX.qr;
$('pix-key').textContent = PIX.key;
$('pix-receiver').textContent = `Favorecido: ${PIX.receiver}`;
$('pix-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(PIX.key);
    btn.textContent = 'Chave copiada!';
  } catch {
    btn.textContent = 'Copie a chave acima';
  }
  setTimeout(() => { btn.textContent = 'Copiar chave'; }, 2500);
});
$('p495').href = PLANS.p495;
$('p995').href = PLANS.p995;
$('p495-inst').textContent = brl.format(495 / 12);
$('p995-inst').textContent = brl.format(995 / 12);
$('whatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Quero contribuir com a Missão Ide com um valor acima de R$ 995.')}`;

/* ---------- Animações (GSAP) ---------- */
gsap.registerPlugin(ScrollTrigger, SplitText);
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  SplitText.create('.headline', {
    type: 'words',
    mask: 'words',
    autoSplit: true,
    onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.05 }),
  });
  gsap.from('.search, .hint', { opacity: 0, y: 20, duration: 0.8, delay: 0.6, ease: 'power3.out' });
  gsap.from('.globe-wrap', { opacity: 0, scale: 0.85, duration: 1.6, delay: 0.2, ease: 'power3.out' });

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  gsap.utils.toArray('.progress span').forEach((bar) => gsap.to(bar, {
    width: `${bar.dataset.pct}%`, duration: 1.6, ease: 'power2.out',
    scrollTrigger: { trigger: bar, start: 'top 85%', once: true },
  }));
});

mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.utils.toArray('.progress span').forEach((bar) => gsap.set(bar, { width: `${bar.dataset.pct}%` }));
});
