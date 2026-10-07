// ===== videos.html logic =====
const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = s => document.querySelector(s);
let lang = localStorage.getItem("lang") || "fa", kind = "long", videos = [];
const t = k => I18N[lang][k] || k;

function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  $("#langBtn").textContent = lang === "en" ? "فارسی" : "EN";
  if (window.refreshThemeLabel) refreshThemeLabel();
  render();
}
function render() {
  const mine = videos.filter(v => v.platform === "youtube");
  const list = mine.filter(v => v.kind === kind);
  $("#cLong").textContent = mine.filter(v => v.kind === "long").length; $("#cShort").textContent = mine.filter(v => v.kind === "short").length;
  const g = $("#vGrid"); g.className = "vgrid " + kind;
  g.innerHTML = list.length ? list.map(VC.card).join("") : `<div class="vnone">${t("v_none")}</div>`;
}
async function load() {
  const { data, error } = await sb.from("videos").select("*").order("created_at", { ascending: false });
  if (!error) { videos = data || []; render(); }
}
document.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => {
  kind = b.dataset.kind; document.querySelectorAll("[data-kind]").forEach(x => x.classList.toggle("active", x === b)); render();
});
$("#vGrid").addEventListener("click", e => { const c = e.target.closest(".vcard"); if (c) VC.open(videos.find(v => v.id === c.dataset.vid)); });
$("#vGrid").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });
$("#langBtn").onclick = () => { lang = lang === "en" ? "fa" : "en"; localStorage.setItem("lang", lang); applyLang(); };
applyLang(); load(); setInterval(load, 120000);
