const Agenda = (() => {
  const { $, esc, moeda, numero, decimalBR, diaISO, deISO, somarDias, dataLonga, diaRelativo, pad, MESES } = U;
  const I = UI.ICONES;

  const hoje = diaISO();
  const estado = { mes: hoje.slice(0, 7), dia: hoje };

  const nomeTipo = (k) => (DB.TIPOS_EVENTO.find((t) => t.key === k) || { label: "Outro" }).label;

  function render() {
    const raiz = $("view-agenda");
    const [ano, mes] = estado.mes.split("-").map(Number);
    const primeiro = new Date(ano, mes - 1, 1);
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const inicio = primeiro.getDay();
    const porDia = {};
    DB.eventos().forEach((e) => {
      if (e.data.startsWith(estado.mes)) (porDia[e.data] = porDia[e.data] || []).push(e);
    });

    let celulas = "";
    for (let i = 0; i < inicio; i++) celulas += `<span class="dia dia--vazio"></span>`;
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = `${estado.mes}-${pad(d)}`;
      const evs = porDia[iso] || [];
      const classes = ["dia", iso === diaISO() ? "dia--hoje" : "", iso === estado.dia ? "dia--sel" : "", iso < diaISO() ? "dia--passado" : ""].join(" ");
      celulas += `<button type="button" class="${classes}" data-dia="${iso}" aria-label="${dataLonga(iso)}${evs.length ? `, ${evs.length} compromisso(s)` : ""}">
        <span>${d}</span>
        <i class="pontos">${evs
          .slice(0, 3)
          .map((e) => `<b class="ponto ponto--${e.tipo}${e.feito ? " ponto--feito" : ""}"></b>`)
          .join("")}</i>
      </button>`;
    }

    const doDia = DB.eventosDoDia(estado.dia);
    const atrasados = DB.atrasados();

    raiz.innerHTML = `
      <header class="topo">
        <div>
          <p class="topo-sub">${DB.proximos(7).length} nos próximos 7 dias</p>
          <h1>Agenda</h1>
        </div>
        <button type="button" class="btn btn--primario btn--pequeno" data-acao="novo">${I.mais} Agendar</button>
      </header>

      <section class="calendario">
        <div class="cal-topo">
          <button type="button" class="icone-btn" data-mes="-1" aria-label="Mês anterior">${I.voltar}</button>
          <h2>${MESES[mes - 1]} <span>${ano}</span></h2>
          <button type="button" class="icone-btn" data-mes="1" aria-label="Próximo mês">${I.seta}</button>
        </div>
        <div class="cal-semana" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
        <div class="cal-grade">${celulas}</div>
        ${estado.mes !== diaISO().slice(0, 7) || estado.dia !== diaISO() ? `<button type="button" class="link cal-hoje" data-acao="hoje">Voltar para hoje</button>` : ""}
      </section>

      ${
        atrasados.length
          ? `<section class="cartao cartao--alerta">
              <div class="cartao-topo"><h2>${I.alerta} Ficaram para trás</h2><span class="contador">${atrasados.length}</span></div>
              <ul class="lista-eventos">${atrasados.map((e) => linhaEvento(e, true)).join("")}</ul>
            </section>`
          : ""
      }

      <section class="cartao">
        <div class="cartao-topo">
          <h2 class="primeira-maiuscula">${diaRelativo(estado.dia) === U.dataCurta(estado.dia) ? dataLonga(estado.dia) : `${diaRelativo(estado.dia)} · ${dataLonga(estado.dia)}`}</h2>
        </div>
        ${
          doDia.length
            ? `<ul class="lista-eventos">${doDia.map((e) => linhaEvento(e)).join("")}</ul>`
            : `<p class="nada">Nenhum compromisso neste dia.</p>`
        }
        <button type="button" class="btn btn--secundario btn--cheio" data-acao="novo">${I.mais} Agendar neste dia</button>
      </section>`;
  }

  function linhaEvento(e, atrasado = false) {
    return `<li><button type="button" data-evento="${e.id}" class="evento evento--${e.tipo}${e.feito ? " evento--feito" : ""}${atrasado ? " evento--atrasado" : ""}">
      <span class="evento-quando">${atrasado ? U.dataCurta(e.data) : e.hora || "Dia"}<small>${atrasado ? e.hora || "" : e.hora ? nomeTipo(e.tipo) : "todo"}</small></span>
      <span class="evento-texto"><strong>${esc(e.titulo)}</strong><small>${esc([e.cliente, e.valor ? moeda(e.valor) : ""].filter(Boolean).join(" · ") || nomeTipo(e.tipo))}</small></span>
      ${e.feito ? `<span class="evento-feito">${I.check}</span>` : ""}
    </button></li>`;
  }

  /* Compromisso */
  function abrirEvento(id, dataPadrao, prefill = {}) {
    const ev = id ? DB.evento(id) : null;
    const v = ev || { titulo: "", tipo: "instalacao", data: dataPadrao || estado.dia, hora: "", duracao: 60, cliente: "", telefone: "", valor: 0, obs: "", ...prefill };
    const corpo = UI.abrir({
      titulo: ev ? "Compromisso" : "Novo compromisso",
      acao: { texto: "Salvar", fn: () => salvar() },
      html: `
        ${
          ev
            ? `<div class="botoes botoes--coluna">
                <button type="button" class="btn ${ev.feito ? "btn--secundario" : "btn--sucesso"} btn--cheio" data-acao="feito">${I.check} ${ev.feito ? "Marcar como pendente" : "Marcar como feito"}</button>
              </div>`
            : ""
        }
        <form class="form" id="formEvento" novalidate>
          ${UI.campo("O que é *", `<input name="titulo" maxlength="80" value="${esc(v.titulo)}" placeholder="Ex.: Instalar LED no Onix" />`)}
          ${UI.campo("Tipo", `<select name="tipo">${UI.opcoes(DB.TIPOS_EVENTO, v.tipo)}</select>`)}
          <div class="campos-3">
            ${UI.campo("Dia", `<input name="data" type="date" value="${v.data}" />`)}
            ${UI.campo("Hora", `<input name="hora" type="time" value="${v.hora || ""}" />`)}
            ${UI.campo(
              "Duração",
              `<select name="duracao">${UI.opcoes(
                [
                  { key: "30", label: "30 min" },
                  { key: "60", label: "1 hora" },
                  { key: "90", label: "1h30" },
                  { key: "120", label: "2 horas" },
                  { key: "180", label: "3 horas" },
                ],
                String(v.duracao || 60)
              )}</select>`
            )}
          </div>
          <div class="campos-2">
            ${UI.campo("Cliente / contato", `<input name="cliente" maxlength="60" value="${esc(v.cliente)}" />`)}
            ${UI.campo("WhatsApp", `<input name="telefone" type="tel" inputmode="tel" maxlength="20" value="${esc(v.telefone)}" placeholder="84 9 0000-0000" />`)}
          </div>
          ${UI.campo("Valor (R$)", `<input name="valor" inputmode="decimal" value="${decimalBR(v.valor)}" />`, "opcional")}
          ${UI.campo("Anotações", `<textarea name="obs" rows="3" maxlength="400" placeholder="Carro, peças, endereço...">${esc(v.obs)}</textarea>`)}
          <p class="erro" id="eventoErro" role="alert"></p>
          <button type="submit" class="btn btn--primario btn--cheio">Salvar compromisso</button>
        </form>
        ${
          ev
            ? `<section class="bloco">
                <h3>Mandar e lembrar</h3>
                <div class="botoes botoes--coluna">
                  <button type="button" class="btn btn--secundario btn--cheio" data-acao="ics">${I.calendario} Pôr no calendário do celular</button>
                  <button type="button" class="btn btn--secundario btn--cheio" data-acao="google">${I.calendario} Pôr na Google Agenda</button>
                  ${ev.telefone ? `<button type="button" class="btn btn--zap btn--cheio" data-acao="lembrar">${I.zap} Lembrar o cliente no WhatsApp</button>` : ""}
                  <button type="button" class="btn btn--secundario btn--cheio" data-acao="compartilhar">${I.compartilhar} Compartilhar</button>
                </div>
              </section>
              <button type="button" class="btn btn--perigo-leve btn--cheio" data-acao="excluir">Excluir compromisso</button>`
            : `<p class="ajuda">Depois de salvar, dá pra colocar no calendário do celular para tocar o alarme.</p>`
        }`,
    });

    const f = corpo.querySelector("#formEvento");
    if (!ev && !v.titulo) setTimeout(() => f.titulo.focus(), 300);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      salvar();
    });

    function salvar() {
      const titulo = f.titulo.value.trim();
      if (!titulo) {
        corpo.querySelector("#eventoErro").textContent = "Escreva o que é o compromisso.";
        f.titulo.focus();
        return;
      }
      if (!f.data.value) {
        corpo.querySelector("#eventoErro").textContent = "Escolha o dia.";
        return;
      }
      const salvo = DB.salvarEvento({
        ...(ev ? { id: ev.id } : {}),
        titulo,
        tipo: f.tipo.value,
        data: f.data.value,
        hora: f.hora.value,
        duracao: Number(f.duracao.value) || 60,
        cliente: f.cliente.value.trim(),
        telefone: f.telefone.value.trim(),
        valor: Math.max(0, numero(f.valor.value)),
        obs: f.obs.value.trim(),
      });
      estado.dia = salvo.data;
      estado.mes = salvo.data.slice(0, 7);
      if (ev) {
        UI.fechar();
        UI.toast("Compromisso atualizado.");
      } else {
        UI.toast("Compromisso salvo.");
        abrirEvento(salvo.id);
      }
    }

    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-acao]");
      if (!b || !ev) return;
      const a = b.dataset.acao;
      if (a === "feito") {
        DB.salvarEvento({ id: ev.id, feito: !ev.feito });
        UI.fechar();
        UI.toast(ev.feito ? "Feito." : "Voltou para pendente.");
      }
      if (a === "ics") {
        U.baixar(`${slug(ev.titulo)}.ics`, ics([ev]), "text/calendar;charset=utf-8");
        UI.toast("Abra o arquivo para adicionar ao calendário.");
      }
      if (a === "google") window.open(linkGoogle(ev), "_blank", "noopener");
      if (a === "lembrar") U.abrirZap(ev.telefone, textoLembrete(ev));
      if (a === "compartilhar") {
        const r = await U.compartilhar(ev.titulo, textoEvento(ev));
        if (r === "copiado") UI.toast("Copiado.");
      }
      if (a === "excluir") {
        const ok = await UI.confirmar("Excluir compromisso?", `"${ev.titulo}" sai da agenda.`, "Excluir");
        if (!ok) return;
        DB.excluirEvento(ev.id);
        UI.fechar();
        UI.toast("Compromisso excluído.");
      }
    });
  }

  /* Textos */
  const quandoTexto = (ev) => `${dataLonga(ev.data)}${ev.hora ? ` às ${ev.hora}` : ""}`;

  function textoLembrete(ev) {
    const nome = ev.cliente ? ev.cliente.split(" ")[0] : "";
    const oQue = ev.tipo === "instalacao" ? "sua instalação" : ev.tipo === "entrega" ? "sua entrega" : "nosso compromisso";
    return [
      `Olá${nome ? ", " + nome : ""}! Aqui é o Marcos, da MV LEDs.`,
      `Passando para confirmar ${oQue}: *${quandoTexto(ev)}*.`,
      ev.valor ? `Valor combinado: ${moeda(ev.valor)}.` : null,
      `Pode confirmar pra mim?`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function textoEvento(ev) {
    return [
      `*${ev.titulo}*`,
      quandoTexto(ev),
      ev.cliente ? `Cliente: ${ev.cliente}${ev.telefone ? " · " + ev.telefone : ""}` : null,
      ev.valor ? `Valor: ${moeda(ev.valor)}` : null,
      ev.obs || null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /* Calendário externo */
  const slug = (t) => U.normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "compromisso";
  const icsEsc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c);
  const compacto = (iso, hora) => iso.replace(/-/g, "") + (hora ? "T" + hora.replace(":", "") + "00" : "");

  function fimDe(ev) {
    const [h, m] = ev.hora.split(":").map(Number);
    const d = deISO(ev.data);
    d.setHours(h, m + (ev.duracao || 60), 0, 0);
    return { data: U.diaISO(d), hora: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
  }

  function descricao(ev) {
    return [ev.cliente && `Cliente: ${ev.cliente}`, ev.telefone && `WhatsApp: ${ev.telefone}`, ev.valor && `Valor: ${moeda(ev.valor)}`, ev.obs]
      .filter(Boolean)
      .join("\n");
  }

  function ics(lista) {
    const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const eventos = lista.map((ev) => {
      const linhas = ["BEGIN:VEVENT", `UID:${ev.id}@mvleds-gestao`, `DTSTAMP:${agora}`];
      if (ev.hora) {
        const fim = fimDe(ev);
        linhas.push(`DTSTART:${compacto(ev.data, ev.hora)}`, `DTEND:${compacto(fim.data, fim.hora)}`);
      } else {
        linhas.push(`DTSTART;VALUE=DATE:${compacto(ev.data)}`, `DTEND;VALUE=DATE:${compacto(somarDias(ev.data, 1))}`);
      }
      linhas.push(`SUMMARY:${icsEsc(ev.titulo)}`);
      const desc = descricao(ev);
      if (desc) linhas.push(`DESCRIPTION:${icsEsc(desc)}`);
      linhas.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEsc(ev.titulo)}`,
        ev.hora ? "TRIGGER:-PT1H" : "TRIGGER:PT8H",
        "END:VALARM",
        "END:VEVENT"
      );
      return linhas.join("\r\n");
    });
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MV LEDs//Gestao//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...eventos, "END:VCALENDAR"].join("\r\n");
  }

  function linkGoogle(ev) {
    let datas;
    if (ev.hora) {
      const fim = fimDe(ev);
      datas = `${compacto(ev.data, ev.hora)}/${compacto(fim.data, fim.hora)}`;
    } else {
      datas = `${compacto(ev.data)}/${compacto(somarDias(ev.data, 1))}`;
    }
    const p = new URLSearchParams({ action: "TEMPLATE", text: ev.titulo, dates: datas, details: descricao(ev), ctz: "America/Fortaleza" });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  }

  function exportarTudo() {
    const futuros = DB.eventos().filter((e) => e.data >= diaISO() && !e.feito);
    if (!futuros.length) return UI.toast("Não há compromissos futuros para exportar.");
    U.baixar("agenda-mvleds.ics", ics(futuros), "text/calendar;charset=utf-8");
    UI.toast(`${futuros.length} compromissos exportados.`);
  }

  function iniciar() {
    $("view-agenda").addEventListener("click", (e) => {
      const b = e.target.closest("[data-acao], [data-dia], [data-mes], [data-evento]");
      if (!b) return;
      if (b.dataset.evento) return abrirEvento(b.dataset.evento);
      if (b.dataset.dia) {
        estado.dia = b.dataset.dia;
        return render();
      }
      if (b.dataset.mes) {
        const [a, m] = estado.mes.split("-").map(Number);
        const d = new Date(a, m - 1 + Number(b.dataset.mes), 1);
        estado.mes = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        estado.dia = estado.mes === diaISO().slice(0, 7) ? diaISO() : `${estado.mes}-01`;
        return render();
      }
      if (b.dataset.acao === "novo") abrirEvento(null, estado.dia);
      if (b.dataset.acao === "hoje") {
        estado.dia = diaISO();
        estado.mes = estado.dia.slice(0, 7);
        render();
      }
    });
  }

  return { render, iniciar, abrirEvento, exportarTudo, nomeTipo };
})();
