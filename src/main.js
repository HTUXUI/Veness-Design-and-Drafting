(() => {
  const root = document.documentElement;

  /* ---- Scroll reveal: content is visible unless we can animate it ---- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce && items.length) {
    root.classList.add('js');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
    setTimeout(() => items.forEach((el) => el.classList.add('in')), 4000); // failsafe
  }


  /* ---- Home carousel: continuous, looping, centre item enlarged ---- */
  const car = document.querySelector('.carousel');
  if (car) {
    const items = [...car.querySelectorAll('.car-item')];
    const N = items.length;
    const num = document.getElementById('car-n');
    const mq = matchMedia('(min-width: 900px)');
    const GAP = () => Math.min(32, innerWidth * 0.02 + 8);
    const startIdx = Math.max(0, items.findIndex((el) => el.hasAttribute('data-start')));
    let pos = startIdx, tw = null, userPaused = reduce, hoverPause = false, dragPause = false, visible = true;
    const DWELL = 5000; // ms each project stays in place before the next slide
    let nextAt = performance.now() + DWELL;
    // Size follows distance from the centre; the time-based tween supplies the easing, so this stays nearly linear
    const smooth = (x) => { const s = x * x * (3 - 2 * x); return 0.35 * x + 0.65 * s; };
    const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const mod = (n, m) => ((n % m) + m) % m;
    const half = Math.floor(N / 2);
    car.classList.add('car-live');

    let cachedW = car.clientWidth; // read once (and on resize) so animation frames never force a layout
    const dims = () => {
      const cw = cachedW;
      const small = Math.min(cw * 0.4, 300);
      const large = mq.matches ? Math.min(cw * 0.56, 860) : Math.min(cw * 0.82, 860);
      return { cw, small, large, gap: GAP() };
    };

    // Every project sits in one slot k (-half..half) around the moving centre point `pos`.
    // A slot's width grows smoothly as it nears the centre, so the middle item is always the largest.
    const layout = () => {
      const { cw, small, large, gap } = dims();
      const base = Math.floor(pos), t = pos - base;
      const lo = -half, hi = N % 2 ? half : half - 1;
      const w = {}, left = {};
      // Low-resolution photos (data-cap) only enlarge up to a size that stays sharp, and reveal their full
      // uncropped shape (data-nat) rather than being zoomed. Other slots grow to the full featured size.
      const capOf = (k) => Math.min(large, +items[mod(base + k, N)].dataset.cap || large);
      for (let k = lo; k <= hi; k++) { const f = smooth(Math.max(0, 1 - Math.abs(k - t))); w[k] = small + (Math.max(small, capOf(k)) - small) * f; }
      left[0] = 0;
      for (let k = 1; k <= hi; k++) left[k] = left[k - 1] + w[k - 1] + gap;
      for (let k = -1; k >= lo; k--) left[k] = left[k + 1] - w[k] - gap;
      const P = w[0] / 2 + t * (w[0] / 2 + gap + w[1] / 2);
      const origin = cw / 2 - P;
      let nearest = 0, nearF = -1;
      const hs = [];
      for (let k = lo; k <= hi; k++) {
        const idx = mod(base + k, N);
        const el = items[idx];
        const f = smooth(Math.max(0, 1 - Math.abs(k - t)));
        // On phones tall photos are shown a little shorter (a light crop, still no zoom) so the row stays compact
        const nat = Math.min(+el.dataset.nat || 0.667, mq.matches ? 9 : 1.1);
        const h = w[k] * (1.25 - (1.25 - nat) * f);
        hs.push(h);
        el.style.width = w[k] + 'px';
        el.style.transform = 'translate3d(' + (origin + left[k]).toFixed(1) + 'px,0,0)';
        el.style.setProperty('--fh', h.toFixed(1) + 'px');
        el.style.setProperty('--f', f.toFixed(3));
        if (f > nearF) { nearF = f; nearest = idx; }
      }
      if (mq.matches) car.style.height = Math.max(...items.map((el) => Math.min(large, +el.dataset.cap || large) * (+el.dataset.nat || 0.667))) + 130 + 'px';
      else car.style.height = Math.max(...hs) + 124 + 'px'; // phones: follow the tallest visible image (captions are fixed height)
      num.textContent = nearest + 1;
    };

    // One time-based tween drives every move (autoplay, keys, focus, swipe release): fixed duration, no long tail
    const slide = (to, dur, ease) => {
      nextAt = performance.now() + dur + DWELL;
      if (reduce) { pos = to; tw = null; layout(); return; }
      tw = { from: pos, to, start: performance.now(), dur, ease };
    };
    const goTo = (t) => slide(t, 850, easeInOut);
    const cur = () => Math.round(tw ? tw.to : pos);
    const shortest = (i) => { const c = Math.round(pos); return c + mod(i - c + half, N) - half; };
    let wasMoving = true;
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!visible || document.hidden || dragPause) return;
      if (tw) {
        const p = Math.min(1, (now - tw.start) / tw.dur);
        pos = tw.from + (tw.to - tw.from) * tw.ease(p);
        if (p >= 1) { pos = tw.to; tw = null; nextAt = now + DWELL; }
      } else if (userPaused || hoverPause) { nextAt = Math.max(nextAt, now + 1500); if (!wasMoving) return; }
      else if (now >= nextAt) slide(Math.round(pos) + 1, 1200, easeInOut);
      wasMoving = !!tw;
      layout();
    };
    car.addEventListener('keydown', (e) => {
      if (e.target !== car) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur() - 1); }
    });
    car.addEventListener('focusin', (e) => { hoverPause = true; const it = e.target.closest('.car-item'); if (it) goTo(shortest(items.indexOf(it))); });
    car.addEventListener('focusout', () => { hoverPause = car.matches(':hover'); });
    car.addEventListener('mouseenter', () => { hoverPause = true; });
    car.addEventListener('mouseleave', () => { hoverPause = car.contains(document.activeElement); });

    // Drag or swipe with momentum, then glide to the nearest project. Vertical swipes still scroll the page.
    let down = false, sx = 0, sy = 0, sp = 0, moved = false, lx = 0, lt = 0, vx = 0, axis = null;
    car.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; down = true; moved = false; axis = null; sx = lx = e.clientX; sy = e.clientY; sp = pos; lt = e.timeStamp; vx = 0; tw = null; });
    car.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y') { down = false; return; }
      if (axis === 'x') {
        if (!moved) { moved = true; dragPause = true; car.classList.add('dragging'); try { car.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } }
        const { small, gap } = dims(); pos = sp - dx / (small + gap);
        const dt = Math.max(1, e.timeStamp - lt); vx = (e.clientX - lx) / dt; lx = e.clientX; lt = e.timeStamp;
        layout();
      }
    });
    const end = () => {
      if (!down && !moved) return;
      down = false;
      if (moved) { dragPause = false; car.classList.remove('dragging'); const { small, gap } = dims(); slide(Math.round(pos - Math.max(-1, Math.min(1, (vx * 250) / (small + gap)))), 700, easeOut); setTimeout(() => { moved = false; }, 0); }
    };
    car.addEventListener('pointerup', end); car.addEventListener('pointercancel', end);
    car.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    car.addEventListener('dragstart', (e) => e.preventDefault());

    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(car);
    addEventListener('resize', () => { cachedW = car.clientWidth; layout(); });
    layout(); requestAnimationFrame(tick);
  }

  /* ---- Home testimonials: cycle through every story; pause on hover/focus or with the button ---- */
  const testi = document.querySelector('[data-testimonials]');
  if (testi) {
    const panels = [...testi.querySelectorAll('.testi-item')];
    const tabs = [...testi.querySelectorAll('.testi-tab')];
    const DUR = 9000;
    let cur = 0, timer = null, hover = false; // cycles on page load, even for reduced-motion visitors (they get instant swaps, no fades)
    testi.classList.add('js-testi');
    testi.style.setProperty('--testi-dur', DUR + 'ms');
    const show = (i, focus) => {
      cur = (i + panels.length) % panels.length;
      panels.forEach((p, k) => { p.classList.toggle('on', k === cur); p.toggleAttribute('inert', k !== cur); });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === cur)); t.tabIndex = k === cur ? 0 : -1; });
      if (focus) tabs[cur].focus();
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (!hover) timer = setTimeout(() => show(cur + 1), DUR); testi.classList.toggle('paused', hover); };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); } });
    });
    testi.addEventListener('mouseenter', () => { hover = true; schedule(); });
    testi.addEventListener('mouseleave', () => { hover = testi.contains(document.activeElement); schedule(); });
    testi.addEventListener('focusin', () => { hover = true; schedule(); });
    testi.addEventListener('focusout', () => { hover = testi.matches(':hover'); schedule(); });
    show(0);
  }

  /* ---- Mobile menu: accessible modal ---- */
  const btn = document.getElementById('menu-btn');
  const drawer = document.getElementById('drawer');
  if (btn && drawer) {
    const closeBtn = drawer.querySelector('[data-close]');
    const outside = [document.getElementById('main'), document.querySelector('.site-footer'), document.querySelector('.site-header')].filter(Boolean);
    const focusables = () => [...drawer.querySelectorAll('a[href], button:not([disabled])')];
    const open = () => {
      drawer.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      outside.forEach((el) => el.setAttribute('inert', ''));
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };
    const close = (restore = true) => {
      drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      outside.forEach((el) => el.removeAttribute('inert'));
      document.body.style.overflow = '';
      if (restore) btn.focus();
    };
    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close(false)));
    matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches && drawer.classList.contains('open')) close(false); });
  }

  /* ---- Enquiry form ---- */
  document.querySelectorAll('form[data-enquiry]').forEach(initForm);

  function initForm(form) {
    const endpoint = form.getAttribute('data-endpoint') || window.VENESS_ENQUIRY_ENDPOINT || '';
    const summary = form.querySelector('.summary');
    const okBox = form.querySelector('.status-box.ok');
    const failBox = form.querySelector('.status-box.fail');
    const submit = form.querySelector('button[type="submit"]');
    const label = submit.querySelector('.lbl');
    const phone = form.elements.phone;
    let sending = false;

    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const phoneOk = (v) => /^\+?[0-9 ()\-]{8,20}$/.test(v.trim());
    const contactPref = () => (form.querySelector('input[name="contact"]:checked') || {}).value;

    const rules = {
      name: (v) => (v.trim() ? '' : 'Enter your name.'),
      email: (v) => (!v.trim() ? 'Enter your email address.' : emailOk(v.trim()) ? '' : 'Enter an email address like name@example.com.'),
      phone: (v) => (v.trim() ? (phoneOk(v) ? '' : 'Enter a phone number using digits and spaces, for example 0403 082 845.') : (contactPref() === 'Phone' ? 'Enter a phone number, or choose Email as your preferred contact.' : '')),
      suburb: (v) => (v.trim() ? '' : 'Enter the suburb of the property.'),
      type: (v) => (v ? '' : 'Choose a project type. “Not sure yet” is fine.'),
      message: (v) => (v.trim() ? '' : 'Tell Chris a little about your project.'),
    };

    const setErr = (name, msg) => {
      const el = form.elements[name]; const field = el.closest('.field'); const err = field.querySelector('.err');
      field.classList.toggle('invalid', !!msg);
      if (msg) { err.textContent = msg; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', err.id + (el.dataset.hint ? ' ' + el.dataset.hint : '')); }
      else { el.removeAttribute('aria-invalid'); el.setAttribute('aria-describedby', el.dataset.hint || ''); if (!el.dataset.hint) el.removeAttribute('aria-describedby'); }
      return msg;
    };

    Object.keys(rules).forEach((n) => {
      const el = form.elements[n];
      el.addEventListener('blur', () => { if (el.value || el.closest('.field').classList.contains('invalid')) setErr(n, rules[n](el.value)); });
      el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) setErr(n, rules[n](el.value)); });
    });
    form.querySelectorAll('input[name="contact"]').forEach((r) => r.addEventListener('change', () => { if (phone.closest('.field').classList.contains('invalid') || contactPref() === 'Phone') setErr('phone', rules.phone(phone.value)); }));

    const setBusy = (b) => {
      sending = b; submit.setAttribute('aria-busy', String(b)); submit.setAttribute('aria-disabled', String(b));
      label.textContent = b ? 'Sending your enquiry…' : 'Send project enquiry';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      okBox.classList.remove('show'); failBox.classList.remove('show');
      const errors = Object.keys(rules).map((n) => [n, setErr(n, rules[n](form.elements[n].value))]).filter(([, m]) => m);
      if (errors.length) {
        summary.innerHTML = '<h3 id="' + form.id + '-sh">Please fix ' + (errors.length === 1 ? '1 problem' : errors.length + ' problems') + ' before sending</h3><ul>' +
          errors.map(([n, m]) => '<li><a href="#' + form.elements[n].id + '">' + m + '</a></li>').join('') + '</ul>';
        summary.classList.add('show'); summary.setAttribute('tabindex', '-1'); summary.focus();
        summary.querySelectorAll('a').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); form.querySelector(a.getAttribute('href')).focus(); }));
        return;
      }
      summary.classList.remove('show');
      if (form.elements.company.value) return; // honeypot: silently drop bots

      setBusy(true);
      try {
        if (!endpoint) throw new Error('No enquiry endpoint configured');
        const data = Object.fromEntries(new FormData(form).entries());
        delete data.company;
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Server responded ' + res.status);
        form.reset();
        okBox.classList.add('show'); okBox.setAttribute('tabindex', '-1'); okBox.focus();
      } catch (err) {
        // Only ever report success after the server accepted the enquiry. Message and fields are kept for retry.
        failBox.classList.add('show'); failBox.setAttribute('tabindex', '-1'); failBox.focus();
      } finally { setBusy(false); }
    });
  }
})();
