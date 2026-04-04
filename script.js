(function () {
    let SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec"; 
    
    try {
        if (import.meta.env && import.meta.env.VITE_SCRIPT_URL) {
            SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
        }
    } catch (e) {}

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elEmail = document.getElementById('email'); // Voltamos para o e-mail
    const elBtn = document.getElementById('btn-submit');
    const elCardMembros = document.getElementById('card-membros');
    const elLista = document.getElementById('lista-membros');
    const elDataDisplay = document.getElementById('data-display');

    function formatarDataLonga(dataStr) {
        if (!dataStr) return "Carregando...";
        const partes = dataStr.split('/');
        const data = new Date(partes[2], partes[1] - 1, partes[2]);
        const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let formatada = data.toLocaleDateString('pt-BR', opcoes);
        return formatada.charAt(0).toUpperCase() + formatada.slice(1);
    }

    function atualizarTravas() {
        // Libera Sociedade se Aldeia estiver OK
        elComboSociedade.disabled = !elComboAldeia.value;
        
        // Validação de E-mail simples
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elEmail.value);
        
        // Habilita botão se tiver Nome + E-mail válido
        elBtn.disabled = !(nomeSelecionado && emailValido);
        elBtn.style.opacity = elBtn.disabled ? "0.5" : "1";
    }

    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">SELECIONE SOCIEDADE</option>';
        if (aldeiaSel && aldeiasMap[aldeiaSel]) {
            aldeiasMap[aldeiaSel].forEach(s => elComboSociedade.add(new Option(s, s)));
        }
        nomeSelecionado = '';
        elCardMembros.classList.add('hidden-section');
        atualizarTravas();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs">Buscando membros...</p>';
        
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'listMembers', 
                aldeia: elComboAldeia.value, 
                sociedade: elComboSociedade.value 
            })
        });
        const data = await res.json();
        membrosLista = Array.isArray(data.data) ? data.data : [];
        renderLista();
        atualizarTravas();
    };

    function renderLista() {
        elLista.innerHTML = '';
        membrosLista.forEach(nome => {
            const isSel = nome === nomeSelecionado;
            const li = document.createElement('li');
            li.className = `px-4 py-3 cursor-pointer border-b border-white/5 ${isSel ? 'bg-gold/20' : ''}`;
            li.innerHTML = `<span class="${isSel ? 'text-gold font-bold' : 'text-white'}">${nome}</span>`;
            li.onclick = () => {
                nomeSelecionado = nome;
                renderLista();
                atualizarTravas();
            };
            elLista.appendChild(li);
        });
    }

    elEmail.oninput = atualizarTravas;

    document.getElementById('form-chamada').onsubmit = async (e) => {
        e.preventDefault();
        elBtn.disabled = true;
        elBtn.textContent = "REGISTRANDO...";

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveAttendance',
                aldeia: elComboAldeia.value,
                sociedade: elComboSociedade.value,
                nome: nomeSelecionado,
                email: elEmail.value
            })
        });
        const res = await response.json();

        if (res.ok) {
            alert("Presença confirmada!");
            location.reload();
        } else {
            alert("Erro ao gravar");
            elBtn.disabled = false;
        }
    };

    // Inicialização
    (async () => {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getOptions' }) });
        const res = await response.json();
        if (res.ok) {
            aldeiasMap = res.data.aldeias;
            elDataDisplay.textContent = formatarDataLonga(res.data.dataPadrao);
            elComboAldeia.innerHTML = '<option value="">SELECIONE A ALDEIA</option>';
            for (let a in aldeiasMap) elComboAldeia.add(new Option(a, a));
            atualizarTravas();
        }
    })();
})();
