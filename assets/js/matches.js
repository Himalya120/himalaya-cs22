// ===== Match schedule: list, countdown, predictions =====
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const voter = localStorage.getItem("voter") || (() => { const v = crypto.randomUUID(); localStorage.setItem("voter", v); return v; })();
const myVotes = () => JSON.parse(localStorage.getItem("votes") || "{}");
let matches = [], counts = {};

async function loadMatches() {
  const [m, c] = await Promise.all([
    sb.from("matches").select("*").order("match_time", { ascending: true }),
    sb.rpc("match_vote_counts")
  ]);
  if (m.error) return;
  matches = m.data || []; counts = {};
  (c.data || []).forEach(x => counts[x.match_id] = x);
  renderMatches();
}
function bars(m) {
  const c = counts[m.id] || { a_count: 0, b_count: 0 }, a = +c.a_count, b = +c.b_count, tot = a + b;
  if (!tot) return "";
  const pa = Math.round(a / tot * 100), pb = 100 - pa;
  const bar = (name, n, p) => `<div class="bar"><i style="--w:${p}%"></i><span><b>${esc(name)}</b><em>${p}% · ${n}</em></span></div>`;
  return `<div class="bars"><small>${t("m_preds")}</small>${bar(m.team_a, a, pa)}${bar(m.team_b, b, pb)}</div>`;
}
function card(m) {
  const my = myVotes()[m.id];
  const when = new Date(m.match_time).toLocaleString(lang === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  let predict = bars(m);
  if (m.status === "upcoming") {
    predict = my
      ? `<div class="mine">✔ ${t("m_yours")}: <b>${esc(my === "a" ? m.team_a : m.team_b)}</b></div>` + predict
      : `<div class="pick-title">${t("m_predict")}</div><div class="pick">
           <button class="btn" data-vote="a" data-id="${m.id}">${esc(m.team_a)}</button>
           <button class="btn ghost" data-vote="b" data-id="${m.id}">${esc(m.team_b)}</button></div>` + predict;
  }
  const streams = (m.streams || []).filter(s => /^https?:\/\//i.test(s.url))
    .map(s => `<a class="btn small" target="_blank" rel="noopener" href="${esc(s.url)}">▶ ${esc(s.title)}</a>`).join("");
  return `<div class="card match tilt"><span class="st st-${m.status}">${t("m_" + m.status)}</span>
    <div class="vs"><div class="team">${esc(m.team_a)}</div><div class="vs-mark">VS</div><div class="team">${esc(m.team_b)}</div></div>
    <div class="mtime">⏰ ${when}${m.status === "upcoming" ? `<span class="cd" data-time="${m.match_time}"></span>` : ""}</div>
    ${m.winner ? `<div class="winner">🏆 ${t("m_winner")}: ${esc(m.winner === "a" ? m.team_a : m.team_b)}</div>` : ""}
    ${predict}
    ${streams ? `<div class="pick-title">${t("m_streams")}</div><div class="streams">${streams}</div>` : ""}</div>`;
}
function renderMatches() {
  const box = document.getElementById("matchList"); if (!box) return;
  box.innerHTML = matches.length ? matches.map(card).join("") : `<div class="card none">${t("m_none")}</div>`;
  tick();
}
function tick() {
  document.querySelectorAll(".cd").forEach(el => {
    const s = Math.floor((new Date(el.dataset.time) - Date.now()) / 1000);
    if (s <= 0) return el.textContent = "";
    const p = n => String(n).padStart(2, "0");
    el.textContent = `${t("m_starts")} ${Math.floor(s / 86400)}d ${p(Math.floor(s % 86400 / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`;
  });
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-vote]"); if (!b) return;
  b.disabled = true;
  const { error } = await sb.from("predictions").insert({ match_id: b.dataset.id, choice: b.dataset.vote, voter_key: voter });
  if (error && error.code !== "23505") { b.disabled = false; return toast(t("err") + error.message, true); }
  const v = myVotes(); v[b.dataset.id] = b.dataset.vote; localStorage.setItem("votes", JSON.stringify(v));
  toast(t("m_voted")); loadMatches();
});
setInterval(tick, 1000);
setInterval(loadMatches, 60000);
loadMatches();
