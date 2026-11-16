const Ajustes = (() => {
  const { esc, diaISO } = U;
  const I = UI.ICONES;

  function abrir() {
    const cfg = DB.config();
    const ultimo = cfg.ultimoBackup ? U.dataCurta(cfg.ultimoBackup) + "/" + cfg.ultimoBackup.slice(0, 4) : "nunca";
    const corpo = UI.abrir({
      titulo: "Ajustes",
      html: `
        <form class="form" id="formAjustes" novalidate>
          ${UI.campo("Seu nome", `<input name="nome" maxlength="30" value="${esc(cfg.nome)}" />`)}
          <div class="campos-2">
            ${UI.campo("Fornecedor principal", `<input name="fornecedorNome" maxlength="60" value="${esc(cfg.fornecedorNome)}" />`)}
            ${UI.campo("WhatsApp do fornecedor", `<input name="fornecedorZap" type="tel" inputmode="tel" maxlength="20" value="${esc(cfg.fornecedorZap)}" />`)}
          </div>
          <button type="submit" class="btn btn--primario btn--cheio">Salvar</button>
        </form>

        <section class="bloco">
          <h3>Cópia de segurança</h3>
          <p class="ajuda">Tudo fica salvo neste celular. Faça uma cópia de vez em quando e guarde no WhatsApp ou no Drive: se trocar de celular ou limpar o navegador, é com ela que você recupera tudo. Última cópia: <b>${ultimo}</b>.</p>
          <div class="botoes botoes--coluna">
            <button type="button" class="btn btn--secundario btn--cheio" data-acao="backup">${I.download} Fazer cópia de segurança</button>
            <label class="btn btn--secundario btn--cheio">
              <input type="file" accept=".json,application/json" id="arquivoBackup" hidden />
              ${I.entrada} Restaurar uma cópia
            </label>
          </div>
        </section>

        <section class="bloco">
          <h3>Usar como aplicativo</h3>
          <p class="ajuda"><b>iPhone:</b> no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".<br /><b>Android:</b> no Chrome, toque nos três pontinhos e depois em "Adicionar à tela inicial".</p>
        </section>

        <section class="bloco">
          <h3>Começar do zero</h3>
          <p class="ajuda">Apaga estoque, vendas e agenda deste celular. Faça uma cópia antes.</p>
          <button type="button" class="btn btn--perigo-leve btn--cheio" data-acao="apagar">Apagar tudo</button>
        </section>
        <p class="rodape">MV LEDs Gestão · feito por Synex Sistemas</p>`,
    });

    const f = corpo.querySelector("#formAjustes");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      DB.salvarConfig({
        nome: f.nome.value.trim() || "Marcos",
        fornecedorNome: f.fornecedorNome.value.trim(),
        fornecedorZap: f.fornecedorZap.value.trim(),
      });
      UI.fechar();
      UI.toast("Ajustes salvos.");
    });

    corpo.querySelector("#arquivoBackup").addEventListener("change", async (e) => {
      const arq = e.target.files[0];
      if (!arq) return;
      const ok = await UI.confirmar("Restaurar cópia?", "O que está no app agora é substituído pelo conteúdo da cópia.", "Restaurar");
      if (!ok) return;
      try {
        DB.importar(await arq.text());
        UI.fechar();
        UI.toast("Cópia restaurada.");
      } catch (err) {
        UI.toast(err.message && err.message.includes("backup") ? err.message : "Esse arquivo não é uma cópia válida.", true);
      }
    });

    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-acao]");
      if (!b) return;
      if (b.dataset.acao === "backup") {
        DB.salvarConfig({ ultimoBackup: diaISO() });
        U.baixar(`mvleds-gestao-${diaISO()}.json`, DB.exportar(), "application/json");
        UI.toast("Cópia baixada. Guarde em lugar seguro.");
      }
      if (b.dataset.acao === "apagar") {
        const ok = await UI.confirmar("Apagar tudo?", "Estoque, vendas e agenda deste celular serão apagados. Não tem como desfazer.", "Apagar tudo");
        if (!ok) return;
        DB.apagarTudo();
        UI.fechar();
        UI.toast("Tudo apagado.");
      }
    });
  }

  return { abrir };
})();
