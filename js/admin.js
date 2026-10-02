// ===== Admin panel: username/password login (Supabase Auth), approve / reject / delete =====
const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = s => document.querySelector(s);
const USER_DOMAIN = "@himalaya.admin"; // "admin" -> admin@himalaya.admin
let tab = "registrations", filter = "all", regs = [], msgs = [], timer;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = d => new Date(d).toLocaleString("fa-IR");
const STATUS = { pending: "در انتظار", approved: "تایید شده", rejected: "رد شده" };
function toast(m, bad) { const el = $("#toast"); el.textContent = m; el.className = "toast show" + (bad ? " bad" : ""); setTimeout(() => el.className = "toast", 3000); }

// ---- Auth ----
async function login(e) {
  e.preventDefault(); $("#err").textContent = ""; $("#loginBtn").disabled = true;
  const u = $("#user").value.trim();
  const email = u.includes("@") ? u : u + USER_DOMAIN;
  const { error } = await sb.auth.signInWithPassword({ email, password: $("#pass").value });
  $("#loginBtn").disabled = false;
  if (error) return $("#err").textContent = "نام کاربری یا رمز اشتباه است";
  await enter();
}
async function enter() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show(false);
  const { data } = await sb.from("admins").select("email").maybeSingle();
  if (!data) { await sb.auth.signOut(); show(false); return $("#err").textContent = "این کاربر دسترسی ادمین ندارد"; }
  show(true); await load(); clearInterval(timer); timer = setInterval(load, 30000);
}
function show(on) { $("#loginForm").hidden = on; $("#panel").hidden = !on; $("#logoutBtn").hidden = !on; $("#dock").hidden = !on; }

// ---- Data ----
async function load() {
  const [r, m] = await Promise.all([
    sb.from("registrations").select("*").order("created_at", { ascending: false }),
    sb.from("messages").select("*").order("created_at", { ascending: false })
  ]);
  if (r.error || m.error) return toast((r.error || m.error).message, true);
  regs = r.data; msgs = m.data; render();
}
async function setStatus(id, status) {
  const { error } = await sb.from("registrations").update({ status }).eq("id", id);
  if (error) return toast(error.message, true); toast("انجام شد"); load();
}
async function toggleRead(id, is_read) {
  const { error } = await sb.from("messages").update({ is_read }).eq("id", id);
  if (error) return toast(error.message, true); load();
}
async function remove(table, id) {
  if (!confirm("مطمئنی حذف شود؟ این کار برگشت ندارد.")) return;
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) return toast(error.message, true); toast("حذف شد"); load();
}

// ---- Render ----
const row = (k, v) => v ? `<div class="row"><i>${k}</i><span>${v}</span></div>` : "";
function regCard(r) {
  const link = /^https?:\/\//i.test(r.steam) ? `<a href="${esc(r.steam)}" target="_blank" rel="noopener">${esc(r.steam)}</a>` : esc(r.steam);
  return `<div class="card item tilt"><span class="badge b-${r.status}">${STATUS[r.status]}</span>
    <h3>${esc(r.name)}</h3>
    ${row("روبیکا/تلگرام", esc(r.contact_id))}${row("استیم", link)}${row("ساعت بازی", esc(r.playtime))}
    ${row("ایمیل", esc(r.email))}${row("نام تیم", esc(r.team_name))}${row("توضیحات", esc(r.note))}${row("تاریخ ثبت", fmt(r.created_at))}
    <div class="acts">
      <button class="btn small ok" data-act="approved" data-id="${r.id}">✔ تایید</button>
      <button class="btn small ghost" data-act="rejected" data-id="${r.id}">✖ رد</button>
      <button class="btn small danger" data-act="del-reg" data-id="${r.id}">حذف</button>
    </div></div>`;
}
function msgCard(m) {
  return `<div class="card item tilt">${m.is_read ? "" : '<span class="badge b-new">جدید</span>'}
    <h3>${esc(m.name || "بدون نام")}</h3><div class="msg-body">${esc(m.body)}</div>${row("تاریخ", fmt(m.created_at))}
    <div class="acts">
      <button class="btn small ok" data-act="read" data-id="${m.id}" data-v="${!m.is_read}">${m.is_read ? "علامت: نخوانده" : "✔ خوانده شد"}</button>
      <button class="btn small danger" data-act="del-msg" data-id="${m.id}">حذف</button>
    </div></div>`;
}
function render() {
  const isM = tab === "matches"; $("#viewList").hidden = isM; $("#viewMatches").hidden = !isM;
  if (isM) { if (typeof loadMatches === "function") loadMatches(); return; }
  $("#sAll").textContent = regs.length;
  for (const s of ["pending", "approved", "rejected"]) $("#s" + s[0].toUpperCase() + s.slice(1)).textContent = regs.filter(r => r.status === s).length;
  $("#sMsg").textContent = msgs.filter(m => !m.is_read).length;
  const q = $("#search").value.toLowerCase();
  $("#filters").hidden = tab !== "registrations";
  const list = (tab === "registrations" ? regs.filter(r => filter === "all" || r.status === filter) : msgs)
    .filter(x => JSON.stringify(x).toLowerCase().includes(q));
  $("#items").innerHTML = list.length ? list.map(tab === "registrations" ? regCard : msgCard).join("") : '<div class="empty">موردی پیدا نشد</div>';
}
function exportCsv() {
  const cols = tab === "registrations" ? ["name", "contact_id", "steam", "playtime", "email", "team_name", "note", "status", "created_at"] : ["name", "body", "is_read", "created_at"];
  const data = tab === "registrations" ? regs : msgs;
  const csv = [cols.join(",")].concat(data.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = tab + ".csv"; a.click();
}

// ---- Events ----
$("#loginForm").onsubmit = login;
$("#logoutBtn").onclick = async () => { await sb.auth.signOut(); clearInterval(timer); show(false); };
$("#refreshBtn").onclick = load; $("#csvBtn").onclick = exportCsv; $("#search").oninput = render;
document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === b)); render(); });
document.querySelectorAll("[data-filter]").forEach(b => b.onclick = () => { filter = b.dataset.filter; document.querySelectorAll("[data-filter]").forEach(x => x.classList.toggle("active", x === b)); render(); });
$("#items").onclick = e => {
  const b = e.target.closest("[data-act]"); if (!b) return; const { act, id } = b.dataset;
  if (act === "approved" || act === "rejected") setStatus(id, act);
  else if (act === "del-reg") remove("registrations", id);
  else if (act === "del-msg") remove("messages", id);
  else if (act === "read") toggleRead(id, b.dataset.v === "true");
};
enter();
