const U = (() => {
  const $ = (id) => document.getElementById(id);

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const moeda = (n) => fmtMoeda.format(Number(n) || 0);

  const numero = (texto) => {
    if (typeof texto === "number") return texto;
    const limpo = String(texto || "").replace(/[^\d,.-]/g, "");
    if (!limpo) return 0;
    const n = limpo.includes(",") ? Number(limpo.replace(/\./g, "").replace(",", ".")) : Number(limpo);
    return Number.isFinite(n) ? n : 0;
  };

  const decimalBR = (n) => (Number(n) || 0).toFixed(2).replace(".", ",");

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const pad = (n) => String(n).padStart(2, "0");
  const diaISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const agoraLocal = (d = new Date()) => `${diaISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const deISO = (iso) => {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d);
  };
  const somarDias = (iso, n) => {
    const d = deISO(iso);
    d.setDate(d.getDate() + n);
    return diaISO(d);
  };

  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  const dataLonga = (iso) => {
    const d = deISO(iso);
    return `${SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  };
  const dataCurta = (iso) => {
    const d = deISO(iso.slice(0, 10));
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };
  const diaRelativo = (iso) => {
    const hoje = diaISO();
    if (iso === hoje) return "Hoje";
    if (iso === somarDias(hoje, 1)) return "Amanhã";
    if (iso === somarDias(hoje, -1)) return "Ontem";
    return dataCurta(iso);
  };
  const horaDe = (dataHora) => {
    const d = new Date(dataHora);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const saudacao = () => {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  };

  const soDigitos = (t) => String(t || "").replace(/\D/g, "");
  const telefoneZap = (t) => {
    let d = soDigitos(t);
    if (!d) return "";
    if (d.length <= 11) d = "55" + d;
    return d;
  };
  const linkZap = (telefone, texto) => {
    const n = telefoneZap(telefone);
    return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
  };
  const abrirZap = (telefone, texto) => window.open(linkZap(telefone, texto), "_blank", "noopener");

  async function compartilhar(titulo, texto) {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto });
        return "compartilhado";
      } catch (e) {
        if (e && e.name === "AbortError") return "cancelado";
      }
    }
    return (await copiar(texto)) ? "copiado" : "falhou";
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    }
  }

  function baixar(nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const normalizar = (t) =>
    String(t || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

  return {
    $, esc, moeda, numero, decimalBR, uid, pad, diaISO, agoraLocal, deISO, somarDias, MESES, SEMANA,
    dataLonga, dataCurta, diaRelativo, horaDe, saudacao, soDigitos, telefoneZap, linkZap, abrirZap,
    compartilhar, copiar, baixar, normalizar,
  };
})();
