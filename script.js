(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWRUJ_AIoTarEVM9U9Q3Voxnu-BO-ltuhQfA2V0wCv7JeF_DvAmQobpveuWje5UAdo/exec";

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    const init = async () => {
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
        const elModal = document.getElementById('modal-novo');
        const elModalFechar = document.getElementById('modal-novo-fechar');
        const elModalNome = document.getElementById('modal-nome');
        const elModalCadastrar = document.getElementById('modal-btn-cadastrar');

        async function chamarGoogle(payload) {
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                return await response.json();
            } catch (e) { return { ok: false, error: "Erro de conexão." }; }
        }

        function formatarDataLonga(dataStr) {
            if (!dataStr) return '...';
            const partes = dataStr.split('/');
            const d = new Date(partes[2], partes[1] - 1, partes[0]);
            return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        }

        if (elBtnNovo) {
            elBtnNovo.onclick = (e) => {
                e.preventDefault();
                const op = opcoesCombo[elCombo.value];
                if (!op) return alert("Selecione a sociedade.");
                document.getElementById('modal-info-aldeia').textContent = `${op.aldeia} - ${op.sociedade}`;
                elModal.classList.replace('hidden', 'flex');
            };
        }

        if (elModalFechar) elModalFechar.onclick = () => elModal.classList.replace('flex', 'hidden');

        function atualizarBotaoSubmit() {
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
            elBtn.disabled = !(emailValido && nomeSelecionado !== "" && elCombo.value !== "");
        }

        function renderLista() {
            var q = elBusca.value.trim().toLowerCase();
            var filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));
            elLista.innerHTML = '';
            filtrados.forEach(nome => {
                const isSel = nome === nomeSelecionado;
                const li = document.createElement('li');
                li.className = `flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isSel ? 'bg-gold/10' : ''}`;
                li.innerHTML = `<span class="text-sm ${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>`;
                li.onclick = () => { nomeSelecionado = isSel ? '' : nome; renderLista(); atualizarBotaoSubmit(); };
                elLista.appendChild(li);
            });
            const badge = document.getElementById('badge-membros');
            if (badge) badge.textContent = membrosLista.length;
        }

        elCombo.onchange = async () => {
            const val = elCombo.value;
            if (!val) return elCardMembros.classList.add('hidden-section');
            elCardMembros.classList.remove('hidden-section');
            elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400 uppercase">Buscando lista...</p>';
            const op = opcoesCombo[val];
            const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
            membrosLista = res.ok ? res.data : [];
            renderLista();
            atualizarBotaoSubmit();
        };

        elEmail.oninput = atualizarBotaoSubmit;
        elBusca.oninput = renderLista;

        elModalCadastrar.onclick = async () => {
            const nome = elModalNome.value.trim();
            const op = opcoesCombo[elCombo.value];
            if (nome.length < 3) return alert("Nome muito curto.");
            elModalCadastrar.disabled = true;
            const res = await chamarGoogle({ action: 'addMember', nome, aldeia: op.aldeia, sociedade: op.sociedade });
            if (res.ok) {
                elModal.classList.replace('flex', 'hidden');
                elModalNome.value = '';
                nomeSelecionado = nome; // Seleciona automaticamente
                elCombo.onchange(); // Recarrega a lista
            } else {
                alert(res.error); // Exibe o erro de Unicidade Global
            }
            elModalCadastrar.disabled = false;
        };

        elForm.onsubmit = async (e) => {
            e.preventDefault();
            const op = opcoesCombo[elCombo.value];
            elBtn.disabled = true;
            elBtnLabel.textContent = 'ENVIANDO...';
            
            const res = await chamarGoogle({ 
                action: 'saveAttendance', 
                data: elData.value, 
                aldeia: op.aldeia, 
                sociedade: op.sociedade, 
                nome: nomeSelecionado, 
                email: elEmail.value 
            });

            if (res.ok) {
                // TELA DE SUCESSO PADRÃO NO LUGAR DO FORM
                document.querySelector('.page-wrap .w-full').innerHTML = `
                    <div class="card-glass rounded-2xl border border-emerald-500/50 p-8 text-center shadow-card">
                        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/30 text-emerald-500">
                            <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 class="font-serif text-xl text-white uppercase tracking-widest mb-2">Presença Confirmada</h2>
                        <p class="text-sm text-gray-400 uppercase tracking-tighter">Obrigado. Sua honra foi registrada.</p>
                        <button onclick="window.location.reload()" class="mt-8 px-6 py-2 rounded-xl bg-gold text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gold-glow">Fazer nova chamada</button>
                    </div>
                `;
            } else {
                alert(res.error);
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        const res = await chamarGoogle({ action: 'getOptions' });
        if (res.ok) {
            aldeiasMap = res.data.aldeias;
            elData.value = res.data.dataPadrao;
            elDataDisplay.textContent = formatarDataLonga(res.data.dataPadrao);
            elCombo.innerHTML = '<option value="">SELECIONE A SOCIEDADE</option>';
            let i = 0;
            for (let aldeia in aldeiasMap) {
                aldeiasMap[aldeia].forEach(soc => {
                    opcoesCombo.push({ aldeia, sociedade: soc });
                    elCombo.add(new Option(`${aldeia} - ${soc}`, i++));
                });
            }
        }
    };

    window.addEventListener('load', init);
})();
