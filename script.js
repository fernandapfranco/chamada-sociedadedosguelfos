(function () {
    const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

    var aldeiasMap = {};
    var opcoesCombo = [];
    var membrosLista = [];
    var nomeSelecionado = '';

    // Elementos
    const elForm = document.getElementById('form-chamada');
    const elData = document.getElementById('data');
    const elDataDisplay = document.getElementById('data-display');
    const elCombo = document.getElementById('combo-aldeia-sociedade');
    const elCardMembros = document.getElementById('card-membros');
    const elBadge = document.getElementById('badge-membros');
    const elBtnNovo = document.getElementById('btn-novo-membro');
    const elBusca = document.getElementById('busca-membro');
    const elLista = document.getElementById('lista-membros');
    const elListaVazia = document.getElementById('lista-membros-vazia');
    
    // PONTO 7: Trocado de elEmail para elTelefone
    const elTelefone = document.getElementById('telefone'); 
    
    const elMsg = document.getElementById('msg-global');
    const elBtn = document.getElementById('btn-submit');
    const elBtnLabel = document.getElementById('btn-label');
    const elModal = document.getElementById('modal-novo');
    const elModalFechar = document.getElementById('modal-novo-fechar');
    const elModalNome = document.getElementById('modal-nome');
    const elModalTelefoneNovo = document.getElementById('modal-telefone-novo'); // PONTO 6
    const elModalCadastrar = document.getElementById('modal-btn-cadastrar');
    const elModalAviso = document.getElementById('modal-aviso');
    const elAvisoTexto = document.getElementById('aviso-texto');
    const elBtnFecharAviso = document.getElementById('btn-fechar-aviso');

    // Funções Auxiliares
    async function chamarGoogle(payload) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const res = await response.json();
            return res.ok ? res.data : { ok: false, error: res.error };
        } catch (e) {
            return { ok: false, error: "Erro de conexão com o servidor." };
        }
    }

    function mostrarAviso(mensagem) {
        elAvisoTexto.textContent = mensagem;
        elModalAviso.classList.replace('hidden', 'flex');
    }

    elBtnFecharAviso.onclick = () => elModalAviso.classList.replace('flex', 'hidden');

    function showGlobal(msg, tipo) {
        elMsg.textContent = msg || '';
        elMsg.className = `rounded-2xl border px-4 py-3 text-sm font-sans ${msg ? 'block' : 'hidden'} `;
        elMsg.classList.add(tipo === 'ok' ? 'bg-emerald-900/50' : 'bg-red-900/50');
        elMsg.classList.add(tipo === 'ok' ? 'border-emerald-500' : 'border-red-500');
    }

    function formatarDataLongaPt(dataStr) {
        if (!dataStr) return '—';
        var partes = dataStr.split('/');
        var d = new Date(partes[2], partes[1] - 1, partes[0]);
        var raw = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    // PONTO 2: Validação de UI - Verifica se pode liberar o botão de confirmação
    function atualizarBotaoSubmit() {
        // Valida se tem nome selecionado e se o telefone tem pelo menos 10 dígitos
        const telLimpo = elTelefone.value.replace(/\D/g, '');
        const telValido = telLimpo.length >= 10; 
        elBtn.disabled = !(nomeSelecionado && telValido);
    }

    function renderLista() {
        var q = (elBusca.value || '').trim().toLowerCase();
        var filtrados = membrosLista.filter(n => !q || n.toLowerCase().includes(q));

        elLista.innerHTML = '';
        elListaVazia.classList.toggle('hidden', filtrados.length > 0);
        
        filtrados.forEach(nome => {
            const isSel = nome === nomeSelecionado;
            const li = document.createElement('li');
            li.className = `flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${isSel ? 'bg-gold/10' :
