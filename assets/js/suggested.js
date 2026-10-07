// ===== Main page: moving strip of featured videos =====
let featuredVideos = [];
function renderSuggested() {
  const sec = document.getElementById("suggested"), track = document.getElementById("track"); if (!sec) return;
  if (!featuredVideos.length) { sec.hidden = true; return; }
  let base = [...featuredVideos]; while (base.length < 8) base = base.concat(featuredVideos);
  const html = base.map(VC.card).join("");
  track.innerHTML = html + html;                      // two copies = seamless loop
  track.style.setProperty("--dur", Math.max(35, base.length * 6) + "s");
  sec.hidden = false;
}
async function loadSuggested() {
  const { data, error } = await sb.from("videos").select("*").eq("featured", true).order("created_at", { ascending: false }).limit(24);
  if (error) return; featuredVideos = data || []; renderSuggested();
}
document.getElementById("track")?.addEventListener("click", e => {
  const c = e.target.closest(".vcard"); if (!c) return;
  const v = featuredVideos.find(x => x.id === c.dataset.vid); if (v) VC.open(v);
});
loadSuggested(); setInterval(loadSuggested, 120000);
