(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec";

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    // Mapeamento de Elementos do DOM
    const elForm = document.getElementById('form-chamada');
    const elData = document.getElementById('data');
    const elDataDisplay = document.getElementById('data-display');
    const elCombo = document.getElementById('combo-aldeia-sociedade');
    const elCardMembros = document.getElementById('card-membros');
    const elBadge = document.getElementById('badge-membros');
    const elBtnNovo = document.getElementById('btn-novo-membro');
    const elBusca = document.getElementById('busca-membro');
    const elLista = document.getElementById('lista-membros');
    const elListaVazia = document.getElementById('lista-membros-vazia');
    const elEmail = document.getElementById('email');
    const elMsg = document.getElementById('msg-global');
    const elBtn = document.getElementById('btn-submit');
    const elBtnLabel = document.getElementById('btn-label');
    const elModal = document.getElementById('modal-novo');
    const elModalFechar = document.getElementById('modal-novo-fechar');
    const elModalNome = document.getElementById('modal-nome');
    const elModalCadastrar = document.getElementById('modal-btn-cadastrar');
    const elModalAviso = document.getElementById('modal-aviso');
    const elAvisoTexto = document.getElementById('aviso-texto');
    const elBtnFecharAviso = document.getElementById('btn-fechar-aviso');

    // --- COMUNICAÇÃO ---
    async function chamarGoogle(payload) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const res = await response.json();
            return res;
        } catch (e) {
            return { ok: false, error: "Erro de conexão com o servidor." };
        }
    }

    // --- MODAIS E AVISOS ---
    function mostrarAviso(mensagem) {
        elAvisoTexto.textContent = mensagem;
        elModalAviso.classList.replace('hidden', 'flex');
    }

    elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');

    function showGlobal(msg, tipo) {
        elMsg.textContent = msg || '';
        elMsg.className = `rounded-2xl border px-4 py-3 text-sm font-sans font-bold text-center ${msg ? 'block' : 'hidden'} `;
        if (tipo === 'ok') {
            elMsg.classList.add('bg-emerald-900/40', 'border-emerald-500', 'text-emerald-200');
        } else {
            elMsg.classList.add('bg-red-900/40', 'border-red-500', 'text-red-200');
        }
    }

    // --- LÓGICA DE INTERFACE ---
    function formatarDataLongaPt(dataStr) {
        if (!dataStr) return '—';
        var partes = dataStr.split('/');
        var d = new Date(partes[2], partes[1] - 1, partes[0]);
        var raw = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
        return raw.charAt(0).toUpperCase() + raw.slice(1);
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
                if (elForm.dataset.finalizado === "true") return; // Trava se já registrou
                nomeSelecionado = isSel ? '' : nome;
                renderLista();
                atualizarBotaoSubmit();
            };
            elLista.appendChild(li);
        });
        elBadge.textContent = membrosLista.length;
    }

    // REGRA 2: Validação rigorosa para habilitar o botão
    function atualizarBotaoSubmit() {
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value.trim());
        const sociedadeOk = elCombo.value !== "";
        const nomeOk = nomeSelecionado !== "";
        
        elBtn.disabled = !(sociedadeOk && nomeOk && emailValido);
    }

    async function carregarMembros() {
        const val = elCombo.value;
        if (!val) {
            elCardMembros.classList.add('hidden-section');
            return;
        }
        const op = opcoesCombo[val];
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">Carregando membros...</p>';
        
        const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
        membrosLista = res.ok ? res.data : [];
        renderLista();
        atualizarBotaoSubmit();
    }

    // --- EVENTOS ---
    elCombo.onchange = carregarMembros;
    elBusca.oninput = renderLista;
    elEmail.oninput = atualizarBotaoSubmit;

    elBtnNovo.onclick = () => {
        const op = opcoesCombo[elCombo.value];
        document.getElementById('modal-info-aldeia').textContent = `${op.aldeia} - ${op.sociedade}`;
        elModal.classList.replace('hidden', 'flex');
    };

    elModalFechar.onclick = () => elModal.classList.replace('flex', 'hidden');

    // REGRA 3 E 4: Cadastro de novo membro com validação global
    elModalCadastrar.onclick = async () => {
        const nomeOriginal = elModalNome.value.trim();
        const op = opcoesCombo[elCombo.value];

        if (nomeOriginal.length < 3) return mostrarAviso("O nome deve ter pelo menos 3 caracteres.");
        
        elModalCadastrar.disabled = true;
        const res = await chamarGoogle({ 
            action: 'addMember', 
            nome: nomeOriginal, 
            aldeia: op.aldeia, 
            sociedade: op.sociedade 
        });

        if (res.ok) {
            elModal.classList.replace('flex', 'hidden');
            elModalNome.value = '';
            nomeSelecionado = nomeOriginal;
            await carregarMembros(); // Recarrega lista para incluir o novo
            showGlobal("Membro cadastrado!", "ok");
        } else {
            mostrarAviso(res.error || "Erro ao cadastrar.");
        }
        elModalCadastrar.disabled = false;
    };

    // REGRA 1: Processamento de registro e persistência de tela
    elForm.onsubmit = async (e) => {
        e.preventDefault();
        const op = opcoesCombo[elCombo.value];
        elBtn.disabled = true;
        elBtnLabel.textContent = 'Enviando dados...';
        
        const res = await chamarGoogle({
            action: 'saveAttendance',
            data: elData.value,
            aldeia: op.aldeia,
            sociedade: op.sociedade,
            nome: nomeSelecionado,
            email: elEmail.value.trim()
        });

        if (res.ok) {
            showGlobal('Presença confirmada com sucesso!', 'ok');
            elBtnLabel.textContent = 'Registrado';
            elBtn.disabled = true; 
            elForm.dataset.finalizado = "true"; // Marca estado para o JS
            // Desabilita campos para evitar edições pós-sucesso
            elForm.querySelectorAll('input, select, button').forEach(item => {
                if(item.id !== 'btn-submit') item.disabled = true;
            });
        } else {
            showGlobal(res.error || 'Erro ao gravar', 'erro');
            elBtnLabel.textContent = 'Confirmar presença';
            elBtn.disabled = false;
        }
    };

    // --- INICIALIZAÇÃO ---
    (async () => {
        const res = await chamarGoogle({ action: 'getOptions' });
        if (res.ok) {
            const data = res.data;
            aldeiasMap = data.aldeias;
            elData.value = data.dataPadrao;
            elDataDisplay.textContent = formatarDataLongaPt(data.dataPadrao);
            
            elCombo.innerHTML = '<option value="">Selecione a sociedade…</option>';
            let i = 0;
            for (let aldeia in aldeiasMap) {
                aldeiasMap[aldeia].forEach(soc => {
                    opcoesCombo.push({ aldeia, sociedade: soc });
                    elCombo.add(new Option(`${aldeia} - ${soc}`, i++));
                });
            }
        } else {
            showGlobal("Erro ao carregar configurações do servidor.", "erro");
        }
    })();
})();
