(function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_3bVpWKs7Xqd3sinWReJcvtQkzUwim4n0S02LeAeAEK2sOJASE75l1GIok6W7s0HM/exec";

    var membrosLista = [];
    var opcoesCombo = [];
    var nomeSelecionado = '';

    const init = async () => {
        const elForm = document.getElementById('form-chamada');
        const elCombo = document.getElementById('combo-aldeia-sociedade');
        const elCardMembros = document.getElementById('card-membros');
        const elLista = document.getElementById('lista-membros');
        const elBusca = document.getElementById('busca-membro');
        const elBtn = document.getElementById('btn-submit');
        const elBtnLabel = document.getElementById('btn-label');
        const elEmail = document.getElementById('email');

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            const filtrados = membrosLista.filter(n => n.toLowerCase().includes(q));
            elLista.innerHTML = '';
            
            if (filtrados.length === 0) {
                elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-500 uppercase">Nenhum membro cadastrado nesta sociedade.</p>';
            }

            filtrados.forEach(nome => {
                const isSel = nome === nomeSelecionado;
                const li = document.createElement('li');
                li.className = `px-4 py-3 cursor-pointer border-b border-white/5 transition-colors ${isSel ? 'bg-gold/20 text-gold font-bold' : 'text-white/80 hover:bg-white/5'}`;
                li.textContent = nome.toUpperCase();
                li.onclick = () => { 
                    nomeSelecionado = isSel ? '' : nome; 
                    renderLista(); 
                    atualizarBotaoSubmit(); 
                };
                elLista.appendChild(li);
            });
            document.getElementById('badge-membros').textContent = filtrados.length;
        }

        function atualizarBotaoSubmit() {
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
            elBtn.disabled = !(emailValido && nomeSelecionado !== "" && elCombo.value !== "");
        }

        elCombo.onchange = async () => {
            if (!elCombo.value) {
                elCardMembros.classList.add('hidden');
                return;
            }
            elCardMembros.classList.remove('hidden');
            elLista.innerHTML = '<p class="p-4 text-center text-xs text-gold animate-pulse">CARREGANDO...</p>';
            
            const op = opcoesCombo[elCombo.value];
            
            try {
                const res = await fetch(SCRIPT_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade }) 
                });
                const json = await res.json();
                membrosLista = json.ok ? json.data : [];
                nomeSelecionado = '';
                renderLista();
                atualizarBotaoSubmit();
            } catch (e) {
                elLista.innerHTML = '<p class="p-4 text-center text-xs text-red-500">ERRO AO CONECTAR.</p>';
            }
        };

        elEmail.oninput = atualizarBotaoSubmit;
        elBusca.oninput = renderLista;

        elForm.onsubmit = async (e) => {
            e.preventDefault();
            const op = opcoesCombo[elCombo.value];
            elBtn.disabled = true;
            elBtnLabel.textContent = 'ENVIANDO...';
            
            try {
                const res = await fetch(SCRIPT_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({ 
                        action: 'saveAttendance', 
                        data: document.getElementById('data').value, 
                        aldeia: op.aldeia, 
                        sociedade: op.sociedade, 
                        nome: nomeSelecionado, 
                        email: elEmail.value 
                    }) 
                });
                const json = await res.json();

                if (json.ok) {
                    document.querySelector('.page-wrap .w-full').innerHTML = `
                        <div class="card-glass p-8 text-center rounded-2xl border border-emerald-500/50">
                            <h2 class="text-white uppercase font-serif tracking-widest">Presença Confirmada</h2>
                            <p class="mt-4 text-xs text-gray-400 uppercase">Não por nós, mas pela Glória do Seu Nome.</p>
                        </div>`;
                } else {
                    alert(json.error);
                    elBtn.disabled = false;
                    elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
                }
            } catch (err) {
                alert("ERRO DE CONEXÃO.");
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        const resInit = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getOptions' }) });
        const jsonInit = await resInit.json();
        if (jsonInit.ok) {
            document.getElementById('data').value = jsonInit.data.dataPadrao;
            document.getElementById('data-display').textContent = jsonInit.data.dataPadrao;
            elCombo.innerHTML = '<option value="">SELECIONE A SOCIEDADE</option>';
            let i = 0;
            for (let aldeia in jsonInit.data.aldeias) {
                jsonInit.data.aldeias[aldeia].forEach(soc => {
                    opcoesCombo.push({ aldeia, sociedade: soc });
                    elCombo.add(new Option(`${aldeia} - ${soc}`, i++));
                });
            }
        }
    };
    window.addEventListener('load', init);
})();
