(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5TYgDdDlM11DyFSU4aZXi5QDQ2XxezU-qU1SqvRasrdQMq3lLT6rm-IDnY-k-67bY/exec";

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    const init = async () => {
        // Elementos principais
        const elForm = document.getElementById('form-chamada');
        const elData = document.getElementById('data');
        const elDataDisplay = document.getElementById('data-display');
        const elCombo = document.getElementById('combo-aldeia-sociedade');
        const elCardMembros = document.getElementById('card-membros');
        const elBtnNovo = document.getElementById('btn-novo-membro');
        const elBusca = document.getElementById('busca-membro');
        const elLista = document.getElementById('lista-membros');
        const elEmail = document.getElementById('email');
        const elBtn = document.getElementById('btn-submit');
        const elBtnLabel = document.getElementById('btn-label');
        
        // Elementos do Modal
        const elModal = document.getElementById('modal-novo');
        const elModalFechar = document.getElementById('modal-novo-fechar');
        const elModalNome = document.getElementById('modal-nome');
        const elModalCadastrar = document.getElementById('modal-btn-cadastrar');
        const elModalAviso = document.getElementById('modal-aviso');
        const elAvisoTexto = document.getElementById('aviso-texto');
        const elBtnFecharAviso = document.getElementById('btn-fechar-aviso');

        async function chamarGoogle(payload) {
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                return await response.json();
            } catch (e) { return { ok: false, error: "Erro de conexão." }; }
        }

        // Função para formatar a data como "Domingo, 5 de Abril de 2026"
        function formatarDataLonga(dataStr) {
            if (!dataStr) return 'CARREGANDO DATA...';
            const partes = dataStr.split('/');
            const d = new Date(partes[2], partes[1] - 1, partes[0]);
            const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            let formatada = d.toLocaleDateString('pt-BR', opcoes);
            return formatada.toUpperCase();
        }

        // --- CORREÇÃO DO BOTÃO NOVO MEMBRO ---
        if (elBtnNovo) {
            elBtnNovo.onclick = (e) => {
                e.preventDefault();
                const val = elCombo.value;
                if (!val || val === "") {
                    alert("Selecione a sociedade primeiro.");
                    return;
                }
                const op = opcoesCombo[val];
                const infoAldeia = document.getElementById('modal-info-aldeia');
                if (infoAldeia) infoAldeia.textContent = `${op.aldeia} - ${op.sociedade}`;
                
                if (elModal) {
                    elModal.classList.remove('hidden');
                    elModal.classList.add('flex');
                }
            };
        }

        if (elModalFechar && elModal) {
            elModalFechar.onclick = () => {
                elModal.classList.add('hidden');
                elModal.classList.remove('flex');
            };
        }

        function atualizarBotaoSubmit() {
            if (!elEmail || !elBtn) return;
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
            const aldeiaSelecionada = elCombo && elCombo.value !== "";
            const membroSelecionado = nomeSelecionado !== "";
            elBtn.disabled = !(emailValido && aldeiaSelecionada && membroSelecionado);
        }

        function renderLista() {
            if (!elLista) return;
            var q = (elBusca.value || '').trim().toLowerCase();
            var filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));
            elLista.innerHTML = '';
            
            filtrados.forEach(nome => {
                const isSel = nome === nomeSelecionado;
                const li = document.createElement('li');
                li.className = `flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${isSel ? 'bg-gold/10' : ''}`;
                li.innerHTML = `<span class="text-sm ${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>`;
                li.onclick = () => { nomeSelecionado = isSel ? '' : nome; renderLista(); atualizarBotaoSubmit(); };
                elLista.appendChild(li);
            });
            const badge = document.getElementById('badge-membros');
            if (badge) badge.textContent = membrosLista.length;
        }

        if (elCombo) {
            elCombo.onchange = async () => {
                const val = elCombo.value;
                if (!val) { elCardMembros.classList.add('hidden-section'); return; }
                elCardMembros.classList.remove('hidden-section');
                elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400">BUSCANDO...</p>';
                const op = opcoesCombo[val];
                const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
                membrosLista = res.ok ? res.data : [];
                renderLista();
                atualizarBotaoSubmit();
            };
        }

        if (elBusca) elBusca.oninput = renderLista;
        if (elEmail) elEmail.oninput = atualizarBotaoSubmit;

        if (elModalCadastrar) {
            elModalCadastrar.onclick = async () => {
                const nomeOriginal = elModalNome.value.trim();
                const op = opcoesCombo[elCombo.value];
                if (nomeOriginal.length < 3) { alert("Nome muito curto."); return; }
                elModalCadastrar.disabled = true;
                const res = await chamarGoogle({ action: 'addMember', nome: nomeOriginal, aldeia: op.aldeia, sociedade: op.sociedade });
                if (res.ok) {
                    elModal.classList.add('hidden');
                    elModalNome.value = '';
                    nomeSelecionado = nomeOriginal;
                    elCombo.onchange(); 
                } else { alert(res.error); }
                elModalCadastrar.disabled = false;
            };
        }

        if (elForm) {
            elForm.onsubmit = async (e) => {
                e.preventDefault();
                const op = opcoesCombo[elCombo.value];
                elBtn.disabled = true;
                elBtnLabel.textContent = 'ENVIANDO...';
                const res = await chamarGoogle({ action: 'saveAttendance', data: elData.value, aldeia: op.aldeia, sociedade: op.sociedade, nome: nomeSelecionado, email: elEmail.value });
                if (res.ok) {
                    elBtnLabel.textContent = 'CONFIRMADO';
                    elForm.style.opacity = '0.5';
                    elForm.style.pointerEvents = 'none';
                } else {
                    alert(res.error);
                    elBtn.disabled = false;
                    elBtnLabel.textContent = 'TENTAR NOVAMENTE';
                }
            };
        }

        // CARGA INICIAL
        const dataRes = await chamarGoogle({ action: 'getOptions' });
        if (dataRes && dataRes.ok) {
            aldeiasMap = dataRes.data.aldeias;
            elData.value = dataRes.data.dataPadrao;
            if (elDataDisplay) elDataDisplay.textContent = formatarDataLonga(dataRes.data.dataPadrao);
            
            elCombo.innerHTML = '<option value="">SELECIONE A SOCIEDADE...</option>';
            let i = 0;
            for (let aldeia in aldeiasMap) {
                aldeiasMap[aldeia].forEach(soc => {
                    opcoesCombo.push({ aldeia, sociedade: soc });
                    elCombo.add(new Option(`${aldeia} - ${soc}`, i++));
                });
            }
        }
    };

    if (document.readyState === 'complete') { init(); } 
    else { window.addEventListener('load', init); }
})();
