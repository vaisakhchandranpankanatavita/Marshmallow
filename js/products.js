/* Catalog.
 *
 * Single source of truth for the storefront today. js/store.js can replace
 * window.PRODUCTS with live data from your API in this same shape, so keep the
 * field names if you edit by hand.
 *
 * Prices are in INR, whole rupees. Image convention: assets/<slug>--<colour>.svg
 */

window.SWATCHES = {
  pink: '#FF2E93', blue: '#2D7DFF', lime: '#B4FF39', orange: '#FF6B1A',
  purple: '#8B2FE8', cyan: '#00E5D0', yellow: '#FFC72C', red: '#E03127',
  black: '#141414', cream: '#FBF3E4'
};

/* Subcategories drive the second filter row. `label` is what the shopper sees. */
window.SUBCATEGORIES = {
  tees: [
    { id: 'oversized',  label: 'Oversized',   blurb: 'Dropped shoulder, boxy body. Our house fit.' },
    { id: 'classic',    label: 'Classic Fit', blurb: 'Straight cut, sits at the hip. The safe one.' },
    { id: 'crop',       label: 'Crop',        blurb: 'Shortened body, hits above the waist.' },
    { id: 'longsleeve', label: 'Full Sleeve', blurb: 'Ribbed cuffs. Good for Delhi winters.' }
  ],
  cases: [
    { id: 'tough',   label: 'Tough',   blurb: 'Dual-layer shell, 2m drop tested.' },
    { id: 'slim',    label: 'Slim',    blurb: 'Barely there. Adds under 2mm.' },
    { id: 'clear',   label: 'Clear',   blurb: 'Anti-yellowing, shows the phone off.' },
    { id: 'magsafe', label: 'MagSafe', blurb: 'Magnet array for snap-on accessories.' }
  ]
};

window.CATEGORY_LABEL = { tees: 'T-Shirts', cases: 'Phone Cases' };
/* Themes cut across both categories — an anime tee and an anime case sit in
   the same theme. Kept as its own axis rather than folded into subcategory,
   because "Oversized" and "Anime" answer different questions. */
window.THEMES = [
  { id: 'anime',    label: 'Anime',    emoji: '\u2694\uFE0F', blurb: 'Big eyes, speed lines, main-character energy.' },
  { id: 'cartoon',  label: 'Cartoon',  emoji: '\uD83D\uDCA5', blurb: 'Saturday-morning faces and dynamite.' },
  { id: 'cars',     label: 'Cars',     emoji: '\uD83C\uDFCE\uFE0F', blurb: 'Redlines, flames and side profiles.' },
  { id: 'gaming',   label: 'Gaming',   emoji: '\uD83C\uDFAE', blurb: 'Controllers, pixel hearts, one more run.' },
  { id: 'music',    label: 'Music',    emoji: '\uD83C\uDFB5', blurb: 'Tape decks, basslines, mixtape nostalgia.' },
  { id: 'space',    label: 'Space',    emoji: '\uD83D\uDE80', blurb: 'Planets, rockets and exploding stars.' },
  { id: 'nature',   label: 'Nature',   emoji: '\uD83C\uDF3F', blurb: 'Daisies, waves, mushrooms, rainbows.' },
  { id: 'abstract', label: 'Abstract', emoji: '\u25FC\uFE0F', blurb: 'Checkers, spirals, bolts and stripes.' }
];

window.THEME_LABEL = id => (window.THEMES.find(t => t.id === id) || {}).label || id;

window.TEE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

/* Model list skewed to what people actually carry in India, not just iPhones. */
window.CASE_SIZES = [
  'iPhone 15', 'iPhone 15 Pro', 'iPhone 16', 'iPhone 16 Pro',
  'OnePlus 12', 'Samsung S24', 'Nothing Phone 2a',
  'Redmi Note 13 Pro', 'realme 12 Pro', 'iQOO Neo 9'
];

const TEE_DETAILS = [
  '240gsm bio-washed combed cotton, sourced from Tiruppur',
  'Water-based screen print — the graphic feels like the shirt, not a sticker',
  'Pre-shrunk, so it survives an Indian summer wash cycle',
  'Printed in batches of 200. When a colourway sells out, that is it'
];

