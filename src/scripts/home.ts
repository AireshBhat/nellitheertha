// Sri Kshetra Nellitheertha: the home page's behaviour.
import 'number-flow';
import { continuous } from 'number-flow/plugins';
import { KN, clockKn, dateKn, timeKn } from '../lib/kn-words';

// English and Kannada side by side; the language switch shows one (styles: .en-only, .kn-only).
function both(el, en, kn) {
  if (!kn) { el.textContent = en; return; }
  const e = document.createElement('span'); e.className = 'en-only'; e.textContent = en;
  const k = document.createElement('span'); k.className = 'kn-only'; k.lang = 'kn'; k.textContent = kn;
  el.replaceChildren(e, k);
}

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

  // The living light behind the deities: by day gold, after sunset in India (6:30 PM to 6 AM) the deeper light of
  // evening aarti. ?now= sets the time, as for the live panel. Never with reduced motion, Save-Data or a slow link.
  try {
    const IST = 330 * 60000, asked = params.get('now');
    const nowMs = asked && !Number.isNaN(Date.parse(asked + 'Z')) ? Date.parse(asked + 'Z') - IST : Date.now();
    const clock = new Date(nowMs + IST), minute = clock.getUTCHours() * 60 + clock.getUTCMinutes();
    const evening = minute >= 18 * 60 + 30 || minute < 6 * 60;
    hero.dataset.light = evening ? 'evening' : 'day';
    const layer = hero.querySelector('.hero-light'), canvas = layer?.querySelector('canvas'), photo = hero.querySelector('.hero-photo img');
    if (layer && canvas && !lean) {
      // The light comes from behind the golden arch: its place in each picture, in the file's pixels.
      const SOURCE = { 'deities-tall.webp': [526, 627], 'deities-wide.webp': [896, 256] };
      const rays = () => {
        const g = canvas.getContext('2d'), s = canvas.width, c = s / 2;
        const [r, gr, bl] = evening ? [255, 182, 104] : [255, 216, 150];
        g.clearRect(0, 0, s, s);
        // The light fades out well before the canvas edge, so it gathers round the arch and never reaches the name.
        const fade = (a0, a1) => { const f = g.createRadialGradient(c, c, 0, c, c, c); f.addColorStop(0, `rgba(${r},${gr},${bl},${a0})`); f.addColorStop(0.18, `rgba(${r},${gr},${bl},${a1})`); f.addColorStop(0.62, `rgba(${r},${gr},${bl},0)`); return f; };
        if ('filter' in g) g.filter = 'blur(2px)';
        // Fixed, uneven rays, so the turning is felt rather than seen.
        let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (const [count, reach, alpha, wide] of [[28, 1, 0.3, 2.2], [40, 0.6, 0.2, 1.4]]) {
          g.fillStyle = fade(alpha, alpha * 0.55);
          g.beginPath();
          for (let i = 0; i < count; i++) {
            const at = (i + rnd() * 0.6) / count * Math.PI * 2, half = (0.4 + rnd() * 0.6) * wide * Math.PI / 180, len = c * reach * (0.7 + rnd() * 0.3);
            g.moveTo(c, c); g.lineTo(c + Math.cos(at - half) * len, c + Math.sin(at - half) * len); g.lineTo(c + Math.cos(at + half) * len, c + Math.sin(at + half) * len); g.closePath();
          }
          g.fill();
        }
        g.fillStyle = fade(0.42, 0.12); g.fillRect(0, 0, s, s); // the glow at the source
      };
      const place = () => {
        // Where the picture's light source falls inside the light's own box, whether the picture covers its box
        // (phones) or is placed at its own size (desktops).
        const box = layer.getBoundingClientRect(), r = photo.getBoundingClientRect(), source = SOURCE[photo.currentSrc.split('/').pop()];
        if (!source || !photo.naturalWidth || !box.width) return;
        const k = Math.max(r.width / photo.naturalWidth, r.height / photo.naturalHeight);
        const [px, py] = getComputedStyle(photo).objectPosition.split(' ').map(parseFloat);
        layer.style.setProperty('--lx', `${r.left - box.left + (r.width - photo.naturalWidth * k) * px / 100 + source[0] * k}px`);
        layer.style.setProperty('--ly', `${r.top - box.top + (r.height - photo.naturalHeight * k) * py / 100 + source[1] * k}px`);
        layer.style.setProperty('--lr', `${1.6 * Math.max(box.width, box.height)}px`);
      };
      const start = () => {
        rays(); place();
        hero.classList.add('alive');
        new ResizeObserver(place).observe(layer);
        photo.addEventListener('load', place);
        // Off screen, the light rests.
        new IntersectionObserver(([entry]) => hero.classList.toggle('rest', !entry.isIntersecting)).observe(hero);
      };
      if (photo.complete && photo.naturalWidth) start(); else photo.addEventListener('load', start, { once: true });
    }
  } catch (error) { console.error(error); }

  // Text first: the reveal and the Antar Ganga drop un-hide words, so they run before anything that could fail.
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

  // Antar Ganga: the second drop, triggered by arriving.
  const ganga = document.querySelector('.ganga');
  if (reduce) ganga.classList.add('play');
  else {
    const gangaObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((e) => e.isIntersecting)) { ganga.classList.add('play'); observer.disconnect(); }
    }, { threshold: 0.45 });
    gangaObserver.observe(ganga);
  }

  // Mark the page ready. If this script never runs (a dropped connection), the inline script in the
  // layout sees no mark when the page has loaded and shows everything without the fades.
  document.documentElement.classList.add('home-ready');

  const progressOf = (el) => {
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, -rect.top / (rect.height - innerHeight)));
  };

  // The live panel and the walk depend on data and the network: an error in one must not stop the rest.
  try {
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
    const put = (name, text, kn = null) => { const el = live(name); if (el) both(el, text, kn); };
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
      put('unit', toKey === 1 ? 'day' : 'days', toKey === 1 ? KN.day : KN.days);
      // The number rolls down to the days left, once, when it comes into view (NumberFlow).
      // The rolling digits are only for the eye: screen readers read the plain number beside them.
      const flow = document.createElement('number-flow');
      flow.className = 'count-flow';
      flow.setAttribute('aria-hidden', 'true');
      Object.assign(flow, { locales: 'en-IN', trend: -1, plugins: [continuous], spinTiming: { duration: 1600, easing: 'cubic-bezier(.16,1,.3,1)' } });
      live('count').before(flow);
      if (reduce) flow.update(toKey);
      else {
        flow.update(10 ** String(toKey).length - 1); // from 99 (or 9) down to the days left
        const seen = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          seen.disconnect();
          flow.update(toKey);
        }, { threshold: 0.6 });
        seen.observe(flow);
      }
      live('count').parentElement.classList.add('ready');
      put('line', toStart === 1 ? 'The programme begins tomorrow, Sunday 20 December.'
        : `The programme begins on Sunday 20 December, in ${plural(toStart, 'day')}.`,
        toStart === 1 ? KN.beginsTomorrow : KN.beginsIn(toStart));
    }

    if (phase === 'during') {
      const index = days.findIndex((d) => d.date === today);
    if (index < 0) throw new Error(`programme: no entry for ${today}`);
      const day = days[index], items = day.items.filter((it) => it.m !== null);
      // "Morning" items have no clock time: they can be next, never now.
      const at = (it) => (it.m !== null ? it.m : it.t === 'Morning' ? 360 : null);
      const upcoming = (list) => list.filter((it) => at(it) !== null);
      put('eyebrow', `BRAHMAKALASHA 2026 · DAY ${index + 1} OF ${days.length}`, KN.dayOf(index + 1, days.length));
      put('title', `Today, ${longDate(day.date, day.weekday)}`, KN.today(dateKn(day.date, day.weekday)));
      const current = [...items].reverse().find((it) => it.m <= minute && minute - it.m < 6 * 60);
      let next = upcoming(day.items).find((it) => at(it) > minute), nextDay = day;
      if (!next && days[index + 1]) { nextDay = days[index + 1]; next = upcoming(nextDay.items)[0]; }
      const nowBox = live('now').parentElement;
      if (current) {
        put('now', current.s, current.sk);
        put('since', `Since ${clock12(current.m).join(' ')}`, KN.since(clockKn(current.m).join(' ')));
      } else nowBox.hidden = true;
      const nextBox = live('next').parentElement;
      if (next) {
        const timeNode = live('next-time');
        if (next.m === null) { both(timeNode, next.t, timeKn(null, next.t)); timeNode.setAttribute('datetime', nextDay.date); }
        else {
          // English "10:20 AM", Kannada "ಬೆಳಗ್ಗೆ 10:20": the clock large, the part of the day small.
          const [time, ampm] = clock12(next.m), [part, clockK] = clockKn(next.m);
          timeNode.innerHTML = `<span class="en-only">${time} <small>${ampm}</small></span><span class="kn-only" lang="kn"><small>${part}</small> ${clockK}</span>`;
          timeNode.setAttribute('datetime', `${nextDay.date}T${String(Math.floor(next.m / 60)).padStart(2, '0')}:${String(next.m % 60).padStart(2, '0')}:00+05:30`);
        }
        put('next-label', nextDay === day ? 'Next' : `Tomorrow, ${longDate(nextDay.date, nextDay.weekday)}`,
          nextDay === day ? KN.next : KN.tomorrow(dateKn(nextDay.date, nextDay.weekday)));
        put('next', next.s, next.sk);
        put('next-detail', next.d || '', next.d ? next.dk : null);
      } else nextBox.hidden = true;
      const toKey = daysFrom(today, KEY.date);
      put('line', toKey > 1 ? `Brahmakalashabhisheka: Friday 25 December, 10:20 AM, in ${plural(toKey, 'day')}.`
        : toKey === 1 ? 'Brahmakalashabhisheka: tomorrow, Friday 25 December, at 10:20 AM, in Kumbha Lagna.'
        : 'The Varshavadhi Jatre is from 25 to 30 December.',
        toKey > 1 ? KN.keyIn(toKey) : toKey === 1 ? KN.keyTomorrow : KN.jatre);
      live('programme-link').href = `brahmakalasha/#dec-${Number(day.date.slice(8))}`;

      // Today's programme, below the panel.
      put('day-eyebrow', `TODAY · ${longDate(day.date, day.weekday).toUpperCase()}`, KN.todayEyebrow(dateKn(day.date, day.weekday)));
      const list = live('timeline');
      list.replaceChildren(...day.items.map((it) => {
        const li = document.createElement('li');
        if (it.k) li.className = 'featured';
        const t = document.createElement('time'); both(t, it.t, timeKn(it.m, it.t));
        const p = document.createElement('p');
        const x = document.createElement('span'); both(x, it.x, it.xk); p.append(x);
        if (it.d) { const d = document.createElement('small'); both(d, it.d, it.dk); p.append(d); }
        li.append(t, p);
        return li;
      }));
      const poster = live('poster');
      if (day.posters.length) poster.href = `/assets/posters/${day.posters[0]}`; else poster.hidden = true;
      // The day's notes: in Kannada, the patrike's own lines (they split and join differently from the English).
      const note = (text, kn) => {
        const p = document.createElement('p'); p.textContent = text;
        if (day.nk?.length) { p.className = kn ? 'kn-only' : 'en-only'; if (kn) p.lang = 'kn'; }
        return p;
      };
      live('notes').replaceChildren(...day.notes.map((n) => note(n, false)), ...(day.nk ?? []).map((n) => note(n, true)));
    }

    const section = params.get('section');
    if (section) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'instant' }));

  } catch (error) { console.error(error); }

  try {
    // The forest walk: real frames from clip 51, scrubbed by scroll.
    const forest = document.getElementById('forest');
    const stage = forest.querySelector('.forest-stage');
    const canvas = forest.querySelector('canvas');
    const context = canvas.getContext('2d');
    // How far through the walk: the stage stays pinned for the section's height less its own. Both are in svh, so
    // a phone's address bar sliding away (which changes innerHeight) neither moves the walk nor ends it early.
    const walked = () => Math.min(1, Math.max(0, -forest.getBoundingClientRect().top / (forest.offsetHeight - stage.offsetHeight)));
    const wide = matchMedia('(min-width: 700px)').matches;
    // The approved frames, unchanged: 60 for phones, 48 for wide screens. A new cut must be approved after a side-by-side look, and needs a new folder,
    // because phones keep cached frames under an old address for weeks.
    const folder = wide ? 'walk-wide' : 'walk-tall';
    const frameCount = wide ? 48 : 60;
    let loading = false, scheduled = false, sized = false, lastDrawn = null, onStage = false, at = 0;
    // Each frame's file once it has arrived, and the decoded pictures of the frames near where the walk is. Drawing a
    // picture that is not decoded yet decodes it there and then, on the main thread: on a phone that stalled the scroll
    // for two or three screen refreshes at every new frame. So the frames within NEAR of the walk are decoded ahead,
    // away from the main thread, and the rest are let go and decoded again when the walk comes back to them: a phone
    // holds about 20 decoded pictures (60 MB) rather than all 60 (175 MB), and none once the walk is off screen.
    const NEAR = 8, BUSY = 'busy';
    const files = new Array(frameCount), pictures = new Array(frameCount);
    // A file is decoded away from the main thread. Frame 000 is the still picture under the walk, already downloaded: a
    // picture is decoded partly on the main thread, so frame 000 is decoded once and kept. Without createImageBitmap
    // (Safari before 15), decode() is the nearest thing, and the frame is drawn itself.
    const still = forest.querySelector('.forest-still');
    const toPicture = (file) => {
      if ('createImageBitmap' in window) return createImageBitmap(file);
      if (!(file instanceof Blob)) return file.decode().then(() => file);
      const image = new Image(); image.src = URL.createObjectURL(file);
      return image.decode().then(() => image);
    };
    const release = (i) => { const picture = pictures[i]; pictures[i] = undefined; if (picture.close) picture.close(); else if (picture !== still) URL.revokeObjectURL(picture.src); };
    const drawable = (i) => (pictures[i] && pictures[i] !== BUSY ? pictures[i] : null);
    // The nearest frame to the walk that has a picture, or a file but no picture yet; null if there is none.
    const nearest = (has) => { for (let d = 0; d < frameCount; d++) for (const i of [at - d, at + d]) if (i >= 0 && i < frameCount && has(i)) return d; return null; };
    let decoding = 0;
    function decodeAhead() {
      // Let go of pictures far from the walk, keeping the nearest one there is so the walk always has something to show.
      const keep = onStage ? Math.max(NEAR + 2, nearest(drawable) ?? 0) : -1;
      for (let i = 0; i < frameCount; i++) if (drawable(i) && Math.abs(i - at) > keep && files[i] !== still) release(i);
      while (onStage && decoding < 3) {
        // The nearest frame with no picture: within NEAR, or further while nothing nearer is shown (frames still arriving).
        const d = nearest((i) => files[i] && !pictures[i]);
        if (d === null || (d > NEAR && (nearest((i) => pictures[i]) ?? Infinity) <= d)) return;
        const i = files[at - d] && !pictures[at - d] ? at - d : at + d;
        pictures[i] = BUSY; decoding++;
        toPicture(files[i]).then((picture) => {
          pictures[i] = picture;
          if (files[i] !== still && (!onStage || Math.abs(i - at) > NEAR + 2 && nearest(drawable) < Math.abs(i - at))) release(i); else requestDraw();
        }, () => { pictures[i] = undefined; files[i] = undefined; })
          .finally(() => { decoding--; decodeAhead(); });
      }
    }

    const cover = (picture) => {
      const pw = picture.naturalWidth || picture.width, ph = picture.naturalHeight || picture.height;
      const scale = Math.max(canvas.width / pw, canvas.height / ph);
      const w = pw * scale, h = ph * scale;
      return [(canvas.width - w) / 2, (canvas.height - h) / 2, w, h];
    };
    function drawForest() {
      scheduled = false;
      const want = Math.min(frameCount - 1, Math.round(walked() * (frameCount - 1)));
      if (want !== at) { at = want; decodeAhead(); }
      // The wanted frame, or the nearest one that is ready, so the walk moves while frames are still arriving.
      let picture = null;
      for (let d = 0; d < frameCount && !picture; d++) picture = drawable(want - d) || drawable(want + d);
      if (!picture || picture === lastDrawn) return;
      lastDrawn = picture;
      context.drawImage(picture, ...cover(picture));
    }
    const requestDraw = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(drawForest); } };
    function sizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * density), height = Math.round(rect.height * density);
      // Setting a canvas's size wipes it, even to the same size, and phones send a resize whenever the address bar
      // slides; the stage is 100svh, so that changes nothing here and the picture is left alone.
      if (sized && width === canvas.width && height === canvas.height) return;
      canvas.width = width;
      canvas.height = height;
      sized = true;
      lastDrawn = null;
      requestDraw();
    }
    if (lean) forest.classList.add('static');
    else {
      const loadForest = () => {
        if (loading) return;
        loading = true;
        const arrived = (i, file) => { files[i] = file; if (!sized) sizeCanvas(); decodeAhead(); };
        const fetchFrame = (i) => fetch(`/assets/${folder}/${String(i).padStart(3, '0')}.webp`, { priority: 'low' })
          .then((response) => (response.ok ? response.blob() : Promise.reject(response.status)))
          .then((file) => arrived(i, file), () => {});
        // Frame 000 is the still (the same screen width picks its file and the walk's folder). If it is not here yet it
        // is asked for now, in the first four with frames 16, 32 and 48, and once it is here its place goes to the next.
        const take = () => { if (still.naturalWidth && still.currentSrc.endsWith(`/${folder}/000.webp`)) arrived(0, still); else fetchFrame(0); };
        const stillHere = still.complete && still.currentSrc;
        if (stillHere) take();
        else {
          const done = () => { take(); loadNext(); };
          still.addEventListener('load', done, { once: true });
          still.addEventListener('error', done, { once: true });
          still.loading = 'eager';
        }
        // Coarse to fine: every 16th frame first, then every 8th, and so on, so the whole walk is covered early.
        const order = [];
        for (let step = 16; step >= 1; step /= 2) {
          for (let i = step; i < frameCount; i += step) if (!order.includes(i)) order.push(i);
        }
        // A few at a time: if all download at once they share the connection and none arrives early.
        let next = 0;
        const loadNext = () => { if (next < order.length) fetchFrame(order[next++]).finally(loadNext); };
        for (let k = stillHere ? 0 : 1; k < 4; k++) loadNext();
      };
      // Pictures are decoded only while the walk is on screen or nearly.
      new IntersectionObserver(([entry]) => { onStage = entry.isIntersecting; decodeAhead(); }, { rootMargin: '50% 0px' }).observe(forest);
      // Frames start downloading when the visitor scrolls towards the walk, or when it is within a screen: nothing
      // is spent on visitors who only read the top, or who arrive further down the page.
      const forestObserver = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { loadForest(); forestObserver.disconnect(); }
      }, { rootMargin: '100% 0px' });
      forestObserver.observe(forest);
      // Scrolling towards the walk starts it early; landing lower down (at #contribute, say) does not.
      const towards = () => {
        const r = forest.getBoundingClientRect();
        if (r.top < innerHeight * 2.5 && r.bottom > -innerHeight) { removeEventListener('scroll', towards); loadForest(); }
      };
      addEventListener('scroll', towards, { passive: true });
      addEventListener('scroll', requestDraw, { passive: true });
      addEventListener('resize', sizeCanvas);
    }

  } catch (error) { console.error(error); }

  // The forest's words dissolve as they rise into the header, which is clear over the forest (styles: .forest-copy).
  const header = document.querySelector('.site-header');
  const forestWords = [...document.querySelectorAll('.forest-copy')];
  let wordsQueued = false;
  function dissolveWords() {
    wordsQueued = false;
    const edge = header.getBoundingClientRect().bottom;
    for (const words of forestWords) {
      const r = words.getBoundingClientRect();
      const under = r.top < edge + 48 && r.bottom > 0 ? `${Math.round(edge - r.top)}px` : '';
      if (words.style.getPropertyValue('--under') !== under) words.style.setProperty('--under', under);
    }
  }
  addEventListener('scroll', () => { if (!wordsQueued) { wordsQueued = true; requestAnimationFrame(dissolveWords); } }, { passive: true });
  dissolveWords();

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

  // Copy the account number.
  const copyButton = document.getElementById('copy-account');
  copyButton.addEventListener('click', async () => {
    const label = copyButton.querySelector('.label') || copyButton;
    try { await navigator.clipboard.writeText('0122500100786201'); both(label, 'Account number copied', KN.copied); copyButton.classList.add('copied'); }
    catch { both(label, 'Select and copy: 0122500100786201', KN.selectAndCopy('0122500100786201')); }
  });
})();
