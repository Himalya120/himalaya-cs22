// ===== Music player (bottom-left corner). Songs are listed in assets/js/playlist.js =====
(function () {
  const list = window.PLAYLIST || []; if (!list.length) return;
  const KEY = "himalaya_player";
  const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  const st = { i: Math.min(saved.i || 0, list.length - 1), t: saved.t || 0, play: saved.play !== false, vol: saved.vol ?? 0.6, open: !!saved.open };
  const save = () => localStorage.setItem(KEY, JSON.stringify({ ...st, t: audio.currentTime || 0 }));
  const audio = new Audio(); audio.preload = "metadata"; audio.volume = st.vol;

  const I = {
    note: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M9 3v12.3A3.5 3.5 0 1 0 11 18.5V8h6V3z"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5h2v14H6zm3.5 7L19 19V5z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 5h2v14h-2zM5 19l9.5-7L5 5z"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
  };
  const root = document.createElement("div"); root.id = "mplayer"; if (st.open) root.classList.add("open");
  root.innerHTML = `
    <button class="mp-fab" aria-label="Open music player">${I.note}<span class="eq"><i></i><i></i><i></i></span></button>
    <div class="mp-card">
      <button class="mp-close" aria-label="Collapse player">${I.down}</button>
      <div class="mp-cover"></div>
      <div class="mp-title"></div><div class="mp-artist"></div>
      <div class="mp-bar"><span><i></i></span></div>
      <div class="mp-times"><em class="cur">0:00</em><em class="tot">0:00</em></div>
      <div class="mp-ctrl">
        <button class="mp-prev" aria-label="Previous">${I.prev}</button>
        <button class="mp-play" aria-label="Play / Pause">${I.play}</button>
        <button class="mp-next" aria-label="Next">${I.next}</button>
      </div>
      <input class="mp-vol" type="range" min="0" max="1" step="0.05" value="${st.vol}" aria-label="Volume">
    </div>`;
  document.body.appendChild(root);
  const q = s => root.querySelector(s);
  const fmt = s => isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00";

  let errors = 0, lastSave = 0;
  function load(i, t = 0, autoplay = true) {
    st.i = (i + list.length) % list.length; const s = list[st.i];
    audio.src = s.file;
    if (t) audio.addEventListener("loadedmetadata", () => { audio.currentTime = t; }, { once: true });
    q(".mp-title").textContent = s.title; q(".mp-artist").textContent = s.artist;
    q(".mp-cover").innerHTML = s.cover ? `<img src="${s.cover}" alt="">` : I.note;
    q(".cur").textContent = fmt(t); q(".tot").textContent = "0:00"; q(".mp-bar i").style.width = "0%";
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: s.title, artist: s.artist, artwork: s.cover ? [{ src: s.cover, sizes: "320x320", type: "image/jpeg" }] : [] });
    if (autoplay) tryPlay(); save();
  }
  function tryPlay() { audio.play().catch(waitForGesture); }
  function waitForGesture() {
    const evs = ["pointerdown", "keydown", "touchstart"];
    const go = e => {
      evs.forEach(n => document.removeEventListener(n, go, true));
      if (e.target.closest && e.target.closest("#mplayer")) return; // the player's own buttons handle it
      if (st.play && audio.paused) audio.play().catch(() => { });
    };
    evs.forEach(n => document.addEventListener(n, go, true));
  }
  function toggle() { if (audio.paused) { st.play = true; tryPlay(); } else { st.play = false; audio.pause(); } save(); }
  const go = d => { load(st.i + d, 0, true); };

  audio.addEventListener("play", () => { root.classList.add("playing"); q(".mp-play").innerHTML = I.pause; errors = 0; });
  audio.addEventListener("pause", () => { root.classList.remove("playing"); q(".mp-play").innerHTML = I.play; });
  audio.addEventListener("ended", () => go(1));
  audio.addEventListener("error", () => { if (++errors < list.length) setTimeout(() => go(1), 800); });
  audio.addEventListener("loadedmetadata", () => { q(".tot").textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    q(".cur").textContent = fmt(audio.currentTime);
    q(".mp-bar i").style.width = (audio.duration ? audio.currentTime / audio.duration * 100 : 0) + "%";
    if (Date.now() - lastSave > 1000) { lastSave = Date.now(); save(); }
  });

  q(".mp-fab").onclick = () => { root.classList.add("open"); st.open = true; save(); };
  q(".mp-close").onclick = () => { root.classList.remove("open"); st.open = false; save(); };
  q(".mp-play").onclick = toggle; q(".mp-prev").onclick = () => go(-1); q(".mp-next").onclick = () => go(1);
  q(".mp-bar").addEventListener("pointerdown", e => {
    const r = q(".mp-bar span").getBoundingClientRect();
    if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
  });
  q(".mp-vol").oninput = e => { st.vol = audio.volume = +e.target.value; save(); };
  addEventListener("pagehide", save);
  let pausedForVideo = false;
  addEventListener("hm-video-open", () => { if (!audio.paused) { pausedForVideo = true; audio.pause(); } });
  addEventListener("hm-video-close", () => { if (pausedForVideo && st.play) audio.play().catch(() => { }); pausedForVideo = false; });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => { st.play = true; tryPlay(); });
    navigator.mediaSession.setActionHandler("pause", () => { st.play = false; audio.pause(); save(); });
    navigator.mediaSession.setActionHandler("previoustrack", () => go(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => go(1));
  }
  load(st.i, st.t, st.play);
})();
