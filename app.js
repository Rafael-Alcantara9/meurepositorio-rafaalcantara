/**
 * app.js — Controle Financeiro Pessoal
 * Lógica principal: CRUD, LocalStorage, filtros, formatação pt-BR
 */

'use strict';

/* ============================================================
   CONSTANTES E DADOS INICIAIS
   ============================================================ */

const STORAGE_KEY = 'controle_financeiro_transacoes';

/** Categorias disponíveis por tipo de transação */
const CATEGORIAS = {
  receita: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Vendas',
    'Outros',
  ],
  despesa: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Roupas',
    'Contas (água, luz, internet)',
    'Outros',
  ],
};

/** Ícones por categoria */
const ICONES_CATEGORIA = {
  'Salário':                       '💼',
  'Freelance':                     '💻',
  'Investimentos':                 '📊',
  'Vendas':                        '🛒',
  'Alimentação':                   '🍽️',
  'Transporte':                    '🚗',
  'Moradia':                       '🏠',
  'Saúde':                         '💊',
  'Educação':                      '📚',
  'Lazer':                         '🎮',
  'Roupas':                        '👕',
  'Contas (água, luz, internet)':  '💡',
  'Outros':                        '📌',
};

/* ============================================================
   ESTADO DA APLICAÇÃO
   ============================================================ */

/** @type {Array<{id:string, descricao:string, valor:number, tipo:string, categoria:string, data:string}>} */
let transacoes = carregarDoStorage();

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/**
 * Gera um ID único baseado em timestamp + número aleatório.
 * @returns {string}
 */
const gerarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Formata um número como moeda brasileira (R$ 1.234,56).
 * @param {number} valor
 * @returns {string}
 */
const formatarMoeda = (valor) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formata uma string de data ISO (YYYY-MM-DD) para DD/MM/AAAA.
 * @param {string} dataISO
 * @returns {string}
 */
const formatarData = (dataISO) => {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

/**
 * Retorna a data atual no formato YYYY-MM-DD (para value do input[type=date]).
 * @returns {string}
 */
const dataHoje = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   PERSISTÊNCIA — LocalStorage
   ============================================================ */

/** Carrega as transações do LocalStorage ou retorna array vazio. */
function carregarDoStorage() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

/** Salva o array de transações no LocalStorage. */
function salvarNoStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
}

/* ============================================================
   RESUMO FINANCEIRO
   ============================================================ */

/** Atualiza os cards de saldo, receitas e despesas. */
function atualizarResumo() {
  const totalReceitas = transacoes
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  document.getElementById('receitas').textContent = formatarMoeda(totalReceitas);
  document.getElementById('despesas').textContent = formatarMoeda(totalDespesas);

  const elSaldo = document.getElementById('saldo');
  elSaldo.textContent = formatarMoeda(saldo);
  elSaldo.style.color = saldo < 0 ? 'var(--color-expense)' : '';
}

/* ============================================================
   FORMULÁRIO — Categorias dinâmicas
   ============================================================ */

/**
 * Preenche o select de categorias de acordo com o tipo escolhido.
 * @param {string} tipo 'receita' | 'despesa'
 * @param {string} [valorAtual] Categoria já selecionada (edição)
 */
function preencherCategorias(tipo, valorAtual = '') {
  const select = document.getElementById('categoria');
  select.innerHTML = '<option value="">Selecione uma categoria...</option>';

  if (!tipo) {
    select.innerHTML = '<option value="">Selecione o tipo primeiro...</option>';
    return;
  }

  const lista = CATEGORIAS[tipo] || [];
  lista.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === valorAtual) opt.selected = true;
    select.appendChild(opt);
  });
}

/**
 * Preenche o select de filtro de categoria com todas as categorias
 * das transações existentes.
 */
