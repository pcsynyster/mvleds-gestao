const Estoque = (() => {
  const { $, esc, moeda, numero, decimalBR, diaISO, diaRelativo, dataCurta, horaDe, normalizar } = U;
  const I = UI.ICONES;

  const estado = { aba: "itens", busca: "", filtro: "todos", filtroMov: "todos" };

  const nomeCategoria = (k) => (DB.CATEGORIAS.find((c) => c.key === k) || { label: "Outros" }).label;
  const nomeItem = (i) => (i.modelo ? `${i.nome} (${i.modelo})` : i.nome);

  /* Lista */
  function render() {
    const raiz = $("view-estoque");
    raiz.innerHTML = `
      <header class="topo">
        <div>
          <p class="topo-sub">${DB.itens().length} itens · ${DB.valorEstoque().unidades} peças</p>
          <h1>Estoque</h1>
        </div>
        <button type="button" class="btn btn--primario btn--pequeno" data-acao="novo">${I.mais} Item</button>
      </header>
      <div class="segmento" role="tablist">
        <button type="button" role="tab" data-aba="itens" aria-selected="${estado.aba === "itens"}">Itens</button>
        <button type="button" role="tab" data-aba="movs" aria-selected="${estado.aba === "movs"}">Movimentações</button>
      </div>
      <div id="estoqueConteudo"></div>`;
    estado.aba === "itens" ? renderItens() : renderMovs();
  }

  function renderItens() {
    const alvo = $("estoqueConteudo");
    const todos = DB.itens();
    if (!todos.length) {
      alvo.innerHTML = UI.vazioHtml(
        "Nenhum item no estoque",
        "Cadastre o primeiro item com a quantidade que tem na loja.",
        `<div class="botoes"><button type="button" class="btn btn--primario" data-acao="novo">Cadastrar item</button></div>`
      );
      return;
    }
    const contagem = { baixo: 0, zerado: 0 };
    todos.forEach((i) => {
      const s = DB.status(i);
      if (s !== "ok") contagem[s]++;
    });
    const filtros = [
      { key: "todos", label: "Todos" },
      { key: "baixo", label: `Baixo${contagem.baixo ? ` · ${contagem.baixo}` : ""}` },
      { key: "zerado", label: `Zerado${contagem.zerado ? ` · ${contagem.zerado}` : ""}` },
      ...DB.CATEGORIAS.filter((c) => todos.some((i) => i.categoria === c.key)),
    ];
    const termo = normalizar(estado.busca);
    const lista = todos
      .filter((i) => !termo || normalizar(`${i.nome} ${i.modelo} ${i.fornecedor} ${i.local}`).includes(termo))
      .filter((i) => {
        if (estado.filtro === "todos") return true;
        if (estado.filtro === "baixo") return DB.status(i) === "baixo";
        if (estado.filtro === "zerado") return DB.status(i) === "zerado";
        return i.categoria === estado.filtro;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || (a.modelo || "").localeCompare(b.modelo || "", "pt-BR"));

    alvo.innerHTML = `
      <div class="busca-linha busca-linha--grande">
        ${I.busca}
        <input type="search" id="estoqueBusca" placeholder="Buscar por nome, encaixe, fornecedor" value="${esc(estado.busca)}" aria-label="Buscar no estoque" />
      </div>
      <div class="chips" role="group" aria-label="Filtros">
        ${filtros.map((f) => `<button type="button" class="chip${estado.filtro === f.key ? " is-ativo" : ""}" data-filtro="${f.key}">${esc(f.label)}</button>`).join("")}
      </div>
      ${
        lista.length
          ? `<ul class="lista-itens">${lista
              .map(
                (i) => `<li><button type="button" class="item-linha" data-item="${i.id}">
                  <span class="item-texto">
                    <strong>${esc(i.nome)}</strong>
                    <small>${esc([i.modelo, nomeCategoria(i.categoria)].filter(Boolean).join(" · "))}</small>
                  </span>
                  <span class="item-lado">
                    <em class="qtd qtd--${DB.status(i)}">${i.qtd}</em>
                    <small>${moeda(i.preco)}</small>
                  </span>
                </button></li>`
              )
              .join("")}</ul>`
          : `<p class="nada">Nenhum item com esse filtro.</p>`
      }`;
  }

  function linhaMov(m) {
    const tipo = DB.TIPOS_MOV[m.tipo];
    const pecas = m.linhas.reduce((s, l) => s + Math.abs(Number(l.qtd)), 0);
    const resumo = m.linhas.length === 1 ? m.linhas[0].nome : `${m.linhas.length} itens · ${pecas} peças`;
    const sinal = m.tipo === "venda" ? "" : m.tipo === "entrada" ? "+" : m.tipo === "perda" ? "−" : "±";
    const valor = m.tipo === "venda" || m.tipo === "entrada" ? moeda(m.total) : `${sinal}${pecas} un`;
    return `<li><button type="button" class="mov mov--${m.tipo}" data-mov="${m.id}">
      <span class="mov-tipo">${tipo.label}</span>
      <span class="mov-texto"><strong>${esc(resumo)}</strong><small>${diaRelativo(m.data.slice(0, 10))} · ${horaDe(m.data)}${m.cliente ? " · " + esc(m.cliente) : ""}</small></span>
      <span class="mov-valor">${valor}</span>
    </button></li>`;
  }

  function renderMovs() {
    const alvo = $("estoqueConteudo");
    const filtros = [{ key: "todos", label: "Todas" }, ...Object.entries(DB.TIPOS_MOV).map(([key, t]) => ({ key, label: t.label }))];
    const lista = DB.movs().filter((m) => estado.filtroMov === "todos" || m.tipo === estado.filtroMov);
    const grupos = {};
    lista.forEach((m) => (grupos[m.data.slice(0, 10)] = grupos[m.data.slice(0, 10)] || []).push(m));
    alvo.innerHTML = `
      <div class="botoes botoes--linha">
        <button type="button" class="btn btn--primario" data-acao="venda">${I.venda} Venda</button>
        <button type="button" class="btn btn--secundario" data-acao="entrada">${I.entrada} Entrada</button>
        <button type="button" class="btn btn--secundario" data-acao="perda">Perda</button>
      </div>
      <div class="chips" role="group" aria-label="Tipo">
        ${filtros.map((f) => `<button type="button" class="chip${estado.filtroMov === f.key ? " is-ativo" : ""}" data-filtromov="${f.key}">${f.label}</button>`).join("")}
      </div>
      ${
        lista.length
          ? Object.entries(grupos)
              .map(([dia, ms]) => {
                const vendido = ms.filter((m) => m.tipo === "venda").reduce((s, m) => s + m.total, 0);
                return `<h3 class="grupo-titulo"><span>${diaRelativo(dia)}${dia !== diaISO() ? "" : ""}</span>${vendido ? `<small>Vendido ${moeda(vendido)}</small>` : ""}</h3>
                  <ul class="lista-movs">${ms.map(linhaMov).join("")}</ul>`;
              })
              .join("")
          : `<p class="nada">Nenhuma movimentação registrada.</p>`
      }`;
  }

  function mostrarAba(aba) {
    estado.aba = aba;
    render();
  }

  /* Item */
  function abrirItem(id) {
    const it = id ? DB.item(id) : null;
    const novo = !it;
    const v = it || { nome: "", categoria: "led", modelo: "", qtd: 0, minimo: 2, custo: 0, preco: 0, fornecedor: "", local: "", obs: "" };
    const margem = it && it.custo > 0 && it.preco > 0 ? Math.round(((it.preco - it.custo) / it.custo) * 100) : null;
    const historico = it ? DB.movsDoItem(it.id).slice(0, 15) : [];

    const corpo = UI.abrir({
      titulo: novo ? "Novo item" : "Item",
      acao: { texto: "Salvar", fn: () => salvarItem(corpo, it) },
      html: `
        ${
          novo
            ? ""
            : `<div class="item-resumo">
                <div class="item-qtd qtd--${DB.status(it)}">
                  <strong>${it.qtd}</strong><span>${it.qtd === 1 ? "peça" : "peças"} em estoque</span>
                </div>
                <div class="item-numeros">
                  <span>Custo <b>${moeda(it.custo)}</b></span>
                  <span>Venda <b>${moeda(it.preco)}</b></span>
                  ${margem !== null ? `<span>Margem <b>${margem}%</b></span>` : ""}
                </div>
              </div>
              <div class="botoes botoes--linha">
                <button type="button" class="btn btn--primario" data-mov-item="venda">Vender</button>
                <button type="button" class="btn btn--secundario" data-mov-item="entrada">Entrada</button>
                <button type="button" class="btn btn--secundario" data-acao="contagem">Corrigir</button>
              </div>`
        }
        <form class="form" id="formItem" novalidate>
          ${UI.campo("Nome do item *", `<input name="nome" maxlength="80" required value="${esc(v.nome)}" placeholder="Ex.: Lâmpada LED 22 mil lúmens" />`)}
          <div class="campos-2">
            ${UI.campo("Encaixe / modelo", `<input name="modelo" maxlength="40" value="${esc(v.modelo)}" placeholder="Ex.: H4" />`)}
            ${UI.campo("Categoria", `<select name="categoria">${UI.opcoes(DB.CATEGORIAS, v.categoria)}</select>`)}
          </div>
          <div class="campos-2">
            ${novo ? UI.campo("Quantidade agora", `<input name="qtd" type="number" inputmode="numeric" min="0" value="${v.qtd}" />`) : ""}
            ${UI.campo("Avisar com", `<input name="minimo" type="number" inputmode="numeric" min="0" value="${v.minimo}" />`, "ou menos")}
          </div>
          <div class="campos-2">
            ${UI.campo("Custo (R$)", `<input name="custo" inputmode="decimal" value="${decimalBR(v.custo)}" />`, "quanto paga")}
            ${UI.campo("Preço de venda (R$)", `<input name="preco" inputmode="decimal" value="${decimalBR(v.preco)}" />`)}
          </div>
          <div class="campos-2">
            ${UI.campo("Fornecedor", `<input name="fornecedor" maxlength="60" value="${esc(v.fornecedor)}" />`)}
            ${UI.campo("Onde fica", `<input name="local" maxlength="40" value="${esc(v.local)}" placeholder="Ex.: Prateleira 2" />`)}
          </div>
          ${UI.campo("Observação", `<textarea name="obs" rows="2" maxlength="300">${esc(v.obs)}</textarea>`)}
          <p class="erro" id="itemErro" role="alert"></p>
          <button type="submit" class="btn btn--primario btn--cheio">Salvar item</button>
        </form>
        ${
          novo
            ? ""
            : `<section class="bloco">
                <h3>Histórico</h3>
                ${historico.length ? `<ul class="lista-movs">${historico.map(linhaMov).join("")}</ul>` : `<p class="nada">Sem movimentações ainda.</p>`}
              </section>
              <button type="button" class="btn btn--perigo-leve btn--cheio" data-acao="excluir">Excluir item</button>`
        }`,
    });

    corpo.querySelector("#formItem").addEventListener("submit", (e) => {
      e.preventDefault();
      salvarItem(corpo, it);
    });
    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-mov-item], [data-acao], [data-mov]");
      if (!b) return;
      if (b.dataset.mov) return verMov(b.dataset.mov);
      if (b.dataset.movItem) return novaMov(b.dataset.movItem, it.id);
      if (b.dataset.acao === "contagem") return corrigirContagem(it.id);
      if (b.dataset.acao === "excluir") {
        const ok = await UI.confirmar("Excluir item?", `"${nomeItem(it)}" sai do estoque. O histórico de vendas continua salvo.`, "Excluir");
        if (!ok) return;
        DB.excluirItem(it.id);
        UI.fechar();
        UI.toast("Item excluído.");
      }
    });
    if (novo) setTimeout(() => corpo.querySelector('[name="nome"]').focus(), 300);
  }

  function salvarItem(corpo, it) {
    const f = corpo.querySelector("#formItem");
    const nome = UI.valorCampo(f, "nome");
    if (!nome) {
      corpo.querySelector("#itemErro").textContent = "Dê um nome ao item.";
      f.querySelector('[name="nome"]').focus();
      return;
    }
    const campos = {
      nome,
      modelo: UI.valorCampo(f, "modelo"),
      categoria: UI.valorCampo(f, "categoria"),
      minimo: Math.max(0, Math.round(numero(UI.valorCampo(f, "minimo")))),
      custo: Math.max(0, numero(UI.valorCampo(f, "custo"))),
      preco: Math.max(0, numero(UI.valorCampo(f, "preco"))),
      fornecedor: UI.valorCampo(f, "fornecedor"),
      local: UI.valorCampo(f, "local"),
      obs: UI.valorCampo(f, "obs"),
    };
    if (it) {
      DB.salvarItem({ id: it.id, ...campos });
      UI.fechar();
      UI.toast("Item atualizado.");
    } else {
      DB.salvarItem({ ...campos, qtd: Math.max(0, Math.round(numero(UI.valorCampo(f, "qtd")))) });
      UI.fechar();
      UI.toast("Item cadastrado.");
    }
  }

  function corrigirContagem(id) {
    const it = DB.item(id);
    const corpo = UI.abrir({
      titulo: "Corrigir quantidade",
      aoFechar: null,
      html: `
        <p class="ajuda">Contou as peças na prateleira e deu diferente? Informe a quantidade real de <b>${esc(nomeItem(it))}</b>. A diferença fica registrada como ajuste.</p>
        <form class="form" id="formContagem" novalidate>
          ${UI.campo("Quantidade real", `<input name="real" type="number" inputmode="numeric" min="0" value="${it.qtd}" />`, `sistema mostra ${it.qtd}`)}
          ${UI.campo("Motivo", `<input name="obs" maxlength="80" placeholder="Ex.: contagem do mês" />`)}
          <button type="submit" class="btn btn--primario btn--cheio">Salvar quantidade</button>
        </form>`,
    });
    const f = corpo.querySelector("#formContagem");
    setTimeout(() => f.real.select(), 300);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const real = Math.max(0, Math.round(numero(f.real.value)));
      const delta = real - it.qtd;
      if (delta === 0) {
        UI.fechar();
        return;
      }
      DB.registrarMov({ tipo: "ajuste", linhas: [{ itemId: it.id, nome: nomeItem(it), qtd: delta, valor: 0 }], obs: f.obs.value.trim() });
      UI.fechar();
      UI.toast(`Quantidade ajustada para ${real}.`);
    });
  }

  /* Venda, entrada, perda */
  function novaMov(tipo, itemId) {
    const it = itemId ? DB.item(itemId) : null;
    const campoValor = tipo === "venda" ? "preco" : "custo";
    const linhas = it ? [{ itemId: it.id, nome: nomeItem(it), qtd: 1, valor: Number(it[campoValor]) || 0 }] : [];
    const titulos = { venda: "Nova venda", entrada: "Entrada de mercadoria", perda: "Perda / defeito" };
    const ajudas = {
      venda: "Escolha os itens vendidos. O estoque baixa sozinho.",
      entrada: "Chegou mercadoria? Escolha os itens e a quantidade. O valor é o custo de cada peça.",
      perda: "Peça com defeito, quebrada ou trocada na garantia. Sai do estoque sem contar como venda.",
    };
    const corpo = UI.abrir({
      titulo: titulos[tipo],
      acao: { texto: "Salvar", fn: () => salvar() },
      html: `
        <p class="ajuda">${ajudas[tipo]}</p>
        <div id="editorLinhas"></div>
        <form class="form" id="formMov" novalidate>
          ${
            tipo === "venda"
              ? `<div class="campos-2">
                  ${UI.campo("Desconto (R$)", `<input name="desconto" inputmode="decimal" value="0,00" />`)}
                  ${UI.campo("Pagamento", `<select name="pagamento">${UI.opcoes(DB.PAGAMENTOS, "Pix")}</select>`)}
                </div>
                <div class="campos-2">
                  ${UI.campo("Cliente", `<input name="cliente" maxlength="60" autocomplete="off" />`, "opcional")}
                  ${UI.campo("WhatsApp do cliente", `<input name="telefone" type="tel" inputmode="tel" maxlength="20" placeholder="84 9 0000-0000" />`)}
                </div>`
              : tipo === "entrada"
              ? UI.campo("Fornecedor", `<input name="cliente" maxlength="60" value="${esc(DB.config().fornecedorNome || "")}" />`, "opcional")
              : ""
          }
          <div class="campos-2">
            ${UI.campo("Data", `<input name="data" type="date" value="${diaISO()}" max="${diaISO()}" />`)}
            ${UI.campo("Observação", `<input name="obs" maxlength="120" />`)}
          </div>
          ${tipo === "entrada" ? `<label class="check"><input type="checkbox" name="atualizarCusto" checked /><span>Atualizar o custo dos itens com estes valores</span></label>` : ""}
          <div class="total"><span>Total</span><strong id="movTotal">${moeda(0)}</strong></div>
          <p class="erro" id="movErro" role="alert"></p>
          <button type="submit" class="btn btn--primario btn--cheio">${tipo === "venda" ? "Registrar venda" : tipo === "entrada" ? "Registrar entrada" : "Registrar perda"}</button>
        </form>`,
    });

    const f = corpo.querySelector("#formMov");
    const atualizarTotal = (ls) => {
      const bruto = ls.reduce((s, l) => s + l.qtd * l.valor, 0);
      const desconto = f.desconto ? numero(f.desconto.value) : 0;
      corpo.querySelector("#movTotal").textContent = moeda(Math.max(0, bruto - desconto));
    };
    const editor = UI.editorLinhas(corpo.querySelector("#editorLinhas"), {
      campoValor,
      linhas,
      permitirSemEstoque: tipo === "entrada",
      aoMudar: atualizarTotal,
    });
    if (f.desconto) f.desconto.addEventListener("input", () => atualizarTotal(editor.linhas()));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      salvar();
    });

    function salvar() {
      const ls = editor.linhas();
      if (!ls.length) {
        corpo.querySelector("#movErro").textContent = "Adicione pelo menos um item.";
        return;
      }
      const dataEscolhida = f.data.value || diaISO();
      const data = dataEscolhida === diaISO() ? U.agoraLocal() : `${dataEscolhida}T12:00:00`;
      if (tipo === "entrada" && f.atualizarCusto.checked) {
        ls.forEach((l) => {
          const item = DB.item(l.itemId);
          if (item && l.valor > 0) item.custo = l.valor;
        });
      }
      const mov = DB.registrarMov({
        tipo,
        linhas: ls,
        data,
        desconto: f.desconto ? Math.max(0, numero(f.desconto.value)) : 0,
        pagamento: f.pagamento ? f.pagamento.value : "",
        cliente: f.cliente ? f.cliente.value.trim() : "",
        telefone: f.telefone ? f.telefone.value.trim() : "",
        obs: f.obs.value.trim(),
      });
      if (tipo === "venda") verMov(mov.id, true);
      else {
        UI.fechar();
        UI.toast(tipo === "entrada" ? "Entrada registrada. Estoque atualizado." : "Perda registrada.");
      }
    }
  }

  function textoRecibo(m) {
    const linhas = m.linhas.map((l) => `${l.qtd}x ${l.nome} — ${moeda(l.qtd * l.valor)}`).join("\n");
    return [
      `*MV LEDs — Iluminação Automotiva*`,
      `Comprovante de compra · ${dataCurta(m.data)}/${m.data.slice(0, 4)}`,
      ``,
      linhas,
      m.desconto ? `Desconto: −${moeda(m.desconto)}` : null,
      `*Total: ${moeda(m.total)}*`,
      m.pagamento ? `Pagamento: ${m.pagamento}` : null,
      ``,
      `Obrigado pela preferência${m.cliente ? ", " + m.cliente.split(" ")[0] : ""}! Qualquer dúvida sobre garantia, é só chamar.`,
    ]
      .filter((l) => l !== null)
      .join("\n");
  }

  function verMov(id, recemCriada = false) {
    const m = DB.movs().find((x) => x.id === id);
    if (!m) return;
    const tipo = DB.TIPOS_MOV[m.tipo];
    const corpo = UI.abrir({
      titulo: recemCriada ? "Venda registrada" : tipo.label,
      html: `
        ${recemCriada ? `<div class="sucesso">${I.check}<strong>${moeda(m.total)}</strong><span>Estoque atualizado</span></div>` : ""}
        <dl class="detalhes">
          <div><dt>Quando</dt><dd>${diaRelativo(m.data.slice(0, 10))}, ${horaDe(m.data)}</dd></div>
          ${m.cliente ? `<div><dt>${m.tipo === "entrada" ? "Fornecedor" : "Cliente"}</dt><dd>${esc(m.cliente)}</dd></div>` : ""}
          ${m.telefone ? `<div><dt>WhatsApp</dt><dd>${esc(m.telefone)}</dd></div>` : ""}
          ${m.pagamento ? `<div><dt>Pagamento</dt><dd>${esc(m.pagamento)}</dd></div>` : ""}
          ${m.obs ? `<div><dt>Observação</dt><dd>${esc(m.obs)}</dd></div>` : ""}
        </dl>
        <ul class="lista-detalhe">
          ${m.linhas
            .map(
              (l) => `<li><span>${m.tipo === "ajuste" ? (l.qtd > 0 ? "+" : "") : ""}${l.qtd}x ${esc(l.nome)}</span>${
                m.tipo === "venda" || m.tipo === "entrada" ? `<b>${moeda(l.qtd * l.valor)}</b>` : ""
              }</li>`
            )
            .join("")}
          ${m.desconto ? `<li><span>Desconto</span><b>−${moeda(m.desconto)}</b></li>` : ""}
          ${m.tipo === "venda" || m.tipo === "entrada" ? `<li class="lista-total"><span>Total</span><b>${moeda(m.total)}</b></li>` : ""}
        </ul>
        ${
          m.tipo === "venda"
            ? `<div class="botoes botoes--coluna">
                <button type="button" class="btn btn--zap btn--cheio" data-acao="recibo">${I.zap} Mandar comprovante no WhatsApp</button>
                <button type="button" class="btn btn--secundario btn--cheio" data-acao="compartilhar">${I.compartilhar} Compartilhar</button>
                ${m.telefone ? `<button type="button" class="btn btn--secundario btn--cheio" data-acao="agendar">${I.calendario} Agendar instalação</button>` : ""}
              </div>`
            : ""
        }
        ${recemCriada ? `<button type="button" class="btn btn--primario btn--cheio" data-acao="outra">Registrar outra venda</button>` : ""}
        <button type="button" class="btn btn--perigo-leve btn--cheio" data-acao="excluir">Excluir registro</button>`,
    });

    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-acao]");
      if (!b) return;
      const a = b.dataset.acao;
      if (a === "recibo") U.abrirZap(m.telefone, textoRecibo(m));
      if (a === "compartilhar") {
        const r = await U.compartilhar("Comprovante MV LEDs", textoRecibo(m));
        if (r === "copiado") UI.toast("Comprovante copiado.");
      }
      if (a === "outra") novaMov("venda");
      if (a === "agendar")
        Agenda.abrirEvento(null, diaISO(), {
          titulo: "Instalação",
          tipo: "instalacao",
          cliente: m.cliente,
          telefone: m.telefone,
          obs: m.linhas.map((l) => `${l.qtd}x ${l.nome}`).join(", "),
        });
      if (a === "excluir") {
        const ok = await UI.confirmar(
          "Excluir registro?",
          m.tipo === "venda" ? "As peças voltam para o estoque e o valor sai das vendas." : "As quantidades do estoque voltam ao que eram antes deste registro.",
          "Excluir"
        );
        if (!ok) return;
        DB.excluirMov(m.id);
        UI.fechar();
        UI.toast("Registro excluído.");
      }
    });
  }

  function iniciar() {
    const raiz = $("view-estoque");
    raiz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-acao], [data-aba], [data-filtro], [data-filtromov], [data-item], [data-mov]");
      if (!b) return;
      if (b.dataset.aba) return mostrarAba(b.dataset.aba);
      if (b.dataset.filtro) {
        estado.filtro = b.dataset.filtro;
        return renderItens();
      }
      if (b.dataset.filtromov) {
        estado.filtroMov = b.dataset.filtromov;
        return renderMovs();
      }
      if (b.dataset.item) return abrirItem(b.dataset.item);
      if (b.dataset.mov) return verMov(b.dataset.mov);
      const a = b.dataset.acao;
      if (a === "novo") abrirItem(null);
      if (a === "venda" || a === "entrada" || a === "perda") novaMov(a);
    });
    raiz.addEventListener("input", (e) => {
      if (e.target.id !== "estoqueBusca") return;
      estado.busca = e.target.value;
      const pos = e.target.selectionStart;
      renderItens();
      const campo = $("estoqueBusca");
      campo.focus();
      campo.setSelectionRange(pos, pos);
    });
  }

  return { render, iniciar, abrirItem, novaMov, verMov, linhaMov, mostrarAba, nomeItem, nomeCategoria };
})();
