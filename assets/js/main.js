/* LATITO Skin: smooth scroll, stepped film, nav, product card, slide-in, sticky bar (prices: fill.js). */
(function () {
  'use strict';
  var C = window.LATITO_CONFIG, P = C.prices;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var money = C.money, M = C.M; // fill.js
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileMQ = window.matchMedia('(max-width: 768px)');
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // delivery estimate: Brisbane date (UTC+10, read with getUTC*) + business days, no weekends or holidays
  var now = new Date(Date.now() + 36e6), H = C.holidays || [], slow = C.dispatchDays[1] + C.deliveryDays[1];
  function bizDay(n, from) {
    var d = new Date(from || now), s;
    while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); s = d.toISOString().slice(0, 10); if (d.getUTCDay() % 6 && H.indexOf(s) < 0 && H.indexOf(s.slice(5)) < 0) n--; }
    return d;
  }
  function fmt(d) { return 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[d.getUTCMonth()]; }
  var eta = fmt(bizDay(C.dispatchDays[0] + C.deliveryDays[0])) + '–' + fmt(bizDay(slow));
  $$('[data-eta]').forEach(function (el) { el.innerHTML = 'Order today. Arrives <b>' + eta + '</b>, tracked.'; el.hidden = false; });

  // Christmas: order-by = latest day whose slowest delivery lands by deliverBy; gift block + bar prefix until then
  var X = C.christmas, md = function (v, e) { return Date.UTC(now.getUTCFullYear(), v.slice(0, 2) - 1, +v.slice(3) + e) - e; };
  if (X && X.enabled) {
    var by = md(X.deliverBy, 1), cut = new Date(by);
    while (bizDay(slow, cut) > by) cut.setUTCDate(cut.getUTCDate() - 1);
    // last working day (a weekend order ships Monday anyway)
    var ci = function () { return cut.toISOString().slice(0, 10); };
    while (!(cut.getUTCDay() % 6) || H.indexOf(ci()) > -1 || H.indexOf(ci().slice(5)) > -1) cut.setUTCDate(cut.getUTCDate() - 1);
    if (now >= md(X.from, 0) && now <= cut) {
      $$('[data-cut]').forEach(function (el) { el.textContent = fmt(cut); });
      $$('[data-xmas]').forEach(function (el) { el.hidden = false; });
      $('.announce').classList.add('is-xmas');
    }
  }

  // ---- 2. smooth scroll
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, virtualScroll: function (v) { return v.event.cancelable; } }); // skip touches already scrolling
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  if (hasGsap) ScrollTrigger.config({ ignoreMobileResize: true });
  var hdr = $('[data-hdr]');
  var navOffset = function () { return $('.nav').offsetHeight + 12; };
  var ioC = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function scrollToY(y) { // links: film targets land on a step, others let go
    y = Math.max(0, y);
    if (!lenis) return window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    if (filmST && y < Y(4) + 2) return go(nearest(y));
    free(); busy = !!filmST;
    lenis.scrollTo(y, { duration: Math.min(1.8, 0.6 + Math.abs(y - scrollY) / 4000), easing: ioC, force: true, lock: true, onComplete: function () { busy = false; } });
  }
  function scrollToEl(el, extra) { scrollToY(el.getBoundingClientRect().top + window.scrollY - navOffset() - (extra || 0)); }
  window.LATITO = {
    lenis: lenis,
    lock: function (on) {
      document.documentElement.style.overflow = on ? 'hidden' : '';
      if (lenis) on ? lenis.stop() : stepping || lenis.start();
    }
  };

  // ---- 3. film
  var film = $('#film'), filmST = null, beatSpan = 0.75, filmP = 0;
  function buildFilm() {
    if (reduce || !hasGsap || !window.LatitoFilm) return;
    var stage = $('.film__stage', film), renderer = window.LatitoFilm(stage);
    var beats = $$('.beat', film);
    var mm = gsap.matchMedia();
    mm.add({ m: '(max-width: 768px)', d: '(min-width: 769px)' }, function () {
      var k = film.offsetHeight / stage.offsetHeight; // film height in screens
      var b = beatSpan = (k - 2) / (k - 1);           // last screen of scroll is the shop rising
      var seg = b / beats.length, proxy = { p: 0 };
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: film, start: 'top top', end: 'bottom bottom', scrub: 0.3, onUpdate: function (st) { filmP = st.progress; onScroll(); } }
      });
      filmST = tl.scrollTrigger;
      tl.to(proxy, { p: 1, duration: b, onUpdate: function () { renderer.render(proxy.p); } }, 0);
      tl.to('.film__cue', { autoAlpha: 0, duration: seg * 0.2 }, 0);
      beats.forEach(function (beat, i) {
        var t0 = i * seg, lines = $$('.ln__in', beat), fx = $$('[data-fx]', beat);
        if (i > 0) {
          tl.fromTo(beat, { autoAlpha: 0 }, { autoAlpha: 1, duration: seg * 0.01 }, t0 + seg * 0.02);
          tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: seg * 0.26, stagger: seg * 0.06, ease: 'power3.out' }, t0 + seg * 0.02);
          tl.fromTo(fx, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: seg * 0.22, stagger: seg * 0.04, ease: 'power2.out' }, t0 + seg * 0.12);
        }
        var out = i < beats.length - 1 ? (i + 1) * seg - seg * 0.24 : b + (1 - b) * 0.12;
        var len = i < beats.length - 1 ? seg * 0.2 : (1 - b) * 0.45;
        tl.to(beat, { autoAlpha: 0, y: -44, filter: 'blur(6px)', duration: len, ease: 'power1.in' }, out);
      });
      tl.to($('.film__media', film), { scale: 0.94, yPercent: -3, duration: 1 - b, ease: 'power1.in' }, b);
      tl.set({}, {}, 1);
      return function () { filmST = null; };
    });
  }

  // ---- 3b. stepped film: one gesture = one step; S0–S3 = beats 1–4, S4 = shop landed (HANDOFF.md)
  var si = 0, stepping = false, busy = false, wT = 0, wD = 0, tY = null, tUsed = false, setT = 0;
  function Y(i) { var s = filmST.start; return Math.round(s + (filmST.end - s) * (i > 3 ? 1 : (i && i + 0.5) * beatSpan / 4)); }
  function nearest(y) { for (var i = 1, b = 0; i < 5; i++) if (Math.abs(Y(i) - y) < Math.abs(Y(b) - y)) b = i; return b; }
  function go(i) {
    si = Math.max(0, Math.min(4, i)); stepping = true; lenis.stop();
    var d = Math.abs(scrollY - Y(si));
    if (d > 1) { busy = true; lenis.scrollTo(Y(si), { duration: Math.min(1.2, 0.3 + d / 300), easing: ioC, force: true, lock: true, onComplete: function () { busy = false; } }); }
  }
  function free() { stepping = false; lenis.start(); }
  function held() { return document.body.classList.contains('cart-open') || !$('.pop').hidden; }
  function step(d) { // "next" at S4 hands back to normal scrolling
    if (busy || held()) return;
    if (d > 0 && si > 3) { free(); lenis.scrollTo(Y(4) + innerHeight * 0.3, { duration: 0.8, easing: ioC }); } else go(si + d);
  }
  addEventListener('wheel', function (e) {
    var d = Math.sign(e.deltaY), fresh = e.timeStamp - wT > 180 || d !== wD; // momentum = one gesture till a 180 ms gap
    if (d) { wT = e.timeStamp; wD = d; }
    if (stepping && d && !e.ctrlKey && Math.abs(e.deltaX) < Math.abs(e.deltaY)) { e.preventDefault(); if (fresh) step(d); }
  }, { passive: false });
  addEventListener('touchstart', function (e) { tY = e.touches[0].clientY; tUsed = false; }, { passive: true });
  addEventListener('touchmove', function (e) {
    if (!stepping || tY == null || e.touches.length > 1 || e.target.closest('.drawer, .pop')) return;
    if (e.cancelable) e.preventDefault(); // else a scroll begun below the film
    var dy = tY - e.touches[0].clientY;
    if (!tUsed && Math.abs(dy) >= 30) { tUsed = true; step(Math.sign(dy)); }
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement, k = e.key, sp = k === ' ';
    if (!stepping || held() || e.altKey || e.ctrlKey || e.metaKey || a.matches('input, textarea, select, [contenteditable]') || (sp && a !== document.body && a.closest('a, button, label, [tabindex]'))) return;
    var d = k === 'Home' ? -9 : /^(ArrowDown|PageDown)$/.test(k) || (sp && !e.shiftKey) ? 1 : /^(ArrowUp|PageUp)$/.test(k) || sp ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    if (d > -9) step(d); else if (!busy) go(0);
  });
  document.addEventListener('focusin', function (e) { // focus past the film: let go, follow it
    var t = e.target;
    if (stepping && !film.contains(t) && !t.closest('.hdr, .skip, .sticky, .drawer, .pop')) { free(); busy = false; lenis.scrollTo(Math.max(scrollY, Y(4)), { immediate: true, force: true }); t.scrollIntoView({ block: 'nearest' }); }
  });
  function watch() { // re-arm on the way back up; a stop between steps settles onto one
    if (busy) return;
    if (!stepping && scrollY < Y(4) - 2) go(nearest(scrollY));
    clearTimeout(setT);
    setT = setTimeout(function () {
      if (busy) return;
      if (scrollY > Y(4) + 2) { if (stepping) free(); } else if (!stepping || Math.abs(scrollY - Y(si)) > 2) go(nearest(scrollY));
    }, 160);
  }

  // ---- 4. nav: theme, tuck, active link
  var themed = $$('[data-nav-theme]'), links = $$('[data-nav-link]');
  var shopEl = $('#shop'), ritualEl = $('#ritual'), navCta = $('[data-nav-cta]'), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      hdr.classList.toggle('is-tucked', y > 40);
      var probe = $('.nav').getBoundingClientRect().bottom - 8, theme = 'film';
      for (var i = themed.length - 1; i >= 0; i--) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { theme = themed[i].dataset.navTheme; break; }
      }
      if (hdr.dataset.theme !== theme) hdr.dataset.theme = theme;
      var active = '', mid = vh * 0.45;
      var rs = shopEl.getBoundingClientRect(), rr = ritualEl.getBoundingClientRect();
      if (rr.top < mid && rr.bottom > mid) active = 'ritual';
      else if (rs.top < mid && rs.bottom > mid) active = 'shop';
      else if (filmST && filmP < beatSpan) { if (Math.floor(filmP / (beatSpan / 4)) === 2) active = 'formula'; }
      else if (!filmST) { var rf = $('#formula').getBoundingClientRect(); if (rf.top < mid && rf.bottom > mid) active = 'formula'; }
      links.forEach(function (a) { a.classList.toggle('is-active', a.dataset.navLink === active); });
      // desktop nav CTA: on once the hero copy is gone, off while the shop is on screen
      navCta.classList.toggle('is-on', !mobileMQ.matches && y > vh * 0.7 && !(rs.top < vh * 0.75 && rs.bottom > vh * 0.25));
      sticky();
      maybePop(y, vh);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ---- 5. in-page links
  function goto(name) {
    if (name === 'formula' && filmST) {
      var s = filmST.start + (filmST.end - filmST.start) * beatSpan * (2.5 / 4);
      return scrollToY(s);
    }
    if (name === 'shop') return scrollToEl($('.pcard'), 4);
    var el = document.getElementById(name);
    if (el) scrollToEl(el);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#') { e.preventDefault(); return; }
    if (a.dataset.openTab) { e.preventDefault(); selectTab(a.dataset.openTab); goto('shop'); return; }
    if (a.dataset.openAcc) { e.preventDefault(); openAcc(a.dataset.openAcc); return; }
    if (a.dataset.openFaq) { e.preventDefault(); var fb = $('[aria-controls="' + a.dataset.openFaq + '"]'); setAcc(fb, true); scrollToEl(fb, 8); return; }
    if (href === '#top') { e.preventDefault(); scrollToY(0); return; }
    if (href === '#main') return;
    var name = a.dataset.goto || a.dataset.navLink || href.slice(1);
    if (document.getElementById(name)) { e.preventDefault(); if (a.closest('.drawer') && window.LatitoCart) window.LatitoCart.close(); goto(name); }
  });

  // ---- 6. buy buttons
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b || !window.LatitoCart) return;
    window.LatitoCart.add(b.dataset.sku, 1, b);
  });

  // ---- 7. product card: tabs, quantity, gallery
  var tabs = $$('[role="tab"]');
  function selectTab(key, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === key;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $$('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== key; });
    $$('[data-gallery]').forEach(function (g) { g.hidden = g.dataset.gallery !== key; });
    observeBuy();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j == null) return;
      e.preventDefault();
      selectTab(tabs[(j + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  // the quantity pick drives the button, the value stack (x n) and the Afterpay line
  function pick(r) {
    var panel = r.closest('.panel'), btn = $('[data-main-buy]', panel), sku = r.value, n = +sku.slice(-1), ap = $('[data-afterpay]', panel);
    btn.dataset.sku = sku;
    btn.dataset.price = P[sku];
    $('[data-btn-total]', btn).textContent = money(P[sku]);
    $$('[data-x]', panel).forEach(function (el) { el.textContent = money(M[el.dataset.m] * n); });
    $$('[data-n]', panel).forEach(function (el) { el.textContent = n > 1 ? n + ' × ' : ''; });
    $$('[data-now]', panel).forEach(function (el) { el.textContent = money(P[sku]); });
    $$('[data-fs]', panel).forEach(function (el) { el.hidden = P[sku] < C.freeShip; });
    ap.hidden = !C.afterpay;
    $('span', ap).textContent = money(P[sku] / 4);
  }
  $$('.qty input').forEach(function (r) {
    r.addEventListener('change', function () { pick(r); });
    if (r.checked) pick(r);
  });
  var IMG = { duo: [600, 1000, 1400], jar: [600, 1000, 1400], tube: [600, 1000, 1400], 'cream-texture': [600, 1000], 'cream-scene': [600, 1000], 'wrap-brush': [600, 1000], 'wrap-scene': [600, 1000] };
  $$('.thumb').forEach(function (th) {
    th.addEventListener('click', function () {
      var g = th.closest('.gallery'), img = $('.gallery__main img', g), key = th.dataset.img;
      if (th.getAttribute('aria-pressed') === 'true') return;
      $$('.thumb', g).forEach(function (o) { o.setAttribute('aria-pressed', o === th); });
      img.classList.add('is-swapping');
      setTimeout(function () {
        var base = 'assets/img/product/' + key + '-';
        img.srcset = IMG[key].map(function (w) { return base + w + '.webp ' + w + 'w'; }).join(', ');
        img.src = base + '1000.webp';
        img.alt = th.getAttribute('aria-label').replace(/^Show /, '');
        var done = function () { img.classList.remove('is-swapping'); };
        if (img.complete) requestAnimationFrame(done); else img.onload = img.onerror = done;
      }, 180);
    });
  });

  // ---- 8. accordions
  function setAcc(btn, open) {
    if (!btn) return;
    btn.setAttribute('aria-expanded', open);
    document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
  }
  $$('.acc__btn').forEach(function (b) {
    b.addEventListener('click', function () { setAcc(b, b.getAttribute('aria-expanded') !== 'true'); });
  });
  function openAcc(key) {
    var panel = $('.panel:not([hidden])'), btn = $('[data-acc="' + key + '"] .acc__btn', panel);
    setAcc(btn, true);
    scrollToEl(btn, 16);
  }

  // ---- 9. sticky mobile bar
  var bar = $('[data-sticky]'), barBtn = $('button', bar), buyVisible = false, buyIO = null;
  function observeBuy() {
    if (!('IntersectionObserver' in window)) return;
    if (buyIO) buyIO.disconnect();
    buyIO = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.target.closest('[hidden]')) buyVisible = en.isIntersecting; }); sticky(); });
    var b = $('.panel:not([hidden]) [data-main-buy]');
    if (b) buyIO.observe(b);
  }
  function sticky() {
    var on = mobileMQ.matches && window.scrollY > window.innerHeight * 0.7 && !buyVisible && !document.body.classList.contains('cart-open');
    if (bar.classList.contains('is-on') === on) return;
    bar.classList.toggle('is-on', on);
    document.body.classList.toggle('has-sticky', on);
    bar.setAttribute('aria-hidden', !on);
    barBtn.tabIndex = on ? 0 : -1;
  }
  document.addEventListener('cart:change', sticky);
  document.addEventListener('cart:closed', function () { sticky(); if (popWaiting) showPop(); });

  // ---- 10. email slide-in
  var POPKEY = 'latito_founding_v1', pop = $('[data-pop]'), popWaiting = false, popShown = !!store.get(POPKEY), popOpener = null;
  function showPop(force) {
    if (!force && popShown && !popWaiting) return;
    if (window.LatitoCart && window.LatitoCart.isOpen()) { popWaiting = true; return; }
    popWaiting = false; popShown = true;
    if (!store.get(POPKEY)) store.set(POPKEY, 'shown');
    if (store.get(POPKEY) === 'joined') { $('[data-pop-form-wrap]', pop).hidden = true; $('[data-pop-ok]', pop).hidden = false; }
    pop.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { pop.classList.add('is-on'); }); });
    popOpener = force ? document.activeElement : null;
    if (force) setTimeout(function () { var i = $('input', pop); if (i && !$('[data-pop-form-wrap]', pop).hidden) i.focus(); else $('.pop__x', pop).focus(); }, 80);
  }
  function hidePop() {
    if (popOpener && pop.contains(document.activeElement)) popOpener.focus({ preventScroll: true });
    popOpener = null;
    pop.classList.remove('is-on');
    if (store.get(POPKEY) !== 'joined') store.set(POPKEY, 'dismissed');
    setTimeout(function () { pop.hidden = true; }, 400);
  }
  function maybePop(y, vh) {
    if (popShown) return;
    var max = document.documentElement.scrollHeight - vh;
    if (max > 0 && y / max >= 0.6) showPop();
  }
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0 && !popShown && performance.now() > 4000) showPop();
    });
  }
  $$('[data-pop-close]', pop).forEach(function (b) { b.addEventListener('click', hidePop); });
  pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePop(); });
  $$('[data-open-popup]').forEach(function (b) { b.addEventListener('click', function () { showPop(true); }); });
  $('[data-pop-form]', pop).addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('input', this), err = $('[data-pop-err]', pop), email = input.value.trim(), btn = $('button[type="submit"]', this);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = 'That email doesn’t look right. Try again?';
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid'); err.textContent = '';
    var done = function () {
      store.set(POPKEY, 'joined');
      $('[data-pop-form-wrap]', pop).hidden = true;
      $('[data-pop-ok]', pop).hidden = false;
      $('.pop__x', pop).focus();
    };
    // Klaviyo (client API), else emailEndpoint, else success shown only
    var K = C.klaviyo || {}, req;
    if (K.companyId && K.listId) req = fetch('https://a.klaviyo.com/client/subscriptions?company_id=' + encodeURIComponent(K.companyId), {
      method: 'POST', headers: { 'Content-Type': 'application/vnd.api+json', revision: '2026-10-15' },
      body: JSON.stringify({ data: { type: 'subscription', attributes: { custom_source: 'Founding 100 slide-in',
        profile: { data: { type: 'profile', attributes: { email: email, subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } } } },
        relationships: { list: { data: { type: 'list', id: K.listId } } } } })
    });
    else if (C.emailEndpoint) req = fetch(C.emailEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, source: 'founding-100' }) });
    else { console.warn('[LATITO] Sign-up not saved: set klaviyo or emailEndpoint in site.config.js'); return done(); }
    btn.disabled = true;
    req.then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
      .catch(function () { btn.disabled = false; err.textContent = 'That didn’t send. Please try again.'; });
  });

  // ---- 11. rail buttons
  var rail = $('[data-rail-track]');
  $$('[data-rail]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = $('.fix', rail);
      rail.scrollBy({ left: +b.dataset.rail * (card.offsetWidth + 20), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---- 12. section reveals
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    $$('section, footer').forEach(function (s) { $$('[data-reveal]', s).forEach(function (el, i) { el.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms'); }); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('is-in'); });

  buildFilm();
  if (lenis && filmST) {
    window.addEventListener('scroll', watch, { passive: true });
    ScrollTrigger.addEventListener('refresh', function () { if (stepping && !busy) lenis.scrollTo(Y(si), { immediate: true, force: true }); });
    watch();
    window.LATITO.step = { go: go, y: Y, i: function () { return stepping ? si : -1; } };
  }
  observeBuy();
  onScroll();
  if (hasGsap) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
