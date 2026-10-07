// ===== YouTube helpers shared by the site and the admin panel =====
window.YTU = (() => {
  const NEW_DAYS = 4;
  // Returns { id, short } or null. Accepts watch / youtu.be / shorts / embed / live links.
  function parse(input) {
    let s = String(input || "").trim(); if (!s) return null;
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    try {
      const u = new URL(s), h = u.hostname.replace(/^(www|m|music)\./, ""); let id = null, short = false;
      if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0];
      else if (h === "youtube.com" || h === "youtube-nocookie.com") {
        if (u.pathname === "/watch") id = u.searchParams.get("v");
        else { const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/); if (m) { id = m[2]; short = m[1] === "shorts"; } }
      }
      return id && /^[\w-]{11}$/.test(id) ? { id, short } : null;
    } catch { return null; }
  }
  const thumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const watchUrl = (id, short) => short ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  const isNew = iso => Date.now() - new Date(iso).getTime() < NEW_DAYS * 864e5;
  return { parse, thumb, watchUrl, isNew };
})();
