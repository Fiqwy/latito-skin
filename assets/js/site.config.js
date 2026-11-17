/* LATITO Skin: every price and fact is filled from here. Keep the HTML fallbacks and index.html's JSON-LD in step. */
window.LATITO_CONFIG = {
  brand: 'LATITO',
  currency: 'AUD',
  prices: { 'wrap-1': 32, 'wrap-2': 58, 'cream-1': 36, 'cream-2': 66, 'ritual-1': 59, 'ritual-2': 105, 'ritual-3': 139 },
  freeShip: 45,
  shipFee: 7.95,
  dispatchDays: [1, 2],  // business days to leave us
  deliveryDays: [7, 12], // business days in transit
  holidays: ['01-01', '01-26', '12-25', '12-26', '2026-12-28'], // 'MM-DD' yearly or 'YYYY-MM-DD' once
  christmas: { enabled: true, from: '11-01', deliverBy: '12-24' },
  foundingCode: 'FOUNDING100',
  foundingPercent: 15,
  email: 'latito.nm@gmail.com',
  abn: '', // empty = "ABN coming soon"
  founderSignoff: '— Nicholas, founder',
  afterpay: false,
  social: { instagram: '', tiktok: '' }, // full URLs
  // filled by _tools/shopify-connect.mjs: PUBLIC Storefront token only, never an Admin token
  shopify: {
    domain: 'a0hiwh-fu.myshopify.com',
    storefrontToken: 'cac2e8f8ca88322e57694081a6cf6355',
    apiVersion: '2026-10',
    variants: {
      'ritual-1': 'gid://shopify/ProductVariant/51063149527298',
      'ritual-2': 'gid://shopify/ProductVariant/51063149560066',
      'ritual-3': 'gid://shopify/ProductVariant/51063149592834',
      'wrap-1': 'gid://shopify/ProductVariant/51063149625602',
      'wrap-2': 'gid://shopify/ProductVariant/51063149658370',
      'cream-1': 'gid://shopify/ProductVariant/51063149723906',
      'cream-2': 'gid://shopify/ProductVariant/51063149756674'
    }
  },
  pixels: { meta: '1164703782576108', tiktok: '' }, // empty = no tracking code
  klaviyo: { companyId: '', listId: '' }, // public site ID + list ID
  emailEndpoint: '', // if no klaviyo: POST {email, source}
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
(function (c) {
  var t = function (r) { return r[0] + '–' + r[1] + ' business days'; };
  c.dispatch = t(c.dispatchDays); c.delivery = t(c.deliveryDays);
})(window.LATITO_CONFIG);
