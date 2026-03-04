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

  // Inicializa o módulo de Controle Mensal de Contas
  initContas();
}

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', init);

/* ============================================================
   CONTROLE MENSAL DE CONTAS
   ============================================================ */

/** Chave do LocalStorage para contas mensais */
const STORAGE_KEY_CONTAS = 'controle_contas_mensais';

/** Categorias disponíveis para contas a pagar */
const CATEGORIAS_CONTAS = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Contas (água, luz, internet)',
  'Outros',
];

/** Ícones por categoria de conta */
const ICONES_CONTAS = {
  'Moradia':                       '🏠',
  'Alimentação':                   '🍽️',
  'Transporte':                    '🚗',
  'Saúde':                         '💊',
  'Educação':                      '📚',
  'Lazer':                         '🎮',
  'Contas (água, luz, internet)':  '💡',
  'Outros':                        '📌',
};

/* ---- Estado do módulo ---- */

/**
 * @type {Array<{
 *   id: string,
 *   descricao: string,
 *   valor: number,
 *   vencimento: string,
 *   categoria: string,
 *   paga: boolean,
 *   dataPagamento: string|null
 * }>}
 */
let contasMensais = carregarContasDoStorage();

/** Mês selecionado (0-indexado: 0=Janeiro ... 11=Dezembro) */
let mesSelecionado = new Date().getMonth();

/** Ano selecionado */
let anoSelecionado = new Date().getFullYear();

/* ---- Persistência ---- */

/** Carrega as contas do LocalStorage ou retorna array vazio. */
function carregarContasDoStorage() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY_CONTAS);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

/** Salva o array de contas no LocalStorage. */
function salvarContasNoStorage() {
  localStorage.setItem(STORAGE_KEY_CONTAS, JSON.stringify(contasMensais));
}

/* ---- Navegação por mês ---- */

/** Retorna o nome do mês por índice (0-indexado). */
const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Atualiza o label de mês/ano no topo da seção. */
function atualizarLabelMes() {
  document.getElementById('mes-atual-label').textContent =
    `${NOMES_MES[mesSelecionado]} ${anoSelecionado}`;
}

/** Navega para o mês anterior e re-renderiza. */
function irMesAnterior() {
  if (mesSelecionado === 0) {
    mesSelecionado = 11;
    anoSelecionado--;
  } else {
    mesSelecionado--;
  }
  atualizarLabelMes();
  renderizarContas();
}

/** Navega para o próximo mês e re-renderiza. */
function irMesProximo() {
  if (mesSelecionado === 11) {
    mesSelecionado = 0;
    anoSelecionado++;
  } else {
    mesSelecionado++;
  }
  atualizarLabelMes();
  renderizarContas();
}

/* ---- Filtragem ---- */

/**
 * Retorna as contas cujo vencimento está no mês/ano selecionado.
 * @returns {Array}
 */
function obterContasDoMes() {
  const mesStr = String(mesSelecionado + 1).padStart(2, '0');
  const prefixo = `${anoSelecionado}-${mesStr}`;
  return contasMensais.filter((c) => c.vencimento.startsWith(prefixo));
}

/* ---- CRUD ---- */

/**
 * Adiciona uma nova conta a pagar.
 * @param {{descricao:string, valor:number, vencimento:string, categoria:string}} dados
 */
function adicionarConta(dados) {
  /** @type {{id:string, descricao:string, valor:number, vencimento:string, categoria:string, paga:boolean, dataPagamento:string|null}} */
  const nova = {
    id: gerarId(),
    ...dados,
    paga: false,
    dataPagamento: null,
  };
  contasMensais.push(nova);
  salvarContasNoStorage();
  renderizarContas();
}

/**
 * Marca uma conta como paga.
 * @param {string} id
 */
