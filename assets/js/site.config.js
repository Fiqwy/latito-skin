/* LATITO Skin: single source of truth. Every price and fact on the page is filled from here.
   The HTML carries the same values as static fallbacks (no-JS and SEO), so if you change a
   price here, change the JSON-LD in index.html too (search for "priceCurrency"). */
window.LATITO_CONFIG = {
  brand: 'LATITO',
  currency: 'AUD',
  prices: { 'wrap-1': 29, 'wrap-2': 52, 'cream-1': 32, 'cream-2': 58, 'ritual-1': 49, 'ritual-2': 89 },
  freeShip: 45,
  shipFee: 7.95,
  dispatchDays: [1, 2],  // business days to leave us (min, max)
  deliveryDays: [7, 12], // business days in transit (min, max); the dispatch/delivery text and the date estimate come from these
  foundingCode: 'FOUNDING100',
  foundingPercent: 15,
  email: 'latito.nm@gmail.com',
  abn: '', // empty renders "ABN coming soon"
  founderSignoff: '— Nicholas, founder',
  afterpay: false, // true shows "or 4 payments of $X with Afterpay" under the buy buttons and Checkout
  social: { instagram: '', tiktok: '' }, // full profile URLs; empty links stay as "#"
  // Fill all three to switch checkout on. variants maps each sku to a Shopify variant GID,
  // e.g. 'ritual-1': 'gid://shopify/ProductVariant/1234567890'
  shopify: { domain: '', storefrontToken: '', apiVersion: '2025-01', variants: {} },
  emailEndpoint: '', // POST {email, source} as JSON; empty = show success only
  skus: {
    'ritual-1': { product: 'ritual', name: 'The Overnight Ritual', variant: '1 set', img: 'assets/img/product/duo-240.webp' },
    'ritual-2': { product: 'ritual', name: 'The Overnight Ritual', variant: '2 sets', img: 'assets/img/product/duo-240.webp' },
    'wrap-1': { product: 'wrap', name: 'Night Wrap', variant: '1 tube', img: 'assets/img/product/tube-240.webp' },
    'wrap-2': { product: 'wrap', name: 'Night Wrap', variant: '2 tubes', img: 'assets/img/product/tube-240.webp' },
    'cream-1': { product: 'cream', name: 'Capsule Cream', variant: '1 jar', img: 'assets/img/product/jar-240.webp' },
    'cream-2': { product: 'cream', name: 'Capsule Cream', variant: '2 jars', img: 'assets/img/product/jar-240.webp' }
  }
};
// Text versions of the shipping times, built from the numbers above so they never drift.
(function (c) {
  var t = function (r) { return r[0] + '–' + r[1] + ' business days'; };
  c.dispatch = t(c.dispatchDays); c.delivery = t(c.deliveryDays);
})(window.LATITO_CONFIG);
