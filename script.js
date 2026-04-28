(function () {
    // CERTIFIQUE-SE DE USAR A URL DA "NOVA IMPLANTAÇÃO" DE PRODUÇÃO
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWh8-TbbbwmW2RaVhvqzY7EwHhYBC-Gvo1FA3cqqHqcS0ksvu9Hy1iakpqzIPj5orQ/exec"; 

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

        // FUNÇÃO DE CHAMADA CENTRALIZADA - AJUSTADA PARA EVITAR ERRO DE CORS EM PRODUÇÃO
        async function chamarGoogle(payload) {
            try {
                // Usamos o redirecionamento 'follow' e Content-Type 'text/plain' 
                // para que o Google Script aceite a requisição de domínios diferentes (Vercel)
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow', 
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify(payload)
                });
                
                // Em produção, o Google pode retornar o JSON dentro de um fluxo de texto
                const texto = await response.text();
                return JSON.parse(texto);
            } catch (e) {
                console.error("Erro na requisição:", e);
                return { ok: false, error: "Falha na conexão com os anais da Sociedade." };
            }
        }

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            elLista.innerHTML = ''; 
            
            if (q.length === 0) {
                elWrap.classList.add('hidden');
                return;
            }

            elWrap.classList.remove('hidden');
            const filtrados = membrosGerais.filter(n => n.toLowerCase().includes(q));
            
            if (filtrados.length > 0) {
                filtrados.slice(0, 15).forEach(nome => {
                    const isSel = nome === nomeSelecionado;
                    const li = document.createElement('li');
                    li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/70 hover:bg-white/10'}`;
                    li.textContent = nome;
                    li.onclick = () => { 
                        nomeSelecionado = nome;
                        elBusca.value = nome.toUpperCase();
                        elWrap.classList.add('hidden'); 
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
            elLista.innerHTML = ''; 
            elWrap.classList.add('hidden');
        } else {
            elDataDisplay.textContent = "ERRO DE CONEXÃO";
        }
    };

    window.addEventListener('load', init);
})();
