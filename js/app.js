const App = (() => {
  const VIEWS = { inicio: Inicio, estoque: Estoque, agenda: Agenda, mandar: Mandar };
  let atual = "inicio";

  function irPara(nome) {
    if (!VIEWS[nome]) return;
    atual = nome;
    document.querySelectorAll(".view").forEach((v) => {
      v.hidden = v.dataset.view !== nome;
      if (v.hidden) v.innerHTML = "";
    });
    document.querySelectorAll(".tab").forEach((t) => {
      const ativa = t.dataset.tab === nome;
      t.classList.toggle("is-ativo", ativa);
      if (ativa) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    VIEWS[nome].render();
    window.scrollTo(0, 0);
    try {
      sessionStorage.setItem("mv-aba", nome);
    } catch {}
  }

  function iniciar() {
    Object.values(VIEWS).forEach((v) => v.iniciar());
    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => irPara(t.dataset.tab)));
    DB.aoMudar(() => VIEWS[atual].render());

    let inicial = "inicio";
    try {
      inicial = sessionStorage.getItem("mv-aba") || "inicio";
    } catch {}
    irPara(inicial);

    let diaVisto = U.diaISO();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && U.diaISO() !== diaVisto) {
        diaVisto = U.diaISO();
        VIEWS[atual].render();
      }
    });

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  return { irPara, iniciar };
})();

App.iniciar();