const CASE_DETAILS = [
  'Shock-absorbing TPU bumper with a rigid polycarbonate back',
  'Raised lip protects the camera array and the screen face-down',
  'UV-cured print that will not peel at the corners',
  'Wireless-charging friendly'
];

/* Compact catalog definition — copy lives here, the rest is derived below.
 *
 * This mirrors what actually exists in the Qikink dashboard (Products -> My
 * Products), not a fictional catalog. Qikink's public API does not expose a
 * products-listing endpoint (their documented API only covers Orders), so
 * there is no automatic pull — add a row here each time a new product is
 * created in Qikink. Keep slug/colorway/size in sync with
 * server/qikink-skus.json so the order-time SKU lookup does not fail.
 *
 * Row shape: [slug, name, category, subcategory, theme, price, compareAt,
 *             colorways, badge, rating, reviews, tagline, description, sizes]
 * `sizes` is optional — omit (or pass null) to fall back to the full
 * TEE_SIZES/CASE_SIZES list; pass an array to restrict to the phone models
 * (or tee sizes) Qikink actually stocks a blank for. */
const RAW = [
  ['anime-clear-case', 'Anime Clear Case', 'cases', 'clear', 'anime', 399, null, ['cream'], null, 0, 0,
   'See-through, not basic.',
   'A hard, anti-yellowing clear case with an anime print on the back. Currently made for iPhone 16 Pro only.',
   ['iPhone 16 Pro']]
];

window.PRODUCTS = RAW.map(r => ({
  slug: r[0], name: r[1], category: r[2], subcategory: r[3], theme: r[4],
  price: r[5], compareAt: r[6], colorways: r[7],
  badge: r[8], rating: r[9], reviews: r[10],
  tagline: r[11], description: r[12], sizes: r[13] || null,
  details: r[2] === 'tees' ? TEE_DETAILS : CASE_DETAILS
}));

/* Helpers shared by every page. */
window.PRODUCT_BY_SLUG = slug => window.PRODUCTS.find(p => p.slug === slug);
window.PRODUCT_IMAGE = (product, colorway) =>
  `assets/${product.slug}--${colorway || product.colorways[0]}.svg`;
window.SIZES_FOR = product =>
  product.sizes || (product.category === 'tees' ? window.TEE_SIZES : window.CASE_SIZES);
window.SUBCATEGORY_LABEL = (category, id) => {
  const list = window.SUBCATEGORIES[category] || [];
  const hit = list.find(s => s.id === id);
  return hit ? hit.label : id;
};

/* No real reviews exist yet — an empty array here, not fabricated ones. See
   the Known limitations section in README before inventing social proof. */
window.REVIEWS = [];

window.FAQS = [
  { q: 'When will my order arrive?',
    a: 'We print and pack Monday to Saturday from our Bengaluru studio. Metros (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata) get it in 2–4 days. Rest of India is 4–7 days. You get a tracking link the moment it leaves us.' },
  { q: 'Do you offer Cash on Delivery?',
    a: 'Yes, on orders up to ₹3,000, across most PIN codes. There is a ₹49 COD handling fee, which we waive if you prepay by UPI. Prepaid orders also ship a day faster because they skip the confirmation call.' },
  { q: 'What if it does not fit?',
    a: 'Send it back unworn within 15 days for a free size exchange or a full refund. We arrange the reverse pickup at no cost anywhere we deliver. Refunds land back on the original payment method within 5–7 working days.' },
  { q: 'Will the print crack?',
    a: 'Not if you treat it normally. We use water-based inks that soak into the fibre rather than sitting on top. Wash cold, inside out, line dry in the shade and skip the dryer — it will outlast the case or shirt.' },
  { q: 'Which phones do the cases fit?',
    a: 'Right now: iPhone 16 Pro only, on the Clear case. More models get added here as we create them in the Qikink dashboard.' },
  { q: 'Do you ship outside India?',
    a: 'Not yet. We ship across all Indian states and union territories including the North East, Jammu & Kashmir, and the islands. International is on the list for next year.' }
];
