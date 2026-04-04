(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5TYgDdDlM11DyFSU4aZXi5QDQ2XxezU-qU1SqvRasrdQMq3lLT6rm-IDnY-k-67bY/exec";

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    // Função para rodar apenas quando o HTML estiver 100% carregado
    const iniciarSistema = async () => {
        // Elementos do DOM
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
            if (elAvisoTexto && elModalAviso) {
                elAvisoTexto.textContent = mensagem;
                elModalAviso.classList.replace('hidden', 'flex');
            } else {
                alert(mensagem);
            }
        }

        // Verificação de segurança para não travar nos eventos
        if (elBtnFecharAviso) elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');
        if (elModalFechar) elModalFechar.onclick = () => elModal.classList.replace('flex', 'hidden');

        function showGlobal(msg, tipo) {
            if (!elMsg) return;
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
            if (!elEmail || !elBtn || !elCombo) return;
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
            const aldeiaSelecionada = elCombo.value !== "";
            const membroSelecionado = nomeSelecionado !== "";
            elBtn.disabled = !(emailValido && aldeiaSelecionada && membroSelecionado);
        }

        function renderLista() {
            if (!elLista) return;
            var q = (elBusca.value || '').trim().toLowerCase();
            var filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));

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
                    atualizarBotaoSubmit();
                };
                elLista.appendChild(li);
            });
            if (elBadge) elBadge.textContent = membrosLista.length;
        }

        if (elCombo) {
            elCombo.onchange = async () => {
                const val = elCombo.value;
                if (!val) {
                    if (elCardMembros) elCardMembros.classList.add('hidden-section');
                    nomeSelecionado = '';
                    atualizarBotaoSubmit();
                    return;
                }
                const op = opcoesCombo[val];
                if (elCardMembros) elCardMembros.classList.remove('hidden-section');
                elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400 uppercase">Buscando lista...</p>';
                
                const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
                membrosLista = (res && res.ok) ? res.data : [];
                renderLista();
                atualizarBotaoSubmit();
            };
        }

        if (elBusca) elBusca.oninput = renderLista;
        if (elEmail) elEmail.oninput = atualizarBotaoSubmit;

        if (elBtnNovo) {
            elBtnNovo.onclick = () => {
                const op = opcoesCombo[elCombo.value];
                if(!op) {
                    mostrarAviso("Selecione uma Aldeia/Sociedade primeiro.");
                    return;
                }
                const infoAldeia = document.getElementById('modal-info-aldeia');
                if (infoAldeia) infoAldeia.textContent = `${op.aldeia} - ${op.sociedade}`;
                if (elModal) elModal.classList.replace('hidden', 'flex');
            };
        }

        if (elModalCadastrar) {
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

                if (res && res.ok) {
                    if (elModal) elModal.classList.replace('flex', 'hidden');
                    elModalNome.value = '';
                    nomeSelecionado = nomeOriginal;
                    elCombo.onchange(); // Recarrega a lista
                } else {
                    mostrarAviso(res ? res.error : "Erro ao cadastrar."); 
                }
                elModalCadastrar.disabled = false;
            };
        }

        if (elForm) {
            elForm.onsubmit = async (e) => {
                e.preventDefault();
                const op = opcoesCombo[elCombo.value];
                if (elBtn) elBtn.disabled = true;
                if (elBtnLabel) elBtnLabel.textContent = 'PROCESSANDO...';

                const res = await chamarGoogle({
                    action: 'saveAttendance',
                    data: elData.value,
                    aldeia: op.aldeia,
                    sociedade: op.sociedade,
                    nome: nomeSelecionado,
                    email: elEmail.value
                });

                if (res && res.ok) {
                    showGlobal('Presença confirmada com sucesso!', 'ok');
                    if (elBtnLabel) elBtnLabel.textContent = 'ENVIADO';
                    if (elEmail) elEmail.disabled = true;
                    if (elCombo) elCombo.disabled = true;
                    if (elBusca) elBusca.disabled = true;
                    if (elBtnNovo) elBtnNovo.style.display = 'none';
                } else {
                    showGlobal(res ? res.error : 'Erro ao gravar', 'erro');
                    if (elBtnLabel) elBtnLabel.textContent = 'TENTAR NOVAMENTE';
                    if (elBtn) elBtn.disabled = false;
                }
            };
        }

        // Carga inicial das Aldeias e Data
        const resInit = await chamarGoogle({ action: 'getOptions' });
        if (resInit && resInit.ok) {
            aldeiasMap = resInit.data.aldeias;
            if (elData) elData.value = resInit.data.dataPadrao;
            if (elDataDisplay) elDataDisplay.textContent = formatarDataLongaPt(resInit.data.dataPadrao);
            
            if (elCombo) {
                elCombo.innerHTML = '<option value="">Selecione a sociedade…</option>';
                let idx = 0;
                for (let aldeia in aldeiasMap) {
                    aldeiasMap[aldeia].forEach(soc => {
                        opcoesCombo.push({ aldeia, sociedade: soc });
                        elCombo.add(new Option(`${aldeia} - ${soc}`, idx++));
                    });
                }
            }
        }
    };

    // Garante a execução após o DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarSistema);
    } else {
        iniciarSistema();
    }
})();
