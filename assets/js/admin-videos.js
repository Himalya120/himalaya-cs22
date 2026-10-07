// ===== Admin: YouTube videos (paste link + title) =====
let vidRows = [], editingVid = null;

function previewLink() {
  const p = YTU.parse($("#vLink").value), box = $("#vPreview");
  if (!$("#vLink").value.trim()) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = p ? `<img src="${YTU.thumb(p.id)}" alt=""><span>${p.short ? "شورت (Shorts)" : "ویدیو بلند"} ✔</span>` : '<span style="color:#ff7b7f">لینک یوتیوب معتبر نیست</span>';
}
function resetVideo() { editingVid = null; $("#videoForm").reset(); $("#vPreview").hidden = true; $("#vfTitle").textContent = "ویدیوی جدید"; $("#vCancel").hidden = true; }
async function loadVideos() {
  const { data, error } = await sb.from("videos").select("*").order("created_at", { ascending: false });
  if (error) return toast(dbErr(error), true);
  vidRows = data;
  $("#videoItems").innerHTML = vidRows.length ? vidRows.map(v => `<div class="card item">
      ${YTU.isNew(v.created_at) ? '<span class="badge b-new">جدید</span>' : ""}
      <img class="adm-thumb" src="${YTU.thumb(v.video_id)}" alt="">
      <h3>${esc(v.title)}</h3>${row("نوع", v.kind === "short" ? "شورت" : "ویدیو بلند")}${row("تاریخ", fmt(v.created_at))}
      <label class="chk"><input type="checkbox" data-feat="${v.id}" ${v.featured ? "checked" : ""}> نمایش در نوار پیشنهادی صفحه اصلی</label>
      <div class="acts"><button class="btn small" data-vact="edit" data-id="${v.id}">ویرایش</button>
      <button class="btn small danger" data-vact="del" data-id="${v.id}">حذف</button></div></div>`).join("")
    : '<div class="empty">هنوز ویدیویی اضافه نشده</div>';
}
$("#vLink").oninput = previewLink;
$("#videoForm").onsubmit = async e => {
  e.preventDefault();
  const p = YTU.parse($("#vLink").value); if (!p) return toast("لینک یوتیوب معتبر نیست", true);
  const payload = { platform: "youtube", video_id: p.id, url: YTU.watchUrl(p.id, p.short), title: $("#vTitle").value.trim(), kind: p.short ? "short" : "long", featured: $("#vFeat").checked };
  const wasEdit = !!editingVid;
  const { error } = await (wasEdit ? sb.from("videos").update(payload).eq("id", editingVid) : sb.from("videos").insert(payload));
  if (error) return toast(dbErr(error), true);
  toast(wasEdit ? "ویدیو ویرایش شد" : "ویدیو اضافه شد و در سایت نمایش داده می‌شود"); resetVideo(); loadVideos();
};
$("#videoItems").onclick = async e => {
  const b = e.target.closest("[data-vact]"); if (!b) return; const v = vidRows.find(x => x.id === b.dataset.id);
  if (b.dataset.vact === "del") {
    if (!confirm("این ویدیو حذف شود؟")) return;
    const { error } = await sb.from("videos").delete().eq("id", v.id);
    return error ? toast(dbErr(error), true) : (toast("حذف شد"), loadVideos());
  }
  editingVid = v.id; $("#vLink").value = v.url; $("#vTitle").value = v.title; $("#vFeat").checked = v.featured; previewLink();
  $("#vfTitle").textContent = "ویرایش ویدیو"; $("#vCancel").hidden = false; $("#videoForm").scrollIntoView({ behavior: "smooth", block: "center" });
};
$("#videoItems").onchange = async e => {
  const c = e.target.closest("[data-feat]"); if (!c) return;
  const { error } = await sb.from("videos").update({ featured: c.checked }).eq("id", c.dataset.feat);
  if (error) { toast(dbErr(error), true); c.checked = !c.checked; } else toast(c.checked ? "به نوار پیشنهادی اضافه شد" : "از نوار پیشنهادی برداشته شد");
};
$("#vCancel").onclick = resetVideo; resetVideo();