function marcarComoPaga(id) {
  const conta = contasMensais.find((c) => c.id === id);
  if (!conta) return;
  conta.paga = true;
  conta.dataPagamento = dataHoje();
  salvarContasNoStorage();
  renderizarContas();
  // Muda automaticamente para a aba "Pagas" para dar feedback visual
  ativarAba('pagas');
}

/**
 * Desfaz o pagamento de uma conta, voltando-a para "Em Aberto".
 * @param {string} id
 */
function desfazerPagamento(id) {
  const conta = contasMensais.find((c) => c.id === id);
  if (!conta) return;
  conta.paga = false;
  conta.dataPagamento = null;
  salvarContasNoStorage();
  renderizarContas();
}

/**
 * Exclui uma conta pelo ID.
 * @param {string} id
 */
function excluirConta(id) {
  contasMensais = contasMensais.filter((c) => c.id !== id);
  salvarContasNoStorage();
  renderizarContas();
}

/* ---- Renderização ---- */

/** Renderiza as listas de contas nas duas abas. */
function renderizarContas() {
  const contas  = obterContasDoMes();
  const hoje    = dataHoje();
  const emAberto = contas.filter((c) => !c.paga);
  const pagas    = contas.filter((c) => c.paga);

  // Atualiza contadores das abas
  document.getElementById('count-aberto').textContent = `(${emAberto.length})`;
  document.getElementById('count-pagas').textContent  = `(${pagas.length})`;

  // — Aba Em Aberto —
  const listaAberto   = document.getElementById('lista-contas-aberto');
  const vazioAberto   = document.getElementById('vazio-contas-aberto');
  listaAberto.innerHTML = '';

  if (emAberto.length === 0) {
    vazioAberto.classList.add('visible');
  } else {
    vazioAberto.classList.remove('visible');
    emAberto
      .sort((a, b) => (a.vencimento > b.vencimento ? 1 : -1))
      .forEach((c) => listaAberto.appendChild(criarItemContaAberto(c, hoje)));
  }

  // — Aba Pagas —
  const listaPagas = document.getElementById('lista-contas-pagas');
  const vazioPagas = document.getElementById('vazio-contas-pagas');
  listaPagas.innerHTML = '';

  if (pagas.length === 0) {
    vazioPagas.classList.add('visible');
  } else {
    vazioPagas.classList.remove('visible');
    pagas
      .sort((a, b) => (a.dataPagamento > b.dataPagamento ? -1 : 1))
      .forEach((c) => listaPagas.appendChild(criarItemContaPaga(c)));
  }
}

/**
 * Cria e retorna o elemento DOM de uma conta em aberto.
 * @param {{id:string, descricao:string, valor:number, vencimento:string, categoria:string}} conta
 * @param {string} hoje Data de hoje no formato YYYY-MM-DD
 * @returns {HTMLElement}
 */
function criarItemContaAberto(conta, hoje) {
  const icone = ICONES_CONTAS[conta.categoria] || '📌';
  const item  = document.createElement('div');

  let statusClass = '';
  let statusTag   = '';
  if (conta.vencimento < hoje) {
    statusClass = 'conta-item--vencida';
    statusTag   = '<span class="conta-item__status conta-item__status--vencida">⚠️ Vencida</span>';
  } else if (conta.vencimento === hoje) {
    statusClass = 'conta-item--hoje';
    statusTag   = '<span class="conta-item__status conta-item__status--hoje">🔔 Vence Hoje</span>';
  }

  item.className  = `conta-item ${statusClass}`;
  item.dataset.id = conta.id;

  item.innerHTML = `
    <label class="conta-item__check-label" aria-label="Marcar ${escaparHtml(conta.descricao)} como paga">
      <input type="checkbox" class="conta-item__checkbox" data-id="${conta.id}" />
    </label>
    <span class="conta-item__icon" aria-hidden="true">${icone}</span>
    <div class="conta-item__details">
      <div class="conta-item__desc" title="${escaparHtml(conta.descricao)}">${escaparHtml(conta.descricao)}</div>
      <div class="conta-item__meta">
        <span class="conta-item__tag">${escaparHtml(conta.categoria)}</span>
        <span class="conta-item__tag">📅 ${formatarData(conta.vencimento)}</span>
        ${statusTag}
      </div>
    </div>
    <div class="conta-item__right">
      <span class="conta-item__value">${formatarMoeda(conta.valor)}</span>
      <button
        class="btn btn--danger btn-excluir-conta"
        data-id="${conta.id}"
        aria-label="Excluir conta ${escaparHtml(conta.descricao)}"
      >🗑️</button>
    </div>
  `;

  return item;
}

