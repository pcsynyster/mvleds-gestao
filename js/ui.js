const UI = (() => {
  const { $, esc, moeda, numero, decimalBR, normalizar } = U;

  const ICONES = {
    mais: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    menos: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    lixo: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    seta: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    voltar: '<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
    engrenagem: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    venda: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>',
    entrada: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    calendario: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    caixa: '<svg viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.2L2 22l4.9-1.2A11 11 0 1 0 20.5 3.5z"/><path d="M8.5 8.5c0 4 3 7 7 7l1.5-1.5-2.5-1.5-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1.5-2.5z"/></svg>',
    compartilhar: '<svg viewBox="0 0 24 24"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
    copiar: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    alerta: '<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>',
    busca: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    relogio: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };

  /* Toast */
  let timerToast;
  function toast(texto, erro = false) {
    const el = $("toast");
    el.textContent = texto;
    el.classList.toggle("is-erro", erro);
    el.classList.add("is-visivel");
    clearTimeout(timerToast);
    timerToast = setTimeout(() => el.classList.remove("is-visivel"), 2800);
  }

  /* Confirmação */
  function confirmar(titulo, texto, botao = "Confirmar", perigo = true) {
    return new Promise((resolve) => {
      const caixa = $("dialogo");
      $("dialogoTitulo").textContent = titulo;
      $("dialogoTexto").textContent = texto;
      const sim = $("dialogoSim");
      sim.textContent = botao;
      sim.className = "btn " + (perigo ? "btn--perigo" : "btn--primario");
      caixa.hidden = false;
      requestAnimationFrame(() => caixa.classList.add("is-aberto"));
      $("dialogoNao").focus();
      const fechar = (r) => {
        caixa.classList.remove("is-aberto");
        setTimeout(() => (caixa.hidden = true), 180);
        resolve(r);
      };
      sim.onclick = () => fechar(true);
      $("dialogoNao").onclick = () => fechar(false);
    });
  }

  /* Folha (bottom sheet) */
  let aoFecharSheet = null;
  let focoAnterior = null;

  function abrir({ titulo, html, acao, aoFechar }) {
    const sheet = $("sheet");
    focoAnterior = document.activeElement;
    $("sheetTitulo").textContent = titulo;
    const antigo = $("sheetCorpo");
    const corpo = antigo.cloneNode(false);
    antigo.replaceWith(corpo);
    corpo.innerHTML = html;
    const slot = $("sheetAcao");
    slot.innerHTML = "";
    if (acao) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link link--forte";
      b.textContent = acao.texto;
      b.addEventListener("click", acao.fn);
      slot.appendChild(b);
    }
    aoFecharSheet = aoFechar || null;
    sheet.hidden = false;
    document.body.classList.add("sem-rolagem");
    requestAnimationFrame(() => sheet.classList.add("is-aberto"));
    return corpo;
  }

  function fechar() {
    const sheet = $("sheet");
    if (sheet.hidden) return;
    sheet.classList.remove("is-aberto");
    document.body.classList.remove("sem-rolagem");
    const corpo = $("sheetCorpo");
    setTimeout(() => {
      if (sheet.classList.contains("is-aberto")) return;
      sheet.hidden = true;
      corpo.innerHTML = "";
    }, 260);
    if (aoFecharSheet) aoFecharSheet();
    aoFecharSheet = null;
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  const sheetAberta = () => !$("sheet").hidden;

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) fechar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("dialogo").hidden) $("dialogoNao").click();
    else fechar();
  });

  /* Campos */
  const campo = (rotulo, input, dica = "") =>
    `<label class="campo"><span>${rotulo}${dica ? ` <small>${dica}</small>` : ""}</span>${input}</label>`;

  const opcoes = (lista, atual) =>
    lista.map((o) => `<option value="${esc(o.key ?? o)}"${(o.key ?? o) === atual ? " selected" : ""}>${esc(o.label ?? o)}</option>`).join("");

  const valorCampo = (raiz, nome) => {
    const el = raiz.querySelector(`[name="${nome}"]`);
    if (!el) return "";
    return el.type === "checkbox" ? el.checked : el.value.trim();
  };

  const vazioHtml = (titulo, texto, botao = "") =>
    `<div class="vazio"><strong>${titulo}</strong><p>${texto}</p>${botao}</div>`;

  /* Editor de linhas de itens (venda, entrada, orçamento) */
  function editorLinhas(raiz, { campoValor = "preco", linhas = [], aoMudar = () => {}, permitirSemEstoque = false } = {}) {
    let estado = linhas.map((l) => ({ ...l }));
    raiz.innerHTML = `
      <div class="seletor">
        <div class="busca-linha">
          ${ICONES.busca}
          <input type="search" class="seletor-busca" placeholder="Buscar item do estoque" aria-label="Buscar item do estoque" autocomplete="off" />
        </div>
        <ul class="seletor-resultados" hidden></ul>
      </div>
      <ul class="linhas-itens"></ul>
      <p class="linhas-vazio">Nenhum item adicionado.</p>`;
    const busca = raiz.querySelector(".seletor-busca");
    const resultados = raiz.querySelector(".seletor-resultados");
    const lista = raiz.querySelector(".linhas-itens");
    const vazio = raiz.querySelector(".linhas-vazio");

    function mostrarResultados() {
      const termo = normalizar(busca.value);
      const achados = DB.itens()
        .filter((i) => !termo || normalizar(`${i.nome} ${i.modelo}`).includes(termo))
        .slice(0, 8);
      if (!busca.value && document.activeElement !== busca) {
        resultados.hidden = true;
        return;
      }
      resultados.innerHTML = achados.length
        ? achados
            .map(
              (i) => `<li><button type="button" data-add="${i.id}">
                <span><strong>${esc(i.nome)}</strong>${i.modelo ? `<small>${esc(i.modelo)}</small>` : ""}</span>
                <span class="seletor-info"><em class="qtd qtd--${DB.status(i)}">${i.qtd} un</em>${moeda(i[campoValor])}</span>
              </button></li>`
            )
            .join("")
        : `<li class="seletor-nada">Nada encontrado. Cadastre o item no Estoque.</li>`;
      resultados.hidden = false;
    }

    function render() {
      vazio.hidden = estado.length > 0;
      lista.innerHTML = estado
        .map((l, idx) => {
          const it = DB.item(l.itemId);
          const aviso = !permitirSemEstoque && it && l.qtd > it.qtd ? `<small class="aviso-linha">Só ${it.qtd} em estoque</small>` : "";
          return `<li class="linha-item" data-idx="${idx}">
            <div class="linha-nome"><strong>${esc(l.nome)}</strong>${aviso}</div>
            <div class="linha-controles">
              <div class="passo">
                <button type="button" data-passo="-1" aria-label="Diminuir">${ICONES.menos}</button>
                <input type="number" inputmode="numeric" min="1" value="${l.qtd}" data-qtd aria-label="Quantidade" />
                <button type="button" data-passo="1" aria-label="Aumentar">${ICONES.mais}</button>
              </div>
              <label class="linha-valor"><span>R$</span><input type="text" inputmode="decimal" value="${decimalBR(l.valor)}" data-valor aria-label="Valor unitário" /></label>
              <button type="button" class="icone-btn" data-remover aria-label="Remover">${ICONES.lixo}</button>
            </div>
          </li>`;
        })
        .join("");
      aoMudar(estado);
    }

    busca.addEventListener("input", mostrarResultados);
    busca.addEventListener("focus", mostrarResultados);
    busca.addEventListener("blur", () => setTimeout(() => (resultados.hidden = true), 150));
    resultados.addEventListener("mousedown", (e) => e.preventDefault());
    resultados.addEventListener("click", (e) => {
      const b = e.target.closest("[data-add]");
      if (!b) return;
      const it = DB.item(b.dataset.add);
      const ja = estado.find((l) => l.itemId === it.id);
      if (ja) ja.qtd += 1;
      else estado.push({ itemId: it.id, nome: it.modelo ? `${it.nome} (${it.modelo})` : it.nome, qtd: 1, valor: Number(it[campoValor]) || 0 });
      busca.value = "";
      resultados.hidden = true;
      busca.blur();
      render();
    });

    lista.addEventListener("click", (e) => {
      const li = e.target.closest(".linha-item");
      if (!li) return;
      const l = estado[li.dataset.idx];
      const passo = e.target.closest("[data-passo]");
      if (passo) {
        l.qtd = Math.max(1, l.qtd + Number(passo.dataset.passo));
        render();
      } else if (e.target.closest("[data-remover]")) {
        estado.splice(li.dataset.idx, 1);
        render();
      }
    });
    lista.addEventListener("change", (e) => {
      const li = e.target.closest(".linha-item");
      if (!li) return;
      const l = estado[li.dataset.idx];
      if (e.target.matches("[data-qtd]")) l.qtd = Math.max(1, Math.round(numero(e.target.value)) || 1);
      if (e.target.matches("[data-valor]")) l.valor = Math.max(0, numero(e.target.value));
      render();
    });

    render();
    return { linhas: () => estado.map((l) => ({ ...l })) };
  }

  return { ICONES, toast, confirmar, abrir, fechar, sheetAberta, campo, opcoes, valorCampo, vazioHtml, editorLinhas };
})();
