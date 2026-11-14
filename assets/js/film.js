/* LATITO film renderer. One interface, two modes:
   - "stills":   the four keyframe <img>s crossfade with a slow push-in, drift and tilt.
   - "sequence": if assets/film/manifest.json has frames > 0, an image sequence is drawn on a
                 <canvas> (cover-fit, DPR-aware, first 24 frames preloaded, the rest streamed,
                 nearest loaded frame drawn).
   main.js drives both through render(p), where p runs 0 to 1 across the four beats.
   Manifest: { "frames": N, "desktop": "assets/film/d/%04d.webp", "mobile": "assets/film/m/%04d.webp",
               "w": 1920, "h": 1080, "start": 1, "holdStart": 0.125, "holdEnd": 0.125, "focusMobile": 0.5 }
   start = first file number (default 1). holdStart / holdEnd = fractions of p that hold the first /
   last frame, so the frames between land on the copy beats. focusMobile = crop focus x on phones
   (default 0.64, for 16:9 frames; 0.5 suits portrait frames). */
(function () {
  'use strict';
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  // Camera move per still: [x0, x1] drift in %, [r0, r1] tilt in deg, [s0, s1] scale.
  var MOVES = [
    { x: [0, -1.2], y: [0, 0.6], r: [0, -0.5], s: [1, 1.08] },
    { x: [0.8, -0.6], y: [0, -0.4], r: [0.9, -0.4], s: [1.01, 1.09] },
    { x: [1.2, -1.2], y: [0.4, 0], r: [-0.4, 0.3], s: [1, 1.08] },
    { x: [-0.6, 0.6], y: [0, -0.5], r: [0.5, -0.2], s: [1.02, 1.1] }
  ];
  var FADE = 0.05; // half-width of each crossfade, in p units

  function LatitoFilm(stage) {
    var stills = [].slice.call(stage.querySelectorAll('.film__still'));
    var canvas = stage.querySelector('.film__canvas');
    var n = stills.length;
    var mode = 'stills';
    var lastP = 0;
    var seq = null;

    function renderStills(p) {
      for (var k = 0; k < n; k++) {
        var edge = k / n;
        var start = k ? edge - FADE : 0;
        var end = k < n - 1 ? (k + 1) / n + FADE : 1;
        var t = clamp((p - start) / (end - start), 0, 1);
        var m = MOVES[k] || MOVES[0];
        var el = stills[k];
        el.style.opacity = k ? smooth(edge - FADE, edge + FADE, p).toFixed(3) : '1';
        el.style.transform = 'translate3d(' + lerp(m.x[0], m.x[1], t).toFixed(3) + '%,' + lerp(m.y[0], m.y[1], t).toFixed(3) + '%,0) rotate(' +
          lerp(m.r[0], m.r[1], t).toFixed(3) + 'deg) scale(' + lerp(m.s[0], m.s[1], t).toFixed(4) + ')';
      }
    }

    function render(p) {
      lastP = clamp(p, 0, 1);
      if (mode === 'sequence') seq.draw(lastP); else renderStills(lastP);
    }

    function Sequence(man) {
      var mobile = window.matchMedia('(max-width: 768px)').matches;
      var pattern = (mobile && man.mobile) || man.desktop;
      var N = man.frames, first = man.start == null ? 1 : man.start;
      var imgs = new Array(N), want = 0, drawn = -1;
      var ctx = canvas.getContext('2d');
      var posX = mobile ? (man.focusMobile != null ? +man.focusMobile : 0.64) : 0.6;
      var hs = +man.holdStart || 0, he = +man.holdEnd || 0;
      var url = function (i) {
        return pattern.replace(/%0(\d)d/, function (_, d) { var s = String(i + first); while (s.length < +d) s = '0' + s; return s; });
      };
      function size() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(stage.clientWidth * dpr);
        canvas.height = Math.round(stage.clientHeight * dpr);
        drawn = -1;
      }
      function nearest(i) {
        for (var d = 0; d < N; d++) {
          if (imgs[i - d] && imgs[i - d].ok) return i - d;
          if (imgs[i + d] && imgs[i + d].ok) return i + d;
        }
        return -1;
      }
      function paint() {
        var i = nearest(want);
        if (i < 0 || i === drawn) return;
        var im = imgs[i], cw = canvas.width, ch = canvas.height;
        var sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
        var w = im.naturalWidth * sc, h = im.naturalHeight * sc;
        ctx.drawImage(im, (cw - w) * posX, (ch - h) * 0.5, w, h);
        drawn = i;
      }
      function load(i) {
        return new Promise(function (res) {
          var im = new Image();
          im.decoding = 'async';
          im.onload = function () { im.ok = true; if (Math.abs(i - want) < 3 || drawn < 0) paint(); res(); };
          im.onerror = function () { res(); };
          imgs[i] = im;
          im.src = url(i);
        });
      }
      function stream(from) {
        var next = from, live = 0;
        (function pump() {
          while (live < 6 && next < N) {
            live++;
            load(next++).then(function () { live--; pump(); });
          }
        })();
      }
      size();
      window.addEventListener('resize', function () { size(); paint(); });
      var head = [];
      for (var i = 0; i < Math.min(24, N); i++) head.push(load(i));
      return {
        ready: Promise.all(head).then(function () {
          var any = imgs.some(function (im) { return im && im.ok; });
          if (any) stream(head.length);
          return any;
        }),
        draw: function (p) { want = Math.round(clamp((p - hs) / (1 - hs - he), 0, 1) * (N - 1)); paint(); }
      };
    }

    // Stills 2-4 stay display:none (so they never download) until stills mode is chosen.
    function useStills() { stage.classList.add('is-stills'); }

    // Look for a frame sequence. With frames: 0 or no manifest, the stills stay on.
    fetch('assets/film/manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (man) {
        if (!man || !(man.frames > 0) || !canvas) return useStills();
        seq = Sequence(man);
        return seq.ready.then(function (any) {
          if (!any) return useStills();
          mode = 'sequence';
          canvas.hidden = false;
          render(lastP);
          // Fade the canvas in over the still, then hide the stills.
          canvas.style.opacity = '0';
          canvas.style.transition = 'opacity .45s ease';
          void canvas.offsetWidth;
          canvas.style.opacity = '1';
          setTimeout(function () { stills.forEach(function (s) { s.style.visibility = 'hidden'; }); }, 500);
        });
      })
      .catch(useStills);

    renderStills(0);
    return { render: render, mode: function () { return mode; } };
  }

  window.LatitoFilm = LatitoFilm;
})();
