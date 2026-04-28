(function () {
    // URL da sua Implantação de TESTE (Certifique-se de que é a mais recente)
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzk6igXpEtZQMTvGabrDAo2WqzVba6KJ8x4B2IKrz7cbCsY_AsD84Qhz4bCnSsIOt8h/exec"; 
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
            elLista.innerHTML = ''; // Limpa a lista sempre
            
            // BUSCA ATIVA: Só exibe resultados se o usuário digitar algo
            if (q.length > 0) {
                const filtrados = membrosGerais.filter(n => n.toLowerCase().includes(q));
                
                if (filtrados.length > 0) {
                    // Mostramos todos os nomes que batem com a busca
                    filtrados.forEach(nome => {
                        const isSel = nome === nomeSelecionado;
                        const li = document.createElement('li');
                        li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-all text-xs tracking-widest uppercase ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/70 hover:bg-white/10'}`;
                        li.textContent = nome;
                        li.onclick = () => { 
                            nomeSelecionado = nome;
                            elBusca.value = nome.toUpperCase();
                            elLista.innerHTML = ''; // Esconde a lista após selecionar
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
            // Habilita o botão apenas se houver nome selecionado e um e-mail válido
            elBtn.disabled = !(nomeSelecionado && elEmail.value.includes('@'));
        }

        elBusca.oninput = () => { 
            nomeSelecionado = ''; // Reseta seleção se o usuário voltar a digitar
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
                data: elDataInput.value, // dd/mm/aaaa
                nome: nomeSelecionado,    // Nome escolhido na lista
                email: elEmail.value      // E-mail digitado pelo usuário
            })
        });
        const json = await res.json();
        // ... restante da lógica de sucesso ...
    } catch (err) {
        alert("Erro na conexão. Tente novamente.");
        elBtn.disabled = false;
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
                // Exibe a data solene (domingo, 26 de abril...)
                elDataDisplay.textContent = json.data.dataParaMostrar;
                
                // Armazena o valor dd/mm/aaaa no input hidden para gravação correta na planilha
                elDataInput.value = json.data.dataParaGravar;
                
                membrosGerais = json.data.membros;
                
                // Não chama renderLista aqui para manter a tela limpa na abertura
                elLista.innerHTML = ''; 
            }
        } catch (err) {
            elDataDisplay.textContent = "ERRO DE CONEXÃO";
        }
    };
    window.addEventListener('load', init);
})();
