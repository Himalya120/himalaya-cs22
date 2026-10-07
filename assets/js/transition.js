// ===== Theme page transitions: ice = blizzard, sunset = fire, matrix = glitch =====
(function () {
  const root = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const END = { ice: "#e4f4ff", sunset: "#2a0a05", matrix: "#000" }, DUR = 1700, GL = "01アイウエオカキクケコ<>{}=+*#$%";
  let busy = false;

  // arrival: the colour of the effect fades away
  const from = sessionStorage.getItem("hm_trans");
  if (from) {
    sessionStorage.removeItem("hm_trans");
    const d = document.createElement("div"); d.className = "trans-cover"; d.style.background = END[from] || "#000"; document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("fade"))); setTimeout(() => d.remove(), 1300);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function sprite(rgb) {
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  }
  const FX = {
    ice: { // blizzard: streaking snow + thickening white fog
      init: (W, H) => ({ f: Array.from({ length: 520 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() })) }),
      draw(ctx, W, H, p, s) {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = `rgba(214,238,255,${Math.min(.95, Math.pow(p, 1.6))})`; ctx.fillRect(0, 0, W, H);
        const sp = 1 + p * 2.2; ctx.lineCap = "round";
        for (const f of s.f) {
          const vx = (14 + 26 * f.z) * sp, vy = (5 + 10 * f.z) * sp; f.x += vx; f.y += vy;
          if (f.x > W + 60) f.x = -60; if (f.y > H + 60) f.y = -60;
          ctx.strokeStyle = `rgba(255,255,255,${.45 + .55 * f.z})`; ctx.lineWidth = .8 + f.z * 3.2;
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - vx * 2.4, f.y - vy * 2.4); ctx.stroke();
        }
      }
    },
    sunset: { // everything catches fire
      init: () => ({ ps: [], sp: [sprite("255,235,130"), sprite("255,140,30"), sprite("210,40,10")] }),
      draw(ctx, W, H, p, s) {
        ctx.clearRect(0, 0, W, H);
        const g = ctx.createLinearGradient(0, H, 0, 0);
        g.addColorStop(0, `rgba(255,120,20,${.92 * p})`); g.addColorStop(.6, `rgba(200,40,10,${.75 * p})`); g.addColorStop(1, `rgba(42,10,5,${.95 * p * p})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        for (let i = 0, n = 6 + 26 * p | 0; i < n; i++) s.ps.push({ x: rnd(0, W), y: H + 30, vx: rnd(-1.5, 1.5), vy: -rnd(5, 13) * (1 + p), r: rnd(40, 110), l: 0, m: rnd(40, 70) | 0 });
        ctx.globalCompositeOperation = "lighter";
        for (let i = s.ps.length - 1; i >= 0; i--) {
          const q = s.ps[i]; q.l++; if (q.l > q.m) { s.ps.splice(i, 1); continue; }
          q.x += q.vx + Math.sin(q.l * .3 + q.r) * 1.5; q.y += q.vy; const k = q.l / q.m;
          ctx.globalAlpha = (1 - k) * .75; ctx.drawImage(s.sp[k < .3 ? 0 : k < .65 ? 1 : 2], q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      }
    },
    matrix: { // hacker glitch: colour bands, torn code rows, blackout
      init: () => ({}),
      draw(ctx, W, H, p) {
        ctx.clearRect(0, 0, W, H); const C = ["rgba(0,255,102,.35)", "rgba(255,0,80,.3)", "rgba(0,220,255,.3)", "rgba(0,0,0,.85)"];
        for (let i = 0, n = 4 + 36 * p | 0; i < n; i++) { ctx.fillStyle = C[Math.random() * C.length | 0]; ctx.fillRect(rnd(-30, 30), rnd(0, H), W, rnd(3, 60 * (.3 + p))); }
        ctx.font = "16px monospace"; ctx.fillStyle = "#00ff66";
        for (let i = 0, n = 6 + 40 * p | 0; i < n; i++) { let str = ""; for (let k = 0; k < 40; k++) str += GL[Math.random() * GL.length | 0]; ctx.fillText(str, rnd(-100, W * .7), rnd(0, H)); }
        if (Math.random() < .2) { ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = `rgba(0,0,0,${Math.pow(p, 2.2)})`; ctx.fillRect(0, 0, W, H);
      }
    }
  };
  function play(href) {
    const th = FX[root.dataset.theme] ? root.dataset.theme : "ice", fx = FX[th];
    const cv = document.createElement("canvas"); cv.className = "trans-canvas"; document.body.appendChild(cv);
    const W = cv.width = innerWidth, H = cv.height = innerHeight, ctx = cv.getContext("2d"), st = fx.init(W, H), t0 = performance.now();
    document.body.classList.add("t-" + th);
    (function f(now) {
      const p = Math.min(1, (now - t0) / DUR); fx.draw(ctx, W, H, p, st);
      if (p < 1) requestAnimationFrame(f); else { sessionStorage.setItem("hm_trans", th); location.href = href; }
    })(t0);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-transition]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce) return;
    e.preventDefault(); if (busy) return; busy = true; play(a.href);
  });
  addEventListener("pageshow", e => {   // back button (page restored from cache): clean up
    if (!e.persisted) return; busy = false;
    document.querySelectorAll(".trans-canvas,.trans-cover").forEach(x => x.remove());
    document.body.className = document.body.className.replace(/\bt-\w+/g, "").trim();
  });
})();
