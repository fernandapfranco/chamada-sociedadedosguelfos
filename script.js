(function () {
    // CERTIFIQUE-SE DE USAR A URL DA "NOVA IMPLANTAÇÃO"
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxI5BpXlxhoqgB7LbBLgMO2ra096B3BxX4lZSUPRg4wxPTteM24ynHqUQXHmufAboP1/exec";

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

        // FUNÇÃO DE CHAMADA AJUSTADA PARA EVITAR CORS
        async function chamarGoogle(payload) {
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow', // Essencial para o Google Script
                    body: JSON.stringify(payload),
                    headers: {
                        // text/plain evita o erro de pre-flight em guias anônimas
                        'Content-Type': 'text/plain;charset=utf-8'
                    }
                });
                return await response.json();
            } catch (e) {
                console.error("Erro na requisição:", e);
                return { ok: false, error: "Erro de conexão." };
            }
        }

        function renderLista() {
            const q = elBusca.value.trim().toLowerCase();
            const filtrados = membrosLista.filter(n => n.toLowerCase().includes(q));
            elLista.innerHTML = '';
            
            if (filtrados.length === 0) {
                elLista.innerHTML = '<p class="p-4 text-center text-xs text-gray-500 uppercase">Membro não localizado.</p>';
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
            if (!elCombo.value) return elCardMembros.classList.add('hidden');
            elCardMembros.classList.remove('hidden');
            elLista.innerHTML = '<p class="p-4 text-center text-xs text-gold animate-pulse uppercase">Buscando lista...</p>';
            
            const op = opcoesCombo[elCombo.value];
            const json = await chamarGoogle({ action: 'listMembers', aldeia: op.aldeia, sociedade: op.sociedade });
            membrosLista = json.ok ? json.data : [];
            nomeSelecionado = '';
            renderLista();
            atualizarBotaoSubmit();
        };

        elEmail.oninput = atualizarBotaoSubmit;
        elBusca.oninput = renderLista;

        elForm.onsubmit = async (e) => {
            e.preventDefault();
            elBtn.disabled = true;
            elBtnLabel.textContent = 'ENVIANDO...';
            
            const op = opcoesCombo[elCombo.value];
            const json = await chamarGoogle({ 
                action: 'saveAttendance', 
                data: document.getElementById('data').value, 
                aldeia: op.aldeia, 
                sociedade: op.sociedade, 
                nome: nomeSelecionado, 
                email: elEmail.value 
            });

if (json.ok) {
    document.querySelector('.page-wrap .w-full').innerHTML = `
        <div class="card-glass p-8 text-center rounded-2xl border border-white/10 shadow-card">
            <h2 class="text-gold uppercase font-serif tracking-widest text-xl">Presença Confirmada</h2>
            <p class="mt-4 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                Não por nós, mas pela Glória do Seu Nome.
            </p>
        </div>`;
} else {
                alert(json.error);
                elBtn.disabled = false;
                elBtnLabel.textContent = 'CONFIRMAR PRESENÇA';
            }
        };

        // CARGA INICIAL
        const jsonInit = await chamarGoogle({ action: 'getOptions' });
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
