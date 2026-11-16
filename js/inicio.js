const Inicio = (() => {
  const { esc, moeda, diaISO, dataLonga, diaRelativo, horaDe } = U;
  const I = UI.ICONES;

  function render() {
    const raiz = U.$("view-inicio");
    const cfg = DB.config();
    const hoje = diaISO();
    const inicioMes = hoje.slice(0, 8) + "01";
    const dia = DB.resumoVendas(hoje, hoje);
    const mes = DB.resumoVendas(inicioMes, hoje);
    const est = DB.valorEstoque();
    const baixos = DB.baixos();
    const atrasados = DB.atrasados();
    const proximos = DB.proximos(7);
    const ultimas = DB.movs().slice(0, 5);
    const semItens = DB.itens().length === 0;

    raiz.innerHTML = `
      <div class="marca">
        <img src="icons/logo.jpg" alt="MV LEDs Iluminação Automotiva" width="1150" height="341" />
      </div>
      <header class="topo">
        <div>
          <p class="topo-sub">${esc(dataLonga(hoje))}</p>
          <h1>${U.saudacao()}, ${esc(cfg.nome || "Marcos")}</h1>
        </div>
        <button type="button" class="icone-btn icone-btn--grande" data-acao="ajustes" aria-label="Ajustes">${I.engrenagem}</button>
      </header>

      <div class="atalhos">
        <button type="button" class="atalho atalho--destaque" data-acao="venda">${I.venda}<span>Nova venda</span></button>
        <button type="button" class="atalho" data-acao="entrada">${I.entrada}<span>Entrada</span></button>
        <button type="button" class="atalho" data-acao="compromisso">${I.calendario}<span>Agendar</span></button>
        <button type="button" class="atalho" data-acao="item">${I.caixa}<span>Novo item</span></button>
      </div>

      ${
        semItens
          ? `<section class="cartao cartao--boas-vindas">
              <h2>Comece pelo estoque</h2>
              <p>Puxe os produtos que já estão no site da loja ou cadastre os itens um por um. Depois é só informar a quantidade de cada um.</p>
              <div class="botoes">
                <button type="button" class="btn btn--primario" data-acao="importar">Puxar produtos do site</button>
                <button type="button" class="btn btn--secundario" data-acao="item">Cadastrar item</button>
              </div>
            </section>`
          : ""
      }

      <div class="metricas">
        <div class="metrica">
          <span>Vendas hoje</span>
          <strong>${moeda(dia.total)}</strong>
          <small>${dia.vendas.length} ${dia.vendas.length === 1 ? "venda" : "vendas"}</small>
        </div>
        <div class="metrica">
          <span>No mês</span>
          <strong>${moeda(mes.total)}</strong>
          <small>Lucro aprox. ${moeda(mes.lucro)}</small>
        </div>
        <div class="metrica">
          <span>Peças em estoque</span>
          <strong>${est.unidades}</strong>
          <small>${DB.itens().length} itens cadastrados</small>
        </div>
        <div class="metrica">
          <span>Valor em estoque</span>
          <strong>${moeda(est.custo)}</strong>
          <small>Vende por ${moeda(est.venda)}</small>
        </div>
      </div>

      ${
        baixos.length
          ? `<section class="cartao cartao--alerta">
              <div class="cartao-topo">
                <h2>${I.alerta} Estoque baixo</h2>
                <span class="contador">${baixos.length}</span>
              </div>
              <ul class="lista-simples">
                ${baixos
                  .slice(0, 4)
                  .map(
                    (i) => `<li><button type="button" data-item="${i.id}">
                      <span>${esc(i.nome)}${i.modelo ? ` <small>${esc(i.modelo)}</small>` : ""}</span>
                      <em class="qtd qtd--${DB.status(i)}">${i.qtd <= 0 ? "Zerado" : i.qtd + " un"}</em>
                    </button></li>`
                  )
                  .join("")}
              </ul>
              <button type="button" class="btn btn--secundario btn--cheio" data-acao="reposicao">${I.zap} Montar pedido de reposição</button>
            </section>`
          : ""
      }

      <section class="cartao">
        <div class="cartao-topo">
          <h2>Próximos compromissos</h2>
          <button type="button" class="link" data-acao="agenda">Ver agenda</button>
        </div>
        ${
          atrasados.length || proximos.length
            ? `<ul class="lista-eventos">
                ${[...atrasados.map((e) => ({ ...e, atrasado: true })), ...proximos]
                  .slice(0, 5)
                  .map(
                    (e) => `<li><button type="button" data-evento="${e.id}" class="evento evento--${e.tipo}${e.atrasado ? " evento--atrasado" : ""}">
                      <span class="evento-quando">${e.atrasado ? "Atrasado" : diaRelativo(e.data)}<small>${e.hora || "Dia todo"}</small></span>
                      <span class="evento-texto"><strong>${esc(e.titulo)}</strong>${e.cliente ? `<small>${esc(e.cliente)}</small>` : ""}</span>
                    </button></li>`
                  )
                  .join("")}
              </ul>`
            : `<p class="nada">Nada marcado para os próximos 7 dias.</p>`
        }
      </section>

      <section class="cartao">
        <div class="cartao-topo">
          <h2>Últimas movimentações</h2>
          ${ultimas.length ? `<button type="button" class="link" data-acao="historico">Ver tudo</button>` : ""}
        </div>
        ${
          ultimas.length
            ? `<ul class="lista-movs">${ultimas.map(Estoque.linhaMov).join("")}</ul>`
            : `<p class="nada">As vendas e entradas que você registrar aparecem aqui.</p>`
        }
      </section>`;
  }

  function iniciar() {
    U.$("view-inicio").addEventListener("click", (e) => {
      const alvo = e.target.closest("[data-acao], [data-item], [data-evento], [data-mov]");
      if (!alvo) return;
      if (alvo.dataset.item) return Estoque.abrirItem(alvo.dataset.item);
      if (alvo.dataset.evento) return Agenda.abrirEvento(alvo.dataset.evento);
      if (alvo.dataset.mov) return Estoque.verMov(alvo.dataset.mov);
      const acoes = {
        ajustes: Ajustes.abrir,
        venda: () => Estoque.novaMov("venda"),
        entrada: () => Estoque.novaMov("entrada"),
        compromisso: () => Agenda.abrirEvento(null, diaISO()),
        item: () => Estoque.abrirItem(null),
        importar: Estoque.importarDoSite,
        reposicao: () => {
          App.irPara("mandar");
          Mandar.reposicao();
        },
        agenda: () => App.irPara("agenda"),
        historico: () => {
          App.irPara("estoque");
          Estoque.mostrarAba("movs");
        },
      };
      acoes[alvo.dataset.acao] && acoes[alvo.dataset.acao]();
    });
  }

  return { render, iniciar, horaDe };
})();
