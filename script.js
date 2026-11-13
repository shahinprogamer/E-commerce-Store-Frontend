/* ===== Shared behaviour: reveal, spotlight, nav, ripple, counters, progress ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = (msg) => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800); };
(function base() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  window.observeReveal = (root = document) => $$('[data-r]:not(.in)', root).forEach((el) => io.observe(el));
  observeReveal();
  // counters
  const co = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; co.unobserve(e.target); const el = e.target, to = +el.dataset.count, suf = el.dataset.suf || ''; if (reduce) { el.textContent = to + suf; return; } const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1600), v = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * v).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); })(t0); }), { threshold: .6 });
  $$('[data-count]').forEach((el) => co.observe(el));
  // spotlight + progress + nav state
  const spot = $('.spot'), bar = $('.bar'), nav = $('.nav');
  let mx = innerWidth / 2, my = innerHeight / 3, sx = mx, sy = my;
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  (function loop() { sx += (mx - sx) * .12; sy += (my - sy) * .12; if (spot) spot.style.transform = `translate(${sx}px,${sy}px)`; requestAnimationFrame(loop); })();
  const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; if (nav) nav.classList.toggle('sm', scrollY > 30); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // nav links highlight + burger
  const links = $$('.links a[href^="#"]');
  const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { threshold: .5 });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) so.observe(s); a.addEventListener('click', () => $('.links')?.classList.remove('open')); });
  $('.burger')?.addEventListener('click', (e) => { const o = $('.links').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  // ripple
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest('.btn'); if (!b) return; const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span'); d.className = 'rp'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`; b.append(d); setTimeout(() => d.remove(), 750); });
  // tilt
  if (!reduce && matchMedia('(hover:hover)').matches) document.addEventListener('pointermove', (e) => { const t = e.target.closest?.('[data-tilt]'); $$('[data-tilt].tilting').forEach((x) => { if (x !== t) { x.classList.remove('tilting'); x.style.transform = ''; } }); if (!t) return; const r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; t.classList.add('tilting'); t.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-6px)`; });
  $$('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));
})();
/* ===== Demo 3: products, filter, search, cart (LocalStorage) ===== */
const PRODUCTS = [
  { id: 1, e: '🎧', n: 'Aura Wireless Headphones', c: 'Audio', p: 89, o: 129, r: 4.8, rv: 412, h: 200, t: 'Best seller' },
  { id: 2, e: '⌚', n: 'Pulse Smartwatch S2', c: 'Wearables', p: 149, o: 199, r: 4.6, rv: 288, h: 150, t: 'New' },
  { id: 3, e: '📷', n: 'Lens Pro Action Camera', c: 'Cameras', p: 179, o: 0, r: 4.7, rv: 156, h: 320, t: '' },
  { id: 4, e: '🔊', n: 'Boom Mini Speaker', c: 'Audio', p: 49, o: 69, r: 4.5, rv: 530, h: 270, t: 'Sale' },
  { id: 5, e: '⌨️', n: 'Mech Keys 75% Keyboard', c: 'Desk', p: 99, o: 0, r: 4.9, rv: 204, h: 175, t: 'Top rated' },
  { id: 6, e: '🖱️', n: 'Glide Ergonomic Mouse', c: 'Desk', p: 39, o: 55, r: 4.4, rv: 318, h: 120, t: 'Sale' },
  { id: 7, e: '💡', n: 'Halo Smart Desk Lamp', c: 'Desk', p: 59, o: 0, r: 4.6, rv: 97, h: 45, t: '' },
  { id: 8, e: '🎮', n: 'Nova Game Controller', c: 'Gaming', p: 69, o: 85, r: 4.7, rv: 342, h: 260, t: '' },
  { id: 9, e: '📱', n: 'Orbit Phone Stand Charger', c: 'Wearables', p: 29, o: 0, r: 4.3, rv: 76, h: 180, t: 'New' },
  { id: 10, e: '🎙️', n: 'Cast USB Microphone', c: 'Audio', p: 79, o: 99, r: 4.8, rv: 221, h: 340, t: '' },
  { id: 11, e: '🕶️', n: 'Vista Smart Glasses', c: 'Wearables', p: 199, o: 0, r: 4.2, rv: 54, h: 215, t: 'New' },
  { id: 12, e: '🕹️', n: 'Arcade Pro Joystick', c: 'Gaming', p: 119, o: 140, r: 4.5, rv: 88, h: 15, t: '' },
];
const money = (n) => '$' + n.toFixed(2);
const KEY = 'volt-cart-v1', FAV = 'volt-fav-v1';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let cart = load(KEY, {}), fav = new Set(load(FAV, []));
let cat = 'All', query = '', sort = 'feat';
const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

