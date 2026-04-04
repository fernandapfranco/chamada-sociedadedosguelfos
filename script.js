/**
 * FRONT-END - Sociedade dos Guelfos
 * Lógica consolidada: Validação Global, Duplo Registro e Cascata
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec";

const state = {
    aldeiasMap: {},
    membrosAtuais: [], // Membros da sociedade selecionada
    membroSelecionado: null,
    isNovoMembro: false,
    dataEvento: ""
};

// Elementos do DOM
const comboAldeia = document.getElementById('combo-aldeia');
const comboSociedade = document.getElementById('combo-sociedade');
const wrapperSociedade = document.getElementById('wrapper-sociedade');
const cardMembros = document.getElementById('card-membros');
const inputEmail = document.getElementById('email');
const wrapperEmail = document.getElementById('wrapper-email');
const btnSubmit = document.getElementById('btn-submit');
const dataDisplay = document.getElementById('data-display');

// Modais
const modalNovo = document.getElementById('modal-novo');
const modalSucesso = document.getElementById('modal-sucesso');
const modalAviso = document.getElementById('modal-aviso');
const avisoTexto = document.getElementById('aviso-texto');

document.addEventListener('DOMContentLoaded', () => {
    carregarOpcoesIniciais();
    configurarEventos();
    resetarFormulario();
});

async function carregarOpcoesIniciais() {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getOptions' })
        });
        const result = await response.json();

        if (result.ok) {
            state.aldeiasMap = result.data.aldeias;
            state.dataEvento = result.data.dataPadrao;
            dataDisplay.innerText = state.dataEvento.toUpperCase();
            
            Object.keys(state.aldeiasMap).forEach(aldeia => {
                comboAldeia.add(new Option(aldeia, aldeia));
            });
        }
    } catch (err) {
        dataDisplay.innerText = "ERRO AO CARREGAR";
    }
}

function configurarEventos() {
    // 1. Mudança de Aldeia
    comboAldeia.addEventListener('change', () => {
        const aldeia = comboAldeia.value;
        resetarAbaixoDe('aldeia');
        if (aldeia) {
            wrapperSociedade.classList.remove('field-disabled');
            comboSociedade.disabled = false;
            const sociedades = state.aldeiasMap[aldeia] || [];
            sociedades.forEach(soc => comboSociedade.add(new Option(soc, soc)));
        }
    });

    // 2. Mudança de Sociedade
    comboSociedade.addEventListener('change', () => {
        const sociedade = comboSociedade.value;
        resetarAbaixoDe('sociedade');
        if (sociedade) {
            cardMembros.classList.remove('hidden-section');
            buscarMembros(comboAldeia.value, sociedade);
        }
    });

    // 3. Abrir Modal Novo Membro
    document.getElementById('btn-novo-membro').onclick = () => {
        document.getElementById('modal-info-aldeia').innerText = `${comboAldeia.value} > ${comboSociedade.value}`;
        document.getElementById('modal-nome').value = "";
        modalNovo.classList.replace('hidden', 'flex');
    };

    // 4. Fechar Modais
    document.getElementById('modal-novo-fechar').onclick = () => modalNovo.classList.replace('flex', 'hidden');
    document.getElementById('btn-fechar-aviso').onclick = () => modalAviso.classList.replace('flex', 'hidden');

    // 5. Cadastrar Novo Membro com Validação Global (via Servidor)
    document.getElementById('modal-btn-cadastrar').onclick = async () => {
        const nomeNovo = document.getElementById('modal-nome').value.trim().toUpperCase();
        if (nomeNovo.length < 3) return;

        // Bloqueia botão do modal para evitar múltiplos cliques
        const btnCadastrar = document.getElementById('modal-btn-cadastrar');
        btnCadastrar.disabled = true;
        btnCadastrar.innerText = "VALIDANDO...";

        try {
            // Chamada para verificar se o nome existe em QUALQUER sociedade
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'checkGlobalName', nome: nomeNovo })
            });
            const result = await response.json();

            if (result.exists) {
                exibirAviso(`O MEMBRO "${nomeNovo}" JÁ PERTENCE À SOCIEDADE: ${result.sociedade} (${result.aldeia}).`);
            } else {
                state.membroSelecionado = nomeNovo;
                state.isNovoMembro = true;
                
                const listUl = document.getElementById('lista-membros');
                const li = document.createElement('li');
                li.className = "px-4 py-3 cursor-pointer bg-gold/20 text-gold transition-colors text-sm uppercase flex justify-between items-center";
                li.innerHTML = `<span>${nomeNovo} (NOVO)</span>`;
                listUl.prepend(li); 

                habilitarEmailEBotoes();
                modalNovo.classList.replace('flex', 'hidden');
                inputEmail.focus();
            }
        } catch (e) {
            exibirAviso("ERRO AO VALIDAR NOME. TENTE NOVAMENTE.");
        } finally {
            btnCadastrar.disabled = false;
            btnCadastrar.innerText = "SALVAR";
        }
    };

    // 6. Submissão do Formulário
    document.getElementById('form-chamada').addEventListener('submit', enviarPresenca);
}

async function buscarMembros(aldeia, sociedade) {
    const listWrap = document.getElementById('lista-membros');
    listWrap.innerHTML = '<li class="p-4 text-center text-xs text-gray-400 italic">BUSCANDO MEMBROS...</li>';
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'listMembers', aldeia, sociedade })
        });
        const result = await response.json();
        if (result.ok) {
            state.membrosAtuais = result.data;
            renderizarMembros(state.membrosAtuais);
            document.getElementById('badge-membros').innerText = state.membrosAtuais.length;
        }
    } catch (e) {
        listWrap.innerHTML = '<li class="p-4 text-center text-xs text-red-400 uppercase">ERRO AO CARREGAR</li>';
    }
}

function renderizarMembros(lista) {
    const listUl = document.getElementById('lista-membros');
    listUl.innerHTML = '';
    if (lista.length === 0) {
        document.getElementById('lista-membros-vazia').classList.remove('hidden');
        return;
    }
    document.getElementById('lista-membros-vazia').classList.add('hidden');
    lista.forEach(nome => {
        const li = document.createElement('li');
        li.className = "px-4 py-3 cursor-pointer hover:bg-gold/10 transition-colors text-sm uppercase flex justify-between items-center";
        li.innerHTML = `<span>${nome}</span>`;
        li.onclick = () => {
            state.isNovoMembro = false;
            selecionarMembro(nome, li);
        };
        listUl.appendChild(li);
    });
}

function selecionarMembro(nome, elemento) {
    document.querySelectorAll('#lista-membros li').forEach(el => el.classList.remove('bg-gold/20', 'text-gold'));
    if (elemento) elemento.classList.add('bg-gold/20', 'text-gold');
    state.membroSelecionado = nome;
    habilitarEmailEBotoes();
}

function habilitarEmailEBotoes() {
    wrapperEmail.classList.remove('field-disabled');
    inputEmail.disabled = false;
    btnSubmit.disabled = false;
}

async function enviarPresenca(e) {
    e.preventDefault();
    if (!state.membroSelecionado || !inputEmail.value) return;

    btnSubmit.disabled = true;
    document.getElementById('btn-label').innerText = "ENVIANDO...";

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveAttendance',
                dataEvento: state.dataEvento,
                aldeia: comboAldeia.value,
                sociedade: comboSociedade.value,
                nome: state.membroSelecionado,
                email: inputEmail.value,
                isNovoMembro: state.isNovoMembro
            })
        });
        const res = await response.json();
        
        if (res.ok) {
            modalSucesso.classList.replace('hidden', 'flex');
        } else {
            // Caso o servidor recuse por duplicidade de data/nome
            exibirAviso(res.message || "ERRO AO REGISTRAR PRESENÇA.");
            btnSubmit.disabled = false;
            document.getElementById('btn-label').innerText = "CONFIRMAR PRESENÇA";
        }
    } catch (err) {
        exibirAviso("ERRO DE CONEXÃO.");
        btnSubmit.disabled = false;
    }
}

function exibirAviso(msg) {
    avisoTexto.innerText = msg.toUpperCase();
    modalAviso.classList.replace('hidden', 'flex');
}

function resetarAbaixoDe(nivel) {
    if (nivel === 'aldeia') {
        comboSociedade.innerHTML = '<option value="">SELECIONE SOCIEDADE</option>';
        comboSociedade.disabled = true;
        wrapperSociedade.classList.add('field-disabled');
    }
    cardMembros.classList.add('hidden-section');
    state.membroSelecionado = null;
    state.isNovoMembro = false;
    inputEmail.value = "";
    inputEmail.disabled = true;
    wrapperEmail.classList.add('field-disabled');
    btnSubmit.disabled = true;
}

function resetarFormulario() {
    comboSociedade.disabled = true;
    inputEmail.disabled = true;
    btnSubmit.disabled = true;
}
