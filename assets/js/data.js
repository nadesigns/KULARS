/* Kulars catalog — preview data.
   Mirrors what Shopify will serve: product → variants → images, plus the fields the
   collection filters read (cat, sizes, color family per variant, need for the kit builder). */
window.KULARS_DATA = (() => {
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const ONE = ['One size'];

  // color families group variant names into the swatches shown in the filters
  const FAMILIES = {
    sand: { label: 'Sand', hex: '#e4d8c3' },
    brown: { label: 'Brown', hex: '#3b281e' },
    wine: { label: 'Wine', hex: '#5a1f2a' },
    orange: { label: 'Orange', hex: '#d9652c' },
    green: { label: 'Green', hex: '#1f5a3c' },
    volt: { label: 'Volt', hex: '#b8e04a' }
  };

  const teamwear = [
    { id: 'singlet', cat: 'training', need: 'training', name: 'Pro Training Singlet', tag: 'Training', price: 38, sizes: SIZES,
      desc: 'Sleeveless training top with orange side panels, the club crest on the chest and the Kulars wordmark across the back. The piece the squad lives in from August to May.',
      variants: [{ c: 'Sand / Brown', fam: 'sand', hex: '#e7dccb', imgs: ['singlet-pair', 'singlet-front'] }] },
    { id: 'jacket', cat: 'jackets', need: 'travel', name: 'All-Weather Training Jacket', tag: 'Training', price: 96, sizes: SIZES,
      desc: 'Full-zip hooded jacket in wine with orange sleeves and piping. K mark and player number on the chest, crest opposite.',
      variants: [{ c: 'Wine / Orange', fam: 'wine', hex: '#5a1f2a', imgs: ['jacket-turn', 'jacket-run'] }] },
    { id: 'coach', cat: 'jackets', need: 'staff', name: "Coaches' Track Jacket", tag: 'Staff', price: 110, sizes: SIZES,
      desc: 'Track jacket for the bench, in pitch green with mint sleeves and a full-length zip. Crest and K mark in club colors.',
      variants: [{ c: 'Pitch Green / Mint', fam: 'green', hex: '#1f5a3c', imgs: ['coach', 'hero-jacket'] }] },
    { id: 'bib', cat: 'training', need: 'training', name: 'Training Bib', tag: 'Training', price: 14, sizes: ['S', 'M', 'L', 'XL'],
      desc: 'Lightweight training bib with the club crest and Kulars wordmark on the chest. Sold in sets for drills and small-sided games.',
      variants: [{ c: 'Orange', fam: 'orange', hex: '#ec6a2c', imgs: ['hero-drill', 'singlet-duo'] }, { c: 'Volt', fam: 'volt', hex: '#b8e04a', imgs: ['hero-drill', 'singlet-duo'] }] },
    { id: 'backpack', cat: 'bags', need: 'bags', name: 'Club Backpack', tag: 'Travel', price: 72, sizes: ONE,
      desc: 'Flap-top backpack with a mesh side pocket, the K mark on the lid and the player\'s number beside the crest.',
      variants: [{ c: 'Wine', fam: 'wine', hex: '#5a1f24', imgs: ['backpack', 'locker'] }] },
    { id: 'armband', cat: 'accessories', need: 'matchday', name: "Captain's Armband", tag: 'Matchday', price: 12, sizes: ONE,
      desc: 'Orange captain\'s armband carrying the Kulars K in sand. Made to match the rest of the kit.',
      variants: [{ c: 'Orange', fam: 'orange', hex: '#ec6a2c', imgs: ['armband', 'locker'] }] }
  ];

  const fanwear = [
    { id: 'crest-hoodie', cat: 'hoodies', need: 'supporters', name: 'Crest Hoodie', tag: 'Club Shop', price: 65, flat: true, sizes: SIZES,
      desc: 'Heavyweight hoodie with the butterfly crest on the chest and the club name down the sleeve.',
      variants: [
        { c: 'Rust', fam: 'orange', hex: '#c4552d', imgs: ['p-hoodie-rust', 'fan-hoodie-rust'], extra: ['p-hoodie-rust-2', 'fan-hoodie-rust-2'] },
        { c: 'Sand', fam: 'sand', hex: '#cfcab8', imgs: ['p-hoodie-tan', 'fan-hoodie-tan'], extra: ['p-hoodie-tan-2', 'fan-hoodie-sit'] }] },
    { id: 'word-hoodie', cat: 'hoodies', need: 'supporters', name: 'Wordmark Hoodie', tag: 'Club Shop', price: 65, flat: true, sizes: SIZES,
      desc: 'Brown hoodie with the club wordmark across the chest and down the sleeve.',
      variants: [{ c: 'Brown', fam: 'brown', hex: '#3b281e', imgs: ['p-hoodie-brown', 'fan-hoodie-brown'], extra: ['p-hoodie-brown-2', 'fan-hoodie-brown-2'] }] },
    { id: 'crest-tee', cat: 'tees', need: 'supporters', name: 'Crest Tee', tag: 'Club Shop', price: 30, flat: true, sizes: SIZES,
      desc: 'Classic-fit cotton tee with the full butterfly crest on the chest.',
      variants: [
        { c: 'Orange', fam: 'orange', hex: '#d9652c', imgs: ['p-tee-orange', 'fan-tee-orange'] },
        { c: 'Sand', fam: 'sand', hex: '#e4dccb', imgs: ['p-tee-sand', 'fan-tee-sand'] }] },
    { id: 'word-tee', cat: 'tees', need: 'supporters', name: 'Wordmark Tee', tag: 'Club Shop', price: 30, flat: true, sizes: SIZES,
      desc: 'Brown tee with the club wordmark on the front and the crest between the shoulders.',
      variants: [{ c: 'Brown', fam: 'brown', hex: '#3b281e', imgs: ['p-tee-brown', 'fan-tee-brown'], extra: ['p-tee-brown-back'] }] },
    { id: 'cap', cat: 'caps', need: 'supporters', name: 'Butterfly Cap', tag: 'Club Shop', price: 34, flat: true, sizes: ONE,
      desc: 'Structured cap with the embroidered butterfly on the front panel.',
      variants: [
        { c: 'Tan', fam: 'sand', hex: '#cdb894', imgs: ['p-cap-tan', 'fan-cap-tan'] },
        { c: 'Orange', fam: 'orange', hex: '#d9652c', imgs: ['p-cap-orange', 'fan-cap-orange'] },
        { c: 'Brown', fam: 'brown', hex: '#3b281e', imgs: ['p-cap-brown', 'fan-cap-brown'] }] },
    { id: 'scarf', cat: 'scarves', need: 'supporters', name: 'Matchday Scarf', tag: 'Club Shop', price: 28, flat: true, sizes: ONE,
      desc: 'Knitted two-sided scarf with tasselled ends. Club name on one side, nickname on the other.',
      variants: [{ c: 'Sand / Rust', fam: 'sand', hex: '#e2d3b6', imgs: ['p-scarf', 'fan-scarf'], extra: ['fan-scarf-up'] }] }
  ];

  // collection facets: label maps decide which values a page offers and in what order
  const COLLECTIONS = {
    teamwear: { products: teamwear, cats: { training: 'Training', jackets: 'Jackets', bags: 'Bags & travel', accessories: 'Accessories' } },
    fanwear: { products: fanwear, cats: { hoodies: 'Hoodies', tees: 'Tees', caps: 'Caps', scarves: 'Scarves' } }
  };

  // custom kit builder groups
  const NEEDS = { training: 'Training', travel: 'Travel', staff: 'Staff & bench', matchday: 'Matchday', bags: 'Bags', supporters: 'Supporters' };

  const clubs = [
    { id: 'staten-island', name: 'Staten Island Athletic SC', level: 'semi-pro', region: 'New York',
      league: 'USL League Two', img: 'walk', shop: 'club-shop.html', featured: true }
  ];
  const LEVELS = { 'semi-pro': 'Semi-pro / USL2', academy: 'Academy', school: 'High school / College', amateur: 'Amateur / Sunday league' };

  return { SIZES, FAMILIES, teamwear, fanwear, COLLECTIONS, NEEDS, clubs, LEVELS };
})();
