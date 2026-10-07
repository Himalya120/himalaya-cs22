// ===== Admin: news editor (uses helpers from admin.js) =====
let newsRows = [], editingNewsId = null;

function resetNews() {
  editingNewsId = null; $("#newsForm").reset(); $("#nfTitle").textContent = "خبر جدید"; $("#nCancel").hidden = true;
}
async function loadNews() {
  const { data, error } = await sb.from("news").select("*").order("created_at", { ascending: false });
  if (error) return toast(dbErr(error), true);
  newsRows = data;
  $("#newsItems").innerHTML = newsRows.length ? newsRows.map(n => `<div class="card item">
      <h3>${esc(n.title)}</h3><div class="msg-body">${esc(n.body)}</div>${row("تاریخ انتشار", fmt(n.created_at))}
      <div class="acts"><button class="btn small" data-nact="edit" data-id="${n.id}">ویرایش</button>
      <button class="btn small danger" data-nact="del" data-id="${n.id}">حذف</button></div></div>`).join("")
    : '<div class="empty">هنوز خبری منتشر نشده</div>';
}
$("#newsForm").onsubmit = async e => {
  e.preventDefault();
  const payload = { title: $("#nTitle").value.trim(), body: $("#nBody").value.trim() };
  const wasEdit = !!editingNewsId;
  const { error } = await (wasEdit ? sb.from("news").update(payload).eq("id", editingNewsId) : sb.from("news").insert(payload));
  if (error) return toast(dbErr(error), true);
  toast(wasEdit ? "خبر ویرایش شد" : "خبر منتشر شد؛ برای بازدیدکننده‌ها نقطه قرمز می‌آید"); resetNews(); loadNews();
};
$("#newsItems").onclick = async e => {
  const b = e.target.closest("[data-nact]"); if (!b) return;
  const n = newsRows.find(x => x.id === b.dataset.id);
  if (b.dataset.nact === "del") {
    if (!confirm("این خبر حذف شود؟")) return;
    const { error } = await sb.from("news").delete().eq("id", n.id);
    return error ? toast(dbErr(error), true) : (toast("حذف شد"), loadNews());
  }
  editingNewsId = n.id; $("#nTitle").value = n.title; $("#nBody").value = n.body;
  $("#nfTitle").textContent = "ویرایش خبر"; $("#nCancel").hidden = false;
  $("#newsForm").scrollIntoView({ behavior: "smooth", block: "center" });
};
$("#nCancel").onclick = resetNews;
resetNews();
