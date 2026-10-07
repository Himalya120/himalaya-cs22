// ===== Video cards + in-site player (modal). Used by the main page strip and videos.html =====
window.VC = (() => {
  const vEsc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tr = k => (window.I18N && I18N[document.documentElement.lang === "en" ? "en" : "fa"][k]) || k;
  let modal;

  function ensure() {
    if (modal) return modal;
    modal = document.createElement("div"); modal.className = "vmodal";
    modal.innerHTML = `<div class="vbox"><div class="vbar">
        <a class="btn small ghost vyt" target="_blank" rel="noopener"></a><span class="sp"></span>
        <button class="btn small ghost vbig"></button><button class="btn small danger vclose" aria-label="Close">✕</button></div>
      <div class="vframe"></div><div class="vtitle"></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    modal.querySelector(".vclose").onclick = close;
    modal.querySelector(".vbig").onclick = () => { modal.classList.toggle("big"); label(); };
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    return modal;
  }
  function label() {
    modal.querySelector(".vbig").textContent = "⤢ " + tr(modal.classList.contains("big") ? "v_small" : "v_big");
    modal.querySelector(".vyt").textContent = "▶ " + tr("v_yt");
  }
  function open(v) {
    const m = ensure();
    m.classList.remove("big"); m.classList.toggle("short", v.kind === "short");
    m.querySelector(".vframe").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&rel=0&playsinline=1" title="${vEsc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    m.querySelector(".vtitle").textContent = v.title; m.querySelector(".vyt").href = v.url;
    label(); m.classList.add("open"); document.body.classList.add("noscroll");
    window.dispatchEvent(new Event("hm-video-open"));
  }
  function close() {
    if (!modal || !modal.classList.contains("open")) return;
    modal.classList.remove("open"); modal.querySelector(".vframe").innerHTML = ""; document.body.classList.remove("noscroll");
    window.dispatchEvent(new Event("hm-video-close"));
  }
  const card = v => `<article class="vcard ${v.kind}" data-vid="${v.id}" tabindex="0" role="button">
    <div class="vthumb"><img src="${YTU.thumb(v.video_id)}" loading="lazy" alt="">
      <span class="vplay">▶</span>${YTU.isNew(v.created_at) ? `<span class="ribbon">${tr("v_new")}</span>` : ""}</div>
    <h3>${vEsc(v.title)}</h3></article>`;
  return { open, close, card, vEsc, tr };
})();