/**
 * Cria e retorna o elemento DOM de uma conta paga.
 * @param {{id:string, descricao:string, valor:number, vencimento:string, categoria:string, dataPagamento:string}} conta
 * @returns {HTMLElement}
 */
function criarItemContaPaga(conta) {
  const icone = ICONES_CONTAS[conta.categoria] || '📌';
  const item  = document.createElement('div');

  item.className  = 'conta-item conta-item--paga';
  item.dataset.id = conta.id;

  item.innerHTML = `
    <span class="conta-item__icon" aria-hidden="true">${icone}</span>
    <div class="conta-item__details">
      <div class="conta-item__desc" title="${escaparHtml(conta.descricao)}">${escaparHtml(conta.descricao)}</div>
      <div class="conta-item__meta">
        <span class="conta-item__tag">${escaparHtml(conta.categoria)}</span>
        <span class="conta-item__tag">📅 Venc: ${formatarData(conta.vencimento)}</span>
        <span class="conta-item__tag">✅ Pago em: ${formatarData(conta.dataPagamento)}</span>
      </div>
    </div>
    <div class="conta-item__right">
      <span class="conta-item__value conta-item__value--paga">${formatarMoeda(conta.valor)}</span>
      <button
        class="btn btn--secondary btn-desfazer-pagamento"
        data-id="${conta.id}"
        aria-label="Desfazer pagamento de ${escaparHtml(conta.descricao)}"
        style="font-size:var(--text-xs);padding:var(--space-1) var(--space-3);"
      >↩️ Desfazer</button>
    </div>
  `;

  return item;
}

/* ---- Abas ---- */

/**
 * Ativa a aba especificada e oculta a outra.
 * @param {'aberto'|'pagas'} aba
 */
function ativarAba(aba) {
  const tabAberto    = document.getElementById('tab-aberto');
  const tabPagas     = document.getElementById('tab-pagas');
  const painelAberto = document.getElementById('painel-aberto');
  const painelPagas  = document.getElementById('painel-pagas');

  if (aba === 'aberto') {
    tabAberto.classList.add('tab--active');
    tabAberto.setAttribute('aria-selected', 'true');
    tabPagas.classList.remove('tab--active');
    tabPagas.setAttribute('aria-selected', 'false');
    painelAberto.removeAttribute('hidden');
    painelPagas.setAttribute('hidden', '');
  } else {
    tabPagas.classList.add('tab--active');
    tabPagas.setAttribute('aria-selected', 'true');
    tabAberto.classList.remove('tab--active');
    tabAberto.setAttribute('aria-selected', 'false');
    painelPagas.removeAttribute('hidden');
    painelAberto.setAttribute('hidden', '');
  }
}

/* ---- Validação do formulário de contas ---- */

/**
 * Exibe mensagem de erro em um campo do formulário de contas.
 * @param {string} campo ID do campo
 * @param {string} msg   Mensagem de erro
 */
function mostrarErroConta(campo, msg) {
  const el    = document.getElementById(`erro-${campo}`);
  if (el) el.textContent = msg;
  const input = document.getElementById(campo);
  if (input) input.classList.add('is-invalid');
}

/**
 * Limpa a mensagem de erro de um campo do formulário de contas.
 * @param {string} campo
 */
function limparErroConta(campo) {
  const el    = document.getElementById(`erro-${campo}`);
  if (el) el.textContent = '';
  const input = document.getElementById(campo);
  if (input) input.classList.remove('is-invalid');
}

