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
    volt: { label: 'Volt', hex: '#b8e04a' },
    black: { label: 'Black', hex: '#232323' },
    white: { label: 'White', hex: '#f4f4f2' }
  };

  // teamwear, shown in the Monarchs kit: every piece is made up in a club's own colors, crest and sponsor
  const teamwear = [
    { id: 'match-jersey', cat: 'matchday', need: 'matchday', name: 'Match Jersey', tag: 'Matchday', price: 58, sizes: SIZES,
      desc: 'Pinstriped match shirt with contrast raglan sleeves, a placket collar and the crest on the chest. Sponsor across the front, name and number on the back. Three colorways for home, away and third kits.',
      variants: [
        { c: 'Orange / Brown', fam: 'orange', hex: '#e8622a', imgs: ['tw-match-orange', 'tw-match-orange-back'] },
        { c: 'Cream / Brown', fam: 'sand', hex: '#f1ece4', imgs: ['tw-match-cream', 'tw-match-cream-back'] },
        { c: 'Brown / Orange', fam: 'brown', hex: '#4a3026', imgs: ['tw-match-brown', 'tw-match-brown-back'] }] },
    { id: 'match-shorts', cat: 'matchday', need: 'matchday', name: 'Match Shorts', tag: 'Matchday', price: 32, sizes: SIZES,
      desc: 'Match shorts with a contrast hem, the crest on one leg and the player number and K mark on the other. Made to pair with the match jersey.',
      variants: [
        { c: 'Cream / Brown', fam: 'sand', hex: '#efe6dc', imgs: ['tw-match-shorts-cream'] },
        { c: 'Brown / Orange', fam: 'brown', hex: '#4a3026', imgs: ['tw-match-shorts-brown'] }] },
    { id: 'training-jersey', cat: 'training', need: 'training', name: 'Training Jersey', tag: 'Training', price: 45, sizes: SIZES,
      desc: 'Short-sleeve training shirt with contrast sleeves and side panels, the crest on the chest, sponsor on the front and the Kulars wordmark across the back.',
      variants: [
        { c: 'Cream / Brown', fam: 'sand', hex: '#efe6dc', imgs: ['tw-training-cream', 'tw-training-cream-back'] },
        { c: 'Sage / Green', fam: 'green', hex: '#8fb5a0', imgs: ['tw-training-green', 'tw-training-green-back'] }] },
    { id: 'quarter-zip', cat: 'training', need: 'training', name: 'Quarter-Zip Training Top', tag: 'Training', price: 68, sizes: SIZES,
      desc: 'Long-sleeve quarter-zip for warm-ups and cold sessions. Contrast sleeves, K marks down the arms, crest and sponsor on the front, Kulars wordmark on the back.',
      variants: [
        { c: 'Cream / Brown', fam: 'sand', hex: '#efe6dc', imgs: ['tw-qzip-cream', 'tw-qzip-cream-back'] },
        { c: 'Sage / Green', fam: 'green', hex: '#8fb5a0', imgs: ['tw-qzip-green', 'tw-qzip-green-back'] }] },
    { id: 'singlet', cat: 'training', need: 'training', name: 'Pro Training Singlet', tag: 'Training', price: 38, sizes: SIZES,
      desc: 'Sleeveless training top with orange side panels, the club crest on the chest and the Kulars wordmark across the back. The piece the squad lives in from August to May.',
      variants: [{ c: 'Sand / Brown', fam: 'sand', hex: '#e7dccb', imgs: ['tw-singlet', 'tw-singlet-back'], extra: ['singlet-pair', 'singlet-front'] }] },
    { id: 'jacket', cat: 'jackets', need: 'travel', name: 'All-Weather Training Jacket', tag: 'Training', price: 96, sizes: SIZES,
      desc: 'Full-zip hooded jacket in wine with orange sleeves and piping. K mark and player number on the chest, crest opposite.',
      variants: [{ c: 'Wine / Orange', fam: 'wine', hex: '#5a1f2a', imgs: ['tw-allweather-jacket', 'jacket-turn'], extra: ['jacket-run'] }] },
    { id: 'coach', cat: 'jackets', need: 'staff', name: "Coaches' Track Jacket", tag: 'Staff', price: 110, sizes: SIZES,
      desc: 'Track jacket for the bench, in pitch green with mint sleeves and a full-length zip. Crest and K mark in club colors.',
      variants: [{ c: 'Pitch Green / Mint', fam: 'green', hex: '#1f5a3c', imgs: ['tw-coach-jacket', 'coach'], extra: ['hero-jacket'] }] },
    { id: 'training-shorts', cat: 'training', need: 'training', name: 'Training Shorts', tag: 'Training', price: 30, sizes: SIZES,
      desc: 'Training shorts with an elastic waist, the crest on one leg and the K mark on the other.',
      variants: [
        { c: 'Brown / Orange', fam: 'brown', hex: '#4a3026', imgs: ['tw-training-shorts-brown'] },
        { c: 'Green', fam: 'green', hex: '#5f8a6e', imgs: ['tw-training-shorts-green'] }] },
    { id: 'training-pants', cat: 'training', need: 'training', name: 'Training Pants', tag: 'Training', price: 55, sizes: SIZES,
      desc: 'Tapered training pants in brown with orange panels at the hip, the crest on the thigh and the K mark opposite.',
      variants: [{ c: 'Brown / Orange', fam: 'brown', hex: '#4a3026', imgs: ['tw-training-pants'] }] },
    { id: 'bib', cat: 'training', need: 'training', name: 'Training Bib', tag: 'Training', price: 14, sizes: ['S', 'M', 'L', 'XL'],
      desc: 'Lightweight training bib with the club crest and Kulars wordmark on the chest and a number on the back. Sold in sets for drills and small-sided games.',
      variants: [
        { c: 'Orange', fam: 'orange', hex: '#ec6a2c', imgs: ['tw-bib-orange', 'tw-bib-orange-back'], extra: ['hero-drill'] },
        { c: 'Volt', fam: 'volt', hex: '#b8e04a', imgs: ['hero-drill', 'singlet-duo'] }] },
    { id: 'polo', cat: 'staff', need: 'staff', name: "Coaches' Polo", tag: 'Staff', price: 48, sizes: SIZES,
      desc: 'Short-sleeve polo for coaches and staff, with green tipping on the collar and cuffs, the crest on the chest and the K mark opposite.',
      variants: [{ c: 'Mint / Green', fam: 'green', hex: '#e6f0e2', imgs: ['tw-polo'] }] },
    { id: 'club-hoodie', cat: 'jackets', need: 'travel', name: 'Club Hoodie', tag: 'Travel', price: 65, sizes: SIZES,
      desc: 'Pullover hoodie in wine with an orange hood lining, drawcords, cuffs and hem. Crest on the chest, K mark opposite.',
      variants: [{ c: 'Wine / Orange', fam: 'wine', hex: '#8e1f2c', imgs: ['tw-club-hoodie'] }] },
    { id: 'puffer-vest', cat: 'jackets', need: 'staff', name: 'Hooded Puffer Vest', tag: 'Staff', price: 88, sizes: SIZES,
      desc: 'Quilted hooded vest in wine with orange snap buttons, zip pockets, the crest on the chest and the K mark opposite. For the touchline on cold mornings.',
      variants: [{ c: 'Wine', fam: 'wine', hex: '#8e1f2c', imgs: ['tw-puffer-vest'] }] },
    { id: 'backpack', cat: 'bags', need: 'bags', name: 'Club Backpack', tag: 'Travel', price: 72, sizes: ONE,
      desc: 'Flap-top backpack with a mesh side pocket, the K mark on the lid and the club crest on the front strap.',
      variants: [
        { c: 'Black', fam: 'black', hex: '#232323', imgs: ['tw-backpack-black', 'tw-backpack-black-side'] },
        { c: 'Wine', fam: 'wine', hex: '#5a1f24', imgs: ['backpack', 'locker'] }] },
    { id: 'armband', cat: 'accessories', need: 'matchday', name: "Captain's Armband", tag: 'Matchday', price: 12, sizes: ONE,
      desc: 'Captain\'s armband carrying the Kulars K. Made to match the rest of the kit.',
      variants: [
        { c: 'Orange', fam: 'orange', hex: '#ec6a2c', imgs: ['tw-armband-pair', 'armband'], extra: ['tw-armband-straps'] },
        { c: 'Cream', fam: 'sand', hex: '#efe4d4', imgs: ['tw-armband-pair', 'tw-armband-straps'] }] },
    { id: 'sock-sleeves', cat: 'accessories', need: 'matchday', name: 'Footless Sock Sleeves', tag: 'Matchday', price: 12, sizes: ONE,
      desc: 'Footless match sock sleeves with a contrast top band and the K mark at the shin. Wear over grip socks.',
      variants: [
        { c: 'Orange', fam: 'orange', hex: '#e8622a', imgs: ['tw-sock-sleeves'] },
        { c: 'White', fam: 'white', hex: '#f4f4f2', imgs: ['tw-sock-sleeves'] },
        { c: 'Brown', fam: 'brown', hex: '#3b281e', imgs: ['tw-sock-sleeves'] }] },
    { id: 'crew-socks', cat: 'accessories', need: 'training', name: 'Crew Socks', tag: 'Training', price: 14, sizes: ONE,
      desc: 'White ribbed crew socks with the K mark knitted in brown.',
      variants: [{ c: 'White / Brown', fam: 'white', hex: '#f4f4f2', imgs: ['tw-crew-socks', 'tw-crew-socks-detail'] }] },
    { id: 'beanie', cat: 'accessories', need: 'travel', name: 'Beanie', tag: 'Travel', price: 24, sizes: ONE,
      desc: 'Knit beanie in black with a white cuff and the K mark embroidered on the front.',
      variants: [{ c: 'Black / White', fam: 'black', hex: '#232323', imgs: ['tw-beanie'] }] },
    { id: 'neck-warmer', cat: 'accessories', need: 'training', name: 'Neck Warmer', tag: 'Training', price: 18, sizes: ONE,
      desc: 'Black fleece neck warmer with the Kulars lockup on the front and the wordmark running down the back.',
      variants: [{ c: 'Black', fam: 'black', hex: '#232323', imgs: ['tw-neck-warmer', 'tw-neck-warmer-back'] }] }
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
    teamwear: { products: teamwear, cats: { matchday: 'Matchday', training: 'Training', jackets: 'Jackets & outerwear', staff: 'Staff', bags: 'Bags & travel', accessories: 'Accessories' } },
    fanwear: { products: fanwear, cats: { hoodies: 'Hoodies', tees: 'Tees', caps: 'Caps', scarves: 'Scarves' } }
  };

  // custom kit builder groups
  const NEEDS = { training: 'Training', travel: 'Travel', staff: 'Staff & bench', matchday: 'Matchday', bags: 'Bags', supporters: 'Supporters' };

  const clubs = [
    { id: 'staten-island', name: 'Staten Island Athletic SC', level: 'semi-pro', region: 'New York',
      league: 'USL League Two', img: 'walk', shop: '/pages/club-shop', featured: true }
  ];
  const LEVELS = { 'semi-pro': 'Semi-pro / USL2', academy: 'Academy', school: 'High school / College', amateur: 'Amateur / Sunday league' };

  return { SIZES, FAMILIES, teamwear, fanwear, COLLECTIONS, NEEDS, clubs, LEVELS };
})();
