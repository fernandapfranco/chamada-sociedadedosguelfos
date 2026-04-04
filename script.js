(function () {
    // RESOLUÇÃO DE URL: Use a sua URL de produção ou preview aqui
    let SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec"; 
    
    try {
        if (import.meta.env && import.meta.env.VITE_SCRIPT_URL) {
            SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
        }
    } catch (e) {}

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elTelefone = document.getElementById('telefone');
    const elBtn = document.getElementById('btn-submit');
    const elCardMembros = document.getElementById('card-membros');
    const elLista = document.getElementById('lista-membros');
    const elDataDisplay = document.getElementById('data-display');

    function aplicarTravas() {
        const aldeiaOk = elComboAldeia.value !== "";
        const socOk = elComboSociedade.value !== "";
        const nomeOk = nomeSelecionado !== "";
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telOk = telLimpo.length >= 10;

        // Desbloqueio em cascata
        elComboSociedade.disabled = !aldeiaOk;
        
        // Só habilita o campo de WhatsApp se o nome estiver selecionado
        elTelefone.disabled = !nomeOk;
        elTelefone.parentElement.style.opacity = elTelefone.disabled ? "0.5" : "1";

        // Botão de confirmação só libera com TUDO preenchido
        elBtn.disabled = !(aldeiaOk && socOk && nomeOk && telOk);
        elBtn.style.opacity = elBtn.disabled ? "0.5" : "1";
    }

    // Inicialização do estado
    aplicarTravas();

    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">SELECIONE SOCIEDADE</option>';
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            aldeiasMap[aldeiaSel].forEach(s => elComboSociedade.add(new Option(s, s)));
        }
        nomeSelecionado = '';
        elCardMembros.classList.add('hidden-section');
        aplicarTravas();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs">Carregando membros...</p>';
        
        const lista = await chamarGoogle({ 
            action: 'listMembers', 
            aldeia: elComboAldeia.value, 
            sociedade: elComboSociedade.value 
        });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista();
        aplicarTravas();
    };

    function renderLista() {
        elLista.innerHTML = '';
        membrosLista.forEach(nome => {
            const isSel = nome === nomeSelecionado;
            const li = document.createElement('li');
            li.className = `px-4 py-3 cursor-pointer border-b border-white/5 ${isSel ? 'bg-gold/20' : ''}`;
            li.innerHTML = `<span class="${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>`;
            li.onclick = () => {
                nomeSelecionado = nome;
                renderLista();
                aplicarTravas(); // Desbloqueia o WhatsApp
            };
            elLista.appendChild(li);
        });
    }

    elTelefone.oninput = aplicarTravas;

    document.getElementById('form-chamada').onsubmit = async (e) => {
        e.preventDefault();
        elBtn.disabled = true;
        elBtn.textContent = "REGISTRANDO...";

        const res = await chamarGoogle({
            action: 'saveAttendance',
            aldeia: elComboAldeia.value,
            sociedade: elComboSociedade.value,
            nome: nomeSelecionado,
            telefone: elTelefone.value
        });

        if (res.ok) {
            const telDestino = "55" + elTelefone.value.replace(/\D/g, '');
            const msg = `Salve Maria! Presença confirmada para *${nomeSelecionado}* na *${elComboSociedade.value}*.`;
            window.open(`https://wa.me/${telDestino}?text=${encodeURIComponent(msg)}`, '_blank');
            location.reload();
        } else {
            alert("Erro: " + res.error);
            elBtn.disabled = false;
        }
    };

    async function chamarGoogle(payload) {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        return res.ok ? res.data : { ok: false, error: res.error };
    }

    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data && data.aldeias) {
            aldeiasMap = data.aldeias;
            elDataDisplay.textContent = data.dataPadrao;
            elComboAldeia.innerHTML = '<option value="">SELECIONE A ALDEIA</option>';
            for (let a in aldeiasMap) elComboAldeia.add(new Option(a, a));
            aplicarTravas();
        }
    })();
})();
