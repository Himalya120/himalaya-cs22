// ===== Admin: match schedule editor (uses helpers from admin.js) =====
let matchRows = [], counts = {}, editingId = null;
const MSTAT = { upcoming: "به‌زودی", live: "زنده", finished: "پایان یافته" };
const toLocalInput = iso => { const d = new Date(iso), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

function streamRow(title = "", url = "") {
  const d = document.createElement("div"); d.className = "stream-row";
  d.innerHTML = `<input placeholder="عنوان (مثلاً آپارات)" maxlength="40" value="${esc(title)}"><input placeholder="https://..." maxlength="300" dir="ltr" value="${esc(url)}"><button type="button" class="btn small danger">✖</button>`;
  d.querySelector("button").onclick = () => d.remove();
  $("#streamRows").appendChild(d);
}
function readStreams() {
  return [...document.querySelectorAll("#streamRows .stream-row")].map(r => { const [a, b] = r.querySelectorAll("input"); return { title: a.value.trim() || "Stream", url: b.value.trim() }; })
    .filter(s => /^https?:\/\//i.test(s.url));
}
function resetForm() {
  editingId = null; $("#matchForm").reset(); $("#streamRows").innerHTML = ""; streamRow();
  $("#mfTitle").textContent = "مسابقه جدید"; $("#mCancel").hidden = true;
}
async function loadMatches() {
  const [m, c] = await Promise.all([sb.from("matches").select("*").order("match_time", { ascending: true }), sb.rpc("match_vote_counts")]);
  if (m.error) return toast(m.error.message, true);
  matchRows = m.data; counts = {}; (c.data || []).forEach(x => counts[x.match_id] = x); renderMatchItems();
}
function renderMatchItems() {
  $("#matchItems").innerHTML = matchRows.length ? matchRows.map(m => {
    const c = counts[m.id] || { a_count: 0, b_count: 0 };
    return `<div class="card item"><span class="badge b-${m.status}">${MSTAT[m.status]}</span>
      <h3>${esc(m.team_a)} vs ${esc(m.team_b)}</h3>
      ${row("زمان", fmt(m.match_time))}${row("حدس‌ها", `${esc(m.team_a)}: ${c.a_count} · ${esc(m.team_b)}: ${c.b_count}`)}
      ${m.winner ? row("برنده", esc(m.winner === "a" ? m.team_a : m.team_b)) : ""}${row("استریم‌ها", (m.streams || []).map(s => esc(s.title)).join("، "))}
      <div class="acts"><button class="btn small" data-mact="edit" data-id="${m.id}">ویرایش</button>
      <button class="btn small danger" data-mact="del" data-id="${m.id}">حذف</button></div></div>`;
  }).join("") : '<div class="empty">هنوز مسابقه‌ای ثبت نشده</div>';
}
$("#matchForm").onsubmit = async e => {
  e.preventDefault();
  const payload = {
    team_a: $("#mA").value.trim(), team_b: $("#mB").value.trim(), match_time: new Date($("#mTime").value).toISOString(),
    status: $("#mStatus").value, winner: $("#mWinner").value || null, streams: readStreams()
  };
  const q = editingId ? sb.from("matches").update(payload).eq("id", editingId) : sb.from("matches").insert(payload);
  const { error } = await q;
  if (error) return toast(error.message, true);
  toast("ذخیره شد و در سایت نمایش داده می‌شود"); resetForm(); loadMatches();
};
$("#matchItems").onclick = async e => {
  const b = e.target.closest("[data-mact]"); if (!b) return;
  const m = matchRows.find(x => x.id === b.dataset.id);
  if (b.dataset.mact === "del") {
    if (!confirm("مسابقه و حدس‌هایش حذف شود؟")) return;
    const { error } = await sb.from("matches").delete().eq("id", m.id);
    return error ? toast(error.message, true) : (toast("حذف شد"), loadMatches());
  }
  editingId = m.id; $("#mA").value = m.team_a; $("#mB").value = m.team_b; $("#mTime").value = toLocalInput(m.match_time);
  $("#mStatus").value = m.status; $("#mWinner").value = m.winner || "";
  $("#streamRows").innerHTML = ""; (m.streams.length ? m.streams : [{}]).forEach(s => streamRow(s.title, s.url));
  $("#mfTitle").textContent = "ویرایش مسابقه"; $("#mCancel").hidden = false;
  $("#matchForm").scrollIntoView({ behavior: "smooth", block: "center" });
};
$("#addStream").onclick = () => streamRow(); $("#mCancel").onclick = resetForm;
resetForm();
