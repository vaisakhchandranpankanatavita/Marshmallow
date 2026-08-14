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
 * REAL_RAW mirrors what actually exists in the Qikink dashboard (Products ->
 * My Products). Qikink's public API does not expose a products-listing
 * endpoint (their documented API only covers Orders), so there is no
 * automatic pull — add a row here each time a new product is created in
 * Qikink. Keep slug/colorway/size in sync with server/qikink-skus.json so
 * the order-time SKU lookup does not fail.
 *
 * Row shape: [slug, name, category, subcategory, theme, price, compareAt,
 *             colorways, badge, rating, reviews, tagline, description, sizes]
 * `sizes` is optional — omit (or pass null) to fall back to the full
 * TEE_SIZES/CASE_SIZES list; pass an array to restrict to the phone models
 * (or tee sizes) Qikink actually stocks a blank for. */
const REAL_RAW = [
  ['anime-clear-case', 'Anime Clear Case', 'cases', 'clear', 'anime', 399, null, ['cream'], null, 0, 0,
   'See-through, not basic.',
   'A hard, anti-yellowing clear case with an anime print on the back. Currently made for iPhone 16 Pro only.',
   ['iPhone 16 Pro']]
];

/* ==========================================================================
 * DEMO / PLACEHOLDER PRODUCTS — NOT REAL. NOT IN QIKINK.
 *
 * Fills out the site (theme tiles, filters, best sellers, the parallel-scroll
 * wall — everything downstream reads window.PRODUCTS, so this needs no other
 * wiring) while there's only one real product. None of these slugs exist in
 * server/qikink-skus.json, so checkout correctly refuses to place a real
 * order for any of them ("no Qikink SKU mapped") — safe to forget to remove.
 *
 * TO REMOVE: delete this whole block down to the `const RAW = [...]` line,
 * change that line to `const RAW = REAL_RAW;`, and run
 * `python3 tools/gen_assets.py` to drop the matching demo artwork (its own
 * DEMO_CATALOG toggle lives next to CATALOG in tools/gen_assets.py — flip
 * both together). Or just set SHOW_DEMO_PRODUCTS to false below to hide them
 * without deleting anything.
 * ========================================================================== */
const SHOW_DEMO_PRODUCTS = true;

