(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
    const MEU_WHATSAPP_BUSINESS = "555135174739"; // Seu número para controle

    var aldeiasMap = {};
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
    const elComboAldeia = document.getElementById('combo-aldeia');
    const elComboSociedade = document.getElementById('combo-sociedade');
    const elWrapperSoc = document.getElementById('wrapper-sociedade');
    const elTelefone = document.getElementById('telefone');
    const elBtn = document.getElementById('btn-submit');
    const elCardMembros = document.getElementById('card-membros');
    const elLista = document.getElementById('lista-membros');

    // Inicialização das Travas
    elComboSociedade.disabled = true;
    elTelefone.disabled = true;
    elBtn.disabled = true;

    function atualizarTravas() {
        // Sociedade só libera se Aldeia estiver ok
        elComboSociedade.disabled = !elComboAldeia.value;
        elWrapperSoc.style.opacity = elComboSociedade.disabled ? "0.5" : "1";

        // Telefone só libera se Nome estiver selecionado
        elTelefone.disabled = !nomeSelecionado;
        elTelefone.parentElement.style.opacity = elTelefone.disabled ? "0.5" : "1";

        // Botão de envio só libera com telefone válido (10+ dígitos)
        const telValido = elTelefone.value.replace(/\D/g, '').length >= 10;
        elBtn.disabled = !nomeSelecionado || !telValido;
    }

    elComboAldeia.onchange = () => {
        const aldeiaSel = elComboAldeia.value;
        elComboSociedade.innerHTML = '<option value="">Selecione a sociedade…</option>';
        if (aldeiaSel) {
            aldeiasMap[aldeiaSel].forEach(soc => elComboSociedade.add(new Option(soc, soc)));
        }
        nomeSelecionado = '';
        elCardMembros.classList.add('hidden-section');
        atualizarTravas();
    };

    elComboSociedade.onchange = async () => {
        if (!elComboSociedade.value) return;
        elCardMembros.classList.remove('hidden-section');
        elLista.innerHTML = '<p class="p-4 text-center text-xs">Buscando...</p>';
        const lista = await chamarGoogle({ 
            action: 'listMembers', 
            aldeia: elComboAldeia.value, 
            sociedade: elComboSociedade.value 
        });
        membrosLista = Array.isArray(lista) ? lista : [];
        renderLista(); // Assume que a função renderLista existe no seu código
        atualizarTravas();
    };

    elTelefone.oninput = atualizarTravas;

    document.getElementById('form-chamada').onsubmit = async (e) => {
        e.preventDefault();
        elBtn.disabled = true;
        const res = await chamarGoogle({
            action: 'saveAttendance',
            aldeia: elComboAldeia.value,
            sociedade: elComboSociedade.value,
            nome: nomeSelecionado,
            telefone: elTelefone.value
        });

        if (res.ok) {
            const telDestino = "55" + elTelefone.value.replace(/\D/g, '');
            const msg = `Salve Maria! Presença confirmada para *${nomeSelecionado}* em ${elComboSociedade.value}.`;
            window.open(`https://wa.me/${telDestino}?text=${encodeURIComponent(msg)}`, '_blank');
            location.reload();
        } else {
            alert(res.error);
            elBtn.disabled = false;
        }
    };

    // Função chamarGoogle e Inicialização (getOptions) devem seguir aqui...
    async function chamarGoogle(payload) {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        return res.ok ? res.data : { ok: false, error: res.error };
    }

    (async () => {
        const data = await chamarGoogle({ action: 'getOptions' });
        if (data) {
            aldeiasMap = data.aldeias;
            elComboAldeia.innerHTML = '<option value="">Selecione a aldeia…</option>';
            for (let a in aldeiasMap) elComboAldeia.add(new Option(a, a));
        }
    })();
})();
