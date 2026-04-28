(function () {
    // Certifique-se de que esta URL seja a da "Nova Versão" da sua implantação
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqttaHTK8WL-wN05ucFDCKDLb6xSlgzF94sAt6NtuYe8kD-XNG37L9A7die2fHfkdI/exec"; 
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

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            elLista.innerHTML = ''; 
            
            if (q.length > 0) {
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
                            elLista.innerHTML = ''; 
                            atualizarBotao(); 
                        };
                        elLista.appendChild(li);
                    });
                } else {
                    elLista.innerHTML = '<p class="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">Guerreiro não localizado.</p>';
                }
            }
        }

        function atualizarBotao() {
            elBtn.disabled = !(nomeSelecionado && elEmail.value.includes('@'));
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

            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify({
                        action: 'saveAttendance',
                        data: elDataInput.value,
                        nome: nomeSelecionado,
                        email: elEmail.value
                    })
                });

                const json = await res.json();

                if (json.ok) {
                    // ESTA PARTE ESTAVA FALTANDO: Limpa a tela e mostra o sucesso
                    document.querySelector('.page-wrap .w-full').innerHTML = `
                        <div class="card-glass p-8 text-center rounded-2xl border border-white/10 shadow-card animate-in fade-in zoom-in duration-300">
                            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 class="text-gold uppercase font-serif tracking-widest text-xl font-bold">Presença Confirmada</h2>
                            <p class="mt-4 text-[11px] text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                                Sua assinatura foi registrada nos anais da Sociedade.<br>Confira seu e-mail em breve.
                            </p>
                        </div>`;
                } else {
                    alert("Erro do Google: " + json.error);
                    elBtn.disabled = false;
                    elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
                }
            } catch (err) {
                console.error(err);
                alert("Erro na conexão com o servidor. Verifique sua internet.");
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        // CARGA INICIAL
        try {
            const res = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'getOptions' }) 
            });
            const json = await res.json();
            if (json.ok) {
                elDataDisplay.textContent = json.data.dataParaMostrar;
                elDataInput.value = json.data.dataParaGravar;
                membrosGerais = json.data.membros;
                elLista.innerHTML = ''; 
            }
        } catch (err) {
            elDataDisplay.textContent = "ERRO DE CONEXÃO";
        }
    };
    window.addEventListener('load', init);
})();
