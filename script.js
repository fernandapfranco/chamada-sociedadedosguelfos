(function () {
    // ATENÇÃO: Substitua pela URL da sua Nova Implantação de TESTE
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
            // Filtra os membros que contêm o texto digitado
            const filtrados = membrosGerais.filter(n => n.toLowerCase().includes(q));
            
            elLista.innerHTML = '';
            
            if (q.length > 0) {
                // Mostra apenas os 8 primeiros resultados para não poluir a tela
                filtrados.slice(0, 8).forEach(nome => {
                    const isSel = nome === nomeSelecionado;
                    const li = document.createElement('li');
                    li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-colors ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/80 hover:bg-white/5'}`;
                    li.textContent = nome.toUpperCase();
                    li.onclick = () => { 
                        nomeSelecionado = isSel ? '' : nome; 
                        renderLista(); 
                        atualizarBotao(); 
                    };
                    elLista.appendChild(li);
                });
            } else {
                elLista.innerHTML = '<p class="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">Digite seu nome para buscar...</p>';
            }
        }

        function atualizarBotao() {
            const emailValido = elEmail.value.includes('@') && elEmail.value.length > 5;
            elBtn.disabled = !(nomeSelecionado && emailValido);
        }

        elBusca.oninput = () => {
            nomeSelecionado = ''; // Reseta seleção ao digitar algo novo
            renderLista();
            atualizarBotao();
        };
        
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
                        <div class="card-glass p-8 text-center rounded-2xl border border-white/10">
                            <h2 class="text-gold uppercase font-serif tracking-widest text-xl">Presença Confirmada</h2>
                            <p class="mt-4 text-[10px] text-gray-400 uppercase tracking-[0.2em]">Não por nós, mas pela Glória do Seu Nome.</p>
                        </div>`;
                } else {
                    alert(json.error);
                    elBtn.disabled = false;
                    document.getElementById('btn-label').textContent = 'CONFIRMAR PRESENÇA';
                }
            } catch (err) {
                alert("Erro de conexão. Tente novamente.");
                elBtn.disabled = false;
            }
        };

        // Carregar dados iniciais
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
                renderLista();
            }
        } catch (err) {
            elDataDisplay.textContent = "ERRO AO CARREGAR";
        }
    };
    window.addEventListener('load', init);
})();
