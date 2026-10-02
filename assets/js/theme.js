// ===== One button that cycles the three themes (used by site + admin) =====
(function () {
  const T = [["ice", "❄️", "یخی", "Ice"], ["sunset", "🌅", "غروب", "Sunset"], ["matrix", "💚", "ماتریکس", "Matrix"]];
  const btn = document.getElementById("themeBtn"), root = document.documentElement;
  function label() {
    const th = T.find(x => x[0] === root.dataset.theme) || T[0];
    btn.textContent = th[1] + " " + (root.lang === "en" ? th[3] : th[2]);
  }
  function apply(name) { root.dataset.theme = name; localStorage.setItem("theme", name); label(); }
  btn.onclick = () => apply(T[(T.findIndex(x => x[0] === root.dataset.theme) + 1) % T.length][0]);
  window.refreshThemeLabel = label;
  apply(localStorage.getItem("theme") || "ice");
})();
