/* Catalog.
 *
 * Single source of truth for the storefront today. When Shopify is connected,
 * js/shopify.js replaces window.PRODUCTS with live data in this same shape —
 * so keep the field names if you edit by hand.
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

/* Compact catalog definition — copy lives here, the rest is derived below. */
const RAW = [
  // ---------- OVERSIZED TEES ----------
  ['cosmic-checker', 'Cosmic Checker Tee', 'tees', 'oversized', 1499, 1899, ['pink','blue','black'], 'Best seller', 4.9, 412,
   'The one everybody asks about.',
   'A warped checkerboard that bends like it is falling into a black hole. Our most-reordered print three drops running.'],
  ['acid-smiley', 'Acid Smiley Tee', 'tees', 'oversized', 1499, null, ['lime','purple','cream'], 'Best seller', 4.8, 356,
   'Aggressively cheerful.',
   'A grin so wide it is almost a threat. Oversized chest print in a lime that shows up under club lighting.'],
  ['hot-flames', 'Hot Flames Tee', 'tees', 'oversized', 1599, 1999, ['orange','black','red'], 'Low stock', 4.7, 289,
   'Certified too hot.',
   'Three-tongue flame stack, hand-drawn then redrawn until the curves felt right. Runs warm in every sense.'],
  ['supernova', 'Supernova Tee', 'tees', 'oversized', 1599, null, ['purple','red','blue'], 'New', 4.9, 118,
   'Go out with a bang.',
   'A ten-point star caught mid-explosion. Printed high on the chest so it reads across a room.'],
  ['hypnotica', 'Hypnotica Tee', 'tees', 'oversized', 1549, null, ['black','red','cyan'], null, 4.8, 203,
   'Do not stare too long.',
   'Six full turns of spiral, plotted rather than drawn so the spacing stays perfect all the way out.'],
  ['third-eye', 'Third Eye Tee', 'tees', 'oversized', 1649, null, ['purple','cream','black'], 'New', 4.8, 96,
   'It sees you.',
   'An eye that follows you around the room, which is either great or deeply unsettling depending on the day.'],

  // ---------- CLASSIC FIT TEES ----------
  ['sunset-stripe', 'Sunset Stripe Tee', 'tees', 'classic', 1099, null, ['yellow','cyan','cream'], null, 4.6, 174,
   'Seventies, but louder.',
   'Seven fat stripes in a sunset gradient. The easy one to reach for when you still want to be seen.'],
  ['tidal', 'Tidal Tee', 'tees', 'classic', 1149, null, ['cyan','blue','lime'], null, 4.7, 162,
   'Five rolling lines.',
   'Stacked waves with just enough wobble to feel hand-drawn. Worn most by people who claim they hate prints.'],
  ['high-voltage', 'High Voltage Tee', 'tees', 'classic', 1199, 1499, ['black','yellow','pink'], 'Best seller', 4.9, 388,
   'Do not touch.',
   'A single fat bolt in warning-sign yellow on deep black. The highest-contrast thing we make.'],
  ['shroom-boom', 'Shroom Boom Tee', 'tees', 'classic', 1099, null, ['lime','cream','blue'], null, 4.7, 141,
   'Forage responsibly.',
   'A spotted cap with a stubby stem, rendered in flat blocks so it prints crisp at any size.'],
  ['double-rainbow', 'Double Rainbow Tee', 'tees', 'classic', 1199, 1449, ['blue','cream','black'], 'Low stock', 4.9, 267,
   'All the way across the sky.',
   'Four concentric arcs in four inks. The most colours we can push through the press in one pass.'],

  // ---------- CROP TEES ----------
  ['daisy-crop', 'Daisy Daze Crop', 'tees', 'crop', 1199, null, ['cream','pink','lime'], null, 4.6, 158,
   'Eight petals, zero chill.',
   'A blown-up daisy in colours no flower has ever managed. Softest handfeel in the range.'],
  ['checker-crop', 'Cosmic Checker Crop', 'tees', 'crop', 1249, 1499, ['cyan','black','yellow'], 'Best seller', 4.8, 224,
   'The checker, cropped.',
   'Same warped grid as the oversized tee, on a shortened body that sits just above the waist.'],
  ['smiley-crop', 'Acid Smiley Crop', 'tees', 'crop', 1199, null, ['purple','orange','cream'], null, 4.7, 133,
   'Short and smug.',
   'The grin, scaled down to suit a cropped chest panel. Reads loud without swallowing the whole shirt.'],
  ['zigzag-crop', 'Zigzag Crop', 'tees', 'crop', 1149, null, ['pink','lime','blue'], 'New', 4.5, 61,
   'Five sharp rows.',
   'Clean geometric zigzag for when you want personality without the shouting.'],

  // ---------- FULL SLEEVE TEES ----------
  ['bolt-sleeve', 'High Voltage Full Sleeve', 'tees', 'longsleeve', 1799, 2099, ['black','blue','red'], 'Best seller', 4.9, 196,
   'Fully charged, fully covered.',
   'The bolt on a long-sleeve body with ribbed cuffs. Our best seller from October onwards.'],
  ['spiral-sleeve', 'Hypnotica Full Sleeve', 'tees', 'longsleeve', 1749, null, ['cream','purple','black'], null, 4.8, 112,
   'Round and round, all winter.',
   'Spiral print with the sleeves left plain, so the graphic stays the only thing going on.'],
  ['wave-sleeve', 'Tidal Full Sleeve', 'tees', 'longsleeve', 1699, null, ['blue','cyan','lime'], null, 4.7, 88,
   'Layer it or do not.',
   'Sits well on its own and well under a jacket. The most-worn piece in our own wardrobes.'],

  // ---------- TOUGH CASES ----------
  ['checker-tough', 'Cosmic Checker Tough Case', 'cases', 'tough', 1099, 1299, ['pink','lime','black'], 'Best seller', 4.8, 341,
   'Matches the tee, survives the fall.',
   'Dual-layer shell with reinforced corners. Drop tested to two metres onto concrete, repeatedly.'],
  ['flame-tough', 'Hot Flames Tough Case', 'cases', 'tough', 1149, null, ['black','orange','red'], null, 4.7, 187,
   'Handle with care, or do not.',
   'Flames climbing a chunky armoured back. Matte finish so it does not slide off the sofa arm.'],
  ['bolt-tough', 'High Voltage Tough Case', 'cases', 'tough', 1099, 1349, ['yellow','black','blue'], 'Low stock', 4.8, 268,
   'Built like a substation.',
   'The bolt scaled to fill the whole back panel, on our most protective shell.'],
  ['star-tough', 'Supernova Tough Case', 'cases', 'tough', 1199, null, ['purple','red','cyan'], 'New', 4.8, 74,
   'Impact rated, literally.',
   'A star mid-explosion on a case designed to take one. Corner airbags absorb the worst of a drop.'],

  // ---------- SLIM CASES ----------
  ['smiley-slim', 'Acid Smiley Slim Case', 'cases', 'slim', 699, null, ['yellow','purple','cyan'], 'Best seller', 4.9, 456,
   'Grins back at you.',
   'Highlighter yellow with the grin dead centre. Easiest phone in the world to spot on a dark table.'],
  ['zigzag-slim', 'Zigzag Slim Case', 'cases', 'slim', 599, null, ['cream','pink','lime'], null, 4.5, 129,
   'Adds almost nothing.',
   'Under 2mm of added thickness. For people who resent that phone cases exist at all.'],
  ['wave-slim', 'Tidal Slim Case', 'cases', 'slim', 649, null, ['cyan','blue','purple'], null, 4.6, 171,
   'Pocket-sized surf.',
   'Rolling waves in three cool tones. The calmest thing in an otherwise very loud catalogue.'],
  ['daisy-slim', 'Daisy Daze Slim Case', 'cases', 'slim', 649, 799, ['cream','pink','lime'], null, 4.7, 203,
   'Bloom on impact.',
   'One oversized daisy, cropped by the edges of the case so it feels bigger than it is.'],

  // ---------- CLEAR CASES ----------
  ['mushroom-clear', 'Shroom Boom Clear Case', 'cases', 'clear', 699, null, ['cream','cyan','pink'], 'New', 4.6, 82,
   'See-through, still weird.',
   'Anti-yellowing clear back with the mushroom floating in the middle. Your phone colour still shows.'],
  ['daisy-clear', 'Daisy Daze Clear Case', 'cases', 'clear', 649, null, ['cream','lime','blue'], null, 4.7, 147,
   'Flowers on glass.',
   'The daisy printed onto a transparent back, so it reads differently on every phone colour.'],
  ['eye-clear', 'Third Eye Clear Case', 'cases', 'clear', 699, 849, ['cream','cyan','yellow'], null, 4.6, 108,
   'Watching, transparently.',
   'The eye on a clear shell. Genuinely unnerving on a white phone, which we consider a feature.'],

  // ---------- MAGSAFE CASES ----------
  ['spiral-mag', 'Hypnotica MagSafe Case', 'cases', 'magsafe', 1149, null, ['purple','red','black'], null, 4.8, 164,
   'Snaps on, spirals out.',
   'Full magnet array, so car mounts and power banks click straight on. Spiral print sits above the ring.'],
  ['rainbow-mag', 'Double Rainbow MagSafe Case', 'cases', 'magsafe', 1199, 1449, ['blue','black','cream'], 'Best seller', 4.9, 231,
   'Four arcs, one magnet.',
   'Our brightest print on our most useful case. Holds a full power bank without sagging.'],
  ['stripe-mag', 'Sunset Stripe MagSafe Case', 'cases', 'magsafe', 1099, null, ['yellow','pink','black'], null, 4.7, 119,
   'Stripes that stick.',
   'Sunset stripes cropped above the magnet ring, so nothing important gets covered.']
];

