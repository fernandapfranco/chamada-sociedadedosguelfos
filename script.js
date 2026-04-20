(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykQ-aZXOz4w_02k2h4YjQnGefsVcPctKXJbeFl1IUiKCJQ-IoB3hbNQc4x4_4L27Te/exec"; // Verifique se esta URL está correta
    var membrosGerais = [];
    var nomeSelecionado = '';

    const init = async () => {
        const elLista = document.getElementById('lista-membros');
        const elBusca = document.getElementById('busca-membro');
        const elBtn = document.getElementById('btn-submit');
        const elEmail = document.getElementById('email');

        // Função para mostrar os nomes na tela
        function renderLista() {
            const termoBusca = elBusca.value.trim().toLowerCase();
            
            // Filtra: se não digitou nada, mostra os 10 primeiros. Se digitou, filtra.
            const filtrados = termoBusca === "" 
                ? membrosGerais.slice(0, 10) 
                : membrosGerais.filter(n => n.toLowerCase().includes(termoBusca)).slice(0, 10);

            elLista.innerHTML = '';
            
            filtrados.forEach(nome => {
                const isSel = nome === nomeSelecionado;
                const li = document.createElement('li');
                li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/70 hover:bg-white/10'}`;
                li.textContent = nome;
                li.onclick = () => { 
                    nomeSelecionado = nome;
                    elBusca.value = nome.toUpperCase(); // Coloca o nome no campo ao clicar
                    atualizarBotao();
                    renderLista(); 
                };
                elLista.appendChild(li);
            });

            if (filtrados.length === 0 && termoBusca !== "") {
                elLista.innerHTML = '<p class="p-4 text-center text-[10px] text-gray-500 uppercase">Guerreiro não localizado.</p>';
            }
        }

        function atualizarBotao() {
            const emailValido = elEmail.value.includes('@');
            elBtn.disabled = !(nomeSelecionado && emailValido);
        }

        // Eventos
        elBusca.oninput = () => {
            nomeSelecionado = ''; 
            renderLista();
            atualizarBotao();
        };
        elEmail.oninput = atualizarBotao;

        // Carga Inicial: Busca os nomes no Google assim que a página carrega
        try {
            const res = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'getOptions' }) 
            });
            const json = await res.json();
            if (json.ok) {
                document.getElementById('data-display').textContent = json.data.dataPadrao;
                document.getElementById('data').value = json.data.dataPadrao;
                membrosGerais = json.data.membros;
                renderLista(); // Mostra os 10 primeiros nomes
            }
        } catch (err) {
            console.error("Erro ao carregar membros:", err);
        }
    };
    window.addEventListener('load', init);
})();
