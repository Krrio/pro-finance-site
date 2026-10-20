(() => {
  const W = 1440;
  const H = 5125;
  const stage = document.getElementById('stage');
  const viewport = document.getElementById('viewport');

  // The design is a fixed 1440px frame: scale it to the viewport width (never above 1:1).
  function fit() {
    const vw = document.documentElement.clientWidth;
    const s = Math.min(vw / W, 1);
    stage.style.setProperty('--s', s);
    stage.style.setProperty('--x', `${(vw - W * s) / 2}px`);
    viewport.style.height = `${H * s}px`;
  }
  fit();

  /* ---------- Candlestick chart (values from Figma node 5:27) ---------- */
  // [wickTop, wickHeight, bodyTop, bodyHeight, isUp]; candle i sits at x = 4 + 7i
  const CANDLES = [
    [187.34, 17.546, 200, 3, 0], [185.14, 26.21, 188.34, 12.382, 1], [173.55, 26.022, 178.13, 10.204, 1],
    [162.72, 27.214, 171.38, 6.748, 1], [164.12, 19.423, 171.38, 7.985, 0], [169.14, 18.403, 175.37, 4.003, 1],
    [155.28, 21.733, 166.65, 8.714, 1], [166.11, 8.816, 166.65, 3.853, 0], [158.63, 20.2, 166.2, 4.302, 1],
    [155.91, 16.31, 166.2, 3, 0], [166.49, 6.627, 167.02, 5.221, 0], [155.01, 18.414, 167.14, 5.101, 1],
    [158.22, 24.732, 167.14, 3.855, 0], [154.36, 27.677, 165.08, 5.912, 1], [155.29, 14.045, 164.68, 3, 1],
    [153.93, 28.57, 164.68, 6.389, 0], [164.44, 17.497, 171.07, 3, 0], [160.46, 18.092, 163.33, 8.199, 1],
    [148.46, 21.978, 153.75, 9.577, 1], [148.01, 14.558, 153.75, 6.323, 0], [150.02, 24.559, 160.08, 3, 0],
    [137.49, 26.581, 147.53, 14.043, 1], [129.66, 22.653, 141.23, 6.309, 1], [121.49, 31.437, 127.93, 13.298, 1],
    [126.41, 4, 126.92, 3, 1], [105.88, 27.811, 119.48, 7.441, 1], [109.94, 17.541, 119.48, 3, 0],
    [100.23, 27.037, 108.41, 12.474, 1], [107.07, 22.239, 108.41, 8.926, 0], [108.49, 13.657, 117.33, 3.604, 0],
    [112.39, 22.01, 120.94, 5.56, 0], [120.22, 16.966, 126.5, 3, 0], [118.73, 21.579, 126.6, 3, 1],
    [108.55, 27.16, 113.69, 12.906, 1], [107.92, 9.787, 111.85, 3, 1], [96.27, 19.126, 106.36, 5.494, 1],
    [91.06, 28.846, 92.49, 13.871, 1], [80.69, 30.67, 92.49, 7.029, 0], [89.7, 14.09, 94.72, 4.793, 1],
    [93.79, 20.275, 94.72, 8.663, 0],
  ];
  const candlesEl = document.getElementById('candles');
  const candleEls = CANDLES.map(([wt, wh, bt, bh, up], i) => {
    const x = 4 + 7 * i;
    const cls = up ? 'up' : 'down';
    const g = document.createElement('div');
    g.className = 'candle';
    g.innerHTML =
      `<div class="wick ${cls}" style="left:${x + 1.5}px;top:${wt}px;height:${wh}px"></div>` +
      `<div class="body ${cls}" style="left:${x}px;top:${bt}px;height:${bh}px"></div>`;
    candlesEl.appendChild(g);
    return g;
  });

  /* ---------- Interactions (work with or without GSAP) ---------- */
  const tfs = document.querySelectorAll('.tf');
  tfs.forEach((tf) => tf.addEventListener('click', () => {
    tfs.forEach((t) => t.classList.toggle('is-active', t === tf));
    if (window.gsap) {
      gsap.fromTo(candlesEl.querySelectorAll('.wick, .body'),
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: '50% 100%', duration: 0.5, ease: 'power3.out', stagger: 0.008, overwrite: true });
    }
  }));

  document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => {
    chip.classList.toggle('is-active');
  }));

  const star = document.querySelector('.star-btn');
  star.addEventListener('click', () => {
    star.classList.remove('is-on');
    void star.offsetWidth;
    star.classList.add('is-on');
  });

  const subscribe = document.querySelector('.subscribe');
  subscribe.addEventListener('submit', () => {
    const input = subscribe.querySelector('input');
    if (!input.value) { input.focus(); return; }
    subscribe.classList.add('is-sent');
    input.value = '';
    input.placeholder = 'Thanks! You are subscribed';
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    stage.style.visibility = 'visible';
    window.addEventListener('resize', fit);
    return;
  }

  /* ================= GSAP ================= */
  gsap.registerPlugin(ScrollTrigger);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  function countUp(el, to, { from = 0, decimals = 2, prefix = '$', suffix = '', duration = 1.8, scrollTrigger } = {}) {
    const o = { v: from };
    return gsap.fromTo(o, { v: from }, {
      v: to, duration, ease: 'power3.out', scrollTrigger,
      onUpdate: () => { el.textContent = prefix + fmt(o.v, decimals) + suffix; },
    });
  }

  const onScroll = (trigger, start = 'top 80%') => ({ trigger, start, toggleActions: 'play none none none' });

  // Clip-path "draw" helpers for the line-art assets
  const CLIP_FULL = 'inset(0% 0% 0% 0%)';

  /* ---------- Intro (hero) ---------- */
  const marketWrap = $('.phone-wrap--market');
  const detailWrap = $('.phone-wrap--detail');
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.1 });

  intro
    .from('.header > *', { y: -30, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0)
    .from('.hero', { scale: 0.94, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.05)
    .from('.hero .display .line > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.3)
    .from('.hero__lead', { y: 26, autoAlpha: 0, duration: 1 }, 0.6)
    .from('.hero__btn', { y: 20, scale: 0.9, autoAlpha: 0, duration: 0.9, clearProps: 'transform' }, 0.75)
    .from('.hero__more', { y: 12, autoAlpha: 0, duration: 0.8 }, 0.95)
    .from('.hero__sparkle', { scale: 0, rotation: -180, autoAlpha: 0, duration: 1.1, ease: 'back.out(2)' }, 0.85)
    .fromTo('.hero__arrow', { clipPath: 'inset(0% 0% 100% 50%)' },
      { clipPath: 'inset(0% 0% 0% 50%)', duration: 0.9, ease: 'power2.inOut' }, 0.95)
    .to('.hero__arrow', { clipPath: CLIP_FULL, duration: 0.6, ease: 'power2.out' }, '>-0.05')
    .from(marketWrap, { y: 320, autoAlpha: 0, duration: 1.5, ease: 'expo.out' }, 0.35)
    .from($('.phone', marketWrap), { rotation: -20, duration: 1.6, ease: 'expo.out' }, 0.35)
    .from(detailWrap, { y: 380, x: 80, autoAlpha: 0, duration: 1.6, ease: 'expo.out' }, 0.5)
    .from($('.phone', detailWrap), { rotation: 30, duration: 1.7, ease: 'expo.out' }, 0.5)
    .from($$('.pm__search, .pm__filter, .chip, .pm__collection, .pm__fav, .pm__choice', marketWrap),
      { y: 14, autoAlpha: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' }, 1.0)
    .from($$('.asset', marketWrap), { scale: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(2.5)' }, 1.45)
    .from(candlesEl.querySelectorAll('.wick, .body'),
      { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.012, ease: 'power3.out' }, 1.15)
    .from($$('.trade-btn', detailWrap), { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.1, clearProps: 'transform' }, 1.3)
    .add(countUp($('#livePrice'), 132.15, { from: 118, duration: 1.6 }), 1.15);

  // Idle loops
  gsap.to($('.float', marketWrap), { y: -12, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to($('.float', detailWrap), { y: -16, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.6 });
  gsap.to('.hero__sparkle', { rotation: '+=360', duration: 14, ease: 'none', repeat: -1, delay: 2 });
  gsap.to('.hero__more img', { y: 4, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // Mouse parallax in hero
  const hero = $('.hero');
  const par = [
    [$('.par', marketWrap), 18],
    [$('.par', detailWrap), 30],
    [$('.hero__sparkle'), 12],
  ].map(([el, depth]) => ({
    depth,
    x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
  }));
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    par.forEach((p) => { p.x(nx * p.depth); p.y(ny * p.depth); });
  });
  hero.addEventListener('mouseleave', () => par.forEach((p) => { p.x(0); p.y(0); }));

  // Live ticker on the stock-detail phone
  const priceEl = $('#livePrice');
  const changeEl = $('#liveChange');
  const lastBody = candleEls[candleEls.length - 1].querySelector('.body');
  const BASE = 130.42;
  let price = 132.15;
  setInterval(() => {
    if (document.hidden) return;
    price = Math.max(128, Math.min(136, price + (Math.random() - 0.48) * 0.6));
    const diff = price - BASE;
    const pct = (diff / BASE) * 100;
    priceEl.textContent = `$${fmt(price, 2)}`;
    changeEl.textContent = `${diff >= 0 ? '+' : '-'}${fmt(Math.abs(pct), 2)}% · $${fmt(Math.abs(diff), 2)}`;
    changeEl.style.color = diff >= 0 ? 'var(--lime)' : 'var(--red)';
    gsap.fromTo(priceEl, { opacity: 0.55 }, { opacity: 1, duration: 0.5 });
    gsap.to(lastBody, { height: 4 + Math.random() * 12, duration: 0.6, ease: 'power2.out' });
  }, 2200);

  /* ---------- Generic scroll reveals ---------- */
  $$('.h2.split').forEach((h) => {
    if (h.closest('.hero')) return;
    gsap.from($$('.line > span', h), {
      yPercent: 110, duration: 1.1, stagger: 0.1, ease: 'power4.out',
      scrollTrigger: onScroll(h, 'top 88%'),
    });
  });
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, delay: 0.15, ease: 'power3.out', scrollTrigger: onScroll(el, 'top 90%') });
  });

  /* ---------- Features ---------- */
  const fcards = $$('.fcard');
  gsap.from(fcards, { y: 90, autoAlpha: 0, duration: 1.2, stagger: 0.15, ease: 'expo.out', scrollTrigger: onScroll('.features', 'top 65%') });
  gsap.from($$('.fcard__content > *, .read-more', $('.features')), {
    y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', delay: 0.35,
    scrollTrigger: onScroll('.features', 'top 65%'),
  });
  gsap.fromTo('.decor-portfolio', { clipPath: 'inset(100% 0% 0% 0%)', y: 40 },
    { clipPath: CLIP_FULL, y: 0, duration: 1.4, ease: 'expo.out', delay: 0.5, scrollTrigger: onScroll('.features', 'top 65%') });
  gsap.fromTo('.decor-gauge', { clipPath: 'inset(0% 32% 0% 0%)' },
    { clipPath: CLIP_FULL, duration: 1.8, ease: 'power2.inOut', delay: 0.6, scrollTrigger: onScroll('.features', 'top 65%') });

  /* ---------- Advantages ---------- */
  gsap.from('.divider--v', { scaleY: 0, transformOrigin: '50% 0%', duration: 1.4, ease: 'expo.inOut', scrollTrigger: onScroll('.advantages', 'top 75%') });
  gsap.from('.divider--h', { scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: 'expo.inOut', delay: 0.15, scrollTrigger: onScroll('.advantages', 'top 75%') });
  gsap.from('.adv', { y: 50, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2, scrollTrigger: onScroll('.advantages', 'top 75%') });
  gsap.from('.adv__icon', {
    scale: 0, rotation: -120, duration: 0.9, stagger: 0.12, ease: 'back.out(2)', delay: 0.45,
    clearProps: 'transform', scrollTrigger: onScroll('.advantages', 'top 75%'),
  });

  /* ---------- Partners ---------- */
  const partners = $$('.partner');
  gsap.from(partners, {
    y: 50, scale: 0.5, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.8)',
    stagger: { each: 0.07, from: 'center' },
    scrollTrigger: onScroll('.partners__logos', 'top 90%'),
    onComplete: () => {
      gsap.to(partners, { y: -8, duration: 1.4, ease: 'sine.inOut', stagger: { each: 0.18, yoyo: true, repeat: -1 } });
    },
  });
  partners.forEach((p) => {
    p.addEventListener('mouseenter', () => gsap.to(p, { scale: 1.12, duration: 0.4, ease: 'back.out(3)' }));
    p.addEventListener('mouseleave', () => gsap.to(p, { scale: 1, duration: 0.4, ease: 'power3.out' }));
  });

  /* ---------- CTA banner + portfolio phone ---------- */
  gsap.fromTo('.cta', { clipPath: 'inset(0% 50% 0% 50% round 24px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: onScroll('.cta', 'top 80%') });
  gsap.fromTo('.cta__squiggle', { clipPath: 'inset(0% 100% 0% 0%)' },
    { clipPath: CLIP_FULL, duration: 1.4, ease: 'power2.inOut', delay: 0.7, scrollTrigger: onScroll('.cta', 'top 80%') });
  gsap.from('.cta .btn', { y: 24, autoAlpha: 0, duration: 0.9, delay: 0.9, ease: 'power3.out', clearProps: 'transform', scrollTrigger: onScroll('.cta', 'top 80%') });

  const portfolio = $('.portfolio-wrap');
  gsap.from(portfolio, { y: 220, rotation: 10, autoAlpha: 0, duration: 1.6, ease: 'expo.out', delay: 0.4, scrollTrigger: onScroll('.cta', 'top 80%') });
  gsap.from($$('.pp__card, .pp__row', portfolio), { x: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 1.0, scrollTrigger: onScroll('.cta', 'top 80%') });
  gsap.fromTo($$('.spark', portfolio), { clipPath: 'inset(0% 100% 0% 0%)' },
    { clipPath: CLIP_FULL, duration: 0.9, stagger: 0.1, ease: 'power2.out', delay: 1.3, scrollTrigger: onScroll('.cta', 'top 80%') });
  countUp($('#totalBalance'), 16988.31, { duration: 2.2, scrollTrigger: onScroll('.cta', 'top 80%') }).delay(0.6);
  gsap.to($('.float', portfolio), { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  /* ---------- Trade in Real Time ---------- */
  const [limeRot, chartRot] = $$('.trade > .rot');
  gsap.from('.lime-card', { rotation: 14, x: -90, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: onScroll('.trade', 'top 75%') });
  gsap.from('.chart-card', { rotation: -12, y: 90, autoAlpha: 0, duration: 1.5, ease: 'expo.out', delay: 0.15, scrollTrigger: onScroll('.trade', 'top 75%') });
  gsap.fromTo('.chart-card__line', { clipPath: 'inset(0% 100% 0% 0%)' },
    { clipPath: CLIP_FULL, duration: 2, ease: 'power2.inOut', delay: 0.6, scrollTrigger: onScroll('.trade', 'top 75%') });
  gsap.from('.chart-card .a', { autoAlpha: 0, y: 6, duration: 0.6, stagger: 0.1, delay: 2.2, scrollTrigger: onScroll('.trade', 'top 75%') });
  gsap.to(limeRot, { y: -30, rotation: -2, ease: 'none', scrollTrigger: { trigger: '.trade', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to(chartRot, { y: 20, rotation: 1.5, ease: 'none', scrollTrigger: { trigger: '.trade', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  /* ---------- Stonks ---------- */
  gsap.from('.stonks__circle', { scale: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'expo.out', scrollTrigger: onScroll('.stonks', 'top 75%') });
  gsap.to('.stonks__circle', { y: -60, ease: 'none', scrollTrigger: { trigger: '.stonks', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.fromTo('.stonks__line', { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: CLIP_FULL, ease: 'none', scrollTrigger: { trigger: '.stonks', start: 'top 80%', end: 'bottom 75%', scrub: 1 } });
  gsap.from('.stock-wrap', { x: 220, rotation: 8, autoAlpha: 0, duration: 1.3, stagger: 0.16, ease: 'expo.out', delay: 0.2, scrollTrigger: onScroll('.stonks', 'top 75%') });
  gsap.fromTo('.stock-card__spark', { clipPath: 'inset(0% 100% 0% 0%)' },
    { clipPath: CLIP_FULL, duration: 1, stagger: 0.16, ease: 'power2.out', delay: 0.8, scrollTrigger: onScroll('.stonks', 'top 75%') });
  $$('.stock-card [data-count]').forEach((el, i) => {
    countUp(el, parseFloat(el.dataset.count), { duration: 1.6, scrollTrigger: onScroll('.stonks', 'top 75%') }).delay(0.4 + i * 0.16);
  });
  countUp($('#stonksCount'), 100000, { decimals: 0, prefix: '', suffix: '+', duration: 2.2, scrollTrigger: onScroll('.stonks', 'top 80%') });

  /* ---------- Final CTA ---------- */
  gsap.from('.final .btn', { scale: 0.8, autoAlpha: 0, duration: 1, delay: 0.3, ease: 'back.out(2)', clearProps: 'transform', scrollTrigger: onScroll('.final', 'top 85%') });

  /* ---------- Footer ---------- */
  gsap.from('.footer .logo, .fcol, .subscribe, .social', {
    y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: onScroll('.footer', 'top 92%'),
  });

  gsap.set(stage, { visibility: 'visible' });

  let resizeRaf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => { fit(); ScrollTrigger.refresh(); });
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