const DEMO_RAW = [
  ['cosmic-checker', 'Cosmic Checker Tee', 'tees', 'oversized', 'abstract', 1499, 1899, ['pink','blue','black'], 'Best seller', 4.9, 412,
   'The one everybody asks about.',
   'A warped checkerboard that bends like it is falling into a black hole. Our most-reordered print three drops running.'],
  ['acid-smiley', 'Acid Smiley Tee', 'tees', 'oversized', 'cartoon', 1499, null, ['lime','purple','cream'], 'Best seller', 4.8, 356,
   'Aggressively cheerful.',
   'A grin so wide it is almost a threat. Oversized chest print in a lime that shows up under club lighting.'],
  ['senpai-stare', 'Senpai Stare Tee', 'tees', 'oversized', 'anime', 1599, null, ['pink','black','cream'], 'New', 4.9, 143,
   'It noticed you.',
   'One enormous manga eye with four highlights and a proper lash line. Prints at nearly full chest width.'],
  ['redline', 'Redline Tee', 'tees', 'oversized', 'cars', 1599, 1899, ['red','black','blue'], 'Best seller', 4.8, 198,
   'Foot down.',
   'A stripped-back side profile with speed bars trailing behind it. No badges, no brand, just the shape.'],
  ['tidal', 'Tidal Tee', 'tees', 'classic', 'nature', 1149, null, ['cyan','blue','lime'], null, 4.7, 162,
   'Five rolling lines.',
   'Stacked waves with just enough wobble to feel hand-drawn. Worn most by people who claim they hate prints.'],
  ['continue-y-n', 'Continue? Y/N Tee', 'tees', 'classic', 'gaming', 1249, null, ['black','purple','cream'], 'Best seller', 4.9, 264,
   'Ten, nine, eight...',
   'A fat controller silhouette with a d-pad and four face buttons. Reads instantly from across an arcade.'],
  ['tape-deck', 'Tape Deck Tee', 'tees', 'classic', 'music', 1199, null, ['orange','black','yellow'], null, 4.7, 152,
   'Side A.',
   'A cassette rendered in flat blocks, spools and all. Older than most of the people who buy it.'],
  ['orbit', 'Orbit Tee', 'tees', 'classic', 'space', 1249, null, ['black','blue','purple'], 'New', 4.8, 97,
   'Ringed and rising.',
   'A ringed planet with a scattering of stars. The calmest thing we print, which is not saying much.'],
  ['bolt-sleeve', 'High Voltage Full Sleeve', 'tees', 'longsleeve', 'abstract', 1799, 2099, ['black','blue','red'], 'Best seller', 4.9, 196,
   'Fully charged, fully covered.',
   'The bolt on a long-sleeve body with ribbed cuffs. Our best seller from October onwards.'],
  ['checker-tough', 'Cosmic Checker Tough Case', 'cases', 'tough', 'abstract', 1099, 1299, ['pink','lime','black'], 'Best seller', 4.8, 341,
   'Matches the tee, survives the fall.',
   'Dual-layer shell with reinforced corners. Drop tested to two metres onto concrete, repeatedly.'],
  ['flame-tough', 'Hot Flames Tough Case', 'cases', 'tough', 'cars', 1149, null, ['black','orange','red'], null, 4.7, 187,
   'Handle with care, or do not.',
   'Flames climbing a chunky armoured back. Matte finish so it does not slide off the sofa arm.'],
  ['respawn-tough', 'Respawn Tough Case', 'cases', 'tough', 'gaming', 1149, 1349, ['black','lime','purple'], 'Low stock', 4.8, 156,
   'Take the fall.',
   'Controller print on the drop-tested shell. For people who game where they walk.'],
  ['smiley-slim', 'Acid Smiley Slim Case', 'cases', 'slim', 'cartoon', 699, null, ['yellow','purple','cyan'], 'Best seller', 4.9, 456,
   'Grins back at you.',
   'Highlighter yellow with the grin dead centre. Easiest phone in the world to spot on a dark table.'],
  ['mixtape-slim', 'Mixtape Slim Case', 'cases', 'slim', 'music', 649, null, ['orange','black','cream'], null, 4.6, 118,
   'Rewind with a pencil.',
   'The cassette print on our thinnest case. Adds under 2mm and a lot of conversation.'],
  ['mushroom-clear', 'Shroom Boom Clear Case', 'cases', 'clear', 'nature', 699, null, ['cream','cyan','pink'], 'New', 4.6, 82,
   'See-through, still weird.',
   'Anti-yellowing clear back with the mushroom floating in the middle. Your phone colour still shows.'],
  ['senpai-clear', 'Senpai Stare Clear Case', 'cases', 'clear', 'anime', 749, null, ['cream','pink','cyan'], null, 4.7, 112,
   'Watching from your pocket.',
   'The eye on a transparent back, so your phone colour becomes part of the artwork.'],
  ['spiral-mag', 'Hypnotica MagSafe Case', 'cases', 'magsafe', 'abstract', 1149, null, ['purple','red','black'], null, 4.8, 164,
   'Snaps on, spirals out.',
   'Full magnet array, so car mounts and power banks click straight on. Spiral print sits above the ring.'],
  ['orbit-mag', 'Orbit MagSafe Case', 'cases', 'magsafe', 'space', 1199, null, ['black','blue','purple'], 'Best seller', 4.9, 143,
   'Full magnetic orbit.',
   'The ringed planet above the magnet array, so the ring and the rings line up. We could not resist.']
];

// DEMO_RAW rows have no `sizes` field (index 13) — pad it with null before
// appending the demo flag, or `demo: true` would land in the `sizes` slot.
const RAW = [...REAL_RAW, ...(SHOW_DEMO_PRODUCTS ? DEMO_RAW.map(r => [...r, null, true]) : [])];

window.PRODUCTS = RAW.map(r => ({
  slug: r[0], name: r[1], category: r[2], subcategory: r[3], theme: r[4],
  price: r[5], compareAt: r[6], colorways: r[7],
  badge: r[8], rating: r[9], reviews: r[10],
  tagline: r[11], description: r[12], sizes: r[13] || null,
  details: r[2] === 'tees' ? TEE_DETAILS : CASE_DETAILS,
  demo: !!r[14]
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
