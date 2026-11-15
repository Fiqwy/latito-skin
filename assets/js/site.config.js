/* LATITO Skin: single source of truth; every price and fact is filled from here. The HTML keeps the same
   values as fallbacks, so a price change here also goes in the JSON-LD in index.html ("priceCurrency"). */
window.LATITO_CONFIG = {
  brand: 'LATITO',
  currency: 'AUD',
  prices: { 'wrap-1': 32, 'wrap-2': 58, 'cream-1': 36, 'cream-2': 66, 'ritual-1': 59, 'ritual-2': 105, 'ritual-3': 139 },
  freeShip: 45,
  shipFee: 7.95,
  dispatchDays: [1, 2],  // business days to leave us (min, max)
  deliveryDays: [7, 12], // business days in transit (min, max); drives the delivery text and date estimate
  holidays: ['01-01', '01-26', '12-25', '12-26', '2026-12-28'], // skipped as business days; 'MM-DD' every year or 'YYYY-MM-DD' once
  christmas: { enabled: true, from: '11-01', deliverBy: '12-24' }, // gift block + bar prefix from 'from' until the order-by date
  foundingCode: 'FOUNDING100',
  foundingPercent: 15,
  email: 'latito.nm@gmail.com',
  abn: '', // empty renders "ABN coming soon"
  founderSignoff: '— Nicholas, founder',
  afterpay: false, // true shows "or 4 payments of $X with Afterpay"
  social: { instagram: '', tiktok: '' }, // full profile URLs; empty links stay as "#"
  // Checkout: filled by `node _tools/shopify-connect.mjs <shop>.myshopify.com <public-token>` (sku → variant GID)
  shopify: {
    domain: '',
    storefrontToken: '', // PUBLIC Storefront token (Headless channel), never an Admin token
    apiVersion: '2026-10',
    variants: {}
  },
  pixels: { meta: '', tiktok: '' }, // pixel IDs; empty = no tracking code loads
  klaviyo: { companyId: '', listId: '' }, // public API key (site ID) + list ID, Founding 100 slide-in
  emailEndpoint: '', // used if klaviyo is empty: POST {email, source} JSON; both empty = success shown only
  skus: {
    'ritual-1': { product: 'ritual', name: 'The Overnight Ritual', variant: '1 set', img: 'assets/img/product/duo-240.webp' },
    'ritual-2': { product: 'ritual', name: 'The Overnight Ritual', variant: '2 sets', img: 'assets/img/product/duo-240.webp' },
    'ritual-3': { product: 'ritual', name: 'The Overnight Ritual', variant: '3 sets', img: 'assets/img/product/duo-240.webp' },
    'wrap-1': { product: 'wrap', name: 'Night Wrap', variant: '1 tube', img: 'assets/img/product/tube-240.webp' },
    'wrap-2': { product: 'wrap', name: 'Night Wrap', variant: '2 tubes', img: 'assets/img/product/tube-240.webp' },
    'cream-1': { product: 'cream', name: 'Capsule Cream', variant: '1 jar', img: 'assets/img/product/jar-240.webp' },
    'cream-2': { product: 'cream', name: 'Capsule Cream', variant: '2 jars', img: 'assets/img/product/jar-240.webp' }
  }
};
// text versions of the shipping times, from the numbers above
(function (c) {
  var t = function (r) { return r[0] + '–' + r[1] + ' business days'; };
  c.dispatch = t(c.dispatchDays); c.delivery = t(c.deliveryDays);
})(window.LATITO_CONFIG);
