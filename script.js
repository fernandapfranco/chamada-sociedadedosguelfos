(function () {
    // CERTIFIQUE-SE DE USAR A URL DA "NOVA IMPLANTAÇÃO" DE PRODUÇÃO
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyq7jlNOPMLJN1UQerDcecEywmQvXO9KtJiG4P1uMTk3gZM6PkbC21Ibb7Kxkn7rKVw/exec"; 

    var membrosGerais = [];
    var nomeSelecionado = '';

    const init = async () => {
        const elForm = document.getElementById('form-chamada');
        const elLista = document.getElementById('lista-membros');
        const elBusca = document.getElementById('busca-membro');
        const elBtn = document.getElementById('btn-submit');
        const elEmail = document.getElementById('email');
        const elDataDisplay = document.getElementById('data-display');
        const elDataInput = document.getElementById('data');
        const elBtnLabel = document.getElementById('btn-label');
        const elWrap = document.getElementById('lista-membros-wrap');

        // FUNÇÃO DE CHAMADA CENTRALIZADA PARA EVITAR ERROS DE CORS
        async function chamarGoogle(payload) {
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify(payload)
                });
                return await response.json();
            } catch (e) {
                console.error("Erro na requisição:", e);
                return { ok: false, error: "Erro de conexão com o servidor." };
            }
        }

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            elLista.innerHTML = ''; 
            
            // BUSCA ATIVA: Se o campo estiver vazio, esconde o card da lista e encerra
            if (q.length === 0) {
                elWrap.classList.add('hidden');
                return;
            }

            // Mostra o contêiner apenas quando há algo digitado
            elWrap.classList.remove('hidden');

            const filtrados = membrosGerais.filter(n => n.toLowerCase().includes(q));
            
            if (filtrados.length > 0) {
                // Limitamos a 15 nomes para performance no mobile
                filtrados.slice(0, 15).forEach(nome => {
                    const isSel = nome === nomeSelecionado;
                    const li = document.createElement('li');
                    li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/70 hover:bg-white/10'}`;
                    li.textContent = nome;
                    li.onclick = () => { 
                        nomeSelecionado = nome;
                        elBusca.value = nome.toUpperCase();
                        elWrap.classList.add('hidden'); // Esconde a lista após seleção
                        atualizarBotao(); 
                    };
                    elLista.appendChild(li);
                });
            } else {
                elLista.innerHTML = '<p class="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">Guerreiro não localizado.</p>';
            }
        }

        function atualizarBotao() {
            const emailValido = elEmail.value.includes('@');
            elBtn.disabled = !(nomeSelecionado && emailValido);
        }

        elBusca.oninput = () => { 
            nomeSelecionado = ''; 
            renderLista(); 
            atualizarBotao(); 
        };
        
        elEmail.oninput = atualizarBotao;

        elForm.onsubmit = async (e) => {
            e.preventDefault();
            elBtn.disabled = true;
            elBtnLabel.textContent = 'ENVIANDO...';

            const json = await chamarGoogle({
                action: 'saveAttendance',
                data: elDataInput.value,
                nome: nomeSelecionado,
                email: elEmail.value
            });

            if (json.ok) {
                document.querySelector('.page-wrap .w-full').innerHTML = `
                    <div class="card-glass p-8 text-center rounded-2xl border border-white/10 shadow-card animate-in fade-in zoom-in duration-300">
                        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 class="text-gold uppercase font-serif tracking-widest text-xl font-bold">Presença Confirmada</h2>
                        <p class="mt-4 text-[11px] text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                            Não por nós, mas pela Glória do Seu Nome.
                        </p>
                    </div>`;
            } else {
                alert("Erro: " + json.error);
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        // CARGA INICIAL
        const jsonInit = await chamarGoogle({ action: 'getOptions' });
        if (jsonInit.ok) {
            elDataDisplay.textContent = jsonInit.data.dataParaMostrar;
            elDataInput.value = jsonInit.data.dataParaGravar;
            membrosGerais = jsonInit.data.membros;
            
            // Garante que a lista comece limpa e escondida
            elLista.innerHTML = ''; 
            elWrap.classList.add('hidden');
        } else {
            elDataDisplay.textContent = "ERRO DE CONEXÃO";
        }
    };

    window.addEventListener('load', init);
})();
