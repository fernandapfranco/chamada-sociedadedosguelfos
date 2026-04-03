(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

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

    // Função de comunicação com Google Apps Script
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
// Função auxiliar para mostrar o aviso centralizado
function mostrarAviso(mensagem) {
    elAvisoTexto.textContent = mensagem;
    elModalAviso.classList.replace('hidden', 'flex');
}

// Fechar o aviso
elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');
    function showGlobal(msg, tipo) {
        elMsg.textContent = msg || '';
        elMsg.className = `rounded-2xl border px-4 py-3 text-sm font-sans ${msg ? 'block' : 'hidden'} `;
        elMsg.classList.add(tipo === 'ok' ? 'bg-emerald-900/50' : 'bg-red-900/50');
        elMsg.classList.add(tipo === 'ok' ? 'border-emerald-500' : 'border-red-500');
    }

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
                nomeSelecionado = isSel ? '' : nome;
                renderLista();
                atualizarBotaoSubmit();
            };
            elLista.appendChild(li);
        });
        elBadge.textContent = membrosLista.length;
    }

    function atualizarBotaoSubmit() {
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
        elBtn.disabled = !(nomeSelecionado && emailValido);
    }

    async function carregarMembros() {
        const val = elCombo.value;
        if (!val) {
            elCardMembros.classList.add('hidden-section');
            return;
        }
        const op = opcoesCombo[val];
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">Carregando...</p>';
        
        const lista = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista();
    }

    // Eventos
    elCombo.onchange = carregarMembros;
    elBusca.oninput = renderLista;
    elEmail.oninput = atualizarBotaoSubmit;
    // Localize onde o elBtnNovo.onclick está definido e atualize:
elBtnNovo.onclick = () => {
    const op = opcoesCombo[elCombo.value];
    // Atualiza o texto do modal com a Aldeia/Sociedade selecionada
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

        const normalizar = (txt) => txt.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        const nomeNovo = normalizar(nomeOriginal);

        // VALIDAÇÃO POR SOBRENOME / NOME PARCIAL
        const jaExiste = membrosLista.some(membroExistente => {
            const nomeExistente = normalizar(membroExistente);
            
            // Verifica se um nome contém o outro (ex: "Fernanda Franco" está em "Fernanda Pedrotti Franco")
            return nomeExistente.includes(nomeNovo) || nomeNovo.includes(nomeExistente);
        });

        if (jaExiste) {
            mostrarAviso(`Já existe um cadastro similar: "${nomeOriginal}". Verifique se este membro já possui registro.`);
            return;
        }

        // Segue o processo de cadastro...
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
            carregarMembros();
        }
        elModalCadastrar.disabled = false;
    };
    elForm.onsubmit = async (e) => {
        e.preventDefault();
        const op = opcoesCombo[elCombo.value];
        elBtn.disabled = true;
        elBtnLabel.textContent = 'Enviando...';
        const res = await chamarGoogle({
            action: 'saveAttendance',
            data: elData.value,
            aldeia: op.aldeia,
            sociedade: op.sociedade,
            nome: nomeSelecionado,
            email: elEmail.value
        });
        if (res.ok) {
            showGlobal('Presença confirmada!', 'ok');
            nomeSelecionado = '';
            elEmail.value = '';
            renderLista();
        } else {
            showGlobal(res.error || 'Erro ao gravar', 'erro');
        }
        elBtnLabel.textContent = 'Confirmar presença';
        elBtn.disabled = false;
    };

    // Init
    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data) {
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
        }
    })();
})();