function atualizarFiltroCategorias() {
  const select = document.getElementById('filtro-categoria');
  const valorAtual = select.value;

  // Coleta categorias únicas existentes nas transações
  const cats = [...new Set(transacoes.map((t) => t.categoria))].sort();

  select.innerHTML = '<option value="todas">Todas</option>';
  cats.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === valorAtual) opt.selected = true;
    select.appendChild(opt);
  });
}

/* ============================================================
   LISTA DE TRANSAÇÕES
   ============================================================ */

/** Lê os filtros atuais e retorna as transações filtradas e ordenadas. */
function obterTransacoesFiltradas() {
  const filtroTipo       = document.getElementById('filtro-tipo').value;
  const filtroCategoria  = document.getElementById('filtro-categoria').value;
  const filtroDataInicio = document.getElementById('filtro-data-inicio').value;
  const filtroDataFim    = document.getElementById('filtro-data-fim').value;

  return transacoes
    .filter((t) => {
      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
      if (filtroDataInicio && t.data < filtroDataInicio) return false;
      if (filtroDataFim    && t.data > filtroDataFim)    return false;
      return true;
    })
    // Mais recente primeiro
    .sort((a, b) => (b.data > a.data ? 1 : b.data < a.data ? -1 : 0));
}

/** Renderiza a lista de transações na tela. */
function renderizarLista() {
  const lista = document.getElementById('lista-transacoes');
  const estadoVazio = document.getElementById('estado-vazio');
  const filtradas = obterTransacoesFiltradas();

  lista.innerHTML = '';

  if (filtradas.length === 0) {
    estadoVazio.classList.add('visible');
    return;
  }

  estadoVazio.classList.remove('visible');

  filtradas.forEach((t) => {
    const icone = ICONES_CATEGORIA[t.categoria] || (t.tipo === 'receita' ? '📈' : '📉');
    const sinal = t.tipo === 'receita' ? '+' : '-';

    const item = document.createElement('div');
    item.className = `transaction-item transaction-item--${t.tipo}`;
    item.dataset.id = t.id;

    item.innerHTML = `
      <span class="transaction-item__icon">${icone}</span>
      <div class="transaction-item__details">
        <div class="transaction-item__desc" title="${escaparHtml(t.descricao)}">${escaparHtml(t.descricao)}</div>
        <div class="transaction-item__meta">
          <span class="transaction-item__tag">${t.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}</span>
          <span class="transaction-item__tag">${escaparHtml(t.categoria)}</span>
          <span class="transaction-item__tag">📅 ${formatarData(t.data)}</span>
        </div>
      </div>
      <div class="transaction-item__right">
        <span class="transaction-item__value transaction-item__value--${t.tipo}">
          ${sinal} ${formatarMoeda(t.valor)}
        </span>
        <button
          class="btn btn--danger"
          aria-label="Excluir transação ${escaparHtml(t.descricao)}"
          data-id="${t.id}"
        >🗑️ Excluir</button>
      </div>
    `;

    lista.appendChild(item);
  });
}

/**
 * Escapa caracteres HTML para evitar injeção de conteúdo.
 * @param {string} str
 * @returns {string}
 */
function escaparHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   CRUD — Adicionar / Excluir
   ============================================================ */

/**
 * Adiciona uma nova transação.
 * @param {{descricao:string, valor:number, tipo:string, categoria:string, data:string}} dados
 */
function adicionarTransacao(dados) {
  const nova = { id: gerarId(), ...dados };
  transacoes.push(nova);
  salvarNoStorage();
  atualizarResumo();
  atualizarFiltroCategorias();
  renderizarLista();
}

/**
 * Exclui uma transação pelo ID.
 * @param {string} id
 */
function excluirTransacao(id) {
  transacoes = transacoes.filter((t) => t.id !== id);
  salvarNoStorage();
  atualizarResumo();
  atualizarFiltroCategorias();
  renderizarLista();
}

/* ============================================================
   VALIDAÇÃO DO FORMULÁRIO
   ============================================================ */

/**
 * Exibe mensagem de erro em um campo.
 * @param {string} campo ID do campo
 * @param {string} msg  Mensagem de erro
 */
