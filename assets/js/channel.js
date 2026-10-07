// ===== Channel box (read-only feed of image + text posts, Telegram-channel style) =====
let chPosts = [], chFirst = true;
const escC = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const chUrl = p => sb.storage.from("channel").getPublicUrl(p).data.publicUrl;

function renderChannel() {
  const feed = document.getElementById("chFeed"); if (!feed) return;
  const loc = lang === "fa" ? "fa-IR" : "en-GB";
  feed.innerHTML = chPosts.length ? chPosts.map(p => `<div class="chpost">
      ${p.image_path ? `<img src="${chUrl(p.image_path)}" loading="lazy" alt="">` : ""}
      ${p.body ? `<p>${escC(p.body)}</p>` : ""}
      <time>${new Date(p.created_at).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" })}</time></div>`).join("")
    : `<div class="news-none">${t("ch_none")}</div>`;
}
async function loadChannel() {
  const feed = document.getElementById("chFeed"); if (!feed) return;
  const { data, error } = await sb.from("channel_posts").select("*").order("created_at", { ascending: true }).limit(60);
  if (error) return;
  const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
  const changed = JSON.stringify(data.map(p => p.id)) !== JSON.stringify(chPosts.map(p => p.id));
  chPosts = data;
  if (changed || chFirst) { renderChannel(); if (chFirst || nearBottom) feed.scrollTop = feed.scrollHeight; chFirst = false; }
}
document.getElementById("chFeed")?.addEventListener("click", e => {
  if (e.target.tagName !== "IMG") return;
  const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${e.target.src}" alt="">`;
  lb.onclick = () => lb.remove(); document.body.appendChild(lb);
});
loadChannel(); setInterval(loadChannel, 30000);
