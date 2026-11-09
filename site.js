// Sri Kshetra Nellitheertha: shared by every page. The language switch and the way back to the top.
(() => {
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };

  // Language. Text with a Kannada version (data-kn) switches.
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
  const asked = new URLSearchParams(location.search).get('lang');
  const device = (navigator.language || '').toLowerCase().startsWith('kn') ? 'kn' : 'en';
  setLanguage(['en', 'kn'].includes(asked) ? asked : storage.get('nelli-language') || device, false);

  // Back to the top: appears after a screen of scrolling, nudges upward three times when it appears
  // and again at the end of the page, then rests (moving things should stop within five seconds).
  const up = document.querySelector('.to-top');
  if (!up) return;
  let shown = false, atEnd = false, queued = false;
  const nudge = () => {
    if (reduce) return;
    up.classList.remove('nudge');
    void up.offsetWidth; // restart the animation
    up.classList.add('nudge');
  };
  up.addEventListener('animationend', () => up.classList.remove('nudge'));
  function update() {
    queued = false;
    const show = scrollY > innerHeight * 1.1;
    if (show !== shown) { shown = show; up.classList.toggle('show', show); if (show) nudge(); }
    const end = scrollY + innerHeight > document.documentElement.scrollHeight - 160;
    if (end && !atEnd && shown) nudge();
    atEnd = end;
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
