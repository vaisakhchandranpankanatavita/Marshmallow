/* Catalog.
 *
 * This is the single source of truth for the storefront today. When Shopify is
 * connected, js/shopify.js replaces the contents of window.PRODUCTS with live
 * data in this same shape — so keep the field names if you edit by hand.
 *
 * Image convention: assets/<slug>--<colorway>.svg
 */

window.SWATCHES = {
  pink: '#FF2E93', blue: '#2D7DFF', lime: '#B4FF39', orange: '#FF6B1A',
  purple: '#8B2FE8', cyan: '#00E5D0', yellow: '#FFC72C', red: '#E03127',
  black: '#141414', cream: '#FBF3E4'
};

window.TEE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
window.CASE_SIZES = ['iPhone 15', 'iPhone 15 Pro', 'iPhone 16', 'iPhone 16 Pro', 'Pixel 9', 'Galaxy S24'];

const TEE_DETAILS = [
  '240gsm heavyweight combed cotton — holds its shape wash after wash',
  'Water-based screen print, so the graphic feels like the shirt, not a sticker',
  'Boxy unisex fit with a ribbed neck and twin-needle hem',
  'Printed in small batches. When a colourway sells out, that\'s it'
];

const CASE_DETAILS = [
  'Shock-absorbing TPU bumper with a rigid polycarbonate back',
  'Raised lip protects the camera array and the screen face-down',
  'UV-cured print that will not peel off at the corners',
  'Wireless-charging and MagSafe friendly'
];

