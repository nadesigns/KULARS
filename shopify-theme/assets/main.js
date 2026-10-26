/* Kulars Teamwear — preview build
   Motion: GSAP + ScrollTrigger, smooth scroll: Lenis.
   One script for every page: the shell (header, menu, bag, quick view, transitions) always runs,
   and each page module only runs when its section is on the page. Catalog lives in data.js. */
(() => {
  const IMG = window.KULARS_IMG || 'assets/img/';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const money = n => '$' + n.toFixed(0);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = hasGsap && !reduced;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const mobileQ = window.matchMedia('(max-width: 900px)');
  if (!motion) document.documentElement.classList.add('reduced');
  if (motion) { gsap.registerPlugin(ScrollTrigger); gsap.config({ nullTargetWarn: false }); }

  const D = window.KULARS_DATA;
  const ALL = Object.fromEntries([...D.teamwear, ...D.fanwear].map(p => [p.id, p]));
  let lenis = null;

  // on Shopify the theme prints the live catalog (keyed by each product's kulars:<id> tag); prices follow the store
  const SHOP = window.KULARS_SHOP || null;
  if (SHOP) Object.entries(SHOP).forEach(([id, sp]) => { if (ALL[id] && sp.variants[0]) ALL[id].price = sp.variants[0].p / 100; });
  const shopVariant = (id, color, size) => SHOP && SHOP[id] && SHOP[id].variants.find(v => v.o[0] === color && (v.o[1] || 'One size') === size);

  /* =========================================================
     PRODUCT CARD
     ========================================================= */
  function cardHTML(p, vi = 0) {
    const v = p.variants[vi];
    const sw = p.variants.length > 1
      ? `<div class="card__swatches">${p.variants.map((x, i) => `<button type="button" class="sw${i === vi ? ' is-active' : ''}" style="background:${x.hex}" data-v="${i}" aria-label="${x.c}"></button>`).join('')}</div>`
      : '';
    return `
      <article class="card" data-id="${p.id}" data-cat="${p.cat}" data-v="${vi}">
        <div class="card__media" data-cursor="View" data-open="${p.id}">
          ${p.flat ? '' : `<span class="card__tag">${p.tag}</span>`}
          <img class="img-a" src="${IMG}${v.imgs[0]}.webp" alt="${p.name} in ${v.c}" loading="lazy">
          <img class="img-b" src="${IMG}${v.imgs[1] || v.imgs[0]}.webp" alt="" loading="lazy" aria-hidden="true">
          <button class="card__quick" type="button" data-open="${p.id}">Quick add <span aria-hidden="true">+</span></button>
        </div>
        <div class="card__info">
          <div>
            <h3 class="card__name">${SHOP && SHOP[p.id] ? `<a href="${SHOP[p.id].url}">${p.name}</a>` : p.name}</h3>
            <p class="card__sub">${p.variants.length > 1 ? p.variants.length + ' colors' : v.c}</p>
            ${sw}
          </div>
          <span class="card__price">${money(p.price)}</span>
        </div>
      </article>`;
  }
  // swatches on any card swap its imagery
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
     TOAST
     ========================================================= */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }
  // search: Shopify's product search in the live build, a note in the preview
  $$('#searchForm, .menu__search').forEach(f => on(f, 'submit', e => {
    e.preventDefault();
    const q = $('input', f).value.trim();
    if (!SHOP) { toast('Search arrives with the Shopify build'); return; }
    if (q) location.href = `/search?type=product&q=${encodeURIComponent(q)}`;
  }));

  /* =========================================================
     BAG
     On Shopify the bag is the Shopify cart (Ajax API), so the drawer, the cart page,
     product pages and checkout always agree. The preview keeps it in localStorage.
     ========================================================= */
  let bag = SHOP ? [] : store.get('kulars-bag', []);
  const FREE_SHIP = 150;
  const bagEl = $('#bag');
  const kidByHandle = SHOP ? Object.fromEntries(Object.entries(SHOP).map(([id, sp]) => [sp.url.split('/').pop(), id])) : {};
  const cartApi = (path, body) => fetch(path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body)
  } : { headers: { Accept: 'application/json' } }).then(async r => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.description || j.message || 'Something went wrong, try again');
    return j;
  });
  function fromCart(cart) {
    bag = cart.items.map(it => {
      const p = ALL[kidByHandle[it.handle]];
      return {
        key: it.key, name: it.product_title, sub: it.options_with_values.map(o => o.value).filter(v => v !== 'Default Title').join(' · '),
        price: it.final_price / 100, qty: it.quantity, src: it.image ? it.image + (it.image.includes('?') ? '&' : '?') + 'width=240' : '', flat: !!(p && p.flat)
      };
    });
    renderBag();
  }
  const syncCart = () => SHOP ? cartApi('/cart.js').then(fromCart).catch(() => {}) : Promise.resolve();
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
        <img src="${i.src || IMG + i.img + '.webp'}" alt="" class="${i.flat ? 'contain' : ''}">
        <div>
          <h4>${i.name}</h4>
          <p>${i.sub || `${i.color} · ${i.size}`}</p>
          <div class="qty"><button type="button" data-q="-1" data-i="${idx}" aria-label="Decrease">−</button><span>${i.qty}</span><button type="button" data-q="1" data-i="${idx}" aria-label="Increase">+</button></div>
        </div>
        <div><div class="bi__price">${money(i.price * i.qty)}</div><button type="button" class="bi__remove" data-rm="${idx}">Remove</button></div>
      </li>`).join('')
      : `<li class="bag__empty"><b>Bag's empty</b>Kit yourself out from the training range.</li>`;
    if (!SHOP) store.set('kulars-bag', bag);
  }
  function bumpBag(name) {
    const btn = $('#bagBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    toast(`${name} added to your bag`);
  }
  // resolves true once the item is in the bag
  async function addToBag(p, vi, size) {
    const v = p.variants[vi];
    if (SHOP) {
      const sv = shopVariant(p.id, v.c, size);
      if (!sv || !sv.a) { toast(`${p.name} in ${v.c} · ${size} is sold out`); return false; }
      return addVariant(sv.id, p.name);
    }
    const key = `${p.id}|${v.c}|${size}`;
    const ex = bag.find(i => i.key === key);
    if (ex) ex.qty++;
    else bag.push({ key, id: p.id, name: p.name, color: v.c, size, price: p.price, img: v.imgs[0], flat: !!p.flat, qty: 1 });
    renderBag(); bumpBag(p.name);
    return true;
  }
  async function addVariant(id, name, quantity = 1) {
    try {
      await cartApi('/cart/add.js', { id, quantity }); await syncCart(); bumpBag(name);
      if (location.pathname === '/cart') location.reload();
      return true;
    }
    catch (err) { toast(err.message); return false; }
  }
  on($('#bagItems'), 'click', async e => {
    const q = e.target.closest('[data-q]'); const rm = e.target.closest('[data-rm]');
    if (!q && !rm) return;
    const idx = +(q ? q.dataset.i : rm.dataset.rm); const it = bag[idx];
    const qty = rm ? 0 : it.qty + +q.dataset.q;
    if (SHOP) {
      $('#bagItems').classList.add('is-busy');
      try {
        fromCart(await cartApi('/cart/change.js', { id: it.key, quantity: Math.max(0, qty) }));
        if (location.pathname === '/cart') location.reload();
      } catch (err) { toast(err.message); }
      $('#bagItems').classList.remove('is-busy');
      return;
    }
    if (qty < 1) bag.splice(idx, 1); else it.qty = qty;
    renderBag();
  });
  function openBag() { bagEl.classList.add('is-open'); bagEl.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); }
  function closeBag() { bagEl.classList.remove('is-open'); bagEl.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  on($('#bagBtn'), 'click', openBag);
  $$('[data-close-bag]').forEach(b => on(b, 'click', closeBag));
  on($('#checkoutBtn'), 'click', () => {
    if (!SHOP) { toast('Checkout runs through Shopify in the live build'); return; }
    if (!bag.length) { toast("Your bag's empty"); return; }
    $('#checkoutBtn').classList.add('is-busy');
    location.href = '/checkout';
  });
  // back/forward cache can show a stale bag after checkout; re-read the cart whenever the page is shown
  on(window, 'pageshow', () => { $('#checkoutBtn').classList.remove('is-busy'); syncCart(); });
  if (SHOP && window.KULARS_CART) fromCart(window.KULARS_CART); else renderBag();
  window.KULARS_BAG = { open: openBag, addVariant, sync: syncCart };

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
    if (SHOP) $$('#qvSizes [data-size]').forEach(b => { const sv = shopVariant(p.id, variant.c, b.dataset.size); b.classList.toggle('is-out', !sv || !sv.a); });
    if (qvMore) qvMore.href = SHOP && SHOP[p.id] ? SHOP[p.id].url : '#';
  }
  // live build: quick view links through to the full product page
  const qvMore = SHOP ? document.createElement('a') : null;
  if (qvMore) { qvMore.className = 'qv__more link-u'; qvMore.textContent = 'View full details'; $('#qvAdd').after(qvMore); }
  function openQV(id, vi) {
    const p = ALL[id]; if (!p) return;
    const card = document.querySelector(`.card[data-id="${id}"]`);
    qvState = { p, v: vi ?? (card && card.dataset.v ? +card.dataset.v : 0), size: null };
    $('#qvTag').textContent = p.tag;
    $('#qvName').textContent = p.name;
    $('#qvPrice').textContent = money(p.price);
    $('#qvDesc').textContent = p.desc;
    $('#qvSizes').innerHTML = p.sizes.map(s => `<button type="button" data-size="${s}">${s}</button>`).join('');
    if (p.sizes.length === 1) { qvState.size = p.sizes[0]; $('#qvSizes button').classList.add('is-active'); }
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
  $$('[data-close]', qv).forEach(b => on(b, 'click', closeQV));
  on($('#qvSwatches'), 'click', e => { const b = e.target.closest('[data-qv]'); if (b) { qvState.v = +b.dataset.qv; paintQV(); } });
  on($('#qvSizes'), 'click', e => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    qvState.size = b.dataset.size; $$('#qvSizes button').forEach(x => x.classList.toggle('is-active', x === b));
  });
  on($('#qvAdd'), 'click', () => {
    if (!qvState.size) {
      toast('Pick a size first');
      if (motion) gsap.fromTo('#qvSizes', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' });
      return;
    }
    addToBag(qvState.p, qvState.v, qvState.size).then(ok => { if (ok) { flashAdded($('#qvAdd')); setTimeout(closeQV, 350); setTimeout(openBag, 800); } });
  });

  /* =========================================================
     PRODUCT PAGE (Shopify): options pick the variant, Add to bag goes through the cart
     ========================================================= */
  const pdp = $('#pdp');
  if (pdp && SHOP) {
    const P = JSON.parse($('#pdpData').textContent);
    const kp = ALL[pdp.dataset.kid];
    const chosen = (P.variants.find(v => v.id === +$('#pdpVariant').value) || P.variants[0]).options.slice();
    const form = $('#pdpForm'), addBtn = $('#pdpAdd');
    // swatch dots take the catalog's colors; anything else gets a neutral dot
    $$('.pdp__color', pdp).forEach(b => {
      const cv = kp && kp.variants.find(x => x.c === b.dataset.value);
      b.querySelector('i').style.background = cv ? cv.hex : 'var(--mist-2)';
    });
    const variantFor = opts => P.variants.find(v => v.options.every((o, i) => o === opts[i]));
    function paint(scrollToMedia) {
      const v = variantFor(chosen);
      $$('.pdp__opt', pdp).forEach(fs => {
        const i = +fs.dataset.index;
        $('[data-selected]', fs).textContent = chosen[i];
        $$('[data-value]', fs).forEach(b => {
          const on = b.dataset.value === chosen[i];
          b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on);
          // a value is out when no available variant pairs it with the other current choices
          const test = chosen.slice(); test[i] = b.dataset.value;
          const tv = variantFor(test); b.classList.toggle('is-out', !tv || !tv.available);
        });
      });
      const price = v ? v.price : P.price;
      $('[data-price]', pdp).textContent = '$' + (price / 100).toFixed(price % 100 ? 2 : 0);
      const cmp = $('[data-compare]', pdp);
      cmp.hidden = !(v && v.compare_at_price > v.price);
      if (!cmp.hidden) cmp.textContent = '$' + (v.compare_at_price / 100).toFixed(0);
      $('#pdpVariant').value = v ? v.id : '';
      addBtn.disabled = !v || !v.available;
      $('span', addBtn).textContent = !v ? 'Unavailable' : v.available ? 'Add to bag' : 'Sold out';
      if (v) history.replaceState(null, '', `${location.pathname}?variant=${v.id}`);
      if (scrollToMedia && v && v.featured_media) {
        const shot = $(`.pdp__shot[data-media="${v.featured_media.id}"]`, pdp);
        if (shot) {
          const gal = $('#pdpGallery');
          if (gal.scrollWidth > gal.clientWidth + 4) gal.scrollTo({ left: shot.offsetLeft - gal.offsetLeft, behavior: 'smooth' });
          else if (shot !== gal.firstElementChild) { gal.prepend(shot); if (motion) gsap.fromTo(shot, { opacity: .3 }, { opacity: 1, duration: .6 }); }
        }
      }
    }
    on(form, 'click', e => {
      const b = e.target.closest('[data-value]'); if (!b) return;
      const i = +b.closest('.pdp__opt').dataset.index;
      chosen[i] = b.dataset.value;
      paint(i === 0);
    });
    on(form, 'submit', async e => {
      e.preventDefault();
      const id = +$('#pdpVariant').value; if (!id) return;
      addBtn.classList.add('is-busy');
      const ok = await addVariant(id, P.title);
      addBtn.classList.remove('is-busy');
      if (ok) { flashAdded(addBtn, () => paint(false)); setTimeout(openBag, 450); }
    });
    paint(false);

    // more from the same range, drawn with the site's own cards
    if (kp) {
      const range = D.teamwear.includes(kp) ? D.teamwear : D.fanwear;
      const more = range.filter(x => x !== kp).slice(0, 4);
      if (more.length) { $('#pdpMoreGrid').innerHTML = more.map(x => cardHTML(x)).join(''); $('#pdpMore').hidden = false; }
    }
  }

  /* =========================================================
     DRAWERS ON TOUCH: own scrolling, swipe to dismiss
     ========================================================= */
  // Lenis cancels wheel and touch while stopped; drawers scroll themselves, so it must leave them alone
  $$('#qv, #bag, .fpanel').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  function swipeClose(el, axis, close, canStart) {
    if (!el) return;
    let x0 = 0, y0 = 0, live = false;
    on(el, 'touchstart', e => { live = !canStart || canStart(e); const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    on(el, 'touchend', e => {
      if (!live) return; live = false;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (axis === 'y' ? dy > 90 && Math.abs(dx) < dy * .6 : dx > 90 && Math.abs(dy) < dx * .6) close();
    }, { passive: true });
  }
  swipeClose($('.qv__panel'), 'y', closeQV, () => mobileQ.matches && $('.qv__panel').scrollTop <= 0);
  swipeClose($('.bag__panel'), 'x', closeBag);
  // a beat of confirmation on whichever add button did the adding
  function flashAdded(btn, restore) {
    const label = $('span', btn); if (!label) return;
    const was = label.textContent;
    label.textContent = 'Added'; btn.classList.remove('is-added'); void btn.offsetWidth; btn.classList.add('is-added');
    setTimeout(() => { if (restore) restore(); else label.textContent = was; }, 1300);
  }

  /* =========================================================
     ANNOUNCEMENT ROTATOR
     ========================================================= */
  const notes = $$('#announceRot span'); let ni = 0;
  if (notes.length > 1) setInterval(() => {
    const prev = notes[ni]; ni = (ni + 1) % notes.length; const next = notes[ni];
    prev.classList.remove('is-on'); prev.classList.add('is-out');
    next.classList.remove('is-out'); next.classList.add('is-on');
    setTimeout(() => prev.classList.remove('is-out'), 650);
  }, 4200);

  /* =========================================================
     MOBILE MENU
     ========================================================= */
  function toggleMenu(force) {
    const open = force ?? !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    $('#menuBtn').setAttribute('aria-expanded', open);
    $('#menu').setAttribute('aria-hidden', !open);
    if (open) {
      lenis && lenis.stop();
      if (motion) {
        gsap.fromTo('.menu__search, .menu__nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: 1, delay: .3, ease: 'expo.out' });
        gsap.fromTo('.menu__nav a', { '--rule': 0 }, { '--rule': 1, stagger: .06, duration: 1.2, delay: .4, ease: 'expo.inOut' });
        gsap.fromTo('.menu__feature, .menu__foot', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: 1, delay: .65, ease: 'expo.out' });
      }
    } else lenis && lenis.start();
  }
  on($('#menuBtn'), 'click', () => toggleMenu());
  mobileQ.addEventListener('change', e => { if (!e.matches && document.body.classList.contains('menu-open')) toggleMenu(false); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (qv.classList.contains('is-open')) closeQV();
    else if (bagEl.classList.contains('is-open')) closeBag();
    else if (document.body.classList.contains('filters-open')) closeFilters && closeFilters();
    else if (document.body.classList.contains('menu-open')) toggleMenu(false);
  });

  /* =========================================================
     FORMS
     ========================================================= */
  on($('#kitForm'), 'submit', e => {
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
  on($('#newsForm'), 'submit', e => {
    e.preventDefault();
    const v = $('#n-email').value.trim();
    $('#newsMsg').textContent = /^\S+@\S+\.\S+$/.test(v) ? "You're on the team sheet." : 'Enter a full email address.';
  });

  /* =========================================================
     FAQ: details open and close with height easing
     ========================================================= */
  $$('.faq details').forEach(d => {
    const sum = $('summary', d), body = $('p', d);
    on(sum, 'click', e => {
      if (!motion) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: .45, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); } });
        d.classList.remove('is-open');
      } else {
        d.open = true; d.classList.add('is-open');
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', onComplete: () => lenis && lenis.resize() });
      }
    });
  });

  /* =========================================================
     HOME: product rows, carousels, club shop pills
     ========================================================= */
  if ($('#teamwearGrid')) $('#teamwearGrid').innerHTML = D.teamwear.map(p => cardHTML(p)).join('');
  if ($('#shopGrid')) $('#shopGrid').innerHTML = D.fanwear.map(p => cardHTML(p)).join('');

  function syncTrack(track) {
    const nav = track.nextElementSibling; if (!nav) return;
    const max = track.scrollWidth - track.clientWidth;
    const shown = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
    const pos = max > 0 ? track.scrollLeft / max : 0;
    $('.track__bar i', nav).style.transform = `translateX(${pos * (1 / Math.max(shown, .01) - 1) * 100}%) scaleX(${shown})`;
    $('[data-dir="-1"]', nav).disabled = track.scrollLeft < 4;
    $('[data-dir="1"]', nav).disabled = track.scrollLeft > max - 4;
  }
  $$('.track').forEach(track => {
    on(track, 'scroll', () => syncTrack(track), { passive: true });
    window.addEventListener('resize', () => syncTrack(track));
    requestAnimationFrame(() => syncTrack(track));
  });
  $$('.arrow').forEach(btn => on(btn, 'click', () => {
    const track = $('#' + btn.dataset.track); const card = $('.card:not(.is-hidden)', track);
    const step = card ? card.offsetWidth + 16 : track.clientWidth * .8;
    track.scrollBy({ left: step * +btn.dataset.dir, behavior: 'smooth' });
  }));

  const tabs = $$('#shopTabs button');
  tabs.forEach(btn => on(btn, 'click', () => {
    tabs.forEach(b => b.setAttribute('aria-selected', b === btn));
    const f = btn.dataset.filter; const track = $('#shopGrid'); const cards = $$('.card', track);
    const apply = () => {
      cards.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
      track.scrollLeft = 0; syncTrack(track);
      const vis = cards.filter(c => !c.classList.contains('is-hidden'));
      if (motion) gsap.fromTo(vis, { x: 40, opacity: 0 }, { x: 0, opacity: 1, stagger: .06, duration: .8, ease: 'expo.out' });
    };
    if (motion) gsap.to(cards, { opacity: 0, duration: .25, onComplete: apply }); else apply();
  }));

  /* =========================================================
     HOME: hero hotspots
     Each spot is pinned in image percentages; we map that through object-fit: cover
     so it stays on the garment at any viewport. Card copy comes from the product data.
     ========================================================= */
  const spots = $$('.spot');
  spots.forEach(sp => {
    const p = ALL[sp.dataset.open];
    sp.setAttribute('aria-label', `${p.name}, ${money(p.price)}. Shop now`);
    sp.innerHTML = `<span class="spot__dot"></span>
      <svg class="spot__line" viewBox="0 0 92 58" preserveAspectRatio="none" aria-hidden="true"><polyline pathLength="1" points="0,58 36,0 92,0"/></svg>
      <span class="spot__card"><small>${p.tag} · ${money(p.price)}</small><b>${p.name}</b><i>Shop now</i></span>`;
  });
  const LINES = { right: '0,58 36,0 92,0', left: '92,58 56,0 0,0', up: '0,58 0,0' };
  function setSide(sp, side) {
    sp.classList.toggle('spot--left', side === 'left');
    sp.classList.toggle('spot--up', side === 'up');
    sp.dataset.at = side;
    $('polyline', sp).setAttribute('points', LINES[side]);
  }
  function layoutSpots() {
    $$('.hero__slide').forEach(fig => {
      const img = $('img', fig); if (!img.naturalWidth) return;
      const W = fig.clientWidth, H = fig.clientHeight;
      const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const rw = img.naturalWidth * k, rh = img.naturalHeight * k;
      const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
      const ox = (W - rw) * px, oy = (H - rh) * py;
      $$('.spot', fig).forEach(sp => {
        const x = ox + rw * sp.dataset.x / 100, y = oy + rh * sp.dataset.y / 100;
        const card = $('.spot__card', sp), cw = card.offsetWidth;
        const room = cw + parseFloat(getComputedStyle(sp.parentElement).getPropertyValue('--lw')) + 16;
        sp.style.transform = `translate(${x}px, ${y}px)`;
        sp.classList.toggle('is-off', x < 24 || x > W - 24 || y < 90);
        const fits = { left: x - room >= 8, right: x + room <= W - 8 };
        const pref = sp.dataset.side, other = pref === 'left' ? 'right' : 'left';
        const side = fits[pref] ? pref : fits[other] ? other : 'up';
        // stacked above the dot on narrow screens, nudged to stay inside the frame
        const nudge = side === 'up' ? Math.min(0, W - 12 - (x + cw / 2)) + Math.max(0, 12 - (x - cw / 2)) : 0;
        card.style.setProperty('--nudge', nudge + 'px');
        setSide(sp, side);
      });
    });
  }
  if (spots.length) {
    $$('.hero__slide img').forEach(img => img.complete ? layoutSpots() : img.addEventListener('load', layoutSpots));
    window.addEventListener('resize', layoutSpots);
    layoutSpots();
  }
  const CLIP_FROM = { right: 'inset(0% 100% 0% 0%)', left: 'inset(0% 0% 0% 100%)', up: 'inset(100% 0% 0% 0%)' };
  function showSpots(fig, delay = 0) {
    if (!motion || !fig) return;
    $$('.spot', fig).forEach((sp, i) => {
      const d = delay + i * .35;
      gsap.killTweensOf([...sp.children, $('polyline', sp), ...$$('.spot__card > *', sp)]);
      gsap.set(sp, { autoAlpha: 1 }); gsap.set($('.spot__dot', sp), { scale: 0 }); gsap.set($('polyline', sp), { strokeDashoffset: 1 }); gsap.set($('.spot__card', sp), { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.fromTo($('.spot__dot', sp), { scale: 0 }, { scale: 1, duration: .7, ease: 'back.out(2.2)', delay: d });
      gsap.fromTo($('polyline', sp), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7, ease: 'power3.inOut', delay: d + .25 });
      gsap.fromTo($('.spot__card', sp), { clipPath: CLIP_FROM[sp.dataset.at], opacity: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .8, ease: 'expo.inOut', delay: d + .75 });
      gsap.fromTo($$('.spot__card > *', sp), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .06, delay: d + 1.05 });
    });
  }
  function hideSpots(fig) {
    if (!motion) return;
    $$('.spot', fig).forEach(sp => {
      gsap.killTweensOf([...sp.children, $('polyline', sp), ...$$('.spot__card > *', sp)]);
      gsap.timeline()
        .to($('.spot__card', sp), { clipPath: CLIP_FROM[sp.dataset.at], duration: .45, ease: 'power3.in' })
        .to($('polyline', sp), { strokeDashoffset: 1, duration: .35, ease: 'power2.in' }, .2)
        .to($('.spot__dot', sp), { scale: 0, duration: .3, ease: 'power2.in' }, .4)
        .set(sp, { autoAlpha: 0 });
    });
  }
  if (motion) gsap.set(spots, { autoAlpha: 0 });

  /* =========================================================
     HOME: hero slider
     ========================================================= */
  const slides = $$('.hero__slide'); const dots = $$('#heroDots button');
  let cur = 0, heroTimer, slideStart = 0, remaining = 6000;
  function goSlide(n) {
    if (n === cur) return;
    const prev = slides[cur], next = slides[n];
    dots.forEach((d, i) => { d.classList.toggle('is-active', i === n); d.classList.toggle('is-done', i < n); });
    slides.forEach(s => s.style.zIndex = 0); prev.style.zIndex = 1; next.style.zIndex = 2;
    hideSpots(prev);
    if (motion) {
      gsap.fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
      gsap.fromTo($('.hero__frame', next), { scale: 1.35, xPercent: 6 }, { scale: 1.08, xPercent: 0, duration: 1.8, ease: 'expo.out' });
      gsap.to($('.hero__frame', prev), { xPercent: -8, duration: 1.4, ease: 'expo.inOut', onComplete: () => gsap.set($('.hero__frame', prev), { xPercent: 0 }) });
      showSpots(next, 1.1);
    } else {
      next.style.clipPath = 'inset(0 0 0 0)';
    }
    prev.classList.remove('is-active'); next.classList.add('is-active');
    cur = n; queueSlide();
  }
  function queueSlide(ms = 6000) {
    if (slides.length < 2) return;
    clearTimeout(heroTimer); slideStart = Date.now(); remaining = ms;
    heroTimer = setTimeout(() => goSlide((cur + 1) % slides.length), ms);
  }
  dots.forEach((d, i) => on(d, 'click', () => goSlide(i)));
  // hovering a hotspot holds the slide so the card can be read and clicked
  spots.forEach(sp => {
    on(sp, 'mouseenter', () => { clearTimeout(heroTimer); remaining -= Date.now() - slideStart; $('.hero').classList.add('is-paused'); });
    on(sp, 'mouseleave', () => { $('.hero').classList.remove('is-paused'); queueSlide(Math.max(remaining, 1200)); });
  });

  /* =========================================================
     COLLECTION PAGES: filters, sort, density, URL state
     ========================================================= */
  let closeFilters = null;
  const coll = $('#collection');
  if (coll) {
    const cfg = D.COLLECTIONS[coll.dataset.source];
    const products = cfg.products;
    const grid = $('#pgrid');
    const sizeOrder = [...D.SIZES, 'One size'];
    const sizes = sizeOrder.filter(s => products.some(p => p.sizes.includes(s)));
    const fams = Object.keys(D.FAMILIES).filter(f => products.some(p => p.variants.some(v => v.fam === f)));
    const prices = products.map(p => p.price);
    const PMIN = Math.floor(Math.min(...prices)), PMAX = Math.ceil(Math.max(...prices));

    const params = new URLSearchParams(location.search);
    const list = k => new Set((params.get(k) || '').split(',').filter(Boolean));
    const state = {
      cat: list('cat'), size: list('size'), color: list('color'), club: list('club'),
      min: +params.get('min') || PMIN, max: +params.get('max') || PMAX,
      sort: params.get('sort') || 'featured'
    };

    // --- build the panel
    const count = fn => products.filter(fn).length;
    const group = (key, title, inner, open = true) => `
      <details class="fgroup" data-group="${key}"${open ? ' open' : ''}>
        <summary>${title}<i aria-hidden="true"></i></summary>
        <div class="fgroup__body">${inner}</div>
      </details>`;
    let groups = group('cat', 'Category', Object.entries(cfg.cats).map(([k, label]) => `
      <label class="fcheck"><input type="checkbox" data-f="cat" value="${k}"><span class="fcheck__box"></span><span>${label}</span><small>${count(p => p.cat === k)}</small></label>`).join(''));
    if (cfg.clubs) groups += group('club', 'Club', Object.entries(cfg.clubs).map(([k, label]) => `
      <label class="fcheck"><input type="checkbox" data-f="club" value="${k}"><span class="fcheck__box"></span><span>${label}</span><small>${count(p => p.club === k)}</small></label>`).join(''));
    groups += group('size', 'Size', `<div class="fsizes">${sizes.map(s => `<button type="button" data-f="size" value="${s}" aria-pressed="false">${s}</button>`).join('')}</div>`);
    groups += group('color', 'Color', `<div class="fcolors">${fams.map(f => `<button type="button" data-f="color" value="${f}" aria-pressed="false"><span style="background:${D.FAMILIES[f].hex}"></span>${D.FAMILIES[f].label}</button>`).join('')}</div>`);
    groups += group('price', 'Price', `
      <div class="frange">
        <div class="frange__track"><span id="rangeFill"></span></div>
        <input type="range" id="priceMin" min="${PMIN}" max="${PMAX}" step="1" aria-label="Minimum price">
        <input type="range" id="priceMax" min="${PMIN}" max="${PMAX}" step="1" aria-label="Maximum price">
      </div>
      <p class="frange__val"><span id="priceMinVal"></span><span id="priceMaxVal"></span></p>`);
    $('#filterGroups').innerHTML = groups;

    // --- subcategory chips with thumbnails
    const thumb = k => { const p = products.find(x => x.cat === k); return p ? p.variants[0].imgs[p.flat ? 0 : 0] : ''; };
    $('#subcats').innerHTML = `<button type="button" class="subcat" data-sub="all"><span class="subcat__img subcat__img--all"><svg viewBox="0 0 160 188" fill="currentColor"><use href="#k-mark"/></svg></span><span>All</span></button>` +
      Object.entries(cfg.cats).map(([k, label]) => `<button type="button" class="subcat" data-sub="${k}"><span class="subcat__img${products.find(x => x.cat === k)?.flat ? ' is-flat' : ''}"><img src="${IMG}${thumb(k)}.webp" alt="" loading="lazy"></span><span>${label}</span></button>`).join('');

    const pMin = $('#priceMin'), pMax = $('#priceMax');
    pMin.value = state.min; pMax.value = state.max;

    function matches(p, skip) {
      if (skip !== 'cat' && state.cat.size && !state.cat.has(p.cat)) return false;
      if (skip !== 'club' && state.club.size && !state.club.has(p.club)) return false;
      if (skip !== 'size' && state.size.size && !p.sizes.some(s => state.size.has(s))) return false;
      if (skip !== 'color' && state.color.size && !p.variants.some(v => state.color.has(v.fam))) return false;
      if (p.price < state.min || p.price > state.max) return false;
      return true;
    }
    const labelFor = (k, v) => k === 'cat' ? cfg.cats[v] : k === 'club' ? cfg.clubs[v] : k === 'color' ? D.FAMILIES[v].label : v;

    function syncControls() {
      $$('[data-f]', coll).forEach(el => {
        const on = state[el.dataset.f].has(el.value);
        if (el.type === 'checkbox') el.checked = on; else el.setAttribute('aria-pressed', on);
      });
      $$('.subcat').forEach(b => b.classList.toggle('is-on', b.dataset.sub === 'all' ? !state.cat.size : state.cat.size === 1 && state.cat.has(b.dataset.sub)));
      const lo = (state.min - PMIN) / (PMAX - PMIN) * 100, hi = (state.max - PMIN) / (PMAX - PMIN) * 100;
      $('#rangeFill').style.left = lo + '%'; $('#rangeFill').style.right = (100 - hi) + '%';
      $('#priceMinVal').textContent = money(state.min); $('#priceMaxVal').textContent = money(state.max);
      $('#sortSelect').value = state.sort;
    }

    function activeList() {
      const out = [];
      ['cat', 'club', 'size', 'color'].forEach(k => state[k].forEach(v => out.push({ k, v, label: labelFor(k, v) })));
      if (state.min > PMIN || state.max < PMAX) out.push({ k: 'price', label: `${money(state.min)} – ${money(state.max)}` });
      return out;
    }

    function writeURL() {
      const q = new URLSearchParams();
      ['cat', 'club', 'size', 'color'].forEach(k => state[k].size && q.set(k, [...state[k]].join(',')));
      if (state.min > PMIN) q.set('min', state.min);
      if (state.max < PMAX) q.set('max', state.max);
      if (state.sort !== 'featured') q.set('sort', state.sort);
      const s = q.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }

    function render(animate = true) {
      let list = products.filter(p => matches(p));
      if (state.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
      if (state.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
      if (state.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      // when filtering by color, lead with the matching colorway
      const vi = p => state.color.size ? Math.max(0, p.variants.findIndex(v => state.color.has(v.fam))) : 0;
      const paint = () => {
        grid.innerHTML = list.map(p => cardHTML(p, vi(p))).join('');
        $('#emptyState').hidden = list.length > 0;
        if (motion && animate) gsap.fromTo($$('.card', grid), { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .05, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
        else if (motion) ScrollTrigger.refresh();
      };
      if (motion && animate && grid.children.length) gsap.to($$('.card', grid), { opacity: 0, y: -12, duration: .22, stagger: .015, ease: 'power2.in', onComplete: paint });
      else paint();

      const n = list.length;
      $('#resultCount').textContent = `${n} ${n === 1 ? 'product' : 'products'}`;
      $('#showResults').textContent = `Show ${n} ${n === 1 ? 'result' : 'results'}`;
      const act = activeList();
      $('#filterCount').hidden = !act.length; $('#filterCount').textContent = act.length;
      $('#activeChips').innerHTML = act.map(a => `<button type="button" class="chip" data-k="${a.k}" data-v="${a.v || ''}">${a.label}<span aria-hidden="true">×</span><span class="sr">Remove</span></button>`).join('') +
        (act.length > 1 ? `<button type="button" class="chip chip--clear" data-k="all">Clear all</button>` : '');
      syncControls(); writeURL();
    }

    // --- events
    coll.addEventListener('change', e => {
      const el = e.target.closest('input[type=checkbox][data-f]'); if (!el) return;
      state[el.dataset.f][el.checked ? 'add' : 'delete'](el.value); render();
    });
    coll.addEventListener('click', e => {
      const b = e.target.closest('button[data-f]');
      if (b) { const s = state[b.dataset.f]; s.has(b.value) ? s.delete(b.value) : s.add(b.value); render(); return; }
      const sub = e.target.closest('[data-sub]');
      if (sub) { state.cat = sub.dataset.sub === 'all' ? new Set() : new Set([sub.dataset.sub]); render(); return; }
      const chip = e.target.closest('.chip');
      if (chip) {
        const k = chip.dataset.k;
        if (k === 'all') clearAll();
        else if (k === 'price') { state.min = PMIN; state.max = PMAX; pMin.value = PMIN; pMax.value = PMAX; render(); }
        else { state[k].delete(chip.dataset.v); render(); }
      }
    });
    function clearAll() {
      ['cat', 'club', 'size', 'color'].forEach(k => state[k].clear());
      state.min = PMIN; state.max = PMAX; pMin.value = PMIN; pMax.value = PMAX; render();
    }
    on($('#clearAll'), 'click', clearAll);
    on($('#emptyClear'), 'click', clearAll);
    on($('#sortSelect'), 'change', e => { state.sort = e.target.value; render(); });

    // dual range: keep the handles from crossing, re-render once the drag settles
    let rangeT;
    const onRange = () => {
      let lo = +pMin.value, hi = +pMax.value;
      if (lo > hi - 1) { if (document.activeElement === pMin) lo = hi - 1; else hi = lo + 1; pMin.value = lo; pMax.value = hi; }
      state.min = lo; state.max = hi; syncControls();
      clearTimeout(rangeT); rangeT = setTimeout(() => render(), 180);
    };
    on(pMin, 'input', onRange); on(pMax, 'input', onRange);

    // density
    const view = $$('.toolbar__view button');
    const setCols = n => { grid.style.setProperty('--cols', n); view.forEach(b => b.setAttribute('aria-pressed', b.dataset.cols === String(n))); store.set('kulars-cols', n); if (motion) ScrollTrigger.refresh(); };
    view.forEach(b => on(b, 'click', () => setCols(+b.dataset.cols)));
    setCols(store.get('kulars-cols', 3));

    // filter panel: sidebar on desktop, drawer on mobile
    const toggle = $('#filterToggle');
    function openFilters() { document.body.classList.add('filters-open'); toggle.setAttribute('aria-expanded', 'true'); lenis && lenis.stop(); }
    closeFilters = () => { document.body.classList.remove('filters-open'); toggle.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); };
    on(toggle, 'click', () => {
      if (mobileQ.matches) { document.body.classList.contains('filters-open') ? closeFilters() : openFilters(); return; }
      const collapsed = coll.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      $('.toolbar__label', toggle).textContent = collapsed ? 'Show filters' : 'Hide filters';
      if (motion) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
    $$('[data-close-filters]').forEach(b => on(b, 'click', () => closeFilters()));
    const setToggleLabel = () => { $('.toolbar__label', toggle).textContent = mobileQ.matches ? 'Filters' : (coll.classList.contains('is-collapsed') ? 'Show filters' : 'Hide filters'); toggle.setAttribute('aria-expanded', mobileQ.matches ? 'false' : String(!coll.classList.contains('is-collapsed'))); };
    mobileQ.addEventListener('change', () => { closeFilters(); setToggleLabel(); });
    setToggleLabel();

    // sticky toolbar gets a shadow once it docks
    if ('IntersectionObserver' in window) {
      const sentinel = document.createElement('div'); sentinel.className = 'toolbar__sentinel'; $('#toolbar').before(sentinel);
      new IntersectionObserver(([en]) => $('#toolbar').classList.toggle('is-stuck', !en.isIntersecting), { rootMargin: '-1px 0px 0px 0px' }).observe(sentinel);
    }

    render(false);
  }

  /* =========================================================
     CLUBS PAGE: kit list + directory filters
     ========================================================= */
  const clubGrid = $('#clubGrid');
  if (clubGrid) {
    $('#clubKit').innerHTML = D.teamwear.map(p => `<button type="button" class="kitchip" data-open="${p.id}"><img src="${IMG}${p.variants[0].imgs[0]}.webp" alt="">${p.name}</button>`).join('');
    const st = { level: 'all', region: 'all', q: '' };
    $('#levelFilters').innerHTML = `<button type="button" data-level="all" aria-pressed="true">All levels</button>` +
      Object.entries(D.LEVELS).map(([k, l]) => `<button type="button" data-level="${k}" aria-pressed="false">${l}</button>`).join('');
    const regions = [...new Set(D.clubs.map(c => c.region))].sort();
    $('#regionSelect').insertAdjacentHTML('beforeend', regions.map(r => `<option value="${r}">${r}</option>`).join(''));

    const join = `<a href="/pages/custom-kits" class="ccard ccard--join">
        <svg viewBox="0 0 160 188" fill="currentColor" aria-hidden="true"><use href="#k-mark"/></svg>
        <span class="ccard__level">Open spot</span><b>Your club here</b><p>Training kit, travel wear and a supporters' shop around your crest.</p><i>Start a custom kit</i></a>`;
    function renderClubs() {
      const list = D.clubs.filter(c => (st.level === 'all' || c.level === st.level) && (st.region === 'all' || c.region === st.region) && (!st.q || c.name.toLowerCase().includes(st.q)));
      const empty = !list.length ? `<div class="ccard ccard--empty"><b>No ${st.level === 'all' ? '' : D.LEVELS[st.level].toLowerCase() + ' '}clubs yet</b><p>We're adding clubs every season. Yours could be the first.</p></div>` : '';
      clubGrid.innerHTML = list.map(c => `
        <article class="ccard">
          <a href="${c.shop}" class="ccard__img" data-cursor="Shop"><img src="${IMG}${c.img}.webp" alt="${c.name} in Kulars kit" loading="lazy">${c.featured ? '<span class="m__tag">Featured club</span>' : ''}</a>
          <span class="ccard__level">${D.LEVELS[c.level]} · ${c.region}</span>
          <b>${c.name}</b>
          <p>${c.league}</p>
          <a href="${c.shop}" class="link-arrow">Shop the supporters' range <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </article>`).join('') + empty + join;
      if (motion) gsap.fromTo($$('.ccard', clubGrid), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .07, ease: 'expo.out' });
    }
    on($('#levelFilters'), 'click', e => {
      const b = e.target.closest('[data-level]'); if (!b) return;
      st.level = b.dataset.level; $$('#levelFilters button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderClubs();
    });
    on($('#regionSelect'), 'change', e => { st.region = e.target.value; renderClubs(); });
    let qT; on($('#clubSearch'), 'input', e => { clearTimeout(qT); qT = setTimeout(() => { st.q = e.target.value.trim().toLowerCase(); renderClubs(); }, 160); });
    renderClubs();
  }

  /* =========================================================
     CUSTOM KITS: range builder feeding the brief
     ========================================================= */
  const bgrid = $('#builderGrid');
  if (bgrid) {
    const all = [...D.teamwear, ...D.fanwear];
    const picks = new Set(store.get('kulars-brief', []).filter(id => ALL[id]));
    let need = 'all';
    $('#needFilters').innerHTML = `<button type="button" data-need="all" aria-pressed="true">All pieces <small>${all.length}</small></button>` +
      Object.entries(D.NEEDS).map(([k, l]) => `<button type="button" data-need="${k}" aria-pressed="false">${l} <small>${all.filter(p => p.need === k).length}</small></button>`).join('');

    function renderBuilder(animate) {
      const list = all.filter(p => need === 'all' || p.need === need);
      bgrid.innerHTML = list.map(p => `
        <article class="bcard${picks.has(p.id) ? ' is-picked' : ''}${p.flat ? ' is-flat' : ''}" data-id="${p.id}">
          <div class="bcard__img"><img src="${IMG}${p.variants[0].imgs[0]}.webp" alt="${p.name}" loading="lazy"></div>
          <span class="bcard__need">${D.NEEDS[p.need]}</span>
          <b>${p.name}</b>
          <button type="button" class="bcard__add" data-pick="${p.id}" aria-pressed="${picks.has(p.id)}"><span class="bcard__plus" aria-hidden="true"></span><span class="bcard__lbl">${picks.has(p.id) ? 'In your brief' : 'Add to brief'}</span></button>
        </article>`).join('');
      if (motion && animate) gsap.fromTo($$('.bcard', bgrid), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .045, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
    }
    function syncBrief() {
      const ids = [...picks];
      store.set('kulars-brief', ids);
      $('#trayCount').textContent = ids.length;
      $('#tray').classList.toggle('is-on', ids.length > 0);
      $('#trayPicks').innerHTML = ids.slice(-5).map(id => `<img src="${IMG}${ALL[id].variants[0].imgs[0]}.webp" alt="${ALL[id].name}" class="${ALL[id].flat ? 'is-flat' : ''}">`).join('');
      $('#briefList').innerHTML = ids.map(id => `<li><img src="${IMG}${ALL[id].variants[0].imgs[0]}.webp" alt="" class="${ALL[id].flat ? 'is-flat' : ''}"><span>${ALL[id].name}</span><button type="button" data-unpick="${id}" aria-label="Remove ${ALL[id].name}">×</button></li>`).join('');
      $('#briefEmpty').hidden = ids.length > 0;
      $('#f-pieces').value = ids.map(id => ALL[id].name).join(', ');
    }
    on($('#needFilters'), 'click', e => {
      const b = e.target.closest('[data-need]'); if (!b) return;
      need = b.dataset.need; $$('#needFilters button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderBuilder(true);
    });
    on(bgrid, 'click', e => {
      const b = e.target.closest('[data-pick]'); if (!b) return;
      const id = b.dataset.pick, card = b.closest('.bcard');
      const add = !picks.has(id); add ? picks.add(id) : picks.delete(id);
      card.classList.toggle('is-picked', add); b.setAttribute('aria-pressed', add); $('.bcard__lbl', b).textContent = add ? 'In your brief' : 'Add to brief';
      if (motion && add) gsap.fromTo($('.bcard__img img', card), { scale: 1.08 }, { scale: 1, duration: .8, ease: 'expo.out' });
      syncBrief();
    });
    on($('#briefList'), 'click', e => {
      const b = e.target.closest('[data-unpick]'); if (!b) return;
      picks.delete(b.dataset.unpick); syncBrief(); renderBuilder(false);
    });
    on($('#kitForm'), 'submit', () => { if (picks.size && $('#formMsg').classList.contains('ok')) $('#formMsg').textContent += ` ${picks.size} pieces attached.`; });
    // the tray only shows while the builder is on screen
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => $('#tray').classList.toggle('is-near', en.isIntersecting), { threshold: 0 }).observe($('#builder'));
    renderBuilder(false); syncBrief();
  }

  /* =========================================================
     NO-MOTION FALLBACK
     ========================================================= */
  if (!motion) {
    const ld = $('#loader'); if (ld) ld.remove();
    document.body.classList.remove('is-loading');
    queueSlide();
    $$('a[href^="#"]').forEach(a => on(a, 'click', () => document.body.classList.contains('menu-open') && toggleMenu(false)));
    return;
  }

  /* =========================================================
     MOTION: smooth scroll, anchors, header
     ========================================================= */
  function splitChars(el) {
    const label = el.closest('h1,h2,p')?.textContent.replace(/\s+/g, ' ').trim();
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
    const h = el.closest('h1,h2,p');
    if (h && label) { h.setAttribute('aria-label', label); $$('.line', h).forEach(l => l.setAttribute('aria-hidden', 'true')); }
  }
  $$('.split').forEach(splitChars);
  function splitWords(el) {
    if (!el) return;
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

  lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const scrollToHash = (hash, immediate) => {
    const target = hash === '#top' || hash === '#' ? 0 : $(hash);
    if (target === null) return false;
    lenis.scrollTo(target, immediate ? { immediate: true, offset: -80 } : { offset: -80, duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    return true;
  };

  // --- page transitions: in-site links fade the page out before leaving
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const samePage = url.pathname === location.pathname || (url.pathname.endsWith('/') && location.pathname === '/');
    if (samePage && url.hash) {
      e.preventDefault();
      const go = () => scrollToHash(url.hash);
      if (document.body.classList.contains('menu-open')) { toggleMenu(false); setTimeout(go, 350); } else go();
      return;
    }
    if (samePage && url.search === location.search) { e.preventDefault(); if (document.body.classList.contains('menu-open')) toggleMenu(false); return; }
    if (a.getAttribute('href').startsWith('#')) return;
    e.preventDefault();
    lenis.stop();
    gsap.to('main, .footer', { opacity: 0, y: -16, duration: .35, ease: 'power2.in', onComplete: () => { location.href = url.href; } });
  });
  // coming back via the back button restores a frozen, faded page; bring it back
  window.addEventListener('pageshow', e => { if (e.persisted) { gsap.set('main, .footer', { opacity: 1, y: 0 }); lenis.start(); } });

  const header = $('#header');
  lenis.on('scroll', ({ scroll, direction }) => {
    header.classList.toggle('is-scrolled', scroll > 30);
    const busy = document.body.classList.contains('menu-open') || document.body.classList.contains('filters-open');
    const hide = direction === 1 && scroll > 700 && !busy;
    if (direction) header.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('header-hidden', header.classList.contains('is-hidden'));
  });
  gsap.to('#progressBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- INTRO: splash on a homepage load, a soft fade-in everywhere else ---------- */
  const loader = $('#loader');
  if (loader) {
    const heroChars = $$('.hero__title .ch');
    gsap.set(heroChars, { yPercent: 115 });
    gsap.set('.hero__eyebrow, .hero__ctas > *, .hero__bar', { y: 30, opacity: 0 });
    gsap.set('.hero__slide.is-active .hero__frame', { scale: 1.35 });
    const arcs = $$('.loader__logo .km0, .loader__logo .km1, .loader__logo .km2, .loader__logo .km3');
    const legs = $$('.loader__logo .km4, .loader__logo .km5, .loader__logo .km6');
    const letters = $$('.loader__logo .kw');
    gsap.timeline()
      .from(arcs, { scaleX: 0, transformOrigin: '0% 50%', duration: .7, ease: 'expo.out', stagger: .06 }, 0)
      .from(legs, { scaleY: 0, transformOrigin: '50% 0%', duration: .6, ease: 'expo.out', stagger: .06 }, .18)
      .from(letters, { yPercent: 60, opacity: 0, duration: .6, ease: 'expo.out', stagger: .045 }, .1)
      .from('.loader__meta', { opacity: 0, y: 10, duration: .5 }, .2);
    const heroIn = (tl, at) => tl
      .to('.hero__slide.is-active .hero__frame', { scale: 1.08, duration: 2.2, ease: 'expo.out' }, at)
      .add(() => showSpots(slides[0]), at + .95)
      .to(heroChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .028 }, at + .2)
      .to('.hero__eyebrow, .hero__ctas > *, .hero__bar', { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .08 }, at + .45);
    // the splash belongs to opening the site; arriving from another page goes straight to the hero
    let internal = false; try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (internal && performance.getEntriesByType('navigation')[0]?.type !== 'reload') {
      loader.remove(); document.body.classList.remove('is-loading');
      lenis.start();
      heroIn(gsap.timeline({ onComplete: () => { queueSlide(); ScrollTrigger.refresh(); } }), .05);
    } else {
      const heroImg = $('.hero__slide.is-active img');
      const imgReady = heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
      const minHold = new Promise(r => setTimeout(r, 1150));
      const maxWait = new Promise(r => setTimeout(r, 3000));
      Promise.race([Promise.all([imgReady, minHold]), maxWait]).then(() => {
        heroIn(gsap.timeline({
          onStart: () => document.body.classList.remove('is-loading'),
          onComplete: () => { loader.remove(); lenis.start(); queueSlide(); ScrollTrigger.refresh(); }
        })
          .to('.loader__logo', { y: -80, opacity: 0, duration: .7, ease: 'power3.in' }, 0)
          .to('.loader__meta', { opacity: 0, duration: .3 }, 0)
          .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, .25), .55);
      });
    }
  } else {
    const titleChars = $$('.phero__title .ch, .shero__title .ch');
    gsap.set(titleChars, { yPercent: 115 });
    gsap.set('.crumbs, .phero__lede, .phero__ctas > *, .shero .eyebrow, .shero__scroll, .subcats, .toolbar', { y: 24, opacity: 0 });
    gsap.set('.phero__media img', { scale: 1.25 });
    lenis.start(); if (location.hash) scrollToHash(location.hash, true);
    gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
      .from('main', { opacity: 0, duration: .5, ease: 'power2.out' }, 0)
      .to('.phero__media img', { scale: 1, duration: 2, ease: 'expo.out' }, 0)
      .to(titleChars, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .025 }, .15)
      .to('.crumbs, .phero__lede, .phero__ctas > *, .shero .eyebrow, .shero__scroll, .subcats, .toolbar', { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .07, clearProps: 'transform' }, .35);
  }

  /* ---------- HOME hero parallax ---------- */
  if ($('.hero')) {
    gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
    if (fine) {
      const hx = gsap.quickTo('.hero__media', 'x', { duration: 1.2, ease: 'power3' });
      const tx = gsap.quickTo('.hero__title', 'x', { duration: 1.4, ease: 'power3' });
      $('.hero').addEventListener('mousemove', e => { const nx = e.clientX / innerWidth - .5; hx(nx * -24); tx(nx * 18); });
    }
  }
  if ($('.phero')) gsap.to('.phero__media img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- SHARED reveals ---------- */
  $$('.display').forEach(h => {
    const chars = $$('.ch', h);
    if (chars.length) gsap.from(chars, { yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .02, scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.eyebrow:not(.hero__eyebrow):not(.shero .eyebrow), .prow__copy, .prow__links, .prow__all, .filters, .stories__head p, .strip > *, .cta__copy, .directory__head > p, .builder__head > p, .name__head > p, .spotlight__copy > p, .spotlight__facts, .pband__content > p').forEach(el => {
    gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('[data-reveal]').forEach((el, i) => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%' } })
      .from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: (i % 3) * .12 })
      .from($('img', el), { scale: 1.4, duration: 1.8, ease: 'expo.out' }, '<.2');
  });
  $$('.pband').forEach(b => {
    gsap.fromTo($('.pband__media img', b), { yPercent: -10, scale: 1.15 }, { yPercent: 10, scale: 1.15, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- HOME sections ---------- */
  if ($('.cats')) {
    gsap.from('.tile', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', stagger: .08, scrollTrigger: { trigger: '.cats', start: 'top 85%' } });
    gsap.from('.tile img', { scale: 1.35, duration: 1.8, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.cats', start: 'top 85%' } });
    gsap.from('.tile__name, .tile__cta', { yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .05, delay: .5, scrollTrigger: { trigger: '.cats', start: 'top 85%' } });
  }
  $$('.track').forEach(t => gsap.from($$('.card', t), { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: t, start: 'top 85%' } }));
  if ($('.impact')) {
    const imp = { v: 0 };
    gsap.to(imp, { v: 5, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '.impact', start: 'top 75%' }, onUpdate: () => { $('#impactNum').textContent = Math.round(imp.v); } });
    gsap.fromTo('.impact__num', { scale: .6, rotate: -6 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.impact', start: 'top bottom', end: 'top 30%', scrub: true } });
    gsap.from('.impact__copy > *, .impact__list li', { y: 40, opacity: 0, stagger: .07, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.impact', start: 'top 75%' } });
  }
  if ($('.mosaic')) {
    ScrollTrigger.batch('.m', {
      start: 'top 88%',
      onEnter: els => {
        gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', stagger: .09 });
        gsap.fromTo(els.map(e => $('.m__cap', e)), { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .09, delay: .6 });
      }
    });
    $$('.m img').forEach(img => gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }
  $$('.story, .shero').forEach(s => gsap.fromTo($('.story__pattern', s), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } }));
  if ($('.story')) {
    gsap.from('.story__lede, .story__body', { y: 40, opacity: 0, stagger: .12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.story__lede', start: 'top 88%' } });
    gsap.from('.acro b', { yPercent: 100, opacity: 0, stagger: .07, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.acro', start: 'top 88%' } });
    gsap.from('.acro span', { opacity: 0, stagger: .07, duration: .8, delay: .4, scrollTrigger: { trigger: '.acro', start: 'top 88%' } });
    splitWords($('.story__sign'));
    gsap.from('.story__sign .rw, .story__cta', { yPercent: 110, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.story__sign', start: 'top 90%' } });
  }
  if ($('.steps')) gsap.from('.steps li', { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 88%' } });
  if ($('.kit-form')) gsap.from('.kit-form', { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.kit-form', start: 'top 90%' } });

  /* ---------- OUR STORY page ---------- */
  const stmt = $('#statement');
  if (stmt) {
    stmt.innerHTML = stmt.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.fromTo('#statement .w', { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: stmt, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  }
  if ($('.reality')) {
    gsap.from('.reality__lead', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.reality__lead', start: 'top 85%' } });
    $$('.reality__list li').forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 62%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') }));
    splitWords($('.reality__end'));
    gsap.from('.reality__end .rw', { yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .03, scrollTrigger: { trigger: '.reality__end', start: 'top 85%' } });
  }
  $$('.rows li').forEach(li => {
    gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 88%' } })
      .from($('b', li), { yPercent: 100, duration: 1.1, ease: 'expo.out' })
      .from($('span', li), { x: 80, opacity: 0, duration: 1.1, ease: 'expo.out' }, '<.1')
      .from($('em', li), { opacity: 0, duration: .8 }, '<.3');
  });
  if ($('.beliefs')) gsap.from('.beliefs p', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.beliefs', start: 'top 88%' } });
  if ($('.signoff')) gsap.from('.signoff__ctas > *', { y: 30, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.signoff__ctas', start: 'top 92%' } });
  if ($('.signoff__text')) gsap.from('.signoff__text .ch', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: .015, scrollTrigger: { trigger: '.signoff__text', start: 'top 85%' } });

  /* ---------- CLUBS page ---------- */
  if ($('.spotlight')) gsap.from('.kitchip', { y: 20, opacity: 0, stagger: .05, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: '.spotlight__kit', start: 'top 92%' } });

  /* ---------- CUSTOM KITS page ---------- */
  if ($('.levels')) gsap.from('.levels li, .levels__label', { y: 20, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.levels', start: 'top 92%' } });
  if ($('.process__rail')) {
    gsap.fromTo('#processLine', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process__steps', start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
    $$('.pstep').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 72%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') }));
  }
  if ($('.ticks')) gsap.from('.ticks li', { y: 30, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ticks', start: 'top 88%' } });
  if ($('.faq')) gsap.from('.faq details', { y: 30, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.faq__list', start: 'top 88%' } });

  /* ---------- FOOTER giant logo assembles ---------- */
  const fm = $$('#footerMark .km'), fw = $$('#footerMark .kw');
  if (fm.length) gsap.timeline({ scrollTrigger: { trigger: '#footerMark', start: 'top bottom', end: 'bottom bottom', scrub: .8 } })
    .from(fm.slice(0, 4), { scaleX: 0, transformOrigin: '0% 50%', stagger: .08, ease: 'none' }, 0)
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
    $$('.magnetic').forEach(b => {
      const mx = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
      const my = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4); });
      b.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
