// ===== Admin: countdown timer (title + duration; the server computes the end time) =====
let timerRows = [];
async function loadTimers() {
  const { data, error } = await sb.from("timers").select("*").order("created_at", { ascending: false }).limit(10);
  if (error) return toast(dbErr(error), true);
  timerRows = data;
  $("#timerItems").innerHTML = timerRows.length ? timerRows.map(t => {
    const active = new Date(t.ends_at) > new Date();
    return `<div class="card item"><span class="badge ${active ? "b-live" : "b-finished"}">${active ? "در حال شمارش" : "تمام شده"}</span>
      <h3>${esc(t.title)}</h3>${row("پایان", fmt(t.ends_at))}${row("پیام پایان", esc(t.finish_text || "پیش‌فرض"))}
      <div class="acts"><button class="btn small danger" data-tid="${t.id}">${active ? "لغو تایمر" : "حذف"}</button></div></div>`;
  }).join("") : '<div class="empty">تایمری ثبت نشده</div>';
}
$("#timerForm").onsubmit = async e => {
  e.preventDefault();
  const sec = (+$("#tmH").value || 0) * 3600 + (+$("#tmM").value || 0) * 60 + (+$("#tmS").value || 0);
  if (sec < 10) return toast("مدت تایمر باید حداقل ۱۰ ثانیه باشد", true);
  if (sec > 604800) return toast("حداکثر مدت تایمر ۷ روز است", true);
  const { error } = await sb.from("timers").insert({ title: $("#tmTitle").value.trim(), duration_seconds: sec, finish_text: $("#tmFinish").value.trim() || null });
  if (error) return toast(dbErr(error), true);
  toast("تایمر شروع شد و تا چند ثانیه دیگر در سایت ظاهر می‌شود"); $("#timerForm").reset(); loadTimers();
};
$("#timerItems").onclick = async e => {
  const b = e.target.closest("[data-tid]"); if (!b) return;
  if (!confirm("این تایمر حذف شود؟")) return;
  const { error } = await sb.from("timers").delete().eq("id", b.dataset.tid);
  return error ? toast(dbErr(error), true) : (toast("انجام شد"), loadTimers());
};
