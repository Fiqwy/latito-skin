/* LATITO: fill prices and facts from site.config.js, on every page. cart.js + main.js reuse C.money and C.M. */
(function () {
  'use strict';
  var C = window.LATITO_CONFIG, P = C.prices;
  var each = function (s, f) { [].forEach.call(document.querySelectorAll(s), f); };
  var money = C.money = function (n) { return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); };
  var singles = P['wrap-1'] + P['cream-1'];
  var M = C.M = {
    ritual: P['ritual-1'], ritual2: P['ritual-2'], ritual3: P['ritual-3'], wrap: P['wrap-1'], wrap2: P['wrap-2'], cream: P['cream-1'], cream2: P['cream-2'],
    ritualWas: singles, ritualSave: singles - P['ritual-1'], ritual2Save: 2 * singles - P['ritual-2'], ritual3Save: 3 * singles - P['ritual-3'],
    wrap2Save: 2 * P['wrap-1'] - P['wrap-2'], cream2Save: 2 * P['cream-1'] - P['cream-2'],
    ritual2Per: P['ritual-2'] / 2, ritual3Per: P['ritual-3'] / 3, wrap2Per: P['wrap-2'] / 2, cream2Per: P['cream-2'] / 2,
    freeShip: C.freeShip, shipFee: C.shipFee
  };
  each('[data-m]', function (el) { var v = M[el.dataset.m]; if (v != null) el.textContent = money(v); });
  each('[data-c]', function (el) { var v = C[el.dataset.c]; if (v) el.textContent = v; });
  each('[data-add]', function (b) { if (P[b.dataset.sku] != null) b.dataset.price = P[b.dataset.sku]; });
  each('[data-abn]', function (el) { el.textContent = C.abn ? 'ABN ' + C.abn : 'ABN coming soon'; });
  each('[data-mailto]', function (a) { a.href = 'mailto:' + C.email; });
  each('[data-social]', function (a) { var u = C.social && C.social[a.dataset.social]; if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } });
})();
