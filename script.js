(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elTelefone = document.getElementById('telefone');
    const elBtn = document.getElementById('btn-submit');
    const elCardMembros = document.getElementById('card-membros');
    const elLista = document.getElementById('lista-membros');
    const elBusca = document.getElementById('busca-membro');

    // 1. ESTADO INICIAL: BLOQUEIO TOTAL
    function resetarEstado() {
        elComboSociedade.disabled = true;
        elTelefone.disabled = true;
        elBtn.disabled = true;
        elBtn.style.opacity = "0.5";
        elTelefone.parentElement.style.opacity = "0.5";
        document.getElementById('wrapper-sociedade').style.opacity = "0.5";
    }
    resetarEstado();

    // 2. FUNÇÃO DE VALIDAÇÃO (O Cérebro das Travas)
    function validarFluxo() {
        // Passo 1: Aldeia selecionada libera Sociedade
        const aldeiaOk = elComboAldeia.value !== "";
        elComboSociedade.disabled = !aldeiaOk;
        document.getElementById('wrapper-sociedade').style.opacity = aldeiaOk ? "1" : "0.5";

        // Passo 2: Nome selecionado libera WhatsApp
        const nomeOk = nomeSelecionado !== "";
        elTelefone.disabled = !nomeOk;
        elTelefone.parentElement.style.opacity = nomeOk ? "1" : "0.5";

        // Passo 3: Telefone preenchido libera Botão Registrar
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telOk = telLimpo.length >= 10;

        if (aldeiaOk && elComboSociedade.value !== "" && nomeOk && telOk) {
            elBtn.disabled = false;
            elBtn.style.opacity = "1";
        } else {
            elBtn.disabled = true;
            elBtn.style.opacity = "0.5";
        }
    }

    // Eventos
    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">Selecione a sociedade…</option>';
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            aldeiasMap[aldeiaSel].forEach(soc => elComboSociedade.add(new Option(soc, soc)));
        }
        nomeSelecionado = ''; 
        elCardMembros.classList.add('hidden-section');
        validarFluxo();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs">Buscando membros...</p>';
        
        const lista = await chamarGoogle({ 
            action: 'listMembers', 
            aldeia: elComboAldeia.value, 
            sociedade: elComboSociedade.value 
        });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista(); 
        validarFluxo();
    };

    elTelefone.oninput = validarFluxo;

    // Função de renderizar (clique no nome define o nomeSelecionado)
    function renderLista() {
        // ... (lógica de renderização que já usamos)
        // IMPORTANTE: Dentro do li.onclick, você deve chamar validarFluxo();
        li.onclick = () => {
            nomeSelecionado = nome;
            renderLista();
            validarFluxo(); // Libera o campo de WhatsApp
        };
    }

    // Inicialização
    (async () => {
        try {
            const data = await chamarGoogle({ action: 'getOptions' });
            if (data && data.aldeias) {
                aldeiasMap = data.aldeias;
                elComboAldeia.innerHTML = '<option value="">Selecione a aldeia…</option>';
                for (let a in aldeiasMap) {
                    elComboAldeia.add(new Option(a, a));
                }
            } else {
                console.error("Mapa de aldeias veio vazio. Verifique a aba 'config'.");
            }
        } catch (e) {
            console.error("Erro ao carregar opções iniciais.");
        }
    })();

    async function chamarGoogle(payload) {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        return res.ok ? res.data : { ok: false, error: res.error };
    }
})();