window.PRODUCTS = [
  {
    slug: 'cosmic-checker', name: 'Cosmic Checker Tee', category: 'tees',
    price: 34, compareAt: 42, colorways: ['pink', 'blue', 'black'],
    badge: 'Best seller', rating: 4.9, reviews: 218,
    tagline: 'The one everybody asks about.',
    description: 'A warped checkerboard that bends like it is falling into a black hole. Our most-reordered print three drops running.',
    details: TEE_DETAILS
  },
  {
    slug: 'acid-smiley', name: 'Acid Smiley Tee', category: 'tees',
    price: 34, compareAt: null, colorways: ['lime', 'purple', 'cream'],
    badge: 'Best seller', rating: 4.8, reviews: 174,
    tagline: 'Aggressively cheerful.',
    description: 'A grin so wide it is almost a threat. Oversized chest print in a lime that shows up under club lighting.',
    details: TEE_DETAILS
  },
  {
    slug: 'hot-flames', name: 'Hot Flames Tee', category: 'tees',
    price: 36, compareAt: 44, colorways: ['orange', 'black', 'red'],
    badge: 'Low stock', rating: 4.7, reviews: 143,
    tagline: 'Certified too hot.',
    description: 'Three-tongue flame stack, hand-drawn then redrawn until the curves felt right. Runs warm in every sense.',
    details: TEE_DETAILS
  },
  {
    slug: 'sunset-stripe', name: 'Sunset Stripe Tee', category: 'tees',
    price: 32, compareAt: null, colorways: ['yellow', 'cyan', 'cream'],
    badge: null, rating: 4.6, reviews: 98,
    tagline: 'Seventies, but louder.',
    description: 'Seven fat stripes in a sunset gradient. The easy one to reach for when you still want to be seen.',
    details: TEE_DETAILS
  },
  {
    slug: 'supernova', name: 'Supernova Tee', category: 'tees',
    price: 36, compareAt: null, colorways: ['purple', 'red', 'blue'],
    badge: 'New', rating: 4.9, reviews: 61,
    tagline: 'Go out with a bang.',
    description: 'A ten-point star mid-explosion. Big, symmetrical and unapologetic — the print sits high so it reads across a room.',
    details: TEE_DETAILS
  },
  {
    slug: 'tidal', name: 'Tidal Tee', category: 'tees',
    price: 34, compareAt: null, colorways: ['cyan', 'blue', 'lime'],
    badge: null, rating: 4.7, reviews: 87,
    tagline: 'Five rolling lines.',
    description: 'Stacked waves with just enough wobble to feel hand-drawn. Our most-worn print by people who claim they hate prints.',
    details: TEE_DETAILS
  },
  {
    slug: 'high-voltage', name: 'High Voltage Tee', category: 'tees',
    price: 36, compareAt: 44, colorways: ['black', 'yellow', 'pink'],
    badge: 'Best seller', rating: 4.9, reviews: 205,
    tagline: 'Do not touch.',
    description: 'A single fat bolt in warning-sign yellow on deep black. The highest-contrast thing we make.',
    details: TEE_DETAILS
  },
  {
    slug: 'third-eye', name: 'Third Eye Tee', category: 'tees',
    price: 38, compareAt: null, colorways: ['purple', 'cream', 'black'],
    badge: 'New', rating: 4.8, reviews: 54,
    tagline: 'It sees you.',
    description: 'An eye that follows you around the room, which is either great or deeply unsettling depending on the day.',
    details: TEE_DETAILS
  },
  {
    slug: 'daisy-daze', name: 'Daisy Daze Tee', category: 'tees',
    price: 32, compareAt: null, colorways: ['cream', 'pink', 'lime'],
    badge: null, rating: 4.6, reviews: 132,
    tagline: 'Eight petals, zero chill.',
    description: 'A blown-up daisy in colours no flower has ever managed. Softest handfeel in the range.',
    details: TEE_DETAILS
  },
  {
    slug: 'hypnotica', name: 'Hypnotica Tee', category: 'tees',
    price: 36, compareAt: null, colorways: ['black', 'red', 'cyan'],
    badge: null, rating: 4.8, reviews: 119,
    tagline: 'Do not stare too long.',
    description: 'Six full turns of spiral, plotted rather than drawn so the spacing stays perfect all the way out.',
    details: TEE_DETAILS
  },
  {
    slug: 'shroom-boom', name: 'Shroom Boom Tee', category: 'tees',
    price: 34, compareAt: null, colorways: ['lime', 'cream', 'blue'],
    badge: null, rating: 4.7, reviews: 76,
    tagline: 'Forage responsibly.',
    description: 'A spotted cap with a stubby stem, rendered in flat blocks so it prints crisp at any size.',
    details: TEE_DETAILS
  },
  {
    slug: 'double-rainbow', name: 'Double Rainbow Tee', category: 'tees',
    price: 34, compareAt: 40, colorways: ['blue', 'cream', 'black'],
    badge: 'Low stock', rating: 4.9, reviews: 164,
    tagline: 'All the way across the sky.',
    description: 'Four concentric arcs in four inks. The most colours we can push through a press in one pass.',
    details: TEE_DETAILS
  },

  {
    slug: 'checker-case', name: 'Cosmic Checker Case', category: 'cases',
    price: 26, compareAt: 32, colorways: ['pink', 'lime', 'black'],
    badge: 'Best seller', rating: 4.8, reviews: 189,
    tagline: 'Matches the tee.',
    description: 'The Cosmic Checker print wrapped onto a case back. Buy both, be insufferable about it.',
    details: CASE_DETAILS
  },
  {
    slug: 'smiley-case', name: 'Acid Smiley Case', category: 'cases',
    price: 26, compareAt: null, colorways: ['yellow', 'purple', 'cyan'],
    badge: 'Best seller', rating: 4.9, reviews: 231,
    tagline: 'Grins back at you.',
    description: 'Highlighter yellow with the grin sitting dead centre. Easiest phone in the world to spot on a bar.',
    details: CASE_DETAILS
  },
  {
    slug: 'flame-case', name: 'Hot Flames Case', category: 'cases',
    price: 28, compareAt: null, colorways: ['black', 'orange', 'red'],
    badge: null, rating: 4.7, reviews: 112,
    tagline: 'Handle with care.',
    description: 'Flames climbing the back of the case. Matte finish, so it does not slide off the arm of the sofa.',
    details: CASE_DETAILS
  },
  {
    slug: 'zigzag-case', name: 'Zigzag Case', category: 'cases',
    price: 24, compareAt: null, colorways: ['cream', 'pink', 'lime'],
    badge: null, rating: 4.5, reviews: 68,
    tagline: 'Five sharp rows.',
    description: 'Clean geometric zigzag for when you want personality without the shouting.',
    details: CASE_DETAILS
  },
  {
    slug: 'bolt-case', name: 'High Voltage Case', category: 'cases',
    price: 26, compareAt: 32, colorways: ['yellow', 'black', 'blue'],
    badge: 'Low stock', rating: 4.8, reviews: 147,
    tagline: 'Fully charged.',
    description: 'The bolt, scaled to fill the whole back panel. Reads from across the room, which is the entire point.',
    details: CASE_DETAILS
  },
  {
    slug: 'wave-case', name: 'Tidal Case', category: 'cases',
    price: 26, compareAt: null, colorways: ['cyan', 'blue', 'purple'],
    badge: null, rating: 4.6, reviews: 93,
    tagline: 'Pocket-sized surf.',
    description: 'Rolling waves in three cool tones. The calmest thing in an otherwise very loud catalogue.',
    details: CASE_DETAILS
  },
  {
    slug: 'daisy-case', name: 'Daisy Daze Case', category: 'cases',
    price: 24, compareAt: null, colorways: ['cream', 'pink', 'lime'],
    badge: null, rating: 4.7, reviews: 105,
    tagline: 'Bloom on impact.',
    description: 'One oversized daisy, cropped by the edges of the case so it feels bigger than it is.',
    details: CASE_DETAILS
  },
  {
    slug: 'spiral-case', name: 'Hypnotica Case', category: 'cases',
    price: 28, compareAt: null, colorways: ['purple', 'red', 'black'],
    badge: 'New', rating: 4.8, reviews: 42,
    tagline: 'Round and round.',
    description: 'The spiral, tightened up to suit a taller canvas. Genuinely hard to stop looking at.',
    details: CASE_DETAILS
  }
];

