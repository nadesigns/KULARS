/* Kulars Teamwear — preview build
   Motion: GSAP + ScrollTrigger, smooth scroll: Lenis.
   Product data below mirrors what Shopify will serve (product → variants → images). */
(() => {
  const IMG = 'assets/img/';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => '$' + n.toFixed(0);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = hasGsap && !reduced;
  if (!motion) document.documentElement.classList.add('reduced');
  else document.body.classList.add('is-loading');

  /* =========================================================
     PRODUCT DATA
     ========================================================= */
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const teamwear = [
    { id: 'singlet', name: 'Pro Training Singlet', tag: 'Training', price: 38,
      desc: 'Sleeveless training top with orange side panels, the club crest on the chest and the Kulars wordmark across the back. The piece the squad lives in from August to May.',
      variants: [{ c: 'Sand / Brown', hex: '#e7dccb', imgs: ['singlet-pair', 'singlet-front'] }] },
    { id: 'jacket', name: 'All-Weather Training Jacket', tag: 'Training', price: 96,
      desc: 'Full-zip hooded jacket in wine with orange sleeves and piping. K mark and player number on the chest, crest opposite.',
      variants: [{ c: 'Wine / Orange', hex: '#5a1f2a', imgs: ['jacket-turn', 'jacket-run'] }] },
    { id: 'coach', name: "Coaches' Track Jacket", tag: 'Staff', price: 110,
      desc: 'Track jacket for the bench, in pitch green with mint sleeves and a full-length zip. Crest and K mark in club colours.',
      variants: [{ c: 'Pitch Green / Mint', hex: '#1f5a3c', imgs: ['coach', 'hero-jacket'] }] },
    { id: 'bib', name: 'Training Bib', tag: 'Training', price: 14,
      desc: 'Lightweight training bib with the club crest and Kulars wordmark on the chest. Sold in sets for drills and small-sided games.',
      variants: [{ c: 'Orange', hex: '#ec6a2c', imgs: ['hero-drill', 'singlet-duo'] }, { c: 'Volt', hex: '#b8e04a', imgs: ['hero-drill', 'singlet-duo'] }] },
    { id: 'backpack', name: 'Club Backpack', tag: 'Travel', price: 72,
      desc: 'Flap-top backpack with a mesh side pocket, the K mark on the lid and the player\'s number beside the crest.',
      variants: [{ c: 'Wine', hex: '#5a1f24', imgs: ['backpack', 'locker'] }] },
    { id: 'armband', name: "Captain's Armband", tag: 'Matchday', price: 12,
      desc: 'Orange captain\'s armband carrying the Kulars K in sand. Made to match the rest of the kit.',
      variants: [{ c: 'Orange', hex: '#ec6a2c', imgs: ['armband', 'locker'] }] }
  ];
  const fanwear = [
    { id: 'crest-hoodie', cat: 'hoodies', name: 'Crest Hoodie', tag: 'Club Shop', price: 65, flat: true,
      desc: 'Heavyweight hoodie with the butterfly crest on the chest and the club name down the sleeve.',
      variants: [
        { c: 'Rust', hex: '#c4552d', imgs: ['p-hoodie-rust', 'fan-hoodie-rust'], extra: ['p-hoodie-rust-2', 'fan-hoodie-rust-2'] },
        { c: 'Sand', hex: '#cfcab8', imgs: ['p-hoodie-tan', 'fan-hoodie-tan'], extra: ['p-hoodie-tan-2', 'fan-hoodie-sit'] }] },
    { id: 'word-hoodie', cat: 'hoodies', name: 'Wordmark Hoodie', tag: 'Club Shop', price: 65, flat: true,
      desc: 'Brown hoodie with the Monarchs wordmark across the chest and down the sleeve.',
      variants: [{ c: 'Brown', hex: '#3b281e', imgs: ['p-hoodie-brown', 'fan-hoodie-brown'], extra: ['p-hoodie-brown-2', 'fan-hoodie-brown-2'] }] },
    { id: 'crest-tee', cat: 'tees', name: 'Crest Tee', tag: 'Club Shop', price: 30, flat: true,
      desc: 'Classic-fit cotton tee with the full butterfly crest on the chest.',
      variants: [
        { c: 'Orange', hex: '#d9652c', imgs: ['p-tee-orange', 'fan-tee-orange'] },
        { c: 'Sand', hex: '#e4dccb', imgs: ['p-tee-sand', 'fan-tee-sand'] }] },
    { id: 'word-tee', cat: 'tees', name: 'Wordmark Tee', tag: 'Club Shop', price: 30, flat: true,
      desc: 'Brown tee with the Monarchs wordmark on the front and the crest between the shoulders.',
      variants: [{ c: 'Brown', hex: '#3b281e', imgs: ['p-tee-brown', 'fan-tee-brown'], extra: ['p-tee-brown-back'] }] },
    { id: 'cap', cat: 'caps', name: 'Butterfly Cap', tag: 'Club Shop', price: 34, flat: true,
      desc: 'Structured cap with the embroidered butterfly on the front panel.',
      variants: [
        { c: 'Tan', hex: '#cdb894', imgs: ['p-cap-tan', 'fan-cap-tan'] },
        { c: 'Orange', hex: '#d9652c', imgs: ['p-cap-orange', 'fan-cap-orange'] },
        { c: 'Brown', hex: '#3b281e', imgs: ['p-cap-brown', 'fan-cap-brown'] }] },
    { id: 'scarf', cat: 'scarves', name: 'Matchday Scarf', tag: 'Club Shop', price: 28, flat: true,
      desc: 'Knitted two-sided scarf with tasselled ends. Club name on one side, Monarchs on the other.',
      variants: [{ c: 'Sand / Rust', hex: '#e2d3b6', imgs: ['p-scarf', 'fan-scarf'], extra: ['fan-scarf-up'] }] }
  ];
  const ALL = Object.fromEntries([...teamwear, ...fanwear].map(p => [p.id, p]));

  /* =========================================================
     RENDER GRIDS
     ========================================================= */
  function cardHTML(p) {
    const v = p.variants[0];
    const sw = p.variants.length > 1
      ? `<div class="card__swatches">${p.variants.map((x, i) => `<button type="button" class="sw${i ? '' : ' is-active'}" style="background:${x.hex}" data-v="${i}" aria-label="${x.c}"></button>`).join('')}</div>`
      : '';
    return `
      <article class="card" data-id="${p.id}"${p.cat ? ` data-cat="${p.cat}"` : ''}>
        <div class="card__media" data-cursor="View" data-open="${p.id}">
          ${p.cat ? '' : `<span class="card__tag">${p.tag}</span>`}
          <img class="img-a" src="${IMG}${v.imgs[0]}.webp" alt="${p.name} in ${v.c}" loading="lazy">
          <img class="img-b" src="${IMG}${v.imgs[1] || v.imgs[0]}.webp" alt="" loading="lazy" aria-hidden="true">
          <button class="card__quick" type="button" data-open="${p.id}">Quick add <span aria-hidden="true">+</span></button>
        </div>
        <div class="card__info">
          <div>
            <h3 class="card__name">${p.name}</h3>
            <p class="card__sub" data-color>${p.variants.length > 1 ? p.variants.length + ' colours' : v.c}</p>
            ${sw}
          </div>
          <span class="card__price">${money(p.price)}</span>
        </div>
      </article>`;
  }
  $('#teamwearGrid').innerHTML = teamwear.map(cardHTML).join('');
  $('#shopGrid').innerHTML = fanwear.map(cardHTML).join('');

  // swatch hover/click on cards swaps imagery
  document.addEventListener('click', e => {
    const sw = e.target.closest('.card .sw');
    if (!sw) return;
    const card = sw.closest('.card'); const p = ALL[card.dataset.id]; const v = p.variants[+sw.dataset.v];
    $$('.sw', card).forEach(s => s.classList.toggle('is-active', s === sw));
    const a = $('.img-a', card), b = $('.img-b', card);
    a.src = IMG + v.imgs[0] + '.webp'; a.alt = `${p.name} in ${v.c}`;
    b.src = IMG + (v.imgs[1] || v.imgs[0]) + '.webp';
    card.dataset.v = sw.dataset.v;
    if (motion) gsap.fromTo(a, { scale: 1.12, opacity: .4 }, { scale: 1, opacity: 1, duration: .8, ease: 'expo.out' });
  });

  /* =========================================================
     BAG
     ========================================================= */
  let bag = store.get('kulars-bag', []);
  const FREE_SHIP = 150;
  const bagEl = $('#bag');
  function renderBag() {
    const count = bag.reduce((n, i) => n + i.qty, 0);
    const total = bag.reduce((n, i) => n + i.qty * i.price, 0);
    $('#bagCount').textContent = count;
    $('#bagHeadCount').textContent = `(${count})`;
    $('#bagTotal').textContent = money(total);
    const left = Math.max(0, FREE_SHIP - total);
    $('#shipMsg').textContent = left ? `Add ${money(left)} more for free shipping` : 'Free shipping unlocked';
    $('#shipBar').style.width = Math.min(100, (total / FREE_SHIP) * 100) + '%';
    $('#bagGive').textContent = total ? `$${(total * .05).toFixed(2)} of this order supports underprivileged football communities.` : '5% of every order supports underprivileged football communities.';
    $('#bagItems').innerHTML = bag.length ? bag.map((i, idx) => `
      <li class="bi">
        <img src="${IMG}${i.img}.webp" alt="" class="${i.flat ? 'contain' : ''}">
        <div>
          <h4>${i.name}</h4>
          <p>${i.color} · ${i.size}</p>
          <div class="qty"><button type="button" data-q="-1" data-i="${idx}" aria-label="Decrease">−</button><span>${i.qty}</span><button type="button" data-q="1" data-i="${idx}" aria-label="Increase">+</button></div>
        </div>
        <div><div class="bi__price">${money(i.price * i.qty)}</div><button type="button" class="bi__remove" data-rm="${idx}">Remove</button></div>
      </li>`).join('')
      : `<li class="bag__empty"><b>Bag's empty</b>Kit yourself out from the training range.</li>`;
    store.set('kulars-bag', bag);
  }
  function addToBag(p, vi, size) {
    const v = p.variants[vi];
    const key = `${p.id}|${v.c}|${size}`;
    const ex = bag.find(i => i.key === key);
    if (ex) ex.qty++;
    else bag.push({ key, id: p.id, name: p.name, color: v.c, size, price: p.price, img: v.imgs[0], flat: !!p.flat, qty: 1 });
    renderBag();
    const btn = $('#bagBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    toast(`${p.name} added to your bag`);
  }
  $('#bagItems').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'); const rm = e.target.closest('[data-rm]');
    if (q) { const it = bag[+q.dataset.i]; it.qty += +q.dataset.q; if (it.qty < 1) bag.splice(+q.dataset.i, 1); renderBag(); }
    if (rm) { bag.splice(+rm.dataset.rm, 1); renderBag(); }
  });
  function openBag() { bagEl.classList.add('is-open'); bagEl.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); }
  function closeBag() { bagEl.classList.remove('is-open'); bagEl.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  $('#bagBtn').addEventListener('click', openBag);
  $$('[data-close-bag]').forEach(b => b.addEventListener('click', closeBag));
  $('#checkoutBtn').addEventListener('click', () => toast('Checkout runs through Shopify in the live build'));
  renderBag();

  /* =========================================================
     QUICK VIEW
     ========================================================= */
  const qv = $('#qv');
  let qvState = { p: null, v: 0, size: null };
  function paintQV() {
    const { p, v } = qvState; const variant = p.variants[v];
    const imgs = [...variant.imgs, ...(variant.extra || [])];
    $('#qvGallery').innerHTML = imgs.map(src => `<img src="${IMG}${src}.webp" alt="${p.name}" class="${p.flat && src.startsWith('p-') ? 'contain' : ''}">`).join('');
    $('#qvColor').textContent = variant.c;
    $('#qvSwatches').innerHTML = p.variants.map((x, i) => `<button type="button" class="sw${i === v ? ' is-active' : ''}" style="background:${x.hex}" data-qv="${i}" aria-label="${x.c}"></button>`).join('');
  }
  function openQV(id) {
    const p = ALL[id]; if (!p) return;
    const card = document.querySelector(`.card[data-id="${id}"]`);
    qvState = { p, v: card && card.dataset.v ? +card.dataset.v : 0, size: null };
    $('#qvTag').textContent = p.tag;
    $('#qvName').textContent = p.name;
    $('#qvPrice').textContent = money(p.price);
    $('#qvDesc').textContent = p.desc;
    const sizes = p.id === 'armband' || p.id === 'backpack' || p.id === 'scarf' || p.id === 'cap' ? ['One size'] : SIZES;
    $('#qvSizes').innerHTML = sizes.map(s => `<button type="button" data-size="${s}">${s}</button>`).join('');
    if (sizes.length === 1) { qvState.size = sizes[0]; $('#qvSizes button').classList.add('is-active'); }
    paintQV();
    qv.classList.add('is-open'); qv.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    if (motion) gsap.fromTo('.qv__info > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .8, delay: .25, ease: 'expo.out' });
    setTimeout(() => $('.qv__close').focus(), 50);
  }
  function closeQV() { qv.classList.remove('is-open'); qv.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o && !e.target.closest('.sw')) { e.preventDefault(); openQV(o.dataset.open); }
  });
  $$('[data-close]', qv).forEach(b => b.addEventListener('click', closeQV));
  $('#qvSwatches').addEventListener('click', e => { const b = e.target.closest('[data-qv]'); if (b) { qvState.v = +b.dataset.qv; paintQV(); } });
  $('#qvSizes').addEventListener('click', e => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    qvState.size = b.dataset.size; $$('#qvSizes button').forEach(x => x.classList.toggle('is-active', x === b));
  });
  $('#qvAdd').addEventListener('click', () => {
    if (!qvState.size) {
      toast('Pick a size first');
      if (motion) gsap.fromTo('#qvSizes', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' });
      return;
    }
    addToBag(qvState.p, qvState.v, qvState.size);
    closeQV(); setTimeout(openBag, 450);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (qv.classList.contains('is-open')) closeQV();
    else if (bagEl.classList.contains('is-open')) closeBag();
    else if (document.body.classList.contains('menu-open')) toggleMenu(false);
  });

  /* =========================================================
     TOAST
     ========================================================= */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }
  $('.icon-btn[aria-label="Search"]').addEventListener('click', () => toast('Search arrives with the Shopify build'));

  /* =========================================================
     MENU
     ========================================================= */
  function toggleMenu(force) {
    const open = force ?? !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    $('#menuBtn').setAttribute('aria-expanded', open);
    $('#menu').setAttribute('aria-hidden', !open);
    if (open) { lenis && lenis.stop(); if (motion) gsap.fromTo('.menu__nav a', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .06, duration: 1, delay: .25, ease: 'expo.out' }); }
    else lenis && lenis.start();
  }
  $('#menuBtn').addEventListener('click', () => toggleMenu());

  /* =========================================================
     FORMS
     ========================================================= */
  $('#kitForm').addEventListener('submit', e => {
    e.preventDefault();
    const club = $('#f-club'), email = $('#f-email'), msg = $('#formMsg');
    const okClub = club.value.trim().length > 1, okEmail = /^\S+@\S+\.\S+$/.test(email.value.trim());
    club.parentElement.classList.toggle('is-error', !okClub);
    email.parentElement.classList.toggle('is-error', !okEmail);
    if (!okClub || !okEmail) { msg.className = 'kit-form__msg err'; msg.textContent = !okClub ? 'Add your club name so we know who to kit.' : 'Check the email address, it looks incomplete.'; return; }
    msg.className = 'kit-form__msg ok';
    msg.textContent = `Thanks, ${club.value.trim()}. In the live site this brief goes straight to the Kulars team.`;
    e.target.querySelector('button[type=submit] span').textContent = 'Brief sent';
  });
  $('#newsForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#n-email').value.trim();
    $('#newsMsg').textContent = /^\S+@\S+\.\S+$/.test(v) ? "You're on the team sheet." : 'Enter a full email address.';
  });

  /* =========================================================
     TABS (club shop filter)
     ========================================================= */
  const tabs = $$('#shopTabs button'); const ink = $('#tabsInk');
  function moveInk(btn) { ink.style.width = btn.offsetWidth + 'px'; ink.style.transform = `translateX(${btn.offsetLeft}px)`; }
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.setAttribute('aria-selected', b === btn)); moveInk(btn);
    const f = btn.dataset.filter; const cards = $$('#shopGrid .card');
    const apply = () => {
      cards.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
      const vis = cards.filter(c => !c.classList.contains('is-hidden'));
      if (motion) gsap.fromTo(vis, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .8, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
    };
    if (motion) gsap.to(cards, { opacity: 0, y: -10, duration: .25, onComplete: apply }); else apply();
  }));
  requestAnimationFrame(() => moveInk(tabs[0]));
  window.addEventListener('resize', () => moveInk(tabs.find(b => b.getAttribute('aria-selected') === 'true')));

  /* =========================================================
     HERO SLIDER
     ========================================================= */
  const slides = $$('.hero__slide'); const dots = $$('#heroDots button');
  let cur = 0, heroTimer;
  function goSlide(n) {
    if (n === cur) return;
    const prev = slides[cur], next = slides[n];
    dots.forEach((d, i) => { d.classList.toggle('is-active', i === n); d.classList.toggle('is-done', i < n); });
    $('#heroLabel').textContent = next.dataset.label;
    slides.forEach(s => s.style.zIndex = 0); prev.style.zIndex = 1; next.style.zIndex = 2;
    if (motion) {
      gsap.fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
      gsap.fromTo($('img', next), { scale: 1.35, xPercent: 6 }, { scale: 1.08, xPercent: 0, duration: 1.8, ease: 'expo.out' });
      gsap.to($('img', prev), { xPercent: -8, duration: 1.4, ease: 'expo.inOut', onComplete: () => gsap.set($('img', prev), { xPercent: 0 }) });
      gsap.fromTo('#heroLabel', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' });
    } else {
      next.style.clipPath = 'inset(0 0 0 0)';
    }
    prev.classList.remove('is-active'); next.classList.add('is-active');
    cur = n; queueSlide();
  }
  function queueSlide() { clearTimeout(heroTimer); heroTimer = setTimeout(() => goSlide((cur + 1) % slides.length), 6000); }
  dots.forEach((d, i) => d.addEventListener('click', () => goSlide(i)));

  /* =========================================================
     NO-MOTION FALLBACK
     ========================================================= */
  let lenis = null;
  if (!motion) {
    $('#loader').remove(); document.body.classList.remove('is-loading');
    queueSlide();
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => document.body.classList.contains('menu-open') && toggleMenu(false)));
    return;
  }

  /* =========================================================
     MOTION
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);

  // --- split text into words/chars (keeps <em> etc.)
  function splitChars(el) {
    const label = el.closest('h1,h2')?.textContent.replace(/\s+/g, ' ').trim();
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap';
            [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'ch'; c.textContent = ch; w.appendChild(c); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    const h = el.closest('h1,h2');
    if (h && label) { h.setAttribute('aria-label', label); $$('.line', h).forEach(l => l.setAttribute('aria-hidden', 'true')); }
  }
  $$('.split').forEach(splitChars);
  // word-level split for long lines (keeps <em>)
  function splitWords(el) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'rw'; w.style.display = 'inline-block'; w.textContent = p; frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  }

  // --- smooth scroll
  lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2 && id !== '#') return;
    const target = id === '#top' || id === '#' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    const go = () => lenis.scrollTo(target, { offset: 0, duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    if (document.body.classList.contains('menu-open')) { toggleMenu(false); setTimeout(go, 350); } else go();
  }));

  // --- header behaviour + progress
  const header = $('#header');
  lenis.on('scroll', ({ scroll, direction }) => {
    header.classList.toggle('is-scrolled', scroll > 30);
    const hide = direction === 1 && scroll > 500 && !document.body.classList.contains('menu-open');
    if (direction) header.classList.toggle('is-hidden', hide);
  });
  gsap.to('#progressBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- LOADER (logo held ~1s) ---------- */
  const heroChars = $$('.hero__title .ch');
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('.hero__eyebrow, .hero__lede, .hero__ctas > *, .hero__bar', { y: 30, opacity: 0 });
  gsap.set('.hero__slide.is-active img', { scale: 1.35 });

  const arcs = $$('.loader__logo .km0, .loader__logo .km1, .loader__logo .km2, .loader__logo .km3');
  const legs = $$('.loader__logo .km4, .loader__logo .km5, .loader__logo .km6');
  const letters = $$('.loader__logo .kw');
  const count = { v: 0 };
  const intro = gsap.timeline();
  intro
    .from(arcs, { scaleX: 0, transformOrigin: '0% 50%', duration: .7, ease: 'expo.out', stagger: .06 }, 0)
    .from(legs, { scaleY: 0, transformOrigin: '50% 0%', duration: .6, ease: 'expo.out', stagger: .06 }, .18)
    .from(letters, { yPercent: 60, opacity: 0, duration: .6, ease: 'expo.out', stagger: .045 }, .1)
    .from('.loader__meta', { opacity: 0, y: 10, duration: .5 }, .2)
    .to(count, { v: 100, duration: 1.05, ease: 'power2.inOut', onUpdate: () => { $('#loaderCount').textContent = String(Math.round(count.v)).padStart(2, '0'); } }, 0);

  const heroImg = $('.hero__slide.is-active img');
  const imgReady = heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
  const minHold = new Promise(r => setTimeout(r, 1150));
  const maxWait = new Promise(r => setTimeout(r, 3000));
  Promise.race([Promise.all([imgReady, minHold]), maxWait]).then(() => {
    const out = gsap.timeline({
      onStart: () => document.body.classList.remove('is-loading'),
      onComplete: () => { $('#loader').remove(); lenis.start(); queueSlide(); ScrollTrigger.refresh(); }
    });
    out
      .to('.loader__logo', { y: -80, opacity: 0, duration: .7, ease: 'power3.in' }, 0)
      .to('.loader__meta', { opacity: 0, duration: .3 }, 0)
      .to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, .25)
      .to('.hero__slide.is-active img', { scale: 1.08, duration: 2.2, ease: 'expo.out' }, .55)
      .to(heroChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .028 }, .75)
      .to('.hero__eyebrow, .hero__lede, .hero__ctas > *, .hero__bar', { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .08 }, 1.0);
  });

  /* ---------- HERO scroll + pointer parallax ---------- */
  gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (fine) {
    const hx = gsap.quickTo('.hero__media', 'x', { duration: 1.2, ease: 'power3' });
    const tx = gsap.quickTo('.hero__title', 'x', { duration: 1.4, ease: 'power3' });
    $('.hero').addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - .5;
      hx(nx * -24); tx(nx * 18);
    });
  }

  /* ---------- MARQUEES driven by scroll velocity ---------- */
  function marquee(row, base) {
    const inner = $('.marquee__inner', row);
    while (row.scrollWidth < innerWidth * 2.5) row.appendChild(inner.cloneNode(true));
    let w = inner.offsetWidth, x = 0, dirSign = +row.dataset.dir || 1;
    window.addEventListener('resize', () => { w = inner.offsetWidth; });
    gsap.ticker.add(() => {
      const v = lenis.velocity || 0;
      if (Math.abs(v) > .5) dirSign = (v > 0 ? 1 : -1) * (+row.dataset.dir || 1);
      x -= (base + Math.min(Math.abs(v) * .9, 28)) * dirSign;
      x = gsap.utils.wrap(-w, 0, x);
      row.style.transform = `translate3d(${x}px,0,0)`;
    });
  }
  $$('.marquee__row').forEach(r => marquee(r, .9));
  $$('.bigtype__row').forEach(r => marquee(r, .6));

  /* ---------- STATEMENT word-by-word ---------- */
  const st = $('#statement');
  st.innerHTML = st.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.fromTo('#statement .w', { opacity: .14 }, {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 45%', scrub: true }
  });
  gsap.from('.statement__k svg', { rotate: -90, scale: .4, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.statement__foot', start: 'top 90%' } });

  /* ---------- HEADINGS rise char by char ---------- */
  $$('.display').forEach(h => {
    const chars = $$('.ch', h);
    if (!chars.length) {
      gsap.from(h, { yPercent: 30, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
      return;
    }
    gsap.from(chars, { yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .022, scrollTrigger: { trigger: h, start: 'top 86%' } });
  });
  $$('.eyebrow:not(.hero__eyebrow), .section-head__copy, .feature__copy p, .cta__copy').forEach(el => {
    gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- MISSION: "Sometimes it's" ---------- */
  gsap.from('.reality__lead', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.reality__lead', start: 'top 85%' } });
  $$('.reality__list li').forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 62%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') }));
  $$('.reality__end, .impact__sign').forEach(el => {
    if (!$$('.ch', el).length) { splitWords(el); }
    gsap.from($$('.ch, .rw', el), { yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .02, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- OUR NAME: acronym rows ---------- */
  $$('.acro li').forEach(li => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 88%' } });
    tl.from($('b', li), { yPercent: 100, duration: 1.1, ease: 'expo.out' })
      .from($('span', li), { x: 80, opacity: 0, duration: 1.1, ease: 'expo.out' }, '<.1')
      .from($('em', li), { opacity: 0, duration: .8 }, '<.3');
  });
  gsap.from('.beliefs p', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.beliefs', start: 'top 88%' } });

  /* ---------- IMPACT: 5% ---------- */
  const imp = { v: 0 };
  gsap.to(imp, { v: 5, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '.impact', start: 'top 70%' }, onUpdate: () => { $('#impactNum').textContent = Math.round(imp.v); } });
  gsap.fromTo('.impact__num', { scale: .55, rotate: -6 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.impact', start: 'top bottom', end: 'top 25%', scrub: true } });
  gsap.from('.impact__list li', { y: 50, opacity: 0, stagger: .1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.impact__list', start: 'top 88%' } });

  /* ---------- CARDS ---------- */
  ScrollTrigger.batch('.grid .card', {
    start: 'top 92%',
    onEnter: els => gsap.fromTo(els, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: .09, ease: 'expo.out', overwrite: true })
  });
  $$('.grid .card').forEach(c => gsap.set(c, { opacity: 0 }));

  /* ---------- HORIZONTAL GALLERY ---------- */
  const track = $('#hsTrack'); const hsCards = $$('.hs-card', track);
  $('#hsTotal').textContent = String(hsCards.length).padStart(2, '0');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const hsTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.hscroll', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: self => {
        gsap.set('#hsBar', { scaleX: self.progress });
        $('#hsIndex').textContent = String(Math.min(hsCards.length, Math.floor(self.progress * hsCards.length) + 1)).padStart(2, '0');
      }
    }
  });
  hsCards.forEach(card => {
    gsap.fromTo($('img', card), { xPercent: -9 }, { xPercent: 9, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hsTween, start: 'left right', end: 'right left', scrub: true } });
    gsap.from($('.hs-card__img', card), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: card, containerAnimation: hsTween, start: 'left 95%' } });
  });
  // skew on velocity
  const skewSet = gsap.quickTo(hsCards, 'skewX', { duration: .5, ease: 'power3' });
  gsap.ticker.add(() => skewSet(gsap.utils.clamp(-6, 6, (lenis.velocity || 0) * -.25)));

  /* ---------- IMAGE REVEALS ---------- */
  gsap.fromTo('.statement__fig img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.statement__fig', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('[data-reveal]').forEach((el, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
    tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: i % 2 ? .2 : 0 })
      .from($('img', el), { scale: 1.4, duration: 1.8, ease: 'expo.out' }, '<.2');
  });
  gsap.to('.feature__img--small', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.feature', start: 'top bottom', end: 'bottom top', scrub: true } });

  // counters
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => el.textContent = Math.round(o.v) });
  });
  gsap.from('.facts li', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 90%' } });

  /* ---------- LOOKBOOK parallax ---------- */
  $$('[data-speed]').forEach(el => {
    const s = +el.dataset.speed;
    gsap.fromTo(el, { yPercent: s }, { yPercent: -s, ease: 'none', scrollTrigger: { trigger: '.lookbook', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from($('img', el), { scale: 1.3, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true } });
  });
  gsap.fromTo('.lookbook__title .display', { scale: .82 }, { scale: 1.06, ease: 'none', scrollTrigger: { trigger: '.lookbook', start: 'top bottom', end: 'center top', scrub: true } });

  /* ---------- PROCESS: K mark draws as you read ---------- */
  const pk = $$('#processK .km');
  gsap.set(pk.slice(0, 4), { transformOrigin: '0% 50%', scaleX: 0 });
  gsap.set(pk.slice(4), { transformOrigin: '50% 0%', scaleY: 0 });
  const ptl = gsap.timeline({ scrollTrigger: { trigger: '.process__steps', start: 'top 70%', end: 'bottom 70%', scrub: .6 } });
  ptl.to(pk.slice(0, 4), { scaleX: 1, stagger: .2, ease: 'none' }).to(pk.slice(4), { scaleY: 1, stagger: .2, ease: 'none' });
  $$('.step').forEach(s => {
    gsap.fromTo(s, { opacity: .25 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 75%', end: 'top 45%', scrub: true } });
    gsap.from($('.step__n', s), { yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 80%' } });
  });

  /* ---------- CTA ---------- */
  gsap.fromTo('.cta__bg', { rotate: -12, yPercent: -40 }, { rotate: 8, yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.kit-form', { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.kit-form', start: 'top 90%' } });

  /* ---------- FOOTER giant logo assembles ---------- */
  const fm = $$('#footerMark .km'), fw = $$('#footerMark .kw');
  const ftl = gsap.timeline({ scrollTrigger: { trigger: '#footerMark', start: 'top bottom', end: 'bottom bottom', scrub: .8 } });
  ftl.from(fm.slice(0, 4), { scaleX: 0, transformOrigin: '0% 50%', stagger: .08, ease: 'none' }, 0)
     .from(fm.slice(4), { scaleY: 0, transformOrigin: '50% 0%', stagger: .08, ease: 'none' }, .15)
     .from(fw, { yPercent: 70, opacity: 0, stagger: .06, ease: 'none' }, .1);

  /* ---------- CURSOR + MAGNETIC ---------- */
  if (fine) {
    const cur = $('#cursor'), lab = $('#cursorLabel');
    const cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !e.target.closest('.card__quick, .sw')) { lab.textContent = t.dataset.cursor; cur.classList.add('is-label'); }
      else cur.classList.remove('is-label');
    });
    $$('.hs-card').forEach(c => c.setAttribute('data-cursor', 'Scroll'));
    $$('.magnetic').forEach(b => {
      const mx = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
      const my = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4); });
      b.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
