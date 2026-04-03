(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elWrapperSoc = document.getElementById('wrapper-sociedade');
    const elTelefone = document.getElementById('telefone');
    const elBtn = document.getElementById('btn-submit');
    const elCardMembros = document.getElementById('card-membros');
    const elLista = document.getElementById('lista-membros');
    const elListaVazia = document.getElementById('lista-membros-vazia');
    const elBusca = document.getElementById('busca-membro');
    const elDataDisplay = document.getElementById('data-display');

    // Inicialização das Travas (Bloqueia tudo no início)
    elComboSociedade.disabled = true;
    elTelefone.disabled = true;
    elBtn.disabled = true;
    elBtn.style.opacity = "0.5";

    // Função de Controle de Fluxo
    function atualizarTravas() {
        // 1. Sociedade só libera se Aldeia estiver selecionada
        elComboSociedade.disabled = !elComboAldeia.value;
        if (elWrapperSoc) elWrapperSoc.style.opacity = elComboSociedade.disabled ? "0.5" : "1";

        // 2. WhatsApp só libera se um Nome de membro estiver selecionado
        elTelefone.disabled = (nomeSelecionado === '');
        if (elTelefone.parentElement) {
            elTelefone.parentElement.style.opacity = elTelefone.disabled ? "0.5" : "1";
        }

        // 3. Botão Confirmar só libera com Telefone válido (mínimo 10 dígitos)
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telValido = telLimpo.length >= 10;
        
        if (nomeSelecionado && telValido) {
            elBtn.disabled = false;
            elBtn.style.opacity = "1";
        } else {
            elBtn.disabled = true;
            elBtn.style.opacity = "0.5";
        }
    }

    // Renderização da lista de membros com clique para selecionar
    function renderLista() {
        const q = (elBusca.value || '').trim().toLowerCase();
        const filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));

        elLista.innerHTML = '';
        if (elListaVazia) elListaVazia.classList.toggle('hidden', filtrados.length > 0);

        filtrados.forEach(nome => {
            const isSel = nome === nomeSelecionado;
            const li = document.createElement('li');
            li.className = `flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${isSel ? 'bg-gold/10' : ''}`;
            li.innerHTML = `
                <span class="text-sm ${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>
                ${isSel ? '<svg class="h-5 w-5 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>' : '<div class="h-5 w-5 rounded-full border border-white/20"></div>'}
            `;
            li.onclick = () => {
                nomeSelecionado = isSel ? '' : nome;
                renderLista();
                atualizarTravas(); // Libera o WhatsApp após selecionar o nome
            };
            elLista.appendChild(li);
        });
    }

    // Eventos de mudança nos Combos
    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">Selecione a sociedade…</option>';
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            aldeiasMap[aldeiaSel].forEach(soc => elComboSociedade.add(new Option(soc, soc)));
        }
        nomeSelecionado = '';
        if (elCardMembros) elCardMembros.classList.add('hidden-section');
        atualizarTravas();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        if (elCardMembros) elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">Buscando membros...</p>';
        
        const lista = await chamarGoogle({ 
            action: 'listMembers', 
            aldeia: elComboAldeia.value, 
            sociedade: elComboSociedade.value 
        });
        
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista();
        atualizarTravas();
    };

    elTelefone.oninput = atualizarTravas;
    elBusca.oninput = renderLista;

    // Envio do Formulário
    document.getElementById('form-chamada').onsubmit = async (e) => {
        e.preventDefault();
        elBtn.disabled = true;
        elBtn.textContent = "Enviando...";

        const res = await chamarGoogle({
            action: 'saveAttendance',
            aldeia: elComboAldeia.value,
            sociedade: elComboSociedade.value,
            nome: nomeSelecionado,
            telefone: elTelefone.value
        });

        if (res.ok) {
            const telDestino = "55" + elTelefone.value.replace(/\D/g, '');
            const msg = `Salve Maria! Presença confirmada para *${nomeSelecionado}* na *${elComboSociedade.value}* em ${elDataDisplay.textContent}.`;
            
            // Abre o WhatsApp para enviar a mensagem
            window.open(`https://wa.me/${telDestino}?text=${encodeURIComponent(msg)}`, '_blank');
            location.reload(); 
        } else {
            alert(res.error || "Erro ao gravar");
            elBtn.disabled = false;
            elBtn.textContent = "Confirmar Presença";
        }
    };

    // Comunicação com Google
    async function chamarGoogle(payload) {
        try {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            return res.ok ? res.data : { ok: false, error: res.error };
        } catch (e) {
            return { ok: false, error: "Erro de conexão." };
        }
    }

    // Inicialização do App
    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data) {
            aldeiasMap = data.aldeias;
            if (elDataDisplay) elDataDisplay.textContent = data.dataPadrao;
            
            elComboAldeia.innerHTML = '<option value="">Selecione a aldeia…</option>';
            for (let a in aldeiasMap) {
                elComboAldeia.add(new Option(a, a));
            }
        }
    })();
})();