/* Helpers shared by every page. */
window.PRODUCT_BY_SLUG = slug => window.PRODUCTS.find(p => p.slug === slug);
window.PRODUCT_IMAGE = (product, colorway) =>
  `assets/${product.slug}--${colorway || product.colorways[0]}.svg`;
window.SIZES_FOR = product =>
  product.category === 'tees' ? window.TEE_SIZES : window.CASE_SIZES;

window.REVIEWS = [
  { name: 'Maya J.', initials: 'mj', rating: 5, product: 'Cosmic Checker Tee',
    title: 'Three compliments before lunch',
    body: 'I wore this to a work thing where the dress code was "smart" and got away with it. The print is way crisper in person than on screen, and it survived a hot wash I definitely was not supposed to do.' },
  { name: 'Theo K.', initials: 'tk', rating: 5, product: 'High Voltage Tee',
    title: 'Actually heavyweight',
    body: 'Ordered expecting the usual thin band-merch cotton. This is properly thick, holds its shape, and the black has not faded after about fifteen washes. Buying the pink next.' },
  { name: 'Aria R.', initials: 'ar', rating: 5, product: 'Acid Smiley Case',
    title: 'Found my phone instantly',
    body: 'Left it on a table in a dark bar and spotted it from the door. Genuinely useful and it has taken two drops onto concrete without a mark.' },
  { name: 'Sam D.', initials: 'sd', rating: 4, product: 'Double Rainbow Tee',
    title: 'Runs boxy, size down',
    body: 'Great print, four real ink colours you can feel with a thumbnail. Fit is properly boxy though — I am normally an L and the M sits better. Docking one star for the size chart, not the shirt.' },
  { name: 'Lo O.', initials: 'lo', rating: 5, product: 'Third Eye Tee',
    title: 'Weird in the best way',
    body: 'People either love it or find it deeply unsettling and both reactions are fun. Cream colourway goes with more than you would think.' },
  { name: 'Ben W.', initials: 'bw', rating: 5, product: 'Hot Flames Tee',
    title: 'Shipped in two days',
    body: 'Ordered Sunday, arrived Tuesday, packaged in a recyclable mailer with a sticker sheet. Small thing but it made the whole thing feel considered.' }
];

window.FAQS = [
  { q: 'How does the sizing run?',
    a: 'Boxy and true to size, with a slightly shorter body than a standard tee. If you like a closer fit, size down one. Every product page has the full chest and length measurements in centimetres, garment flat.' },
  { q: 'When will my order arrive?',
    a: 'We print and pack Monday to Friday. UK orders arrive in 2–3 working days, Europe in 4–6, and the rest of the world in 7–12. You get a tracking link the moment it leaves the studio.' },
  { q: 'What if it does not fit?',
    a: 'Send it back unworn within 30 days for a free exchange or a full refund, no explaining required. Return postage is on us for anything shipped inside the UK.' },
  { q: 'Will the print crack?',
    a: 'Not if you treat it normally. We use water-based inks that soak into the fibre rather than sitting on top. Wash cold, inside out, and skip the tumble dryer and it will outlast the shirt.' },
  { q: 'Do you restock sold-out colourways?',
    a: 'Rarely. We print in small batches so that the good colours stay a bit special. Join the list and you will hear about a restock before it goes public.' },
  { q: 'Which phones do the cases fit?',
    a: 'iPhone 15 and 16 across all sizes, Pixel 9, and Galaxy S24. Pick your model at checkout. If yours is not listed, email us — we can usually cut a one-off.' }
];
