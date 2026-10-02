// ===== Main site logic (no login needed for visitors) =====
const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = s => document.querySelector(s);
let lang = localStorage.getItem("lang") || "fa";
const t = k => I18N[lang][k] || k;
const FIELDS = { name: "name", contact: "contact_id", steam: "steam", play: "playtime", email: "email", team: "team_name", note: "note" };

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  $("#langBtn").textContent = lang === "en" ? "فارسی" : "EN";
  if (window.refreshThemeLabel) refreshThemeLabel();
  if (typeof renderMatches === "function") renderMatches();
}
function toast(msg, bad) {
  const el = $("#toast"); el.textContent = msg; el.className = "toast show" + (bad ? " bad" : "");
  setTimeout(() => el.className = "toast", 3800);
}
async function submitReg(e) {
  e.preventDefault();
  const btn = $("#regSubmit"); btn.disabled = true;
  const row = {};
  for (const [id, col] of Object.entries(FIELDS)) row[col] = $("#" + id).value.trim() || null;
  const { error } = await sb.from("registrations").insert(row);
  btn.disabled = false;
  if (error) return toast(t("err") + error.message, true);
  $("#regForm").reset(); toast(t("ok_saved"));
}
async function submitMsg(e) {
  e.preventDefault();
  const { error } = await sb.from("messages").insert({ name: $("#cName").value.trim(), body: $("#cMsg").value.trim() });
  if (error) return toast(t("err") + error.message, true);
  $("#msgForm").reset(); toast(t("ok_sent"));
}
// Load Aparat player / chat inside the page on demand
document.querySelectorAll("[data-embed]").forEach(btn => btn.onclick = () => {
  const f = document.createElement("iframe");
  f.src = APP_CONFIG[btn.dataset.embed]; f.allowFullscreen = true; f.title = btn.dataset.embed;
  btn.closest(".poster").replaceWith(f);
});
// 3D tilt on cards + hero cube parallax
document.addEventListener("mousemove", e => {
  document.querySelectorAll(".tilt").forEach(c => {
    const r = c.getBoundingClientRect();
    if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40) { c.style.transform = ""; return; }
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
  });
  const w = $(".scene"); if (w) w.style.setProperty("--tilt", `${(e.clientX / innerWidth - .5) * 40}deg`);
});
// Init
$("#langBtn").onclick = () => { lang = lang === "en" ? "fa" : "en"; localStorage.setItem("lang", lang); applyLang(); };
$("#regForm").onsubmit = submitReg; $("#msgForm").onsubmit = submitMsg;
applyLang();