function renderCats() {
  const list = ['All', ...new Set(PRODUCTS.map((p) => p.c))];
  $('#cats').innerHTML = list.map((c) => `<button class="${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
}
function renderGrid() {
  let list = PRODUCTS.filter((p) => (cat === 'All' || p.c === cat) && (p.n + p.c).toLowerCase().includes(query.toLowerCase()));
  if (sort === 'low') list.sort((a, b) => a.p - b.p); if (sort === 'high') list.sort((a, b) => b.p - a.p); if (sort === 'rate') list.sort((a, b) => b.r - a.r);
  $('#res').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  $('#none').hidden = list.length > 0;
  $('#grid').innerHTML = list.map((p, i) => `<article class="card pc" style="--h:${p.h};animation-delay:${i * 35}ms"><div class="im"><span>${p.e}</span>${p.t ? `<i class="badge">${p.t}</i>` : ''}<button class="fav ${fav.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-label="Wishlist">${fav.has(p.id) ? '❤️' : '🤍'}</button></div><h3>${p.n}</h3><div class="stars">${stars(p.r)}<small>${p.r} (${p.rv})</small></div><div class="bt"><div class="pr">${money(p.p)}${p.o ? `<s>${money(p.o)}</s>` : ''}</div><button class="add" data-add="${p.id}">Add +</button></div></article>`).join('');
}
function renderCart() {
  const ids = Object.keys(cart).filter((id) => cart[id] > 0), count = ids.reduce((s, id) => s + cart[id], 0);
  const sub = ids.reduce((s, id) => s + cart[id] * PRODUCTS.find((p) => p.id == id).p, 0);
  const cnt = $('#cnt'); if (cnt.textContent != count) { cnt.classList.remove('bump'); cnt.offsetWidth; cnt.classList.add('bump'); } cnt.textContent = count;
  $('#items').innerHTML = ids.length ? ids.map((id) => { const p = PRODUCTS.find((x) => x.id == id); return `<div class="it" style="--h:${p.h}"><div class="t">${p.e}</div><div><b>${p.n}</b><small>${money(p.p)} each</small><div class="qty"><button data-q="${id}" data-d="-1" aria-label="Less">−</button><span>${cart[id]}</span><button data-q="${id}" data-d="1" aria-label="More">+</button></div></div><button class="rm" data-rm="${id}" aria-label="Remove">🗑</button></div>`; }).join('') : '<div class="empty"><div>🛒</div><p>Your cart is empty.</p></div>';
  $('#sub').textContent = money(sub);
  const left = Math.max(0, 50 - sub);
  $('#ship').innerHTML = (ids.length ? (left ? `Add <b>${money(left)}</b> more for free delivery` : 'You unlocked <b>free delivery</b> 🎉') : 'Free delivery over $50') + `<i><b style="width:${Math.min(100, sub / 50 * 100)}%"></b></i>`;
  $('#checkout').disabled = !ids.length; save(KEY, cart);
}
const setCart = (open) => { $('#drawer').classList.toggle('on', open); $('#shade').classList.toggle('on', open); $('#drawer').setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : ''; };

$('#cats').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; renderCats(); renderGrid(); });
$('#q').addEventListener('input', (e) => { query = e.target.value; renderGrid(); });
$('#sort').addEventListener('change', (e) => { sort = e.target.value; renderGrid(); });
$('#grid').addEventListener('click', (e) => {
  const a = e.target.closest('[data-add]'), f = e.target.closest('[data-fav]');
  if (a) { cart[a.dataset.add] = (cart[a.dataset.add] || 0) + 1; renderCart(); toast('Added to cart'); }
  if (f) { const id = +f.dataset.fav; fav.has(id) ? fav.delete(id) : fav.add(id); save(FAV, [...fav]); f.classList.toggle('on'); f.textContent = fav.has(id) ? '❤️' : '🤍'; }
});
$('#items').addEventListener('click', (e) => {
  const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
  if (q) { cart[q.dataset.q] = Math.max(0, cart[q.dataset.q] + +q.dataset.d); if (!cart[q.dataset.q]) delete cart[q.dataset.q]; }
  if (r) delete cart[r.dataset.rm]; renderCart();
});
$('#openCart').onclick = () => setCart(true); $('#closeCart').onclick = $('#shade').onclick = () => setCart(false);
addEventListener('keydown', (e) => e.key === 'Escape' && setCart(false));
$('#clear').onclick = () => { cart = {}; renderCart(); };
$('#checkout').onclick = () => { cart = {}; renderCart(); setCart(false); toast('Order placed! (demo only)'); };
renderCats(); renderGrid(); renderCart(); observeReveal();
