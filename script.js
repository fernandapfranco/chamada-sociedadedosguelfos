(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRVqcqM5YOujnyWswybIOmCOBEVbv1cAeAy5VBf8KVWVfWzZ5hgV6fXq7zX2ols7rN/exec";

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
        const elModalInfo = document.getElementById('modal-info-aldeia'); // Texto da sociedade no modal
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

        function mostrarAviso(msg) {
            elAvisoTexto.textContent = msg.toUpperCase();
            elModalAviso.classList.replace('hidden', 'flex');
        }

        // Normalização para comparação de nomes (remove acentos e espaços)
        function normalizarTexto(t) {
            return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
        }

        if (elBtnFecharAviso) elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');

        function formatarDataLonga(dataStr) {
            if (!dataStr) return "...";
            const partes = dataStr.split('/');
            const d = new Date(partes[2], partes[1] - 1, partes[0]);
            return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        }

        if (elBtnNovo) {
            elBtnNovo.onclick = (e) => {
                e.preventDefault();
                if (!elCombo.value) return mostrarAviso("Selecione a sociedade primeiro");
                
                // Exibe a sociedade atual no modal
                const op = opcoesCombo[elCombo.value];
                if (elModalInfo) elModalInfo.textContent = `${op.aldeia} — ${op.sociedade}`;
                
                elModal.classList.replace('hidden', 'flex');
            };
        }

        document.getElementById('modal-novo-fechar').onclick = () => elModal.classList.replace('flex', 'hidden');

        function atualizarBotaoSubmit() {
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
            elBtn.disabled = !(emailValido && nomeSelecionado !== "" && elCombo.value !== "");
        }

        function renderLista() {
            var q = normalizarTexto(elBusca.value);
            var filtrados = membrosLista.filter(n => !q || normalizarTexto(n).includes(q));
            
            elLista.innerHTML = '';
            filtrados.forEach(nome => {
                const isSel = (nome === nomeSelecionado);
                const li = document.createElement('li');
                li.className = `flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isSel ? 'bg-gold/10' : ''}`;
                li.innerHTML = `<span class="text-sm ${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>`;
                li.onclick = () => { 
                    nomeSelecionado = isSel ? '' : nome; 
                    renderLista(); 
                    atualizarBotaoSubmit(); 
                };
                elLista.appendChild(li);
            });
            document.getElementById('badge-membros').textContent = membrosLista.length;
        }

        elCombo.onchange = async () => {
            const val = elCombo.value;
            if (!val) return elCardMembros.classList.add('hidden-section');
            elCardMembros.classList.remove('hidden-section');
            elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-400 uppercase">Buscando lista...</p>';
            
            const op = opcoesCombo[val];
            const res = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
            membrosLista = res.ok ? res.data : [];
            nomeSelecionado = ''; 
            renderLista();
            atualizarBotaoSubmit();
        };

        elEmail.oninput = atualizarBotaoSubmit;
        elBusca.oninput = renderLista;

        // Cadastro Visual de Novo Membro
        elModalCadastrar.onclick = () => {
            const nomeDigitado = elModalNome.value.trim();
            if (nomeDigitado.split(' ').length < 2) return mostrarAviso("Informe nome e sobrenome");
            
            const nomeNorm = normalizarTexto(nomeDigitado);
            
            // Validação de similaridade local (evita duplicata na lista da tela)
            const jaExisteNaTela = membrosLista.some(m => normalizarTexto(m) === nomeNorm);
            if (jaExisteNaTela) return mostrarAviso("Este membro já está na lista");

            // Adiciona provisoriamente na lista e seleciona
            membrosLista.push(nomeDigitado);
            nomeSelecionado = nomeDigitado;
            
            elModal.classList.replace('flex', 'hidden');
            elModalNome.value = '';
            renderLista();
            atualizarBotaoSubmit();
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
                document.querySelector('.page-wrap .w-full').innerHTML = `
                    <div class="card-glass rounded-2xl border border-emerald-500/50 p-8 text-center shadow-card animate-in zoom-in duration-300">
                        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/30 text-emerald-500">
                            <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 class="font-serif text-xl text-white uppercase tracking-widest mb-2">Presença Confirmada</h2>
                        <p class="text-sm text-gray-400 uppercase tracking-tighter">Não por nós, mas pela Glória do Seu Nome.</p>
                    </div>
                `;
            } else {
                mostrarAviso(res.error);
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        // Carga inicial
        const resInit = await chamarGoogle({ action: 'getOptions' });
        if (resInit.ok) {
            aldeiasMap = resInit.data.aldeias;
            elData.value = resInit.data.dataPadrao;
            elDataDisplay.textContent = formatarDataLonga(resInit.data.dataPadrao);
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
