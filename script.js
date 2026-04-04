/**
 * FRONT-END - Sociedade dos Guelfos
 * Lógica de cascata corrigida para o novo HTML
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwdIgOpTxJJRBX6SBEFqTP6wOo5SI5Ro5tsTTue_sLMGhzdncl-NyaS_fK2GmwKVO72/exec";

const state = {
    aldeiasMap: {},
    membrosAtuais: [],
    membroSelecionado: null,
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
                const opt = new Option(aldeia, aldeia);
                comboAldeia.add(opt);
            });
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
        dataDisplay.innerText = "ERRO AO CARREGAR";
    }
}

function configurarEventos() {
    // 1. Mudança de Aldeia -> Habilita Sociedade
    comboAldeia.addEventListener('change', () => {
        const aldeia = comboAldeia.value;
        resetarAbaixoDe('aldeia');

        if (aldeia) {
            // Remove a trava visual e funcional
            wrapperSociedade.classList.remove('field-disabled');
            comboSociedade.disabled = false;
            
            const sociedades = state.aldeiasMap[aldeia] || [];
            sociedades.forEach(soc => {
                comboSociedade.add(new Option(soc, soc));
            });
        }
    });

    // 2. Mudança de Sociedade -> Habilita Membros
    comboSociedade.addEventListener('change', async () => {
        const sociedade = comboSociedade.value;
        const aldeia = comboAldeia.value;
        resetarAbaixoDe('sociedade');

        if (sociedade) {
            cardMembros.classList.remove('hidden-section');
            buscarMembros(aldeia, sociedade);
        }
    });

    // 3. Submissão
    document.getElementById('form-chamada').addEventListener('submit', enviarPresenca);
}

async function buscarMembros(aldeia, sociedade) {
    const listWrap = document.getElementById('lista-membros');
    listWrap.innerHTML = '<li class="p-4 text-center text-xs text-gray-400">BUSCANDO...</li>';
    
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
        listWrap.innerHTML = '<li class="p-4 text-center text-xs text-red-400">ERRO AO CARREGAR</li>';
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
        li.onclick = () => selecionarMembro(nome, li);
        listUl.appendChild(li);
    });
}

function selecionarMembro(nome, elemento) {
    document.querySelectorAll('#lista-membros li').forEach(el => el.classList.remove('bg-gold/20', 'text-gold'));
    elemento.classList.add('bg-gold/20', 'text-gold');
    state.membroSelecionado = nome;
    
    // Habilita o campo de Email (Passo Final)
    wrapperEmail.classList.remove('field-disabled');
    inputEmail.disabled = false;
    btnSubmit.disabled = false; // Habilita o botão de confirmação
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
                email: inputEmail.value
            })
        });
        const res = await response.json();
        if (res.ok) {
            alert("Presença confirmada!");
            location.reload();
        }
    } catch (err) {
        alert("Erro ao salvar.");
        btnSubmit.disabled = false;
        document.getElementById('btn-label').innerText = "Confirmar presença";
    }
}

function resetarAbaixoDe(nivel) {
    if (nivel === 'aldeia') {
        comboSociedade.innerHTML = '<option value="">Selecione sociedade</option>';
        comboSociedade.disabled = true;
        wrapperSociedade.classList.add('field-disabled');
    }
    
    // Esconde membros e desabilita email
    cardMembros.classList.add('hidden-section');
    state.membroSelecionado = null;
    inputEmail.value = "";
    inputEmail.disabled = true;
    wrapperEmail.classList.add('field-disabled');
    btnSubmit.disabled = true;
}

function resetarFormulario() {
    // Garante que tudo comece bloqueado
    comboSociedade.disabled = true;
    inputEmail.disabled = true;
    btnSubmit.disabled = true;
}