function mostrarErro(campo, msg) {
  const el = document.getElementById(`erro-${campo}`);
  if (el) el.textContent = msg;
  const input = document.getElementById(campo) || document.querySelector(`[name="${campo}"]`);
  if (input) input.classList.add('is-invalid');
}

/**
 * Limpa a mensagem de erro de um campo.
 * @param {string} campo
 */
function limparErro(campo) {
  const el = document.getElementById(`erro-${campo}`);
  if (el) el.textContent = '';
  const input = document.getElementById(campo) || document.querySelector(`[name="${campo}"]`);
  if (input) input.classList.remove('is-invalid');
}

/**
 * Valida o formulário e retorna os dados ou null em caso de erro.
 * @returns {{descricao:string, valor:number, tipo:string, categoria:string, data:string}|null}
 */
function validarFormulario() {
  let valido = true;

  ['descricao', 'valor', 'tipo', 'categoria', 'data'].forEach(limparErro);

  const descricao = document.getElementById('descricao').value.trim();
  const valorStr  = document.getElementById('valor').value.trim();
  const tipo      = document.querySelector('input[name="tipo"]:checked')?.value || '';
  const categoria = document.getElementById('categoria').value;
  const data      = document.getElementById('data').value;

  if (!descricao) {
    mostrarErro('descricao', 'A descrição é obrigatória.');
    valido = false;
  }

  const valor = parseFloat(valorStr);
  if (!valorStr || isNaN(valor) || valor <= 0) {
    mostrarErro('valor', 'Informe um valor maior que zero.');
    valido = false;
  }

  if (!tipo) {
    mostrarErro('tipo', 'Selecione o tipo (Receita ou Despesa).');
    valido = false;
  }

  if (!categoria) {
    mostrarErro('categoria', 'Selecione uma categoria.');
    valido = false;
  }

  if (!data) {
    mostrarErro('data', 'Informe a data da transação.');
    valido = false;
  }

  if (!valido) return null;

  return { descricao, valor, tipo, categoria, data };
}

/* ============================================================
   INICIALIZAÇÃO E EVENTOS
   ============================================================ */

function init() {
  // Define a data padrão do formulário como hoje
  document.getElementById('data').value = dataHoje();

  // Renderização inicial
  atualizarResumo();
  atualizarFiltroCategorias();
  renderizarLista();

  /* ---------- Formulário: mudança de tipo ---------- */
  document.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      preencherCategorias(radio.value);
      limparErro('tipo');
      limparErro('categoria');
    });
  });

  /* ---------- Formulário: submit ---------- */
  document.getElementById('form-transacao').addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = validarFormulario();
    if (!dados) return;

    adicionarTransacao(dados);

    // Reseta o formulário
    e.target.reset();
    document.getElementById('data').value = dataHoje();
    preencherCategorias('');
    ['descricao', 'valor', 'tipo', 'categoria', 'data'].forEach(limparErro);
  });

  /* ---------- Lista: delegação de eventos (excluir) ---------- */
  document.getElementById('lista-transacoes').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      excluirTransacao(id);
    }
  });

  /* ---------- Filtros ---------- */
  ['filtro-tipo', 'filtro-categoria', 'filtro-data-inicio', 'filtro-data-fim'].forEach((id) => {
    document.getElementById(id).addEventListener('change', renderizarLista);
  });

  document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
    document.getElementById('filtro-tipo').value = 'todos';
    document.getElementById('filtro-categoria').value = 'todas';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    renderizarLista();
  });

  /* ---------- Limpeza de erros em tempo real ---------- */
  document.getElementById('descricao').addEventListener('input', () => limparErro('descricao'));
  document.getElementById('valor').addEventListener('input', () => limparErro('valor'));
  document.getElementById('categoria').addEventListener('change', () => limparErro('categoria'));
  document.getElementById('data').addEventListener('change', () => limparErro('data'));
}

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', init);
