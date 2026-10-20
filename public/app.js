const $ = (s, r = document) => r.querySelector(s);
const fmt = n => 'Rs ' + n.toLocaleString('en-PK');
const api = async (url, body) => {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
};
const cart = {
  get: () => JSON.parse(localStorage.getItem('cart') || '{}'),
  set(c) { localStorage.setItem('cart', JSON.stringify(c)); $('#count').textContent = Object.values(c).reduce((a, b) => a + b, 0); },
  add(id) { const c = this.get(); c[id] = (c[id] || 0) + 1; this.set(c); },
};
function toast(t) { const e = $('.toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 1800); }
function card(p) {
  return `<article class="card" style="--c:${p.color}"><div class="pic"></div><h3>${p.name}</h3><small>${p.note}</small>
  <div class="foot"><span>${fmt(p.price)}</span><button class="btn sm" data-add="${p.id}">Add to cart</button></div></article>`;
}
function bindAdd(root) {
  root.addEventListener('click', e => { const id = e.target.dataset.add; if (id) { cart.add(id); toast('Added to cart'); } });
}
async function layout() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const on = f => page === f ? 'class="on"' : '';
  document.body.insertAdjacentHTML('afterbegin', `<header><div class="wrap"><a class="logo" href="/">Maati</a>
    <nav><a href="/" ${on('index.html')}>Home</a><a href="/shop.html" ${on('shop.html')}>Shop</a>
    <a href="/cart.html" ${on('cart.html')}>Cart<span class="badge" id="count">0</span></a><span id="who"></span></nav></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap">Maati. Handmade ceramics, shipped across Pakistan.</div></footer><div class="toast" role="status"></div>`);
  cart.set(cart.get());
  const me = await api('/api/me');
  window.user = me.ok ? me.data : null;
  $('#who').innerHTML = user ? `<span>Hi, ${user.name.split(' ')[0]}</span> <button class="link" id="out">Sign out</button>` : `<a href="/auth.html" ${on('auth.html')}>Sign in</a>`;
  $('#out')?.addEventListener('click', async () => { await api('/api/logout', {}); location.href = '/'; });
}
document.addEventListener('DOMContentLoaded', async () => { await layout(); window.init?.(); });