window.PRODUCTS = RAW.map(r => ({
  slug: r[0], name: r[1], category: r[2], subcategory: r[3],
  price: r[4], compareAt: r[5], colorways: r[6],
  badge: r[7], rating: r[8], reviews: r[9],
  tagline: r[10], description: r[11],
  details: r[2] === 'tees' ? TEE_DETAILS : CASE_DETAILS
}));

/* Helpers shared by every page. */
window.PRODUCT_BY_SLUG = slug => window.PRODUCTS.find(p => p.slug === slug);
window.PRODUCT_IMAGE = (product, colorway) =>
  `assets/${product.slug}--${colorway || product.colorways[0]}.svg`;
window.SIZES_FOR = product =>
  product.category === 'tees' ? window.TEE_SIZES : window.CASE_SIZES;
window.SUBCATEGORY_LABEL = (category, id) => {
  const list = window.SUBCATEGORIES[category] || [];
  const hit = list.find(s => s.id === id);
  return hit ? hit.label : id;
};

window.REVIEWS = [
  { name: 'Ananya S.', initials: 'as', rating: 5, product: 'Cosmic Checker Tee', city: 'Bengaluru',
    title: 'Three compliments before lunch',
    body: 'Wore this to an office offsite where the dress code was smart casual and completely got away with it. The print is far crisper in person than on screen, and it survived a hot wash I was definitely not supposed to do.' },
  { name: 'Rohan K.', initials: 'rk', rating: 5, product: 'High Voltage Tee', city: 'Mumbai',
    title: 'Actually heavyweight',
    body: 'Ordered expecting the usual thin band-merch cotton. This is properly thick, holds its shape, and the black has not faded after about fifteen washes. Buying the pink next.' },
  { name: 'Priya N.', initials: 'pn', rating: 5, product: 'Acid Smiley Slim Case', city: 'Hyderabad',
    title: 'Found my phone instantly',
    body: 'Left it on a table at a crowded cafe and spotted it from the door. Genuinely useful, and it has taken two drops onto tile without a mark.' },
  { name: 'Meera D.', initials: 'md', rating: 4, product: 'Double Rainbow Tee', city: 'Pune',
    title: 'Runs boxy, size down',
    body: 'Great print, four real ink colours you can feel with a thumbnail. The fit is properly boxy though — I am usually an L and the M sits better. Docking one star for the size chart, not the shirt.' },
  { name: 'Sana I.', initials: 'si', rating: 5, product: 'Third Eye Tee', city: 'Delhi',
    title: 'Weird in the best way',
    body: 'People either love it or find it deeply unsettling and both reactions are fun. The cream colourway goes with far more than you would think.' },
  { name: 'Karthik V.', initials: 'kv', rating: 5, product: 'Hot Flames Tee', city: 'Chennai',
    title: 'Delivered in two days',
    body: 'Ordered Sunday night, arrived Tuesday morning in Chennai, packed in a recyclable mailer with a sticker sheet. Small thing, but it made the whole order feel considered.' }
];

