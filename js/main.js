(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- язык ---------- */
  var lang = 'ru';
  try { lang = localStorage.getItem('alash-lang') || ''; } catch (e) { lang = ''; }
  if (!lang) lang = /^kk/i.test(navigator.language || '') ? 'kk' : 'ru';

  function t(k) { return (window.I18N[lang] && window.I18N[lang][k]) || k; }
  function setLang(l) {
    lang = l;
    document.documentElement.lang = l;
    document.title = t('meta.title');
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    try { localStorage.setItem('alash-lang', l); } catch (e) {}
    updatePour();
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  /* ---------- сцена со стаканом ---------- */
  var scene = $('#scene'), stage = $('#stage'), hero = $('#hero');
  var cards = $$('.card'), rail = $('#railFill'), contact = $('#contact'), facesEl = $('#faces');
  var cup = new window.Cup($('#cup'), 'assets/label.jpg');
  // угол стакана на каждом шаге: 0 — лицо, ~180 — оборот
  var ANG = [0, 6, 205, 214, 160, 360, 348, 372, 360];
  var N = ANG.length;
  scene.style.setProperty('--steps', N);

  var grains = $('#grains'), G = [];
  for (var i = 0; i < 16; i++) {
    var s = document.createElement('i');
    var d = 0.3 + Math.random() * 0.9;
    s.style.left = (4 + Math.random() * 92) + '%';
    s.style.top = (6 + Math.random() * 88) + '%';
    s.style.width = s.style.height = (12 + d * 20) + 'px';
    s.style.backgroundImage = 'url(assets/grain-' + (1 + i % 5) + '.png)';
    s.style.rotate = Math.round(Math.random() * 360) + 'deg';
    s.style.opacity = 0.45 + d * 0.5;
    if (d < 0.6) s.style.filter = 'blur(1.5px)';
    s.style.animationDelay = (-Math.random() * 9) + 's';
    grains.appendChild(s); G.push({ el: s, d: d });
  }

  var prepScene = $('#prepScene'), frames = $$('#frames img'), prepSteps = $$('#prepSteps li'), lastFF = -1;
  var auto = 0, drag = 0, dragV = 0, cur = 0, last = performance.now(), active = -1;
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var r = scene.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = Math.max(0, Math.min(1, -r.top / total));
    var pos = p * (N - 1), i0 = Math.min(N - 2, Math.floor(pos)), f = pos - i0;
    var base = ANG[i0] + (ANG[i0 + 1] - ANG[i0]) * smooth((f - 0.2) / 0.6);

    var heroW = Math.max(0, 1 - pos * 2);
    if (!reduce) auto += dt * 16 * heroW;
    if (heroW === 0) { var near = Math.round(auto / 360) * 360; auto += (near - auto) * Math.min(1, dt * 4); }
    if (!dragging) { drag += dragV * dt; dragV *= Math.pow(0.02, dt); drag += (0 - drag) * Math.min(1, dt * 1.2) * (heroW > 0 ? 0 : 1); }

    var target = base + auto + drag;
    cur += (target - cur) * (reduce ? 1 : Math.min(1, dt * 7));
    if (Math.abs(cup.rot - cur) > 0.02) { cup.rot = cur; cup.draw(); }

    var a = Math.round(pos);
    if (a !== active) {
      active = a;
      cards.forEach(function (c) { c.classList.toggle('is-on', +c.dataset.step === a); });
      stage.classList.toggle('is-alash', a >= 5);
      stage.classList.toggle('is-hero', a === 0);
    }
    hero.style.setProperty('--out', (1 - heroW).toFixed(3));
    hero.style.visibility = heroW > 0 ? 'visible' : 'hidden';
    var ct = contact.getBoundingClientRect(), fc = facesEl.getBoundingClientRect();
    document.body.classList.toggle('on-dark', (a >= 5 && r.bottom > 50) || (ct.top < 50 && ct.bottom > 0) || ct.bottom <= 0 || (fc.top < 50 && fc.bottom > 50));
    rail.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    if (!reduce) for (var k = 0; k < G.length; k++) G[k].el.style.transform = 'translateY(' + (-pos * 60 * G[k].d).toFixed(1) + 'px)';
    // «Как готовить»: кадры сменяются по прокрутке
    var pr = prepScene.getBoundingClientRect(), pt = pr.height - window.innerHeight;
    var pp = Math.max(0, Math.min(1, -pr.top / pt)), ff = pp * (frames.length - 1);
    var fi = Math.min(frames.length - 2, Math.floor(ff)), fr = smooth((ff - fi - 0.25) / 0.5);
    if (ff !== lastFF) {
      lastFF = ff;
      for (var q = 0; q < frames.length; q++) frames[q].style.opacity = q <= fi ? 1 : q === fi + 1 ? fr : 0;
      var st = ff < 1.5 ? 0 : ff < 4.5 ? 1 : 2;
      for (var w = 0; w < prepSteps.length; w++) prepSteps[w].classList.toggle('is-on', w === st);
    }
    requestAnimationFrame(frame);
  }

  // стакан можно крутить рукой
  var dragging = false, lx = 0, lt = 0, cv = $('#cup');
  cv.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; lt = performance.now(); dragV = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lx, now = performance.now();
    drag += dx * 0.6; dragV = dx * 0.6 / Math.max(0.008, (now - lt) / 1000);
    lx = e.clientX; lt = now;
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { dragging = false; }); });

  window.addEventListener('resize', function () { cup.resize(); });

  // якоря «Продукт» и «Алаш» ведут на нужный шаг сцены
  $$('.anchor').forEach(function (a) {
    a.style.top = 'calc(' + (parseFloat(a.style.getPropertyValue('--at')) / (N - 1)) + ' * (100% - 100vh))';
  });

  /* ---------- сколько жидкости ---------- */
  var ml = $('#ml'), out = $('#mlOut'), state = $('#mlState'), liquid = $('#liquid'), wave = $('#wave'), ticks = $('#ticks');
  function yOf(v) { return 370 - (v / 330) * 340; }
  [50, 100, 150, 200, 250, 300].forEach(function (v) {
    var y = yOf(v), ns = 'http://www.w3.org/2000/svg';
    var l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', 250); l.setAttribute('x2', 266); l.setAttribute('y1', y); l.setAttribute('y2', y);
    l.setAttribute('stroke', '#1B6B3C'); l.setAttribute('stroke-width', 2);
    var tx = document.createElementNS(ns, 'text');
    tx.setAttribute('x', 272); tx.setAttribute('y', y + 4); tx.textContent = v;
    ticks.appendChild(l); ticks.appendChild(tx);
  });
  function updatePour() {
    var v = +ml.value, y = yOf(v), k = (v - 150) / 150;
    out.textContent = v;
    state.textContent = t(v < 190 ? 'prep.thick' : v < 250 ? 'prep.mid' : 'prep.thin');
    liquid.setAttribute('y', y);
    // чем больше жидкости, тем светлее
    var c = [Math.round(226 + 18 * k), Math.round(190 + 34 * k), Math.round(112 + 78 * k)];
    liquid.setAttribute('fill', 'rgb(' + c.join(',') + ')');
    wave.setAttribute('d', 'M0 ' + y + 'q40 -7 80 0t80 0t80 0t80 0v8H0Z');
    wave.setAttribute('fill', 'rgba(255,255,255,.35)');
  }
  ml.addEventListener('input', updatePour);

  /* архивные фото проявляются, когда до них докрутили */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    $$('.face, .archive figure').forEach(function (f, i) { f.classList.add('will-in'); f.style.transitionDelay = (i % 3) * 0.12 + 's'; io.observe(f); });
  }

  setLang(lang);
  requestAnimationFrame(frame);
})();
