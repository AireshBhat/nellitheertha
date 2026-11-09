// Pass 01 · Claude · forked from Kimi's Moonwater 01. Throwaway exploration.
(() => {
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection || {};
  const lean = reduce || connection.saveData || /(^|-)2g|3g/.test(connection.effectiveType || '');
  const storage = {
    get(key, session = false) {
      try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; }
    },
    set(key, value, session = false) {
      try { (session ? sessionStorage : localStorage).setItem(key, value); } catch {}
    }
  };

  // The first drop: once per visit, never on reduced motion.
  const hero = document.querySelector('.hero');
  if (!reduce && !storage.get('nelli-pass01-drop', true)) {
    const image = hero.querySelector('img');
    const play = () => { hero.classList.add('play'); storage.set('nelli-pass01-drop', '1', true); };
    if (image.complete) play(); else image.addEventListener('load', play, { once: true });
  }

  // Tide (festival / ordinary) and language.
  function setTide(tide) {
    body.dataset.tide = tide;
    document.querySelectorAll('[data-tide-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tideChoice === tide)));
  }
  document.querySelectorAll('[data-tide-choice]').forEach((b) => b.addEventListener('click', () => setTide(b.dataset.tideChoice)));

  function setLanguage(language, remember = true) {
    body.dataset.language = language;
    document.querySelectorAll('[data-language-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.languageChoice === language)));
    document.querySelectorAll('[data-en][data-kn]').forEach((el) => {
      el.textContent = language === 'kn' ? el.dataset.kn : el.dataset.en;
      el.lang = language === 'kn' ? 'kn' : 'en';
    });
    if (remember) storage.set('nelli-language', language);
  }
  document.querySelectorAll('[data-language-choice]').forEach((b) => b.addEventListener('click', () => setLanguage(b.dataset.languageChoice)));

  const params = new URLSearchParams(location.search);
  const askedLanguage = params.get('lang');
  const deviceLanguage = (navigator.language || '').toLowerCase().startsWith('kn') ? 'kn' : 'en';
  setLanguage(['en', 'kn'].includes(askedLanguage) ? askedLanguage : storage.get('nelli-language') || deviceLanguage, false);
  if (['festival', 'ordinary'].includes(params.get('tide'))) setTide(params.get('tide'));
  const section = params.get('section');
  if (section) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'instant' }));

  // Reveal: text and pictures come out of the scene, once.
  const once = (selector, className, options) => {
    const elements = document.querySelectorAll(selector);
    if (reduce || !('IntersectionObserver' in window)) { elements.forEach((el) => el.classList.add(className)); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add(className); observer.unobserve(entry.target); }
      });
    }, options);
    elements.forEach((el) => observer.observe(el));
  };
  once('[data-reveal]', 'is-visible', { threshold: 0.2 });
  once('[data-spread]', 'is-visible', { threshold: 0.15 });
  once('.canopy', 'in', { threshold: 0, rootMargin: '0px 0px -12% 0px' });

  // The forest walk: real frames from clip 51, scrubbed by scroll.
  const forest = document.getElementById('forest');
  const canvas = forest.querySelector('canvas');
  const context = canvas.getContext('2d');
  const wide = matchMedia('(min-width: 700px)').matches;
  const folder = wide ? 'walk-wide' : 'walk-tall';
  const frameCount = wide ? 48 : 60;
  const frames = new Array(frameCount);
  let loading = false, scheduled = false, sized = false, lastDrawn = null;
  const ready = (image) => Boolean(image && image.complete && image.naturalWidth);

  const progressOf = (el) => {
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, -rect.top / (rect.height - innerHeight)));
  };
  const cover = (image) => {
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    return [(canvas.width - w) / 2, (canvas.height - h) / 2, w, h];
  };
  function drawForest() {
    scheduled = false;
    const want = Math.min(frameCount - 1, Math.round(progressOf(forest) * (frameCount - 1)));
    // The wanted frame, or the nearest one that has arrived, so the walk moves while frames are still downloading.
    let frame = null;
    for (let d = 0; d < frameCount && !frame; d++) {
      if (ready(frames[want - d])) frame = frames[want - d];
      else if (ready(frames[want + d])) frame = frames[want + d];
    }
    if (!frame || frame === lastDrawn) return;
    lastDrawn = frame;
    context.drawImage(frame, ...cover(frame));
  }
  const requestDraw = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(drawForest); } };
  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * density);
    canvas.height = Math.round(rect.height * density);
    sized = true;
    lastDrawn = null;
    requestDraw();
  }
  if (lean) forest.classList.add('static');
  else {
    const loadForest = () => {
      if (loading) return;
      loading = true;
      // Coarse to fine: every 16th frame first, then every 8th, and so on, so the whole walk is covered early.
      const order = [];
      for (let step = 16; step >= 1; step /= 2) {
        for (let i = 0; i < frameCount; i += step) if (!order.includes(i)) order.push(i);
      }
      // A few at a time: if all download at once they share the connection and none arrives early.
      let next = 0;
      const loadNext = () => {
        if (next >= order.length) return;
        const i = order[next++];
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => { if (!sized) sizeCanvas(); requestDraw(); loadNext(); };
        image.onerror = loadNext;
        image.src = `assets/${folder}/${String(i).padStart(3, '0')}.webp`;
        frames[i] = image;
      };
      for (let k = 0; k < 4; k++) loadNext();
    };
    const forestObserver = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { loadForest(); forestObserver.disconnect(); }
    }, { rootMargin: '400% 0px' });
    forestObserver.observe(forest);
    addEventListener('scroll', requestDraw, { passive: true });
    addEventListener('resize', sizeCanvas);
  }

  // Into the earth: the light recedes as you go in.
  const earth = document.getElementById('earth');
  let earthQueued = false;
  function moveEarth() {
    earthQueued = false;
    const p = progressOf(earth);
    earth.style.setProperty('--earth-dark', String(0.18 + p * 0.7));
    earth.style.setProperty('--earth-scale', String(1 + p * 0.05));
  }
  if (!reduce) addEventListener('scroll', () => { if (!earthQueued) { earthQueued = true; requestAnimationFrame(moveEarth); } }, { passive: true });

  // Antar Ganga: the second drop, triggered by arriving.
  const ganga = document.querySelector('.ganga');
  if (reduce) ganga.classList.add('play');
  else {
    const gangaObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((e) => e.isIntersecting)) { ganga.classList.add('play'); observer.disconnect(); }
    }, { threshold: 0.45 });
    gangaObserver.observe(ganga);
  }

  // Exploration controls and copy button.
  const demo = document.querySelector('.demo-controls');
  const demoToggle = demo.querySelector('.demo-toggle');
  demoToggle.addEventListener('click', () => {
    const open = demo.classList.toggle('open');
    demoToggle.setAttribute('aria-expanded', String(open));
  });
  const copyButton = document.getElementById('copy-account');
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('0122500100786201'); copyButton.textContent = 'Account number copied'; }
    catch { copyButton.textContent = 'Select and copy: 0122500100786201'; }
  });
})();
