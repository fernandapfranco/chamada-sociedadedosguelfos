(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
    const WHATSAPP_BUSINESS = "555135174739"; // Seu número Business

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos Novos (Filtros Dependentes)
    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elWrapperSoc = document.getElementById('wrapper-sociedade');

    // Elementos Existentes
    const elForm = document.getElementById('form-chamada');
    const elData = document.getElementById('data');
    const elDataDisplay = document.getElementById('data-display');
    const elCardMembros = document.getElementById('card-membros');
    const elBadge = document.getElementById('badge-membros');
    const elBtnNovo = document.getElementById('btn-novo-membro');
    const elBusca = document.getElementById('busca-membro');
    const elLista = document.getElementById('lista-membros');
    const elListaVazia = document.getElementById('lista-membros-vazia');
    const elTelefone = document.getElementById('telefone'); 
    const elMsg = document.getElementById('msg-global');
    const elBtn = document.getElementById('btn-submit');
    const elBtnLabel = document.getElementById('btn-label');

    // Modais
    const elModal = document.getElementById('modal-novo');
    const elModalFechar = document.getElementById('modal-novo-fechar');
    const elModalNome = document.getElementById('modal-nome');
    const elModalTelefoneNovo = document.getElementById('modal-telefone-novo');
    const elModalCadastrar = document.getElementById('modal-btn-cadastrar');
    const elModalAviso = document.getElementById('modal-aviso');
    const elAvisoTexto = document.getElementById('aviso-texto');
    const elBtnFecharAviso = document.getElementById('btn-fechar-aviso');

    function atualizarBotaoSubmit() {
    const telLimpo = elTelefone.value.replace(/\D/g, '');
    const telValido = telLimpo.length >= 10;
    
    // SÓ LIBERA SE: Tem Aldeia + Tem Sociedade + Tem Nome Selecionado + Tem Telefone
    const tudoPreenchido = elComboAldeia.value && elComboSociedade.value && nomeSelecionado && telValido;
    
    elBtn.disabled = !tudoPreenchido;
}

// 2. Lógica de Cascata: Aldeia -> Sociedade
elComboAldeia.onchange = () => {
    const aldeiaSel = elComboAldeia.value;
    elComboSociedade.innerHTML = '<option value="">Selecione a sociedade…</option>';
    
    if (aldeiaSel) {
        elWrapperSoc.classList.remove('opacity-50', 'pointer-events-none');
        // Pega as sociedades do mapa que veio do Google
        aldeiasMap[aldeiaSel].forEach(soc => {
            elComboSociedade.add(new Option(soc, soc));
        });
    } else {
        elWrapperSoc.classList.add('opacity-50', 'pointer-events-none');
    }
    
    // Sempre que mudar a aldeia, reseta a seleção de membro
    nomeSelecionado = '';
    elCardMembros.classList.add('hidden-section');
    atualizarBotaoSubmit();
};

// 3. Carregar membros quando selecionar a Sociedade
elComboSociedade.onchange = async () => {
    const aldeia = elComboAldeia.value;
    const sociedade = elComboSociedade.value;
    
    if (!aldeia || !sociedade) return;

    elCardMembros.classList.remove('hidden-section');
    elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">Buscando membros...</p>';
    
    // Envia os dois campos separados para o Apps Script
    const lista = await chamarGoogle({ action: 'listMembers', aldeia, sociedade });
    membrosLista = Array.isArray(lista) ? lista : [];
    renderLista();
    atualizarBotaoSubmit();
};

// 4. Inicialização: Preencher o primeiro combo (Aldeia)
(async () => {
    const data = await chamarGoogle({ action: 'getOptions' });
    if (data) {
        aldeiasMap = data.aldeias; // Guarda o mapa para usar depois
        elData.value = data.dataPadrao;
        elDataDisplay.textContent = formatarDataLongaPt(data.dataPadrao);
        
        elComboAldeia.innerHTML = '<option value="">Selecione a aldeia…</option>';
        for (let aldeia in aldeiasMap) {
            elComboAldeia.add(new Option(aldeia, aldeia));
        }
    }
})();

    // Funções Auxiliares
    async function chamarGoogle(payload) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const res = await response.json();
            return res.ok ? res.data : { ok: false, error: res.error };
        } catch (e) {
            return { ok: false, error: "Erro de conexão com o servidor." };
        }
    }

    function mostrarAviso(mensagem) {
        elAvisoTexto.textContent = mensagem;
        elModalAviso.classList.replace('hidden', 'flex');
    }

    function formatarDataLongaPt(dataStr) {
        if (!dataStr) return '—';
        var partes = dataStr.split('/');
        var d = new Date(partes[2], partes[1] - 1, partes[0]);
        var raw = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    function atualizarBotaoSubmit() {
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telValido = telLimpo.length >= 10; 
        elBtn.disabled = !(nomeSelecionado && telValido && elComboSociedade.value);
    }

    function renderLista() {
        var q = (elBusca.value || '').trim().toLowerCase();
        var filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));
        elLista.innerHTML = '';
        elListaVazia.classList.toggle('hidden', filtrados.length > 0);
        
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
                atualizarBotaoSubmit();
            };
            elLista.appendChild(li);
        });
        elBadge.textContent = membrosLista.length;
    }

    // --- LÓGICA DE FILTROS DEPENDENTES ---
    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">Selecione a sociedade…</option>';
        
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            elWrapperSoc.classList.remove('opacity-50', 'pointer-events-none');
            aldeiasMap[aldeiaSel].forEach(soc => {
                elComboSociedade.add(new Option(soc, soc));
            });
        } else {
            elWrapperSoc.classList.add('opacity-50', 'pointer-events-none');
        }
        elCardMembros.classList.add('hidden-section');
        atualizarBotaoSubmit();
    };

    elComboSociedade.onchange = carregarMembros;

    async function carregarMembros() {
        const aldeia = elComboAldeia.value;
        const sociedade = elComboSociedade.value;
        if (!aldeia || !sociedade) return;

        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">Carregando...</p>';
        
        const lista = await chamarGoogle({ action: 'listMembers', aldeia, sociedade });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista();
    }

    // Eventos e Modais
    elBusca.oninput = renderLista;
    elTelefone.oninput = atualizarBotaoSubmit;
    elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');
    elModalFechar.onclick = () => elModal.classList.replace('flex', 'hidden');

    elBtnNovo.onclick = () => {
        const aldeia = elComboAldeia.value;
        const sociedade = elComboSociedade.value;
        document.getElementById('modal-info-aldeia').textContent = `${aldeia} - ${sociedade}`;
        elModal.classList.replace('hidden', 'flex');
    };

    elModalCadastrar.onclick = () => {
        const nomeOriginal = elModalNome.value.trim();
        const telNovo = elModalTelefoneNovo.value.trim();

        if (nomeOriginal.length < 3 || telNovo.length < 10) {
            mostrarAviso("Preencha o nome e o telefone corretamente.");
            return;
        }

        nomeSelecionado = nomeOriginal;
        elTelefone.value = telNovo; 
        
        elModal.classList.replace('flex', 'hidden');
        elModalNome.value = '';
        elModalTelefoneNovo.value = '';
        
        if (!membrosLista.includes(nomeOriginal)) {
            membrosLista.push(nomeOriginal);
        }
        renderLista();
        atualizarBotaoSubmit();
    };

    // SUBMIT E WHATSAPP
    elForm.onsubmit = async (e) => {
        e.preventDefault();
        const aldeia = elComboAldeia.value;
        const sociedade = elComboSociedade.value;
        
        elBtn.disabled = true;
        elBtnLabel.textContent = 'Enviando...';

        const res = await chamarGoogle({
            action: 'saveAttendance',
            data: elData.value,
            aldeia: aldeia,
            sociedade: sociedade,
            nome: nomeSelecionado,
            telefone: elTelefone.value
        });

        if (res.ok) {
            // PONTO 7: Abrir WhatsApp da pessoa com a mensagem vinda do seu Business
            // Como navegador não "manda" sozinho, abrimos o chat da PESSOA 
            // para que ela veja a mensagem ou você envie.
            const telDestino = "55" + elTelefone.value.replace(/\D/g, '');
            const msg = `Salve Maria! Presença confirmada para *${nomeSelecionado}* na *${sociedade}* em ${elDataDisplay.textContent}.`;
            
            // Link que abre o chat da pessoa
            const linkZap = `https://wa.me/${telDestino}?text=${encodeURIComponent(msg)}`;
            
            nomeSelecionado = '';
            elTelefone.value = '';
            renderLista();
            window.open(linkZap, '_blank');
        } else {
            alert(res.error || "Erro ao gravar");
        }
        
        elBtnLabel.textContent = 'Confirmar presença';
        elBtn.disabled = false;
    };

    // Inicialização
    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data) {
            aldeiasMap = data.aldeias;
            elData.value = data.dataPadrao;
            elDataDisplay.textContent = formatarDataLongaPt(data.dataPadrao);
            
            elComboAldeia.innerHTML = '<option value="">Selecione a aldeia…</option>';
            for (let aldeia in aldeiasMap) {
                elComboAldeia.add(new Option(aldeia, aldeia));
            }
        }
    })();
})();
