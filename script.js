(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykQ-aZXOz4w_02k2h4YjQnGefsVcPctKXJbeFl1IUiKCJQ-IoB3hbNQc4x4_4L27Te/exec"; 
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

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            // Se não houver busca, mostra os 10 primeiros. Se houver, filtra.
            const filtrados = q === "" 
                ? membrosGerais.slice(0, 10) 
                : membrosGerais.filter(n => n.toLowerCase().includes(q)).slice(0, 10);
            
            elLista.innerHTML = '';
            
            filtrados.forEach(nome => {
                const isSel = nome === nomeSelecionado;
                const li = document.createElement('li');
                li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/70 hover:bg-white/10'}`;
                li.textContent = nome;
                li.onclick = () => { 
                    nomeSelecionado = nome;
                    elBusca.value = nome.toUpperCase();
                    atualizarBotao();
                    renderLista(); 
                };
                elLista.appendChild(li);
            });

            if (filtrados.length === 0 && q !== "") {
                elLista.innerHTML = '<p class="p-4 text-center text-[10px] text-gray-500 uppercase">Guerreiro não localizado.</p>';
            }
        }

        function atualizarBotao() {
            elBtn.disabled = !(nomeSelecionado && elEmail.value.includes('@'));
        }

        elBusca.oninput = () => { nomeSelecionado = ''; renderLista(); atualizarBotao(); };
        elEmail.oninput = atualizarBotao;

        elForm.onsubmit = async (e) => {
            e.preventDefault();
            elBtn.disabled = true;
            document.getElementById('btn-label').textContent = 'ENVIANDO...';

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
                    document.querySelector('.page-wrap .w-full').innerHTML = `
                        <div class="card-glass p-8 text-center rounded-2xl border border-white/10 shadow-card">
                            <h2 class="text-gold uppercase font-serif tracking-widest text-xl">Presença Confirmada</h2>
                            <p class="mt-4 text-[10px] text-gray-400 uppercase tracking-[0.2em]">Não por nós, mas pela Glória do Seu Nome.</p>
                        </div>`;
                } else {
                    alert(json.error);
                    elBtn.disabled = false;
                    document.getElementById('btn-label').textContent = 'CONFIRMAR PRESENÇA';
                }
            } catch (err) {
                alert("Erro ao enviar. Tente novamente.");
                elBtn.disabled = false;
            }
        };

        // CARGA INICIAL (AQUI ESTAVA O ERRO)
        try {
            const res = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'getOptions' }) 
            });
            const json = await res.json();
            if (json.ok) {
                elDataInput.value = json.data.dataPadrao;
                elDataDisplay.textContent = json.data.dataPadrao;
                membrosGerais = json.data.membros;
                renderLista(); // Isso trará os 10 primeiros nomes já na abertura
            }
        } catch (err) {
            elDataDisplay.textContent = "ERRO DE CONEXÃO";
        }
    };
    window.addEventListener('load', init);
})();
