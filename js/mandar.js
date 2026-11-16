const Mandar = (() => {
  const { $, esc, moeda, numero, diaISO, somarDias, dataCurta, dataLonga, MESES } = U;
  const I = UI.ICONES;

  function render() {
    const baixos = DB.baixos().length;
    $("view-mandar").innerHTML = `
      <header class="topo">
        <div>
          <p class="topo-sub">Pelo WhatsApp ou onde quiser</p>
          <h1>Mandar</h1>
        </div>
      </header>
      <div class="cartoes-mandar">
        <button type="button" class="mandar" data-acao="reposicao">
          <span class="mandar-icone">${I.caixa}</span>
          <span class="mandar-texto"><strong>Pedido de reposição</strong><small>${baixos ? `${baixos} itens acabando. Monta a lista pro fornecedor.` : "Monta a lista de compra pro fornecedor."}</small></span>
          ${I.seta}
        </button>
        <button type="button" class="mandar" data-acao="orcamento">
          <span class="mandar-icone">${I.venda}</span>
          <span class="mandar-texto"><strong>Orçamento para cliente</strong><small>Escolhe os itens e manda o valor certinho.</small></span>
          ${I.seta}
        </button>
        <button type="button" class="mandar" data-acao="resumo">
          <span class="mandar-icone">${I.relogio}</span>
          <span class="mandar-texto"><strong>Resumo de vendas</strong><small>Do dia, da semana ou do mês.</small></span>
          ${I.seta}
        </button>
        <button type="button" class="mandar" data-acao="semana">
          <span class="mandar-icone">${I.calendario}</span>
          <span class="mandar-texto"><strong>Agenda da semana</strong><small>Os compromissos dos próximos 7 dias.</small></span>
          ${I.seta}
        </button>
        <button type="button" class="mandar" data-acao="estoque">
          <span class="mandar-icone">${I.download}</span>
          <span class="mandar-texto"><strong>Relatório do estoque</strong><small>Lista completa ou planilha.</small></span>
          ${I.seta}
        </button>
      </div>`;
  }

  function botoesEnvio({ zap = true, rotuloZap = "Mandar no WhatsApp", extra = "" } = {}) {
    return `<div class="botoes botoes--coluna">
      ${zap ? `<button type="button" class="btn btn--zap btn--cheio" data-envio="zap">${I.zap} ${rotuloZap}</button>` : ""}
      <button type="button" class="btn btn--secundario btn--cheio" data-envio="compartilhar">${I.compartilhar} Compartilhar</button>
      <button type="button" class="btn btn--secundario btn--cheio" data-envio="copiar">${I.copiar} Copiar texto</button>
      ${extra}
    </div>`;
  }

  async function enviar(tipo, texto, telefone, titulo) {
    if (tipo === "zap") return U.abrirZap(telefone, texto);
    if (tipo === "copiar") return UI.toast((await U.copiar(texto)) ? "Texto copiado." : "Não deu pra copiar.", true);
    const r = await U.compartilhar(titulo, texto);
    if (r === "copiado") UI.toast("Texto copiado.");
  }

  const previa = (texto) => `<pre class="previa">${esc(texto)}</pre>`;

  /* Reposição */
  function reposicao() {
    const cfg = DB.config();
    const todos = DB.itens().slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (!todos.length) return UI.toast("Cadastre itens no estoque primeiro.", true);
    const sugestao = (i) => Math.max(i.minimo * 2 - i.qtd, 1);
    const marcados = new Map(DB.baixos().map((i) => [i.id, sugestao(i)]));

    const corpo = UI.abrir({
      titulo: "Pedido de reposição",
      html: `
        <p class="ajuda">Os itens acabando já vêm marcados com uma sugestão de quantidade. Ajuste o que quiser.</p>
        <div class="campos-2">
          ${UI.campo("Fornecedor", `<input id="repNome" maxlength="60" value="${esc(cfg.fornecedorNome)}" />`)}
          ${UI.campo("WhatsApp dele", `<input id="repZap" type="tel" inputmode="tel" maxlength="20" value="${esc(cfg.fornecedorZap)}" placeholder="84 9 0000-0000" />`)}
        </div>
        <ul class="lista-pedido">
          ${todos
            .map(
              (i) => `<li data-id="${i.id}">
                <label class="check">
                  <input type="checkbox" ${marcados.has(i.id) ? "checked" : ""} />
                  <span><strong>${esc(Estoque.nomeItem(i))}</strong><small>Tem ${i.qtd} · avisa com ${i.minimo}</small></span>
                </label>
                <input type="number" inputmode="numeric" min="1" value="${marcados.get(i.id) || sugestao(i)}" aria-label="Quantidade a pedir" />
              </li>`
            )
            .join("")}
        </ul>
        <h3 class="sub">Mensagem</h3>
        <div id="repPrevia"></div>
        ${botoesEnvio({
          rotuloZap: "Mandar pro fornecedor",
          extra: `<button type="button" class="btn btn--secundario btn--cheio" data-acao="agendar">${I.calendario} Agendar a chegada</button>`,
        })}`,
    });

    const lerItens = () =>
      [...corpo.querySelectorAll(".lista-pedido li")]
        .filter((li) => li.querySelector('input[type="checkbox"]').checked)
        .map((li) => ({ item: DB.item(li.dataset.id), qtd: Math.max(1, Math.round(numero(li.querySelector('input[type="number"]').value))) }));

    const texto = () => {
      const nome = corpo.querySelector("#repNome").value.trim();
      const itens = lerItens();
      return [
        `Olá${nome ? ", " + nome.split(" ")[0] : ""}! Aqui é o Marcos, da MV LEDs.`,
        `Gostaria de fazer um pedido:`,
        ``,
        ...(itens.length ? itens.map((x) => `• ${x.qtd}x ${Estoque.nomeItem(x.item)}`) : ["(nenhum item marcado)"]),
        ``,
        `Pode me passar o valor e o prazo de entrega?`,
      ].join("\n");
    };
    const atualizar = () => (corpo.querySelector("#repPrevia").innerHTML = previa(texto()));
    corpo.addEventListener("input", atualizar);
    corpo.addEventListener("change", atualizar);
    atualizar();

    corpo.addEventListener("click", (e) => {
      const b = e.target.closest("[data-envio], [data-acao]");
      if (!b) return;
      const nome = corpo.querySelector("#repNome").value.trim();
      const zap = corpo.querySelector("#repZap").value.trim();
      if (nome !== cfg.fornecedorNome || zap !== cfg.fornecedorZap) DB.salvarConfig({ fornecedorNome: nome, fornecedorZap: zap });
      if (!lerItens().length) return UI.toast("Marque pelo menos um item.", true);
      if (b.dataset.acao === "agendar") {
        return Agenda.abrirEvento(null, somarDias(diaISO(), 3), {
          titulo: `Chegada do pedido${nome ? " — " + nome : ""}`,
          tipo: "fornecedor",
          cliente: nome,
          telefone: zap,
          obs: lerItens()
            .map((x) => `${x.qtd}x ${Estoque.nomeItem(x.item)}`)
            .join("\n"),
        });
      }
      enviar(b.dataset.envio, texto(), zap, "Pedido MV LEDs");
    });
  }

  /* Orçamento */
  function orcamento() {
    if (!DB.itens().length) return UI.toast("Cadastre itens no estoque primeiro.", true);
    const corpo = UI.abrir({
      titulo: "Orçamento",
      html: `
        <div id="orcLinhas"></div>
        <form class="form" id="formOrc" novalidate>
          <div class="campos-2">
            ${UI.campo("Cliente", `<input name="cliente" maxlength="60" autocomplete="off" />`)}
            ${UI.campo("WhatsApp", `<input name="telefone" type="tel" inputmode="tel" maxlength="20" placeholder="84 9 0000-0000" />`)}
          </div>
          <div class="campos-2">
            ${UI.campo("Desconto (R$)", `<input name="desconto" inputmode="decimal" value="0,00" />`)}
            ${UI.campo("Vale por", `<select name="validade"><option value="3">3 dias</option><option value="7" selected>7 dias</option><option value="15">15 dias</option></select>`)}
          </div>
          <label class="check"><input type="checkbox" name="instalacao" checked /><span>Dizer que a instalação é feita na loja</span></label>
          ${UI.campo("Observação", `<input name="obs" maxlength="140" placeholder="Ex.: para Onix 2020" />`)}
        </form>
        <div class="total"><span>Total</span><strong id="orcTotal">${moeda(0)}</strong></div>
        <h3 class="sub">Mensagem</h3>
        <div id="orcPrevia"></div>
        ${botoesEnvio({
          rotuloZap: "Mandar pro cliente",
          extra: `<button type="button" class="btn btn--primario btn--cheio" data-acao="vender">${I.check} Cliente fechou: registrar venda</button>`,
        })}`,
    });
    const f = corpo.querySelector("#formOrc");
    let linhas = [];
    const total = () => Math.max(0, linhas.reduce((s, l) => s + l.qtd * l.valor, 0) - numero(f.desconto.value));
    const texto = () => {
      const validade = somarDias(diaISO(), Number(f.validade.value));
      const nome = f.cliente.value.trim().split(" ")[0];
      const desconto = numero(f.desconto.value);
      return [
        `*MV LEDs — Iluminação Automotiva*`,
        `Orçamento${nome ? " para " + nome : ""}`,
        ``,
        ...(linhas.length ? linhas.map((l) => `${l.qtd}x ${l.nome} — ${moeda(l.qtd * l.valor)}`) : ["(adicione os itens)"]),
        desconto > 0 ? `Desconto: −${moeda(desconto)}` : null,
        `*Total: ${moeda(total())}*`,
        f.instalacao.checked ? `Instalação feita na loja.` : null,
        f.obs.value.trim() || null,
        ``,
        `Orçamento válido até ${dataCurta(validade)}.`,
      ]
        .filter((l) => l !== null)
        .join("\n");
    };
    const atualizar = () => {
      corpo.querySelector("#orcTotal").textContent = moeda(total());
      corpo.querySelector("#orcPrevia").innerHTML = previa(texto());
    };
    const editor = UI.editorLinhas(corpo.querySelector("#orcLinhas"), {
      campoValor: "preco",
      permitirSemEstoque: true,
      aoMudar: (ls) => {
        linhas = ls;
        atualizar();
      },
    });
    f.addEventListener("input", atualizar);
    f.addEventListener("change", atualizar);

    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-envio], [data-acao]");
      if (!b) return;
      if (!editor.linhas().length) return UI.toast("Adicione pelo menos um item.", true);
      if (b.dataset.acao === "vender") {
        const ok = await UI.confirmar("Registrar como venda?", `Venda de ${moeda(total())}. As peças saem do estoque.`, "Registrar venda", false);
        if (!ok) return;
        const mov = DB.registrarMov({
          tipo: "venda",
          linhas: editor.linhas(),
          desconto: Math.max(0, numero(f.desconto.value)),
          cliente: f.cliente.value.trim(),
          telefone: f.telefone.value.trim(),
          pagamento: "Pix",
          obs: f.obs.value.trim(),
        });
        return Estoque.verMov(mov.id, true);
      }
      enviar(b.dataset.envio, texto(), f.telefone.value.trim(), "Orçamento MV LEDs");
    });
  }

  /* Resumo de vendas */
  function periodo(chave) {
    const hoje = diaISO();
    if (chave === "hoje") return { de: hoje, ate: hoje, nome: "hoje" };
    if (chave === "7") return { de: somarDias(hoje, -6), ate: hoje, nome: "últimos 7 dias" };
    if (chave === "mes") return { de: hoje.slice(0, 8) + "01", ate: hoje, nome: MESES[Number(hoje.slice(5, 7)) - 1] };
    const d = new Date();
    d.setDate(0);
    const fim = U.diaISO(d);
    return { de: fim.slice(0, 8) + "01", ate: fim, nome: MESES[d.getMonth()] };
  }

  function resumo(chave = "hoje") {
    const p = periodo(chave);
    const r = DB.resumoVendas(p.de, p.ate);
    const porPagamento = {};
    r.vendas.forEach((m) => (porPagamento[m.pagamento || "Outro"] = (porPagamento[m.pagamento || "Outro"] || 0) + m.total));
    const texto = [
      `*Resumo MV LEDs — ${p.nome}*`,
      p.de === p.ate ? dataLonga(p.de) : `${dataCurta(p.de)} a ${dataCurta(p.ate)}`,
      ``,
      `Vendas: ${r.vendas.length}`,
      `Peças vendidas: ${r.pecas}`,
      `Faturamento: ${moeda(r.total)}`,
      `Lucro aproximado: ${moeda(r.lucro)}`,
      Object.keys(porPagamento).length ? `\nPor pagamento:\n${Object.entries(porPagamento).map(([k, v]) => `• ${k}: ${moeda(v)}`).join("\n")}` : null,
      r.maisVendidos.length ? `\nMais vendidos:\n${r.maisVendidos.slice(0, 5).map(([n, q]) => `• ${q}x ${n}`).join("\n")}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const corpo = UI.abrir({
      titulo: "Resumo de vendas",
      html: `
        <div class="segmento segmento--4" role="tablist">
          ${[
            ["hoje", "Hoje"],
            ["7", "7 dias"],
            ["mes", "Mês"],
            ["passado", "Mês passado"],
          ]
            .map(([k, l]) => `<button type="button" role="tab" data-periodo="${k}" aria-selected="${k === chave}">${l}</button>`)
            .join("")}
        </div>
        <div class="metricas metricas--sheet">
          <div class="metrica"><span>Faturamento</span><strong>${moeda(r.total)}</strong><small>${r.vendas.length} vendas</small></div>
          <div class="metrica"><span>Lucro aprox.</span><strong>${moeda(r.lucro)}</strong><small>${r.pecas} peças</small></div>
        </div>
        ${previa(texto)}
        ${botoesEnvio()}`,
    });
    corpo.addEventListener("click", (e) => {
      const b = e.target.closest("[data-periodo], [data-envio]");
      if (!b) return;
      if (b.dataset.periodo) return resumo(b.dataset.periodo);
      enviar(b.dataset.envio, texto, "", "Resumo MV LEDs");
    });
  }

  /* Agenda da semana */
  function semana() {
    const lista = DB.proximos(7);
    const texto = lista.length
      ? [
          `*Agenda MV LEDs — próximos 7 dias*`,
          ``,
          ...lista.map(
            (e) => `• ${dataCurta(e.data)}${e.hora ? " " + e.hora : ""} — ${e.titulo}${e.cliente ? " (" + e.cliente + ")" : ""}`
          ),
        ].join("\n")
      : `*Agenda MV LEDs*\nNada marcado para os próximos 7 dias.`;
    const corpo = UI.abrir({
      titulo: "Agenda da semana",
      html: `${previa(texto)}
        ${botoesEnvio({ extra: `<button type="button" class="btn btn--secundario btn--cheio" data-acao="ics">${I.calendario} Pôr tudo no calendário do celular</button>` })}`,
    });
    corpo.addEventListener("click", (e) => {
      const b = e.target.closest("[data-envio], [data-acao]");
      if (!b) return;
      if (b.dataset.acao === "ics") return Agenda.exportarTudo();
      enviar(b.dataset.envio, texto, "", "Agenda MV LEDs");
    });
  }

  /* Relatório do estoque */
  function relatorio() {
    const itens = DB.itens().slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (!itens.length) return UI.toast("O estoque ainda está vazio.", true);
    const v = DB.valorEstoque();
    const texto = [
      `*Estoque MV LEDs — ${dataCurta(diaISO())}*`,
      ``,
      ...itens.map((i) => `${i.qtd <= 0 ? "[ZERADO] " : i.qtd <= i.minimo ? "[BAIXO] " : ""}${i.qtd}x ${Estoque.nomeItem(i)}`),
      ``,
      `Total: ${v.unidades} peças · ${moeda(v.custo)} em custo`,
    ].join("\n");
    const corpo = UI.abrir({
      titulo: "Relatório do estoque",
      html: `${previa(texto)}
        ${botoesEnvio({ zap: true, extra: `<button type="button" class="btn btn--secundario btn--cheio" data-acao="csv">${I.download} Baixar planilha (CSV)</button>` })}`,
    });
    corpo.addEventListener("click", (e) => {
      const b = e.target.closest("[data-envio], [data-acao]");
      if (!b) return;
      if (b.dataset.acao === "csv") {
        const cel = (t) => `"${String(t ?? "").replace(/"/g, '""')}"`;
        const linhas = [
          ["Item", "Encaixe/modelo", "Categoria", "Quantidade", "Mínimo", "Custo", "Preço", "Fornecedor", "Local"],
          ...itens.map((i) => [i.nome, i.modelo, Estoque.nomeCategoria(i.categoria), i.qtd, i.minimo, U.decimalBR(i.custo), U.decimalBR(i.preco), i.fornecedor, i.local]),
        ];
        U.baixar(`estoque-mvleds-${diaISO()}.csv`, "﻿" + linhas.map((l) => l.map(cel).join(";")).join("\r\n"), "text/csv;charset=utf-8");
        return UI.toast("Planilha baixada.");
      }
      enviar(b.dataset.envio, texto, "", "Estoque MV LEDs");
    });
  }

  function iniciar() {
    $("view-mandar").addEventListener("click", (e) => {
      const b = e.target.closest("[data-acao]");
      if (!b) return;
      ({ reposicao, orcamento, resumo: () => resumo("hoje"), semana, estoque: relatorio })[b.dataset.acao]();
    });
  }

  return { render, iniciar, reposicao, orcamento, resumo };
})();