window.FAQS = [
  { q: 'How does the sizing run?',
    a: 'Our oversized fit is boxy with a dropped shoulder — if you want it closer to the body, take one size down. Classic Fit is true to size. Every product page lists chest and length in centimetres, measured on the garment laid flat. Sizes run XS to 3XL.' },
  { q: 'When will my order arrive?',
    a: 'We print and pack Monday to Saturday from our Bengaluru studio. Metros (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata) get it in 2–4 days. Rest of India is 4–7 days. You get a tracking link the moment it leaves us.' },
  { q: 'Do you offer Cash on Delivery?',
    a: 'Yes, on orders up to ₹3,000, across most PIN codes. There is a ₹49 COD handling fee, which we waive if you prepay by UPI. Prepaid orders also ship a day faster because they skip the confirmation call.' },
  { q: 'What if it does not fit?',
    a: 'Send it back unworn within 15 days for a free size exchange or a full refund. We arrange the reverse pickup at no cost anywhere we deliver. Refunds land back on the original payment method within 5–7 working days.' },
  { q: 'Will the print crack?',
    a: 'Not if you treat it normally. We use water-based inks that soak into the fibre rather than sitting on top. Wash cold, inside out, line dry in the shade and skip the dryer — it will outlast the shirt.' },
  { q: 'Which phones do the cases fit?',
    a: 'iPhone 15 and 16 across all sizes, OnePlus 12, Samsung S24, Nothing Phone 2a, Redmi Note 13 Pro, realme 12 Pro and iQOO Neo 9. Pick your model at checkout. If yours is not listed, write to us — we can usually cut a one-off.' },
  { q: 'Do you restock sold-out colourways?',
    a: 'Rarely. We print in batches of 200 so the good colours stay a bit special. Join the list and you will hear about a restock before it goes public.' },
  { q: 'Do you ship outside India?',
    a: 'Not yet. We ship across all Indian states and union territories including the North East, Jammu & Kashmir, and the islands. International is on the list for next year.' }
];
