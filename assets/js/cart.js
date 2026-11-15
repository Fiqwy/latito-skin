/* LATITO bag: lines {sku, qty} in localStorage "latito_cart_v1"; drawer, upsell, checkout. */
(function () {
  'use strict';
  var C = window.LATITO_CONFIG, P = C.prices, KEY = 'latito_cart_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var money = C.money; // fill.js
  var drawer = $('#cart'), panel = $('.drawer__panel', drawer);
  var linesEl = $('[data-lines]', drawer), upEl = $('[data-upsell]', drawer), emptyEl = $('[data-empty]', drawer);
  var footEl = $('[data-foot]', drawer), shipEl = $('[data-ship]', drawer), note = $('[data-checkout-note]', drawer);
  var lines = load(), isOpen = false, lastTrigger = null, closeTimer = 0;

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v.filter(function (l) { return l && P[l.sku] != null && l.qty > 0; })
        .map(function (l) { return { sku: l.sku, qty: Math.min(99, l.qty | 0) }; }) : [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {} }
  function find(sku) { for (var i = 0; i < lines.length; i++) if (lines[i].sku === sku) return lines[i]; return null; }
  function count() { return lines.reduce(function (s, l) { return s + l.qty; }, 0); }
  function subtotal() { return lines.reduce(function (s, l) { return s + P[l.sku] * l.qty; }, 0); }
  // what the same things cost bought one by one (Ritual = tube + jar; 2-packs = two singles)
  var one = P['wrap-1'] + P['cream-1'], V = { 'ritual-1': one, 'ritual-2': 2 * one, 'ritual-3': 3 * one, 'wrap-2': 2 * P['wrap-1'], 'cream-2': 2 * P['cream-1'] };
  function saved() { return lines.reduce(function (s, l) { return s + ((V[l.sku] || P[l.sku]) - P[l.sku]) * l.qty; }, 0); }
  // every add → track.js; value = what it added
  function emit(sku, qty, value) { document.dispatchEvent(new CustomEvent('cart:add', { detail: { sku: sku, qty: qty, value: value } })); }

  function upsell() {
    var only = lines.length === 1 && lines[0].qty === 1 ? lines[0].sku : '';
    var r1 = find('ritual-1'), r2 = find('ritual-2'), r3 = find('ritual-3');
    if (only === 'wrap-1') return { from: 'wrap-1', to: 'ritual-1', img: C.skus['cream-1'].img, add: P['ritual-1'] - P['wrap-1'],
      text: 'Complete the ritual. Add the Capsule Cream for +' + money(P['ritual-1'] - P['wrap-1']) + '. It’s usually ' + money(P['cream-1']) + '.' };
    if (only === 'cream-1') return { from: 'cream-1', to: 'ritual-1', img: C.skus['wrap-1'].img, add: P['ritual-1'] - P['cream-1'],
      text: 'Complete the ritual. Add the Night Wrap for +' + money(P['ritual-1'] - P['cream-1']) + '. It’s usually ' + money(P['wrap-1']) + '.' };
    // the Ritual ladder: one set → two → three; nothing once three is in the bag
    var n = r1 && r1.qty === 1 && !r2 && !r3 ? 2 : r2 && r2.qty === 1 && !r1 && !r3 ? 3 : 0, to = 'ritual-' + n, from = 'ritual-' + (n - 1);
    if (n) return { from: from, to: to, img: C.skus[to].img, add: P[to] - P[from],
      text: 'Make it ' + (n > 2 ? 'three. Add a third' : 'two. Add a second') + ' Ritual for +' + money(P[to] - P[from]) + '. You save ' + money(n * one - P[to]) + ' in total.' };
    return null;
  }

  function render(added) {
    // remember which control had focus so a re-render doesn't drop it
    var a = document.activeElement, keep = a && drawer.contains(a) && a.dataset.act ? { sku: a.dataset.sku, act: a.dataset.act } : null;
    var sub = subtotal(), n = count();
    linesEl.innerHTML = lines.map(function (l) {
      var s = C.skus[l.sku];
      return '<li class="line' + (l.sku === added ? ' is-added' : '') + '">' +
        '<img src="' + s.img + '" width="76" height="76" alt="">' +
        '<div><p class="line__name">' + s.name + '</p><p class="line__var">' + s.variant + '</p>' +
        '<div class="line__row"><div class="stepper">' +
        '<button type="button" data-act="dec" data-sku="' + l.sku + '" aria-label="One less ' + s.name + ', ' + s.variant + '">−</button>' +
        '<output aria-live="polite">' + l.qty + '</output>' +
        '<button type="button" data-act="inc" data-sku="' + l.sku + '" aria-label="One more ' + s.name + ', ' + s.variant + '">+</button></div>' +
        '<button type="button" class="line__rm" data-act="rm" data-sku="' + l.sku + '">Remove</button></div></div>' +
        '<p class="line__price">' + money(P[l.sku] * l.qty) + '</p>' +
        '<span class="line__added" aria-hidden="true">Added ✓</span></li>';
    }).join('');

    var u = upsell();
    upEl.hidden = !u;
    if (u) upEl.innerHTML = '<img src="' + u.img + '" width="64" height="64" alt=""><p>' + u.text + '</p>' +
      '<button type="button" class="btn" data-act="up" data-from="' + u.from + '" data-to="' + u.to + '">Add +' + money(u.add) + '</button>';

    var empty = !lines.length, free = sub >= C.freeShip;
    emptyEl.hidden = !empty; footEl.hidden = empty; shipEl.hidden = empty;
    $('[data-ship-txt]', drawer).textContent = free ? 'Free tracked shipping unlocked' : 'You’re ' + money(C.freeShip - sub) + ' away from free shipping';
    $('[data-ship-bar]', drawer).style.transform = 'scaleX(' + Math.min(1, sub / C.freeShip).toFixed(3) + ')';
    $('[data-subtotal]', drawer).textContent = money(sub);
    $('[data-ship-fee]', drawer).textContent = free ? 'Free' : money(C.shipFee);
    var total = sub + (free || empty ? 0 : C.shipFee), sv = saved(), ap = $('[data-afterpay]', drawer);
    $('[data-total]', drawer).textContent = money(total);
    $('[data-save-row]', drawer).hidden = !sv;
    $('[data-save]', drawer).textContent = money(sv);
    ap.hidden = !C.afterpay;
    $('span', ap).textContent = money(total / 4);
    note.textContent = '';

    [].forEach.call(document.querySelectorAll('[data-cart-count]'), function (el) {
      if (el.textContent !== String(n) && el.classList.contains('nav__count')) {
        el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      }
      el.textContent = n;
      el.classList.toggle('has', n > 0);
    });

    if (keep && isOpen) {
      var back = drawer.querySelector('[data-act="' + keep.act + '"][data-sku="' + keep.sku + '"]');
      (back || $('[data-close-cart].round', drawer)).focus();
    }
    document.dispatchEvent(new CustomEvent('cart:change', { detail: { count: n, subtotal: sub } }));
  }

  function add(sku, qty, trigger) {
    if (P[sku] == null) return;
    var l = find(sku);
    if (l) l.qty = Math.min(99, l.qty + (qty || 1)); else lines.push({ sku: sku, qty: qty || 1 });
    save(); render(sku); open(trigger); emit(sku, qty || 1, P[sku] * (qty || 1));
  }
  function setQty(sku, q) {
    var l = find(sku); if (!l) return;
    if (q <= 0) lines.splice(lines.indexOf(l), 1); else l.qty = Math.min(99, q);
    save(); render();
  }
  function swap(from, to) {
    var l = find(from); if (!l) return;
    var t = find(to);
    if (t) { t.qty += 1; lines.splice(lines.indexOf(l), 1); } else { l.sku = to; l.qty = 1; }
    save(); render(to); emit(to, 1, P[to] - P[from]);
    var f = $('.line.is-added [data-act="inc"]', drawer) || $('[data-close-cart].round', drawer);
    f.focus();
  }

  // ---- drawer ----
  function focusables() {
    return [].filter.call(panel.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'), function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }
  function open(trigger) {
    lastTrigger = trigger || document.activeElement;
    if (isOpen) return;
    isOpen = true;
    clearTimeout(closeTimer);
    drawer.hidden = false;
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    document.body.classList.add('cart-open');
    setExpanded(true);
    if (window.LATITO) window.LATITO.lock(true);
    setTimeout(function () { if (isOpen) $('[data-close-cart].round', drawer).focus(); }, 60);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    document.body.classList.remove('cart-open');
    setExpanded(false);
    if (window.LATITO) window.LATITO.lock(false);
    closeTimer = setTimeout(function () { drawer.hidden = true; }, 450);
    var back = lastTrigger && document.contains(lastTrigger) && lastTrigger.offsetParent !== null ? lastTrigger : $('.nav__bag');
    back.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('cart:closed'));
  }
  function setExpanded(v) { [].forEach.call(document.querySelectorAll('[data-open-cart]'), function (b) { b.setAttribute('aria-expanded', v); }); }

  drawer.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act], [data-close-cart], [data-checkout]');
    if (!b) return;
    if (b.hasAttribute('data-close-cart')) { close(); return; }
    if (b.hasAttribute('data-checkout')) { checkout(b); return; }
    var sku = b.dataset.sku, l = find(sku);
    if (b.dataset.act === 'inc' && l) { setQty(sku, l.qty + 1); emit(sku, 1, P[sku]); }
    else if (b.dataset.act === 'dec' && l) setQty(sku, l.qty - 1);
    else if (b.dataset.act === 'rm') setQty(sku, 0);
    else if (b.dataset.act === 'up') swap(b.dataset.from, b.dataset.to);
    if (!lines.length) { var cta = $('[data-empty] .btn', drawer); if (cta) cta.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-cart]');
    if (b) { e.preventDefault(); render(); open(b); }
  });

  // ---- checkout ----
  // ?checkout=test: real cart, checkout link printed, not opened (HANDOFF.md)
  var TEST = /[?&]checkout=test\b/.test(location.search);
  function checkout(btn) {
    var s = C.shopify || {}, v = s.variants || {};
    if (!lines.length) return;
    if (!s.domain || !s.storefrontToken || lines.some(function (l) { return !v[l.sku]; })) {
      if (TEST) console.warn('[LATITO test checkout] shopify config incomplete:', s);
      note.textContent = 'Checkout connects at launch'; return;
    }
    document.dispatchEvent(new CustomEvent('cart:checkout', { detail: { lines: lines.slice(), subtotal: subtotal(), count: count() } }));
    btn.disabled = true; note.textContent = '';
    fetch('https://' + s.domain + '/api/' + (s.apiVersion || '2026-10') + '/graphql.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': s.storefrontToken },
      body: JSON.stringify({
        query: 'mutation($lines:[CartLineInput!]!){cartCreate(input:{lines:$lines}){cart{checkoutUrl} userErrors{field message}}}',
        variables: { lines: lines.map(function (l) { return { merchandiseId: v[l.sku], quantity: l.qty }; }) }
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      var c = j.data && j.data.cartCreate, url = c && c.cart && c.cart.checkoutUrl;
      if (!url) throw new Error(JSON.stringify(j.errors || (c && c.userErrors) || j));
      if (window.LatitoTrack) url = window.LatitoTrack.withUtm(url);
      if (!TEST) { window.location.href = url; return; }
      console.info('[LATITO test checkout]', url);
      btn.disabled = false; note.textContent = 'Test mode: the checkout link is in the console.';
    }).catch(function (err) {
      console.warn('[LATITO] Checkout failed:', err.message);
      btn.disabled = false;
      note.textContent = 'Checkout didn’t open. Please try again.';
    });
  }

  render();
  window.LatitoCart = { add: add, open: open, close: close, isOpen: function () { return isOpen; }, lines: function () { return lines.slice(); } };
})();
