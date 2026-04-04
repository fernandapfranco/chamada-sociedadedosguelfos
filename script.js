(function () {
    // RESOLUÇÃO DO ERRO: Tenta pegar a variável do Vercel, se não existir (undefined), usa a URL direta.
    let SCRIPT_URL = "";
    try {
        SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
    } catch (e) {
        // Cole aqui a URL da sua NOVA IMPLANTAÇÃO do Apps Script (a de teste)
        SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec"; 
    }

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elTelefone = document.getElementById('telefone');
    const elBtn = document.getElementById('btn-submit');
    const elLista = document.getElementById('lista-membros');
    const elDataDisplay = document.getElementById('data-display');

    // --- AS TRAVAS QUE VOCÊ PEDIU ---
    function aplicarTravas() {
        const aldeiaOk = elComboAldeia.value !== "";
        const socOk = elComboSociedade.value !== "";
        const nomeOk = nomeSelecionado !== "";
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telOk = telLimpo.length >= 10;

        // Desabilita campos se o anterior não estiver preenchido
        elComboSociedade.disabled = !aldeiaOk;
        elTelefone.disabled = !nomeOk;
        
        // O Botão só habilita se TUDO estiver preenchido
        elBtn.disabled = !(aldeiaOk && socOk && nomeOk && telOk);
        elBtn.style.opacity = elBtn.disabled ? "0.5" : "1";
    }

    // Eventos
    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">SELECIONE SOCIEDADE</option>';
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            aldeiasMap[aldeiaSel].forEach(s => elComboSociedade.add(new Option(s, s)));
        }
        nomeSelecionado = '';
        aplicarTravas();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        elLista.innerHTML = '<p class="p-4 text-center text-xs">Buscando...</p>';
        const lista = await chamarGoogle({ 
            action: 'listMembers', 
            aldeia: elComboAldeia.value, 
            sociedade: elComboSociedade.value 
        });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista();
        aplicarTravas();
    };

    elTelefone.oninput = aplicarTravas;

    function renderLista() {
        elLista.innerHTML = '';
        membrosLista.forEach(nome => {
            const isSel = nome === nomeSelecionado;
            const li = document.createElement('li');
            li.className = `px-4 py-3 cursor-pointer ${isSel ? 'bg-gold/20' : ''}`;
            li.innerHTML = `<span class="${isSel ? 'text-gold' : 'text-white'}">${nome}</span>`;
            li.onclick = () => {
                nomeSelecionado = nome;
                renderLista();
                aplicarTravas();
            };
            elLista.appendChild(li);
        });
    }

    async function chamarGoogle(payload) {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        return res.ok ? res.data : { ok: false, error: res.error };
    }

    // Inicialização
    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data && data.aldeias) {
            aldeiasMap = data.aldeias;
            elDataDisplay.textContent = data.dataPadrao;
            elComboAldeia.innerHTML = '<option value="">ALDEIA</option>';
            for (let a in aldeiasMap) elComboAldeia.add(new Option(a, a));
            aplicarTravas();
        }
    })();
})();
