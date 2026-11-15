/* LATITO: Meta + TikTok pixels (nothing loads until an ID is in site.config.js); utm_* passed on to checkout. */
(function () {
  'use strict';
  var C = window.LATITO_CONFIG, P = C.prices, X = C.pixels || {}, w = window, d = document;

  // landing utm_*, kept for the visit
  var utm = [];
  try {
    new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_/.test(k)) utm.push([k, v]); });
    if (utm.length) sessionStorage.setItem('latito_utm', JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem('latito_utm')) || [];
  } catch (e) {}
  function withUtm(url) {
    try { var u = new URL(url); utm.forEach(function (p) { u.searchParams.set(p[0], p[1]); }); return u.href; } catch (e) { return url; }
  }

  // official base code, unchanged apart from the IDs
  if (X.meta) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('init', X.meta);
  }
  if (X.tiktok) {
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
      ttq.load(X.tiktok);
    }(w, d, 'ttq');
  }

  // items [[sku, qty]]; one event ID shared by both pixels (for server-side dedup later)
  function send(name, items, value, extra) {
    if (!X.meta && !X.tiktok) return;
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ids = items.map(function (i) { return i[0]; });
    // contents: Meta keys (id, item_price) + TikTok keys (content_id, price)
    var o = { content_ids: ids, content_type: 'product', value: Math.round(value * 100) / 100, currency: C.currency,
      contents: items.map(function (i) { return { id: i[0], content_id: i[0], quantity: i[1], item_price: P[i[0]], price: P[i[0]] }; }) };
    for (var k in extra) o[k] = extra[k];
    if (X.meta) w.fbq('track', name, o, { eventID: id });
    if (X.tiktok) w.ttq.track(name, o, { event_id: id });
  }

  if (X.meta || X.tiktok) {
    if (X.meta) w.fbq('track', 'PageView', {}, { eventID: 'pv' + Date.now().toString(36) });
    if (X.tiktok) w.ttq.page();
    // ViewContent once, when the shop first comes on screen
    var shop = d.getElementById('shop');
    if (shop && 'IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var b = d.querySelector('.panel:not([hidden]) [data-main-buy]'), s = b && b.dataset.sku;
        if (P[s] != null) send('ViewContent', [[s, 1]], P[s]);
      }, { rootMargin: '0px 0px -35% 0px' });
      io.observe(shop);
    }
    d.addEventListener('cart:add', function (e) { send('AddToCart', [[e.detail.sku, e.detail.qty]], e.detail.value); });
    d.addEventListener('cart:checkout', function (e) {
      var l = e.detail.lines;
      send('InitiateCheckout', l.map(function (x) { return [x.sku, x.qty]; }), e.detail.subtotal, { num_items: e.detail.count });
    });
  }

  w.LatitoTrack = { send: send, withUtm: withUtm };
})();