/**
 * Valida o formulário de nova conta e retorna os dados ou null.
 * @returns {{descricao:string, valor:number, vencimento:string, categoria:string}|null}
 */
function validarFormularioConta() {
  const campos = ['conta-descricao', 'conta-valor', 'conta-vencimento', 'conta-categoria'];
  campos.forEach(limparErroConta);

  let valido = true;

  const descricao   = document.getElementById('conta-descricao').value.trim();
  const valorStr    = document.getElementById('conta-valor').value.trim();
  const vencimento  = document.getElementById('conta-vencimento').value;
  const categoria   = document.getElementById('conta-categoria').value;

  if (!descricao) {
    mostrarErroConta('conta-descricao', 'A descrição é obrigatória.');
    valido = false;
  }

  const valor = parseFloat(valorStr);
  if (!valorStr || isNaN(valor) || valor <= 0) {
    mostrarErroConta('conta-valor', 'Informe um valor maior que zero.');
    valido = false;
  }

  if (!vencimento) {
    mostrarErroConta('conta-vencimento', 'Informe a data de vencimento.');
    valido = false;
  }

  if (!categoria) {
    mostrarErroConta('conta-categoria', 'Selecione uma categoria.');
    valido = false;
  }

  if (!valido) return null;

  return { descricao, valor, vencimento, categoria };
}

/* ---- Relatório ---- */

/** Gera e exibe o relatório mensal no modal. */
function gerarRelatorio() {
  const contas   = obterContasDoMes();
  const hoje     = dataHoje();
  const total    = contas.length;
  const pagas    = contas.filter((c) => c.paga);
  const emAberto = contas.filter((c) => !c.paga);
  const vencidas = emAberto.filter((c) => c.vencimento < hoje);

  const totalPago      = pagas.reduce((acc, c) => acc + c.valor, 0);
  const totalPendente  = emAberto.reduce((acc, c) => acc + c.valor, 0);
  const totalVencido   = vencidas.reduce((acc, c) => acc + c.valor, 0);
  const percentual     = total > 0 ? Math.round((pagas.length / total) * 100) : 0;

  // Breakdown por categoria
  /** @type {Object.<string, {previsto:number, pago:number, pendente:number}>} */
  const cats = {};
  contas.forEach((c) => {
    if (!cats[c.categoria]) cats[c.categoria] = { previsto: 0, pago: 0, pendente: 0 };
    cats[c.categoria].previsto += c.valor;
    if (c.paga) {
      cats[c.categoria].pago += c.valor;
    } else {
      cats[c.categoria].pendente += c.valor;
    }
  });

  let breakdownHtml = '';
  for (const [cat, vals] of Object.entries(cats)) {
    const icone = ICONES_CONTAS[cat] || '📌';
    breakdownHtml += `
      <tr>
        <td>${icone} ${escaparHtml(cat)}</td>
        <td>${formatarMoeda(vals.previsto)}</td>
        <td class="relatorio__cell--pago">${formatarMoeda(vals.pago)}</td>
        <td class="relatorio__cell--pendente">${formatarMoeda(vals.pendente)}</td>
      </tr>`;
  }
  if (!breakdownHtml) {
    breakdownHtml = '<tr><td colspan="4" style="text-align:center;color:var(--color-muted)">Nenhuma conta neste mês.</td></tr>';
  }

  // Atualiza o DOM do modal
  document.getElementById('relatorio-titulo').textContent         = `${NOMES_MES[mesSelecionado]} ${anoSelecionado}`;
  document.getElementById('relatorio-total-contas').textContent   = total;
  document.getElementById('relatorio-total-pago').textContent     = formatarMoeda(totalPago);
  document.getElementById('relatorio-total-pendente').textContent = formatarMoeda(totalPendente);
  document.getElementById('relatorio-total-vencido').textContent  = formatarMoeda(totalVencido);
  document.getElementById('relatorio-percentual').textContent     = `${percentual}%`;
  document.getElementById('relatorio-barra').style.width          = `${percentual}%`;
  document.getElementById('relatorio-barra-container').setAttribute('aria-valuenow', percentual);
  document.getElementById('relatorio-barra-label').textContent    = `${percentual}% quitado`;
  document.getElementById('relatorio-breakdown').innerHTML        = breakdownHtml;

  const modal = document.getElementById('modal-relatorio');
  modal.removeAttribute('hidden');
  modal.focus();
}

