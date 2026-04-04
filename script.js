/**
 * FRONT-END - Sociedade dos Guelfos
 * Lógica de cascata e validação de campos
 */

// Substitua pela URL do seu Web App após publicar no Google Apps Script
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
const btnSubmit = document.getElementById('btn-submit');
const dataDisplay = document.getElementById('data-display');

// Inicialização
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
            
            // Atualiza display da data
            dataDisplay.innerText = state.dataEvento.toUpperCase();
            
            // Popula Aldeias
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
    // 1. Mudança de Aldeia
    comboAldeia.addEventListener('change', () => {
        const aldeia = comboAldeia.value;
        resetarAbaixoDe('aldeia');

        if (aldeia) {
            wrapperSociedade.classList.remove('opacity-50', 'pointer-events-none');
            const sociedades = state.aldeiasMap[aldeia] || [];
            sociedades.forEach(soc => {
                comboSociedade.add(new Option(soc, soc));
            });
        }
    });

    // 2. Mudança de Sociedade
    comboSociedade.addEventListener('change', async () => {
        const sociedade = comboSociedade.value;
        const aldeia = comboAldeia.value;
        resetarAbaixoDe('sociedade');

        if (sociedade) {
            cardMembros.classList.remove('hidden-section');
            buscarMembros(aldeia, sociedade);
        }
    });

    // 3. Validação do E-mail e Botão Final
    // Só habilita o e-mail se os campos anteriores estiverem ok
    const validarCamposParaEmail = () => {
        const pronto = comboAldeia.value && comboSociedade.value && state.membroSelecionado;
        inputEmail.disabled = !pronto;
        inputEmail.parentElement.parentElement.parentElement.style.opacity = pronto ? "1" : "0.5";
    };

    // 4. Submissão do Formulário
    document.getElementById('form-chamada').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!state.membroSelecionado) {
            alert("Por favor, selecione um membro na lista.");
            return;
        }

        const dados = {
            action: 'saveAttendance',
            dataEvento: state.dataEvento,
            aldeia: comboAldeia.value,
            sociedade: comboSociedade.value,
            nome: state.membroSelecionado,
            email: inputEmail.value
        };

        // Bloquear botão
        btnSubmit.disabled = true;
        document.getElementById('btn-label').innerText = "ENVIANDO...";

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify(dados)
            });
            const res = await response.json();
            if (res.ok) {
                alert("Presença confirmada com sucesso!");
                location.reload();
            }
        } catch (err) {
            alert("Erro ao salvar. Tente novamente.");
            btnSubmit.disabled = false;
            document.getElementById('btn-label').innerText = "CONFIRMAR PRESENÇA";
        }
    });
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
    
    lista.forEach(nome => {
        const li = document.createElement('li');
        li.className = "px-4 py-3 cursor-pointer hover:bg-gold/10 transition-colors text-sm uppercase flex justify-between items-center";
        li.innerHTML = `<span>${nome}</span>`;
        li.onclick = () => selecionarMembro(nome, li);
        listUl.appendChild(li);
    });
}

function selecionarMembro(nome, elemento) {
    // Desmarcar anterior
    document.querySelectorAll('#lista-membros li').forEach(el => el.classList.remove('bg-gold/20', 'text-gold'));
    
    // Marcar atual
    elemento.classList.add('bg-gold/20', 'text-gold');
    state.membroSelecionado = nome;
    
    // Agora que selecionou o membro, o e-mail pode ser preenchido
    inputEmail.disabled = false;
    inputEmail.parentElement.parentElement.parentElement.style.opacity = "1";
    inputEmail.focus();
}

function resetarAbaixoDe(nivel) {
    if (nivel === 'aldeia') {
        comboSociedade.innerHTML = '<option value="">Selecione sociedade</option>';
        wrapperSociedade.classList.add('opacity-50', 'pointer-events-none');
        state.membroSelecionado = null;
    }
    
    if (nivel === 'aldeia' || nivel === 'sociedade') {
        cardMembros.classList.add('hidden-section');
        state.membroSelecionado = null;
        inputEmail.disabled = true;
        inputEmail.parentElement.parentElement.parentElement.style.opacity = "0.5";
    }
}

function resetarFormulario() {
    inputEmail.disabled = true;
    inputEmail.parentElement.parentElement.parentElement.style.opacity = "0.5";
}
