// ===== News bell: list of announcements + red dot for unread ones =====
const escN = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SEEN_KEY = "himalaya_news_seen";
let news = [];

async function loadNews() {
  const { data, error } = await sb.from("news").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) return;
  news = data || []; renderNews();
}
function hasUnread() {
  const seen = localStorage.getItem(SEEN_KEY);
  return news.some(n => !seen || new Date(n.created_at) > new Date(seen));
}
function renderNews() {
  const list = document.getElementById("newsList"); if (!list) return;
  document.getElementById("newsHead").textContent = t("n_title");
  const loc = lang === "fa" ? "fa-IR" : "en-GB";
  list.innerHTML = news.length
    ? news.map(n => `<article class="news-item"><h4>${escN(n.title)}</h4><p>${escN(n.body)}</p><time>${new Date(n.created_at).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" })}</time></article>`).join("")
    : `<div class="news-none">${t("n_none")}</div>`;
  const u = hasUnread();
  document.getElementById("bellDot").hidden = !u;
  document.getElementById("bellBtn").classList.toggle("unread", u);
}
const pop = () => document.getElementById("newsPop");
document.getElementById("bellBtn").onclick = () => {
  const open = pop().classList.toggle("open");
  if (open && news.length) { localStorage.setItem(SEEN_KEY, news[0].created_at); renderNews(); }
};
document.getElementById("newsClose").onclick = () => pop().classList.remove("open");
document.addEventListener("click", e => { if (!e.target.closest(".brand")) pop().classList.remove("open"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") pop().classList.remove("open"); });
setInterval(loadNews, 60000);
loadNews();