/** Fecha o modal de relatório. */
function fecharRelatorio() {
  document.getElementById('modal-relatorio').setAttribute('hidden', '');
}

/* ---- Inicialização do módulo de contas ---- */

/** Registra todos os event listeners do módulo de contas mensais. */
function initContas() {
  // Label do mês inicial
  atualizarLabelMes();

  // Renderização inicial
  renderizarContas();

  // Navegação de mês
  document.getElementById('btn-mes-anterior').addEventListener('click', irMesAnterior);
  document.getElementById('btn-mes-proximo').addEventListener('click', irMesProximo);

  // Alternância de abas
  document.getElementById('tab-aberto').addEventListener('click', () => ativarAba('aberto'));
  document.getElementById('tab-pagas').addEventListener('click',  () => ativarAba('pagas'));

  // Formulário de nova conta: limpeza de erros em tempo real
  document.getElementById('conta-descricao').addEventListener('input',  () => limparErroConta('conta-descricao'));
  document.getElementById('conta-valor').addEventListener('input',      () => limparErroConta('conta-valor'));
  document.getElementById('conta-vencimento').addEventListener('change', () => limparErroConta('conta-vencimento'));
  document.getElementById('conta-categoria').addEventListener('change',  () => limparErroConta('conta-categoria'));

  // Formulário de nova conta: submit
  document.getElementById('form-conta').addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = validarFormularioConta();
    if (!dados) return;
    adicionarConta(dados);
    e.target.reset();
    // Navega para o mês do vencimento cadastrado
    const [ano, mes] = dados.vencimento.split('-').map(Number);
    mesSelecionado = mes - 1;
    anoSelecionado = ano;
    atualizarLabelMes();
    renderizarContas();
    ativarAba('aberto');
  });

  // Delegação de eventos: lista Em Aberto
  document.getElementById('lista-contas-aberto').addEventListener('change', (e) => {
    const checkbox = e.target.closest('input.conta-item__checkbox');
    if (!checkbox) return;
    const id   = checkbox.dataset.id;
    const item = checkbox.closest('.conta-item');
    // Animação antes de mover
    if (item) {
      item.classList.add('conta-item--pagando');
      item.addEventListener('animationend', () => marcarComoPaga(id), { once: true });
    } else {
      marcarComoPaga(id);
    }
  });

  document.getElementById('lista-contas-aberto').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-excluir-conta');
    if (!btn) return;
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      excluirConta(btn.dataset.id);
    }
  });

  // Delegação de eventos: lista Pagas
  document.getElementById('lista-contas-pagas').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-desfazer-pagamento');
    if (!btn) return;
    desfazerPagamento(btn.dataset.id);
    ativarAba('aberto');
  });

  // Modal de relatório
  document.getElementById('btn-gerar-relatorio').addEventListener('click', gerarRelatorio);

  const fecharModal = () => fecharRelatorio();
  document.getElementById('btn-fechar-relatorio').addEventListener('click', fecharModal);
  document.getElementById('btn-fechar-relatorio-rodape').addEventListener('click', fecharModal);
  document.getElementById('modal-backdrop').addEventListener('click', fecharModal);
  document.getElementById('btn-imprimir-relatorio').addEventListener('click', () => window.print());

  // Fechar modal com tecla Escape
  document.getElementById('modal-relatorio').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharRelatorio();
  });
}
