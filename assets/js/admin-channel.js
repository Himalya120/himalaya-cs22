// ===== Admin: channel posts (image + text) =====
const CH_BUCKET = "channel";
let chRows = [], chFile = null;
const chPub = p => sb.storage.from(CH_BUCKET).getPublicUrl(p).data.publicUrl;

async function shrink(file) {            // max 1280px JPEG to save storage; GIFs are kept as they are
  if (file.type === "image/gif") return { blob: file, ext: "gif", type: "image/gif" };
  const img = await createImageBitmap(file), k = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return { blob: await new Promise(r => c.toBlob(r, "image/jpeg", .85)), ext: "jpg", type: "image/jpeg" };
}
$("#chFile").onchange = e => {
  chFile = e.target.files[0] || null; const p = $("#chPrev");
  if (chFile) { p.src = URL.createObjectURL(chFile); p.hidden = false; } else p.hidden = true;
};
async function loadChannelAdmin() {
  const { data, error } = await sb.from("channel_posts").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return toast(dbErr(error), true);
  chRows = data;
  $("#chItems").innerHTML = chRows.length ? chRows.map(p => `<div class="card item">
      ${p.image_path ? `<img class="adm-thumb" src="${chPub(p.image_path)}" alt="">` : ""}
      ${p.body ? `<div class="msg-body">${esc(p.body)}</div>` : ""}${row("تاریخ", fmt(p.created_at))}
      <div class="acts"><button class="btn small danger" data-pid="${p.id}">حذف</button></div></div>`).join("")
    : '<div class="empty">هنوز پستی منتشر نشده</div>';
}
window.loadChannel = loadChannelAdmin;
$("#chForm").onsubmit = async e => {
  e.preventDefault();
  const body = $("#chText").value.trim(); if (!body && !chFile) return toast("یک عکس یا متن بنویس", true);
  const btn = $("#chSend"); btn.disabled = true; let path = null;
  try {
    if (chFile) {
      if (!chFile.type.startsWith("image/")) throw new Error("فقط فایل تصویر مجاز است");
      const { blob, ext, type } = await shrink(chFile);
      if (blob.size > 5242880) throw new Error("حجم عکس بعد از فشرده‌سازی از ۵ مگابایت بیشتر است");
      path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await sb.storage.from(CH_BUCKET).upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (up.error) throw up.error;
    }
    const { error } = await sb.from("channel_posts").insert({ body: body || null, image_path: path });
    if (error) { if (path) await sb.storage.from(CH_BUCKET).remove([path]); throw error; }
    toast("پست در کانال منتشر شد"); $("#chForm").reset(); chFile = null; $("#chPrev").hidden = true; loadChannelAdmin();
  } catch (err) { toast(dbErr(err), true); }
  btn.disabled = false;
};
$("#chItems").onclick = async e => {
  const b = e.target.closest("[data-pid]"); if (!b) return;
  if (!confirm("این پست حذف شود؟")) return;
  const p = chRows.find(x => x.id === b.dataset.pid);
  const { error } = await sb.from("channel_posts").delete().eq("id", p.id);
  if (error) return toast(dbErr(error), true);
  if (p.image_path) await sb.storage.from(CH_BUCKET).remove([p.image_path]);
  toast("حذف شد"); loadChannelAdmin();
};
