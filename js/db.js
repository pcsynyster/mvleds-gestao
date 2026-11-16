const DB = (() => {
  const CHAVE = "mvleds-gestao";
  const VERSAO = 1;

  const CATEGORIAS = [
    { key: "led", label: "Lâmpadas LED" },
    { key: "interno", label: "LED interno" },
    { key: "placa", label: "LED de placa" },
    { key: "halogena", label: "Halógenas" },
    { key: "acessorio", label: "Acessórios" },
    { key: "outro", label: "Outros" },
  ];

  const TIPOS_MOV = {
    venda: { label: "Venda", sinal: -1 },
    entrada: { label: "Entrada", sinal: 1 },
    perda: { label: "Perda / defeito", sinal: -1 },
    ajuste: { label: "Ajuste", sinal: 1 },
  };

  const TIPOS_EVENTO = [
    { key: "instalacao", label: "Instalação" },
    { key: "entrega", label: "Entrega" },
    { key: "fornecedor", label: "Fornecedor / pedido" },
    { key: "pagamento", label: "Pagamento" },
    { key: "outro", label: "Outro" },
  ];

  const PAGAMENTOS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Fiado"];

  const vazio = () => ({
    versao: VERSAO,
    itens: [],
    movs: [],
    eventos: [],
    config: { nome: "Marcos", fornecedorNome: "", fornecedorZap: "", ultimoBackup: null },
  });

  let dados = carregar();
  const ouvintes = new Set();

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return vazio();
      return validar(JSON.parse(bruto));
    } catch {
      return vazio();
    }
  }

  function validar(obj) {
    const base = vazio();
    if (!obj || typeof obj !== "object") return base;
    return {
      versao: VERSAO,
      itens: Array.isArray(obj.itens) ? obj.itens : [],
      movs: Array.isArray(obj.movs) ? obj.movs : [],
      eventos: Array.isArray(obj.eventos) ? obj.eventos : [],
      config: { ...base.config, ...(obj.config || {}) },
    };
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
    } catch {
      UI.toast("Não foi possível salvar. O armazenamento do navegador está cheio.", true);
    }
    ouvintes.forEach((fn) => fn());
  }

  const aoMudar = (fn) => ouvintes.add(fn);

  /* Itens */
  const itens = () => dados.itens;
  const item = (id) => dados.itens.find((i) => i.id === id);

  function salvarItem(campos) {
    const existente = campos.id && item(campos.id);
    if (existente) {
      Object.assign(existente, campos, { atualizado: new Date().toISOString() });
    } else {
      dados.itens.push({
        id: U.uid(),
        nome: "",
        categoria: "led",
        modelo: "",
        qtd: 0,
        minimo: 2,
        custo: 0,
        preco: 0,
        fornecedor: "",
        local: "",
        obs: "",
        criado: new Date().toISOString(),
        ...campos,
      });
    }
    salvar();
    return existente || dados.itens[dados.itens.length - 1];
  }

  function excluirItem(id) {
    dados.itens = dados.itens.filter((i) => i.id !== id);
    salvar();
  }

  const status = (i) => (i.qtd <= 0 ? "zerado" : i.qtd <= i.minimo ? "baixo" : "ok");
  const baixos = () => dados.itens.filter((i) => status(i) !== "ok").sort((a, b) => a.qtd - b.qtd);

  /* Movimentações */
  const movs = () => dados.movs;

  function registrarMov(mov) {
    const sinal = TIPOS_MOV[mov.tipo].sinal;
    const novo = {
      id: U.uid(),
      data: U.agoraLocal(),
      desconto: 0,
      cliente: "",
      telefone: "",
      pagamento: "",
      obs: "",
      ...mov,
    };
    novo.linhas = novo.linhas.map((l) => {
      const it = item(l.itemId);
      if (it) it.qtd = Number(it.qtd) + sinal * Number(l.qtd);
      return { ...l, custo: it ? Number(it.custo) || 0 : 0 };
    });
    novo.total = Math.max(0, novo.linhas.reduce((s, l) => s + l.qtd * (l.valor || 0), 0) - (novo.desconto || 0));
    dados.movs.unshift(novo);
    salvar();
    return novo;
  }

  function excluirMov(id) {
    const mov = dados.movs.find((m) => m.id === id);
    if (!mov) return;
    const sinal = TIPOS_MOV[mov.tipo].sinal;
    mov.linhas.forEach((l) => {
      const it = item(l.itemId);
      if (it) it.qtd = Number(it.qtd) - sinal * Number(l.qtd);
    });
    dados.movs = dados.movs.filter((m) => m.id !== id);
    salvar();
  }

  const movsDoItem = (id) => dados.movs.filter((m) => m.linhas.some((l) => l.itemId === id));

  function resumoVendas(de, ate) {
    const vendas = dados.movs.filter((m) => m.tipo === "venda" && m.data.slice(0, 10) >= de && m.data.slice(0, 10) <= ate);
    const total = vendas.reduce((s, m) => s + m.total, 0);
    const custo = vendas.reduce((s, m) => s + m.linhas.reduce((c, l) => c + l.qtd * (l.custo || 0), 0), 0);
    const pecas = vendas.reduce((s, m) => s + m.linhas.reduce((c, l) => c + Number(l.qtd), 0), 0);
    const porItem = {};
    vendas.forEach((m) =>
      m.linhas.forEach((l) => {
        porItem[l.nome] = (porItem[l.nome] || 0) + Number(l.qtd);
      })
    );
    const maisVendidos = Object.entries(porItem).sort((a, b) => b[1] - a[1]);
    return { vendas, total, lucro: total - custo, pecas, maisVendidos };
  }

  function valorEstoque() {
    return dados.itens.reduce(
      (s, i) => {
        const q = Math.max(0, Number(i.qtd) || 0);
        s.unidades += q;
        s.custo += q * (Number(i.custo) || 0);
        s.venda += q * (Number(i.preco) || 0);
        return s;
      },
      { unidades: 0, custo: 0, venda: 0 }
    );
  }

  /* Agenda */
  const eventos = () => dados.eventos;
  const evento = (id) => dados.eventos.find((e) => e.id === id);
  const eventosDoDia = (iso) =>
    dados.eventos.filter((e) => e.data === iso).sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99"));
  const proximos = (dias = 7) => {
    const hoje = U.diaISO();
    const fim = U.somarDias(hoje, dias);
    return dados.eventos
      .filter((e) => e.data >= hoje && e.data <= fim && !e.feito)
      .sort((a, b) => (a.data + (a.hora || "99")).localeCompare(b.data + (b.hora || "99")));
  };
  const atrasados = () => dados.eventos.filter((e) => e.data < U.diaISO() && !e.feito);

  function salvarEvento(campos) {
    const existente = campos.id && evento(campos.id);
    if (existente) Object.assign(existente, campos);
    else dados.eventos.push({ id: U.uid(), feito: false, criado: new Date().toISOString(), ...campos });
    salvar();
    return existente || dados.eventos[dados.eventos.length - 1];
  }

  function excluirEvento(id) {
    dados.eventos = dados.eventos.filter((e) => e.id !== id);
    salvar();
  }

  /* Config e backup */
  const config = () => dados.config;
  function salvarConfig(campos) {
    Object.assign(dados.config, campos);
    salvar();
  }

  const exportar = () => JSON.stringify({ app: "mvleds-gestao", exportado: new Date().toISOString(), ...dados }, null, 2);

  function importar(texto) {
    const obj = JSON.parse(texto);
    if (!obj || obj.app !== "mvleds-gestao") throw new Error("Arquivo não é um backup do MV LEDs Gestão.");
    dados = validar(obj);
    salvar();
  }

  function apagarTudo() {
    dados = vazio();
    salvar();
  }

  return {
    CATEGORIAS, TIPOS_MOV, TIPOS_EVENTO, PAGAMENTOS,
    aoMudar, itens, item, salvarItem, excluirItem, status, baixos,
    movs, registrarMov, excluirMov, movsDoItem, resumoVendas, valorEstoque,
    eventos, evento, eventosDoDia, proximos, atrasados, salvarEvento, excluirEvento,
    config, salvarConfig, exportar, importar, apagarTudo,
  };
})();
