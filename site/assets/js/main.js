/* =========================================================
   DAVID HUBSCHWERLIN — interactions & motion
   Dependencies (optional, progressive): GSAP + ScrollTrigger, Lenis
   ========================================================= */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const store = {
    get(k){ try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v){ try { sessionStorage.setItem(k, v); } catch {} }
  };

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target, offset = -72) => {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href*="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      const hash = href.slice(href.indexOf('#'));
      const path = href.slice(0, href.indexOf('#'));
      const samePage = !path || location.pathname.endsWith(path);
      if (!samePage || hash.length < 2) return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      lenis && lenis.start();
      scrollTo(el);
    });
  });

  /* ---------- SVG stroke drawing ---------- */
  const prepDraw = (svg) => {
    const els = $$('path, line, polyline, polygon, circle, rect, ellipse', svg).filter((el) => {
      const cs = getComputedStyle(el);
      return cs.stroke && cs.stroke !== 'none' && !el.hasAttribute('data-nodraw');
    });
    els.forEach((el) => {
      let len = 0;
      try { len = el.getTotalLength(); } catch { len = 0; }
      if (!len) return;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      el.dataset.len = len;
    });
    return els.filter((el) => el.dataset.len);
  };
  const playDraw = (svg, opts = {}) => {
    const els = svg._drawEls || (svg._drawEls = prepDraw(svg));
    const { dur = 1.6, stagger = 0.04, delay = 0 } = opts;
    if (reduce) { els.forEach((el) => (el.style.strokeDashoffset = 0)); return; }
    if (hasGSAP) {
      gsap.killTweensOf(els);
      gsap.set(els, { strokeDashoffset: (i, el) => el.dataset.len });
      gsap.to(els, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut', stagger, delay, overwrite: true });
    } else {
      els.forEach((el, i) => {
        el.style.transition = 'none';
        el.style.strokeDashoffset = el.dataset.len;
        requestAnimationFrame(() => {
          el.style.transition = `stroke-dashoffset ${dur}s cubic-bezier(.65,0,.35,1) ${delay + i * stagger}s`;
          el.style.strokeDashoffset = 0;
        });
      });
    }
  };
  $$('svg[data-draw]').forEach((svg) => prepDraw(svg));

  /* ---------- Preloader & hero intro ---------- */
  const heroIntro = () => {
    const title = $('[data-split]');
    if (title && !title.dataset.splitDone) {
      title.dataset.splitDone = '1';
    }
    const spans = title ? $$('.w > span', title) : [];
    if (hasGSAP && !reduce) {
      gsap.to(spans, { y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07, delay: 0.1 });
    } else {
      spans.forEach((s) => (s.style.transform = 'none'));
    }
    $$('.hero [data-reveal]').forEach((el, i) => {
      setTimeout(() => el.classList.add('is-revealed'), 350 + i * 140);
    });
    const art = $('.hero svg[data-draw]');
    if (art) playDraw(art, { dur: 1.8, stagger: 0.035, delay: 0.25 });
  };

  // split hero title words
  const splitTitle = $('[data-split]');
  if (splitTitle) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(splitTitle);
  }

  const loader = $('[data-loader]');
  const runLoader = () => {
    if (!loader) { heroIntro(); return; }
    const seen = store.get('dh-seen');
    if (seen || reduce) {
      loader.remove();
      heroIntro();
      return;
    }
    store.set('dh-seen', '1');
    document.documentElement.style.overflow = 'hidden';
    const mark = $('svg', loader);
    const text = $('.loader__text', loader);
    const bar = $('.loader__bar i', loader);
    if (mark) playDraw(mark, { dur: 1.1, stagger: 0.08 });
    const finish = () => {
      loader.classList.add('is-done');
      if (hasGSAP) {
        gsap.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut', onComplete: () => loader.remove() });
      } else {
        loader.style.transition = 'clip-path 1.1s cubic-bezier(.65,0,.35,1)';
        loader.style.clipPath = 'inset(0 0 100% 0)';
        setTimeout(() => loader.remove(), 1200);
      }
      document.documentElement.style.overflow = '';
      setTimeout(heroIntro, 250);
    };
    if (hasGSAP) {
      const tl = gsap.timeline({ onComplete: finish });
      tl.to(text, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 0.3)
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.2)
        .to({}, { duration: 0.15 });
    } else {
      if (text) text.style.opacity = 1;
      if (bar) { bar.style.transition = 'transform 1.3s'; bar.style.transform = 'scaleX(1)'; }
      setTimeout(finish, 1500);
    }
  };
  if (document.readyState === 'complete') runLoader();
  else window.addEventListener('load', runLoader);

  /* ---------- Navigation ---------- */
  const nav = $('[data-nav]');
  const themed = $$('[data-theme]');
  let lastY = window.scrollY, ticking = false;
  const updateNav = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      if (y > 400 && y > lastY + 6 && !document.body.classList.contains('menu-open')) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 200) nav.classList.remove('is-hidden');
      // theme under nav
      const probe = 44;
      let theme = 'dark';
      for (const s of themed) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { theme = s.dataset.theme; break; }
      }
      nav.classList.toggle('is-dark', theme === 'dark');
      nav.classList.toggle('is-light', theme === 'light');
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateNav); ticking = true; } }, { passive: true });
  updateNav();

  // active link
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__links a, .menu__links a').forEach((a) => {
    const href = a.getAttribute('href').split('#')[0];
    if (href === here) a.classList.add('is-active');
  });

  // mobile menu
  const toggle = $('[data-menu-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open);
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open) nav.classList.remove('is-hidden');
    });
    $$('.menu a').forEach((a) => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      lenis && lenis.start();
    }));
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $('[data-cursor-el]');
  if (cursor && finePointer && !reduce) {
    const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__ring span', cursor);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const tick = () => {
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverSel = 'a, button, label, .acc__btn, .hlist__item, .risk__row, .seg, [data-hover]';
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest(hoverSel);
      cursor.classList.toggle('is-hover', !!t);
      const v = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-view', !!v);
      if (v && label) label.textContent = v.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-hover', 'is-view'));
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('.btn, .pole__link i, .acc__plus').forEach((el) => {
      const strength = el.classList.contains('btn') ? 0.35 : 0.5;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Reveal on scroll (deterministic, rAF-throttled) ---------- */
  const revealSel = '[data-reveal]:not(.hero [data-reveal]), [data-stagger], [data-lines], .clip-reveal, .stat, .step, .pillar, .tl, .pstep, .feature__screen, .quote, .bcard, .sector, .hcard';
  const pending = new Set($$(revealSel));
  $$('svg[data-draw]').forEach((svg) => { if (!svg.closest('.hero') && !svg.closest('.loader') && !svg.closest(revealSel)) pending.add(svg); });
  const counters = new Set($$('[data-count]'));
  const growers = new Set($$('.timeline__line, .steps__line'));
  const fmt = (n, dec) => n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const revealEl = (el) => {
    el.classList.add('is-revealed', 'is-in');
    if (el.hasAttribute('data-stagger')) Array.from(el.children).forEach((c, i) => (c.style.transitionDelay = `${i * 90}ms`));
    const svg = el.matches('svg[data-draw]') ? el : $('svg[data-draw]', el);
    if (svg && !svg.closest('.hero') && !svg.dataset.drawn) { svg.dataset.drawn = '1'; playDraw(svg, { dur: 1.4, stagger: 0.05 }); }
    if (el.classList.contains('risk__chart')) drawRisk(el);
  };
  const countEl = (el) => {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = prefix + fmt(end, dec) + suffix; return; }
    const t0 = performance.now(), dur = 1800;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + fmt(end * e, dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const growEl = (el) => {
    const i = $('i', el); if (!i) return;
    i.style.transition = 'transform 1.8s cubic-bezier(.65,0,.35,1)'; i.style.transform = 'scaleX(1)';
  };
  const drawRisk = (chart) => {
    $$('.seg', chart).forEach((s, i) => {
      const len = s.getTotalLength();
      const final = `${s.dataset.len} ${len}`;
      if (reduce) { s.style.strokeDasharray = final; return; }
      setTimeout(() => {
        s.style.transition = 'stroke-dasharray 1.4s cubic-bezier(.65,0,.35,1), stroke-width .5s cubic-bezier(.16,1,.3,1), opacity .5s';
        s.style.strokeDasharray = final;
      }, 120 + i * 260);
    });
  };
  // initial state of risk segments (hidden until the chart reveals)
  $$('.risk__chart .seg').forEach((s) => { s.style.strokeDasharray = reduce ? `${s.dataset.len} ${s.getTotalLength()}` : `0 ${s.getTotalLength()}`; });

  const levels = $$('.level');
  const levelsArt = $('.levels__art');
  const setLevel = (idx) => {
    levels.forEach((l, i) => l.classList.toggle('is-active', i <= idx));
    if (levelsArt) $$('g[data-level]', levelsArt).forEach((g) => g.classList.toggle('is-active', parseInt(g.dataset.level) <= idx + 1));
  };

  let checkQueued = false;
  const check = () => {
    checkQueued = false;
    const vh = innerHeight;
    const lineReveal = vh * 0.92, lineCount = vh * 0.85;
    pending.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < lineReveal && r.bottom > 0) { pending.delete(el); try { revealEl(el); } catch (e) { console.warn(e); } }
    });
    counters.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < lineCount && r.bottom > 0) { counters.delete(el); countEl(el); } });
    growers.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < lineReveal && r.bottom > 0) { growers.delete(el); growEl(el); } });
    if (levels.length) {
      const mid = vh * 0.5; let idx = -1;
      levels.forEach((l, i) => { const r = l.getBoundingClientRect(); if (r.top < mid) idx = i; });
      if (idx >= 0) setLevel(idx);
    }
  };
  const queueCheck = () => { if (!checkQueued) { checkQueued = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', queueCheck, { passive: true });
  window.addEventListener('resize', queueCheck);
  window.addEventListener('load', () => { queueCheck(); setTimeout(queueCheck, 400); setTimeout(queueCheck, 1500); });
  if (lenis) lenis.on('scroll', queueCheck);
  queueCheck();

  /* ---------- Mouse parallax (hero art) ---------- */
  if (finePointer && !reduce) {
    $$('[data-parallax-group]').forEach((group) => {
      const layers = $$('[data-depth]', group);
      let tx = 0, ty = 0, cx = 0, cy = 0;
      window.addEventListener('pointermove', (e) => {
        tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5);
      }, { passive: true });
      const tick = () => {
        cx = lerp(cx, tx, 0.06); cy = lerp(cy, ty, 0.06);
        layers.forEach((l) => {
          const d = parseFloat(l.dataset.depth) * 100;
          l.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
        });
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /* ---------- Scroll parallax ---------- */
  if (hasST && !reduce) {
    $$('[data-speed]').forEach((el) => {
      const sp = parseFloat(el.dataset.speed);
      gsap.to(el, { yPercent: sp * -30, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Manifesto: word-by-word scroll reveal ---------- */
  $$('[data-scroll-words]').forEach((el) => {
    const html = el.innerHTML;
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const out = document.createDocumentFragment();
    const walk = (node, gold) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { out.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'w' + (gold ? ' gold' : ''); s.textContent = p; out.appendChild(s);
          });
        } else if (n.nodeType === 1) walk(n, gold || n.tagName === 'EM');
      });
    };
    walk(tmp, false);
    el.innerHTML = ''; el.appendChild(out);
    const words = $$('.w', el);
    if (reduce) { words.forEach((w) => (w.style.opacity = 1)); return; }
    const update = () => {
      const r = el.getBoundingClientRect();
      const start = innerHeight * 0.85, end = innerHeight * 0.3;
      const p = clamp((start - r.top) / (r.height + start - end), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => (w.style.opacity = i < n ? 1 : 0.16));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Horizontal scroll ---------- */
  $$('[data-hscroll]').forEach((section) => {
    const track = $('.hscroll__track', section);
    const bar = $('.hscroll__progress i', section);
    if (!track) return;
    const mq = matchMedia('(min-width: 821px)');
    if (!(hasST && mq.matches && !reduce)) return;
    const getDist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -getDist(),
      ease: 'none',
      scrollTrigger: {
        trigger: section, pin: true, scrub: 0.6, anticipatePin: 1,
        start: 'top top', end: () => '+=' + getDist(), invalidateOnRefresh: true,
        onUpdate: (st) => { if (bar) bar.style.width = (st.progress * 100).toFixed(2) + '%'; }
      }
    });
  });

  /* ---------- Poles: redraw icon on hover ---------- */
  $$('.pole').forEach((p) => {
    const svg = $('svg', p);
    if (!svg) return;
    prepDraw(svg);
    p.addEventListener('mouseenter', () => playDraw(svg, { dur: 1.1, stagger: 0.03 }));
  });

  /* ---------- Accordion ---------- */
  $$('.acc').forEach((acc) => {
    const items = $$('.acc__item', acc);
    items.forEach((item) => {
      const btn = $('.acc__btn', item), panel = $('.acc__panel', item);
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        items.forEach((o) => {
          if (o !== item && o.classList.contains('is-open')) {
            o.classList.remove('is-open');
            const p = $('.acc__panel', o); p.style.height = p.scrollHeight + 'px';
            requestAnimationFrame(() => (p.style.height = '0px'));
            $('.acc__btn', o).setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', String(!open));
        if (!open) {
          panel.style.height = panel.scrollHeight + 'px';
          panel.addEventListener('transitionend', function te() { if (item.classList.contains('is-open')) panel.style.height = 'auto'; panel.removeEventListener('transitionend', te); });
        } else {
          panel.style.height = panel.scrollHeight + 'px';
          requestAnimationFrame(() => (panel.style.height = '0px'));
        }
        setTimeout(() => hasST && ScrollTrigger.refresh(), 750);
      });
    });
    const first = $('.acc__item', acc);
    if (first && acc.hasAttribute('data-open-first')) $('.acc__btn', first).click();
  });

  /* ---------- Hover list with sticky panel ---------- */
  $$('.hlist').forEach((list) => {
    const items = $$('.hlist__item', list);
    const panel = $('.hlist__panel', list);
    if (!panel) return;
    const t = $('[data-p-title]', panel), d = $('[data-p-desc]', panel), tags = $('[data-p-tags]', panel), idx = $('[data-p-idx]', panel), inner = $('.hlist__panelIn', panel);
    const show = (item) => {
      items.forEach((i) => i.classList.toggle('is-active', i === item));
      const apply = () => {
        t.textContent = item.dataset.title;
        d.textContent = item.dataset.desc;
        if (idx) idx.textContent = item.dataset.idx;
        if (tags) tags.innerHTML = (item.dataset.tags || '').split('|').filter(Boolean).map((x) => `<li>${x}</li>`).join('');
      };
      if (hasGSAP && !reduce) {
        gsap.to(inner, { opacity: 0, y: 10, duration: .2, onComplete: () => { apply(); gsap.to(inner, { opacity: 1, y: 0, duration: .5, ease: 'expo.out' }); } });
      } else apply();
    };
    items.forEach((i) => {
      i.addEventListener('mouseenter', () => finePointer && show(i));
      i.addEventListener('click', () => show(i));
      i.addEventListener('focus', () => show(i));
    });
    show(items[0]);
  });

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('.tab', root), panels = $$('.tabpanel', root);
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      panels.forEach((p) => p.classList.toggle('is-active', p.id === tab.dataset.tab));
      setTimeout(() => hasST && ScrollTrigger.refresh(), 100);
    }));
  });

  /* ---------- Risk donut ---------- */
  $$('.risk').forEach((risk) => {
    const segs = $$('.seg', risk), rows = $$('.risk__row', risk);
    const center = $('.risk__center', risk);
    const set = (key) => {
      segs.forEach((s) => s.classList.toggle('is-active', s.dataset.key === key));
      rows.forEach((r) => r.classList.toggle('is-active', r.dataset.key === key));
      const row = rows.find((r) => r.dataset.key === key);
      if (center && row) { $('b', center).textContent = row.dataset.short; $('span', center).textContent = row.dataset.pct; }
    };
    segs.forEach((s) => s.addEventListener('mouseenter', () => set(s.dataset.key)));
    rows.forEach((r) => { r.addEventListener('mouseenter', () => set(r.dataset.key)); r.addEventListener('click', () => set(r.dataset.key)); });
    set(rows[0] && rows[0].dataset.key);
  });

  /* ---------- Form ---------- */
  $$('form[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.classList.add('is-sent');
    });
  });

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Refresh ---------- */
  window.addEventListener('load', () => { if (hasST) { ScrollTrigger.refresh(); ScrollTrigger.addEventListener('refresh', queueCheck); } });
})();
