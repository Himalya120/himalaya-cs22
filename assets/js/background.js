// ===== Background animation per theme: snow / embers / matrix rain =====
(function () {
  const cv = document.getElementById("bg"); if (!cv) return;
  const ctx = cv.getContext("2d"); let W, H, P = [], cols = [], mx = 0;
  const theme = () => document.documentElement.dataset.theme;
  const GLYPHS = "01アイウエオカキクケコサシスセソ<>{}=+*";
  function size() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    P = Array.from({ length: 150 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * .9 + .1, r: Math.random() * 2.5 + .6, ph: Math.random() * 6.28 }));
    cols = Array.from({ length: Math.ceil(W / 18) }, () => Math.random() * H / 18);
  }
  addEventListener("mousemove", e => mx = e.clientX / innerWidth - .5);
  function frame(t) {
    ctx.clearRect(0, 0, W, H); const th = theme();
    if (th === "matrix") {
      ctx.font = "16px monospace"; ctx.shadowBlur = 0;
      cols.forEach((y, i) => {
        for (let k = 0; k < 14; k++) {
          ctx.fillStyle = k === 0 ? "#d9ffe6" : `rgba(0,255,102,${.7 - k * .05})`;
          ctx.fillText(GLYPHS[(i * 7 + k + (y | 0)) % GLYPHS.length], i * 18, (y - k) * 18);
        }
        cols[i] = y * 18 > H + 300 && Math.random() > .975 ? 0 : y + .18 + (i % 5) * .03;
      });
    } else {
      const ice = th === "ice";
      for (const p of P) {
        if (ice) { p.y += p.z * 1.2; p.x += Math.sin(t / 1000 + p.ph) * .4 * p.z; }
        else { p.y -= p.z * .9; p.x += Math.sin(t / 900 + p.ph) * .5; }
        p.x += mx * p.z * 2;
        if (p.y > H + 10) p.y = -10; if (p.y < -10) p.y = H + 10;
        if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.z * 1.6, 0, 6.283);
        ctx.fillStyle = ice ? `rgba(220,245,255,${.35 + p.z * .55})` : `rgba(255,${120 + p.z * 90 | 0},60,${.25 + p.z * .6})`;
        ctx.shadowBlur = 8; ctx.shadowColor = ice ? "#9fe4ff" : "#ff7a2f"; ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  addEventListener("resize", size); size(); requestAnimationFrame(frame);
})();
