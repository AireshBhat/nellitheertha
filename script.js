// Sri Kshetra Nellitheertha: the home page's behaviour.
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
  const params = new URLSearchParams(location.search);

  // The first drop: once per visit, never on reduced motion.
  const hero = document.querySelector('.hero');
  if (!reduce && !storage.get('nelli-pass01-drop', true)) {
    const image = hero.querySelector('img');
    const play = () => { hero.classList.add('play'); storage.set('nelli-pass01-drop', '1', true); };
    if (image.complete) play(); else image.addEventListener('load', play, { once: true });
  }

  // The live panel: before, during and after the Brahmakalasha, always in Indian time.
  // ?now=2026-12-25T09:00 shows the panel as it will be at that moment (Indian time), for checking.
  const IST = 330 * 60000, DAY = 86400000;
  const asked = params.get('now');
  const nowMs = asked && !Number.isNaN(Date.parse(asked + 'Z')) ? Date.parse(asked + 'Z') - IST : Date.now();
  const clock = new Date(nowMs + IST); // read with getUTC*: the wall clock in India
  const today = clock.toISOString().slice(0, 10);
  const minute = clock.getUTCHours() * 60 + clock.getUTCMinutes();
  const daysFrom = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
  const KEY = { date: '2026-12-25' };
  const dataNode = document.getElementById('programme-data');
  const programme = dataNode ? JSON.parse(dataNode.textContent) : { days: [] };
  const days = programme.days;
  const live = (name) => document.querySelector(`[data-live="${name}"]`);
  const put = (name, text) => { const el = live(name); if (el) el.textContent = text; };
  const longDate = (date, weekday) => `${weekday} ${Number(date.slice(8))} December`;
  const clock12 = (m) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return [`${(h % 12) || 12}:${mm}`, h < 12 ? 'AM' : 'PM']; };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  let phase = 'before';
  if (days.length && today > days[days.length - 1].date) phase = 'after';
  else if (days.length && today >= days[0].date) phase = 'during';
  body.dataset.phase = phase;
  body.dataset.tide = phase === 'after' ? 'ordinary' : 'festival';

  // The day strip: days gone, today, and the day of the Brahmakalashabhisheka.
  document.querySelectorAll('.festival-days li').forEach((li) => {
    if (li.dataset.date < today) li.classList.add('past');
    if (li.dataset.date === today) { li.classList.add('today'); li.querySelector('a').setAttribute('aria-current', 'date'); }
  });

  if (phase === 'before' && days.length) {
    const toKey = daysFrom(today, KEY.date), toStart = daysFrom(today, days[0].date);
    put('count', String(toKey));
    put('unit', toKey === 1 ? 'day' : 'days');
    live('count').parentElement.classList.add('ready');
    put('line', toStart === 1 ? 'The programme begins tomorrow, Sunday 20 December.'
      : `The programme begins on Sunday 20 December, in ${plural(toStart, 'day')}.`);
  }

  if (phase === 'during') {
    const index = days.findIndex((d) => d.date === today);
    const day = days[index], items = day.items.filter((it) => it.m !== null);
    // "Morning" items have no clock time: they can be next, never now.
    const at = (it) => (it.m !== null ? it.m : it.t === 'Morning' ? 360 : null);
    const upcoming = (list) => list.filter((it) => at(it) !== null);
    put('eyebrow', `BRAHMAKALASHA 2026 · DAY ${index + 1} OF ${days.length}`);
    put('title', `Today, ${longDate(day.date, day.weekday)}`);
    const current = [...items].reverse().find((it) => it.m <= minute && minute - it.m < 6 * 60);
    let next = upcoming(day.items).find((it) => at(it) > minute), nextDay = day;
    if (!next && days[index + 1]) { nextDay = days[index + 1]; next = upcoming(nextDay.items)[0]; }
    const nowBox = live('now').parentElement;
    if (current) {
      put('now', current.s);
      put('since', `Since ${clock12(current.m).join(' ')}`);
    } else nowBox.hidden = true;
    const nextBox = live('next').parentElement;
    if (next) {
      const timeNode = live('next-time');
      if (next.m === null) { timeNode.textContent = next.t; timeNode.setAttribute('datetime', nextDay.date); }
      else {
        const [time, ampm] = clock12(next.m);
        timeNode.innerHTML = `${time} <small>${ampm}</small>`;
        timeNode.setAttribute('datetime', `${nextDay.date}T${String(Math.floor(next.m / 60)).padStart(2, '0')}:${String(next.m % 60).padStart(2, '0')}:00+05:30`);
      }
      put('next-label', nextDay === day ? 'Next' : `Tomorrow, ${longDate(nextDay.date, nextDay.weekday)}`);
      put('next', next.s);
      put('next-detail', next.d || '');
    } else nextBox.hidden = true;
    const toKey = daysFrom(today, KEY.date);
    put('line', toKey > 1 ? `Brahmakalashabhisheka: Friday 25 December, 10:20 AM, in ${plural(toKey, 'day')}.`
      : toKey === 1 ? 'Brahmakalashabhisheka: tomorrow, Friday 25 December, at 10:20 AM, in Kumbha Lagna.'
      : 'The Varshavadhi Jatre is from 25 to 30 December.');
    live('programme-link').href = `brahmakalasha/#dec-${Number(day.date.slice(8))}`;

    // Today's programme, below the panel.
    put('day-eyebrow', `TODAY · ${longDate(day.date, day.weekday).toUpperCase()}`);
    const list = live('timeline');
    list.replaceChildren(...day.items.map((it) => {
      const li = document.createElement('li');
      if (it.k) li.className = 'featured';
      const t = document.createElement('time'); t.textContent = it.t;
      const p = document.createElement('p'); p.textContent = it.x;
      if (it.d) { const d = document.createElement('small'); d.textContent = it.d; p.append(d); }
      li.append(t, p);
      return li;
    }));
    const poster = live('poster');
    if (day.posters.length) poster.href = `assets/posters/${day.posters[0]}`; else poster.hidden = true;
    live('notes').replaceChildren(...day.notes.map((n) => { const p = document.createElement('p'); p.textContent = n; return p; }));
  }

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

  // Copy the account number.
  const copyButton = document.getElementById('copy-account');
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('0122500100786201'); copyButton.textContent = 'Account number copied'; }
    catch { copyButton.textContent = 'Select and copy: 0122500100786201'; }
  });
})();
