/* ==========================================================
   LEADWIN Global Pharmacy — main.js
   1) 기본 정보 반영  2) 헤더/메뉴  3) 서브 탭  4) 메인 슬라이드
   5) 스크롤 애니메이션  6) 사진 칸 (images 폴더 + 브라우저 업로드)
   ========================================================== */
(function () {
  'use strict';

  var CFG = window.LEADWIN_CONFIG || {};
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }
  function elOf(t) { return t && t.nodeType === 1 ? t : (t && t.parentElement) || null; }

  /* ---------- 1. 기본 정보 (js/config.js) ---------- */
  function applyConfig() {
    $$('[data-config]').forEach(function (el) {
      var v = CFG[el.getAttribute('data-config')];
      if (v != null && String(v).trim() !== '') el.textContent = v;
    });
    $$('[data-tel]').forEach(function (a) {
      var v = CFG[a.getAttribute('data-tel')] || CFG.phone || '';
      var digits = String(v).replace(/[^0-9+]/g, '');
      if (digits) a.setAttribute('href', 'tel:' + digits);
    });
    $$('[data-mailto]').forEach(function (a) {
      if (CFG.email && CFG.email.indexOf('@') > 0) a.setAttribute('href', 'mailto:' + CFG.email);
    });
    var q = encodeURIComponent(CFG.mapQuery || '강남역');
    $$('iframe[data-map]').forEach(function (f) {
      f.src = 'https://www.google.com/maps?q=' + q + '&hl=ko&z=16&output=embed';
    });
    $$('[data-map-link]').forEach(function (a) {
      var t = a.getAttribute('data-map-link');
      a.href = t === 'naver' ? 'https://map.naver.com/p/search/' + q
        : t === 'kakao' ? 'https://map.kakao.com/?q=' + q
        : 'https://www.google.com/maps/search/?api=1&query=' + q;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$('[data-kakao]').forEach(function (a) {
      if (CFG.kakao) { a.href = CFG.kakao; a.target = '_blank'; a.rel = 'noopener'; return; }
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast('카카오톡 채널 주소를 js/config.js 의 kakao 항목에 넣으면 바로 연결돼요.');
      });
    });
  }

  /* ---------- 2. 헤더 · 모바일 메뉴 ---------- */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var page = document.body.getAttribute('data-page');
    if (page) $$('.gnb [data-menu="' + page + '"]').forEach(function (li) { li.classList.add('is-current'); });

    var toggle = $('.nav-toggle');
    if (!toggle) return;
    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    }
    toggle.addEventListener('click', function () { setOpen(!document.body.classList.contains('nav-open')); });
    $$('.gnb a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) setOpen(false); });
  }

  /* ---------- 3. 서브 탭 (현재 보고 있는 구역 표시) ---------- */
  function initSubnav() {
    var pairs = $$('.subnav a[href^="#"]').map(function (a) {
      return [a, document.getElementById(a.getAttribute('href').slice(1))];
    }).filter(function (p) { return p[1]; });
    if (!pairs.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.4;
      var current = pairs[0];
      pairs.forEach(function (p) { if (p[1].getBoundingClientRect().top <= line) current = p; });
      pairs.forEach(function (p) { p[0].classList.toggle('active', p === current); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- 4. 메인 사진 슬라이드 ---------- */
  function initSliders() {
    $$('[data-slider]').forEach(function (box) {
      var slides = $$('.slide', box);
      var n = slides.length;
      if (!n) return;
      var dotsBox = $('.slider-dots', box);
      var count = $('.slider-count', box);
      var countNow = $('.slider-count-now', box);
      var progress = $('.slider-progress', box);
      var DELAY = 6000;
      var i = 0, timer = null, hover = false;

      var tabs = $$('[data-slide-tab]', box);
      var dots = tabs.length ? tabs : slides.map(function () {
        var b = document.createElement('button');
        b.type = 'button';
        if (dotsBox) dotsBox.appendChild(b);
        return b;
      });
      dots.forEach(function (b, k) {
        if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', (k + 1) + '번째 슬라이드 보기');
        b.addEventListener('click', function () { go(k); start(); });
      });
      function go(k) {
        i = (k + n) % n;
        slides.forEach(function (s, j) {
          s.classList.toggle('is-active', j === i);
          s.setAttribute('aria-hidden', j === i ? 'false' : 'true');
        });
        dots.forEach(function (d, j) { d.classList.toggle('is-active', j === i); });
        if (count) count.textContent = pad(i + 1) + ' / ' + pad(n);
        if (countNow) countNow.textContent = pad(i + 1);
      }
      function runProgress(on) {
        if (!progress) return;
        progress.classList.remove('run');
        if (on) { void progress.offsetWidth; progress.classList.add('run'); }
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; } runProgress(false); }
      function start() {
        stop();
        if (reduceMotion || hover || n < 2 || document.hidden || document.body.classList.contains('edit-mode')) return;
        runProgress(true);
        timer = setInterval(function () { go(i + 1); runProgress(true); }, DELAY);
      }
      var prev = $('.slider-prev', box), next = $('.slider-next', box);
      if (prev) prev.addEventListener('click', function () { go(i - 1); start(); });
      if (next) next.addEventListener('click', function () { go(i + 1); start(); });
      if (!box.classList.contains('hero')) {
        box.addEventListener('mouseenter', function () { hover = true; stop(); });
        box.addEventListener('mouseleave', function () { hover = false; start(); });
      }
      var x0 = null;
      box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (x0 == null) return;
        var dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); start(); }
      });
      document.addEventListener('leadwin:editmode', start);
      document.addEventListener('visibilitychange', start);
      go(0);
      start();
    });
  }

  /* ---------- 5. 스크롤 등장 효과 ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     6. 사진 칸
     - 사진을 보여주는 순서:
       ① 이 브라우저에서 직접 넣은 사진 (사진 편집 모드)
       ② images 폴더의 파일 (예: images/main-campus-1.jpg)
       ③ 없으면 깔끔한 안내 칸
     ========================================================== */
  var IMG_DIR = 'images/';
  var EXTS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
  var ICON_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONS = {
    image: '<svg ' + ICON_ATTR + '><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    person: '<svg ' + ICON_ATTR + '><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
    people: '<svg ' + ICON_ATTR + '><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 13.6c2.9.3 5 2.7 5 5.9"/></svg>',
    building: '<svg ' + ICON_ATTR + '><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8.5 7h1.5M14 7h1.5M8.5 11h1.5M14 11h1.5"/></svg>',
    award: '<svg ' + ICON_ATTR + '><circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.6 7 21l5-2.6 5 2.6-1.6-7.4"/></svg>',
    board: '<svg ' + ICON_ATTR + '><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/></svg>',
    sofa: '<svg ' + ICON_ATTR + '><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 18v-5a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v5z"/><path d="M5 18v2M19 18v2"/></svg>',
    doc: '<svg ' + ICON_ATTR + '><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    university: '<svg ' + ICON_ATTR + '><path d="M3 9l9-5 9 5-9 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>'
  };

  /* 저장소: IndexedDB (안 되면 localStorage) */
  var Store = (function () {
    var LS = 'leadwin-photo:';
    var dbPromise = null;
    function open() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise(function (resolve, reject) {
        try {
          var req = window.indexedDB.open('leadwin-photos', 1);
          req.onupgradeneeded = function () { req.result.createObjectStore('photos'); };
          req.onsuccess = function () { resolve(req.result); };
          req.onerror = function () { reject(req.error); };
          req.onblocked = function () { reject(new Error('blocked')); };
        } catch (e) { reject(e); }
      });
      return dbPromise;
    }
    function run(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction('photos', mode);
          var req = fn(tx.objectStore('photos'));
          tx.oncomplete = function () { resolve(req ? req.result : undefined); };
          tx.onerror = tx.onabort = function () { reject(tx.error || new Error('transaction failed')); };
        });
      });
    }
    function lsGet(k) { try { return window.localStorage.getItem(LS + k); } catch (e) { return null; } }
    function toDataURL(blob) {
      return new Promise(function (res, rej) {
        var r = new FileReader();
        r.onload = function () { res(r.result); };
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
    }
    return {
      get: function (k) {
        return run('readonly', function (s) { return s.get(k); })
          .then(function (v) { return v != null ? v : lsGet(k); }, function () { return lsGet(k); });
      },
      set: function (k, blob) {
        return run('readwrite', function (s) { return s.put(blob, k); })
          .catch(function () {
            /* IndexedDB를 못 쓰는 환경(예: Safari에서 파일을 직접 연 경우) → 사진을 더 작게 줄여 localStorage에 저장 */
            var small = (/svg|gif/.test(blob.type) || blob.size < 300 * 1024) ? Promise.resolve(blob) : resizeImage(blob, 1400, 0.8);
            return small.then(toDataURL).then(function (d) {
              try { window.localStorage.setItem(LS + k, d); }
              catch (e) {
                var err = new Error('quota');
                err.userMessage = '브라우저 저장 공간이 꽉 찼어요. images 폴더에 사진 파일을 넣는 방법을 사용해 주세요.';
                throw err;
              }
            });
          });
      },
      del: function (k) {
        try { window.localStorage.removeItem(LS + k); } catch (e) { /* 무시 */ }
        return run('readwrite', function (s) { return s.delete(k); }).catch(function () {});
      },
      clear: function () {
        try {
          Object.keys(window.localStorage).forEach(function (key) {
            if (key.indexOf(LS) === 0) window.localStorage.removeItem(key);
          });
        } catch (e) { /* 무시 */ }
        return run('readwrite', function (s) { return s.clear(); }).catch(function () {});
      }
    };
  })();

  /* images 폴더에서 파일 찾기 (jpg → jpeg → png → webp 순서) */
  var probeCache = {};
  function probe(key) {
    if (probeCache[key]) return probeCache[key];
    probeCache[key] = new Promise(function (resolve) {
      var k = 0;
      (function tryNext() {
        if (k >= EXTS.length) { resolve(null); return; }
        var src = IMG_DIR + key + '.' + EXTS[k++];
        var im = new Image();
        im.onload = function () { resolve(src); };
        im.onerror = tryNext;
        im.src = src;
      })();
    });
    return probeCache[key];
  }

  function setupSlot(el) {
    if (el._phReady) return;
    el._phReady = true;
    var key = el.getAttribute('data-photo');
    var fileHint = IMG_DIR + key + '.jpg';
    var label = el.getAttribute('data-label') || '';

    if (!$('.ph-fallback', el) && !el.classList.contains('ph-bare')) {
      var empty = document.createElement('div');
      empty.className = 'ph-empty';
      empty.innerHTML = '<span class="ph-icon">' + (ICONS[el.getAttribute('data-icon')] || ICONS.image) + '</span>' +
        (label ? '<span class="ph-label"></span>' : '') + '<span class="ph-file"></span>';
      if (label) $('.ph-label', empty).textContent = label;
      $('.ph-file', empty).textContent = fileHint;
      el.appendChild(empty);
    }

    var tools = document.createElement('div');
    tools.className = 'ph-tools';
    tools.innerHTML = '<span class="ph-tip"><span class="t-add">＋ 클릭해서 사진 넣기</span><span class="t-change">클릭해서 사진 바꾸기</span></span>' +
      '<span class="ph-name"></span><button type="button" class="ph-del">사진 삭제</button>';
    $('.ph-name', tools).textContent = fileHint;
    el.appendChild(tools);

    $('.ph-del', tools).addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      Store.del(key).then(function () {
        refreshKey(key);
        toast('넣었던 사진을 지웠어요.');
      });
    });

    loadSlot(el);
  }

  function loadSlot(el) {
    var key = el.getAttribute('data-photo');
    function fromFolder() {
      return probe(key).then(function (src) { if (src) display(el, src, false); else reset(el); });
    }
    return Store.get(key).then(function (v) {
      if (v) { display(el, v, true); return null; }
      return fromFolder();
    }, fromFolder);
  }

  function display(el, v, uploaded) {
    var src = v;
    if (typeof v !== 'string') {
      if (el._url) URL.revokeObjectURL(el._url);
      el._url = src = URL.createObjectURL(v);
    }
    var img = $('img.ph-img', el);
    if (!img) {
      img = document.createElement('img');
      img.className = 'ph-img';
      img.alt = el.getAttribute('data-label') || '';
      img.decoding = 'async';
      el.insertBefore(img, el.firstChild);
    }
    img.onerror = function () {
      if (uploaded) {
        toast('이 사진 형식은 브라우저에서 보이지 않아요. JPG나 PNG로 저장해서 다시 넣어주세요.');
        Store.del(el.getAttribute('data-photo'));
      }
      reset(el);
    };
    img.src = src;
    el.classList.add('has-photo');
    el.classList.toggle('is-uploaded', !!uploaded);
  }

  function reset(el) {
    var img = $('img.ph-img', el);
    if (img) img.parentNode.removeChild(img);
    if (el._url) { URL.revokeObjectURL(el._url); el._url = null; }
    el.classList.remove('has-photo', 'is-uploaded');
  }

  function refreshKey(key) {
    $$('[data-photo]').forEach(function (s) { if (s.getAttribute('data-photo') === key) loadSlot(s); });
  }

  /* 큰 사진은 보기 좋은 크기(가로·세로 최대 2400px)로 줄여서 저장 */
  function prepare(file) {
    if (/svg|gif/.test(file.type) || file.size < 600 * 1024) return Promise.resolve(file);
    return resizeImage(file, 2400, 0.88);
  }

  function resizeImage(file, max, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight;
        var r = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * r));
        c.height = Math.max(1, Math.round(h * r));
        var ctx = c.getContext('2d');
        var png = file.type === 'image/png';
        if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { resolve(b && b.size < file.size ? b : file); }, png ? 'image/png' : 'image/jpeg', quality);
      };
      im.onerror = function () {
        URL.revokeObjectURL(url);
        var err = new Error('decode');
        err.userMessage = '이 파일은 열 수 없어요. JPG나 PNG 사진으로 넣어주세요. (아이폰 HEIC 사진은 JPG로 바꿔야 해요)';
        reject(err);
      };
      im.src = url;
    });
  }

  function savePhoto(slot, file) {
    var key = slot.getAttribute('data-photo');
    var isImage = /^image\//.test(file.type) || /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(file.name || '');
    if (!isImage) { toast('사진(이미지) 파일만 넣을 수 있어요.'); return; }
    slot.classList.add('is-busy');
    prepare(file)
      .then(function (blob) { return Store.set(key, blob); })
      .then(function () {
        refreshKey(key);
        toast('사진을 넣었어요! 이 브라우저에 자동 저장됩니다.');
      })
      .catch(function (err) {
        if (window.console) console.error(err);
        toast((err && err.userMessage) || '사진을 저장하지 못했어요. 더 작은 사진으로 다시 시도해 주세요.');
      })
      .then(function () { slot.classList.remove('is-busy'); });
  }

  /* ---------- 사진 편집 모드 ---------- */
  var picker = null, pickTarget = null, editBar = null, toastEl = null, toastTimer = null;
  function isEdit() { return document.body.classList.contains('edit-mode'); }

  function ensureEditUI() {
    if (editBar) return;
    editBar = document.createElement('div');
    editBar.className = 'edit-bar';
    editBar.hidden = true;
    editBar.innerHTML = '<span class="eb-icon">' + ICONS.image + '</span>' +
      '<p><b>사진 편집 모드</b>사진 칸을 클릭하거나, 사진 파일을 칸 위로 끌어다 놓으세요.</p>' +
      '<button type="button" class="eb-reset">넣은 사진 전체 삭제</button>' +
      '<button type="button" class="eb-done">편집 끝내기</button>';
    document.body.appendChild(editBar);
    $('.eb-done', editBar).addEventListener('click', function () { setEdit(false); });
    $('.eb-reset', editBar).addEventListener('click', function () {
      if (!window.confirm('이 브라우저에서 넣은 사진을 모두 지울까요?\n(images 폴더에 넣은 사진은 그대로 남아요)')) return;
      Store.clear().then(function () {
        $$('[data-photo]').forEach(loadSlot);
        toast('넣었던 사진을 모두 지웠어요.');
      });
    });

    picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.hidden = true;
    document.body.appendChild(picker);
    picker.addEventListener('change', function () {
      var f = picker.files && picker.files[0];
      if (f && pickTarget) savePhoto(pickTarget, f);
      picker.value = '';
    });
  }

  function setEdit(on, silent) {
    ensureEditUI();
    document.body.classList.toggle('edit-mode', on);
    editBar.hidden = !on;
    try {
      if (on) window.sessionStorage.setItem('leadwin-edit', '1');
      else window.sessionStorage.removeItem('leadwin-edit');
    } catch (e) { /* 무시 */ }
    $$('[data-edit-toggle]').forEach(function (b) { b.textContent = on ? '사진 편집 끝내기' : '사진 편집'; });
    var ev;
    try { ev = new CustomEvent('leadwin:editmode', { detail: on }); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('leadwin:editmode', false, false, on); }
    document.dispatchEvent(ev);
    if (on && !silent) toast('사진 편집 모드예요. 원하는 사진 칸을 클릭해 보세요.');
  }

  function initPhotos() {
    $$('[data-photo]').forEach(setupSlot);

    /* 클릭: 편집 모드에서 사진 칸을 누르면 파일 선택 창 열기 */
    document.addEventListener('click', function (e) {
      var t = elOf(e.target);
      if (!t) return;
      if (t.closest('[data-edit-toggle]')) {
        e.preventDefault();
        setEdit(!isEdit());
        return;
      }
      if (!isEdit() || t.closest('.ph-del') || t.closest('.edit-bar')) return;
      var slot = t.closest('[data-photo]');
      if (!slot) return;
      e.preventDefault();
      e.stopPropagation();
      ensureEditUI();
      pickTarget = slot;
      picker.click();
    }, true);

    /* 끌어다 놓기: 사진 칸 위에 파일을 놓으면 바로 저장 (편집 모드가 아니어도 동작) */
    function clearDrag(except) {
      $$('.ph.drag-over').forEach(function (s) { if (s !== except) s.classList.remove('drag-over'); });
    }
    function hasFiles(e) {
      var types = e.dataTransfer && e.dataTransfer.types;
      if (!types) return false;
      for (var i = 0; i < types.length; i++) { if (types[i] === 'Files') return true; }
      return false;
    }
    document.addEventListener('dragover', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      var t = elOf(e.target);
      var slot = t && t.closest('[data-photo]');
      clearDrag(slot);
      if (slot) { slot.classList.add('drag-over'); e.dataTransfer.dropEffect = 'copy'; }
      else { e.dataTransfer.dropEffect = 'none'; }
    });
    document.addEventListener('dragleave', function (e) {
      if (!e.relatedTarget) clearDrag(null);
    });
    document.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      clearDrag(null);
      var t = elOf(e.target);
      var slot = t && t.closest('[data-photo]');
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (slot && f) savePhoto(slot, f);
      else if (f) toast('사진 칸 위에 놓아 주세요.');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isEdit()) setEdit(false);
    });

    var restore = false;
    try { restore = window.sessionStorage.getItem('leadwin-edit') === '1'; } catch (e) { /* 무시 */ }
    if (/[?&]edit\b/.test(window.location.search)) restore = true;
    if (restore) setEdit(true, true);
  }

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  /* ---------- 시작 ---------- */
  function init() {
    safe(applyConfig);
    safe(initHeader);
    safe(initSubnav);
    safe(initPhotos);
    safe(initSliders);
    safe(initReveal);
  }
  document.documentElement.classList.add('js');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
