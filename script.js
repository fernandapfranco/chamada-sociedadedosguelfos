(function () {
    // Integração com variáveis de ambiente do Vite/Vercel
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

    if (!SCRIPT_URL) {
        console.error("ERRO: VITE_SCRIPT_URL não definida nas variáveis de ambiente.");
    }

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
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

    async function chamarGoogle(payload) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (e) {
            return { ok: false, error: "Erro de conexão com o servidor." };
        }
    }

    function mostrarAviso(mensagem) {
        elAvisoTexto.textContent = mensagem;
        elModalAviso.classList.replace('hidden', 'flex');
    }

    elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');

    function showGlobal(msg, tipo) {
        elMsg.textContent = msg || '';
        elMsg.className = `rounded-2xl border px-4 py-3 text-sm font-sans ${msg ? 'block' : 'hidden'} `;
        if(tipo === 'ok') {
            elMsg.classList.add('bg-emerald-900/50', 'border-emerald-500');
        } else {
            elMsg.classList.add('bg-red-900/50', 'border-red-500');
        }
    }

    function formatarDataLongaPt(dataStr) {
        if (!dataStr) return '—';
        var partes = dataStr.split('/');
        var d = new Date(partes[2], partes[1] - 1, partes[0]);
        var raw = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    function atualizarBotaoSubmit() {
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
        const aldeiaSelecionada = elCombo.value !== "";
        const membroSelecionado = nomeSelecionado !== "";
        elBtn.disabled = !(emailValido && aldeiaSelecionada && membroSelecionado);
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

    async function carregarMembros() {
        const val = elCombo.value;
        if (!val) {
            elCardMembros.classList.add('hidden-section');
            nomeSelecionado = '';
            atualizarBotaoSubmit();
            return;
        }
        const op = opcoesCombo[val];
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400 uppercase">Buscando lista...</p>';
        
        const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
        membrosLista = res.ok ? res.data : [];
        renderLista();
        atualizarBotaoSubmit();
    }

    elCombo.onchange = carregarMembros;
    elBusca.oninput = renderLista;
    elEmail.oninput = atualizarBotaoSubmit;

    elBtnNovo.onclick = () => {
        const op = opcoesCombo[elCombo.value];
        if(!op) {
            mostrarAviso("Selecione uma Aldeia/Sociedade primeiro.");
            return;
        }
        document.getElementById('modal-info-aldeia').textContent = `${op.aldeia} - ${op.sociedade}`;
        elModal.classList.replace('hidden', 'flex');
    };

    elModalFechar.onclick = () => elModal.classList.replace('flex', 'hidden');

    elModalCadastrar.onclick = async () => {
        const nomeOriginal = elModalNome.value.trim();
        const op = opcoesCombo[elCombo.value];

        if (nomeOriginal.length < 3) {
            mostrarAviso("O nome inserido é muito curto.");
            return;
        }

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
            await carregarMembros();
        } else {
            mostrarAviso(res.error); 
        }
        elModalCadastrar.disabled = false;
    };

    elForm.onsubmit = async (e) => {
        e.preventDefault();
        const op = opcoesCombo[elCombo.value];
        elBtn.disabled = true;
        elBtnLabel.textContent = 'PROCESSANDO...';

        const res = await chamarGoogle({
            action: 'saveAttendance',
            data: elData.value,
            aldeia: op.aldeia,
            sociedade: op.sociedade,
            nome: nomeSelecionado,
            email: elEmail.value
        });

        if (res.ok) {
            showGlobal('Presença confirmada com sucesso!', 'ok');
            elBtnLabel.textContent = 'ENVIADO';
            elEmail.disabled = true;
            elCombo.disabled = true;
            elBusca.disabled = true;
            elBtnNovo.style.display = 'none';
        } else {
            showGlobal(res.error, 'erro');
            elBtnLabel.textContent = 'TENTAR NOVAMENTE';
            elBtn.disabled = false;
        }
    };

    (async () => {
        if(!SCRIPT_URL) return;
        const res = await chamarGoogle({ action: 'getOptions' });
        if (res && res.ok) {
            aldeiasMap = res.data.aldeias;
            elData.value = res.data.dataPadrao;
            elDataDisplay.textContent = formatarDataLongaPt(res.data.dataPadrao);
            
            elCombo.innerHTML = '<option value="">Selecione a sociedade…</option>';
            let i = 0;
            for (let aldeia in aldeiasMap) {
                aldeiasMap[aldeia].forEach(soc => {
                    opcoesCombo.push({ aldeia, sociedade: soc });
                    elCombo.add(new Option(`${aldeia} - ${soc}`, i++));
                });
            }
        }
    })();
})();
