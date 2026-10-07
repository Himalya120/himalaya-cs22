// ===== Floating countdown timer (top of Home) + big "started" message with confetti =====
(function () {
  const box = document.getElementById("timerBox"); if (!box) return;
  let offset = 0, cur = null;
  const now = () => Date.now() + offset, pad = n => String(n).padStart(2, "0");

  async function sync() { const { data } = await sb.rpc("server_now"); if (data) offset = new Date(data).getTime() - Date.now(); }
  function show(tm) {
    cur = tm; document.getElementById("tbTitle").textContent = tm.title; tick();
    box.classList.remove("out"); box.hidden = false;
  }
  function hide() { cur = null; if (box.hidden) return; box.classList.add("out"); setTimeout(() => { if (!cur) box.hidden = true; }, 800); }
  function finish(tm) { hide(); celebrate(tm); }

  async function poll() {
    const { data, error } = await sb.from("timers").select("*").order("created_at", { ascending: false }).limit(1);
    if (error) return;
    const tm = data && data[0];
    if (!tm) return hide();
    const active = new Date(tm.ends_at).getTime() > now();
    if (active) { if (!cur || cur.id !== tm.id) show(tm); }
    else if (!cur) hide();                    // already over and nobody was watching it
  }
  function tick() {
    if (!cur) return;
    const s = Math.ceil((new Date(cur.ends_at).getTime() - now()) / 1000);
    if (s <= 0) return finish(cur);
    document.getElementById("tbDigits").textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
  }

  function celebrate(tm) {
    const ov = document.createElement("div"); ov.className = "timer-finish";
    ov.innerHTML = `<div class="tf-text"></div>`; ov.firstChild.textContent = tm.finish_text || t("tm_started");
    document.body.appendChild(ov); confetti(5500);
    setTimeout(() => { ov.classList.add("out"); setTimeout(() => ov.remove(), 1000); }, 7000);
  }
  function confetti(ms) {
    const cv = document.createElement("canvas"); cv.className = "confetti"; document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff", "#ff9f1c", "#ffffff"], ps = [], end = performance.now() + ms;
    const spawn = n => { for (let i = 0; i < n; i++) ps.push({ x: Math.random() * W, y: -20 - Math.random() * H * .4, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, w: 6 + Math.random() * 8, h: 10 + Math.random() * 10, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, c: cols[Math.random() * cols.length | 0], ph: Math.random() * 6 }); };
    spawn(240);
    (function f(tm) {
      ctx.clearRect(0, 0, W, H); if (tm < end && Math.random() < .6) spawn(7);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.vy += .06; p.vx += Math.sin(p.ph += .08) * .05; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > H + 30) { ps.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (tm < end || ps.length) requestAnimationFrame(f); else cv.remove();
    })(performance.now());
  }
  sync().then(poll);
  setInterval(tick, 250); setInterval(poll, 10000); setInterval(sync, 300000);
})();
