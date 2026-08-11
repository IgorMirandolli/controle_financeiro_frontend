const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

const state = {
  loadState: 'loading',
  online: false,
  source: 'api',
  categories: [],
  transactions: [],
  charts: {
    monthly: null,
    category: null
  },
  filters: {
    startDate: '',
    endDate: '',
    categoryId: ''
  },
  activeNav: 'dashboard',
  editingTransactionId: null,
  lastSyncMessage: 'Aguardando sincronizacao',
  lastErrorMessage: '',
  chartDefaultsConfigured: false
};

const elements = {
  pageBanner: document.getElementById('pageBanner'),
  navItems: Array.from(document.querySelectorAll('.nav-item')),
  summaryCards: document.getElementById('summaryCards'),
  monthlyChart: document.getElementById('monthlyChart'),
  monthlyChartNote: document.getElementById('monthlyChartNote'),
  categoryChart: document.getElementById('categoryChart'),
  categoryChartNote: document.getElementById('categoryChartNote'),
  transactionsList: document.getElementById('transactionsList'),
  apiStatus: document.getElementById('apiStatus'),
  sidebarStatus: document.getElementById('sidebarStatus'),
  refreshButton: document.getElementById('refreshButton'),
  clearFiltersButton: document.getElementById('clearFiltersButton'),
  filterStartDate: document.getElementById('filterStartDate'),
  filterEndDate: document.getElementById('filterEndDate'),
  filterCategory: document.getElementById('filterCategory'),
  filterSummary: document.getElementById('filterSummary'),
  transactionsCount: document.getElementById('transactionsCount'),
  transactionForm: document.getElementById('transactionForm'),
  transactionId: document.getElementById('transactionId'),
  transactionType: document.getElementById('transactionType'),
  transactionCategoryId: document.getElementById('transactionCategoryId'),
  transactionDescription: document.getElementById('transactionDescription'),
  transactionAmount: document.getElementById('transactionAmount'),
  transactionDate: document.getElementById('transactionDate'),
  cancelEditButton: document.getElementById('cancelEditButton'),
  saveTransactionButton: document.getElementById('saveTransactionButton'),
  formHint: document.getElementById('formHint'),
  formModeBadge: document.getElementById('formModeBadge'),
  transactionFormPanel: document.getElementById('transactionFormPanel'),
  transactionsPanel: document.getElementById('transactionsPanel'),
  monthlyChartPanel: document.getElementById('monthlyChartPanel'),
  categoryPanel: document.getElementById('categoryPanel')
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function normalizeDateKey(value) {
  if (!value) {
    return '';
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const prefixMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (prefixMatch) {
    return prefixMatch[1];
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return text.slice(0, 10);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateText(value) {
  const normalized = normalizeDateKey(value);

  if (!normalized) {
    return '-';
  }

  const date = new Date(`${normalized}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleDateString('pt-BR');
}

function formatDateInput(value) {
  const normalized = normalizeDateKey(value);

  if (!normalized) {
    return new Date().toISOString().slice(0, 10);
  }

  return normalized;
}

function normalizeTransactionForView(transaction) {
  return {
    ...transaction,
    date: normalizeDateKey(transaction.date),
    amount: Number(transaction.amount || 0)
  };
}

function typeLabel(type) {
  return type === 'income' ? 'Receita' : 'Despesa';
}

function typePillClass(type) {
  return type === 'income' ? 'pill pill-income' : 'pill pill-expense';
}

function parseAmount(value) {
  return Number(String(value ?? '').trim().replace(',', '.'));
}

function sortTransactions(transactions = []) {
  return [...transactions].sort((left, right) => {
    if (left.date === right.date) {
      return Number(right.id) - Number(left.id);
    }

    return String(right.date).localeCompare(String(left.date));
  });
}

function buildFallbackData() {
  const today = new Date();
  const dateFromOffset = (daysAgo) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo)
      .toISOString()
      .slice(0, 10);

  const categories = [
    { id: 1, name: 'Salario', type: 'income', color: '#2563eb' },
    { id: 2, name: 'Freelance', type: 'income', color: '#7c3aed' },
    { id: 3, name: 'Alimentacao', type: 'expense', color: '#dc2626' },
    { id: 4, name: 'Transporte', type: 'expense', color: '#ea580c' },
    { id: 5, name: 'Moradia', type: 'expense', color: '#475569' },
    { id: 6, name: 'Saude', type: 'expense', color: '#0f766e' }
  ];

  const transactions = sortTransactions([
    {
      id: 101,
      description: 'Salario mensal',
      amount: 5200,
      type: 'income',
      categoryId: 1,
      categoryName: 'Salario',
      categoryType: 'income',
      date: dateFromOffset(9)
    },
    {
      id: 102,
      description: 'Projeto freelance',
      amount: 900,
      type: 'income',
      categoryId: 2,
      categoryName: 'Freelance',
      categoryType: 'income',
      date: dateFromOffset(7)
    },
    {
      id: 103,
      description: 'Mercado da semana',
      amount: 410,
      type: 'expense',
      categoryId: 3,
      categoryName: 'Alimentacao',
      categoryType: 'expense',
      date: dateFromOffset(6)
    },
    {
      id: 104,
      description: 'Uber e busao',
      amount: 126,
      type: 'expense',
      categoryId: 4,
      categoryName: 'Transporte',
      categoryType: 'expense',
      date: dateFromOffset(4)
    },
    {
      id: 105,
      description: 'Aluguel',
      amount: 1800,
      type: 'expense',
      categoryId: 5,
      categoryName: 'Moradia',
      categoryType: 'expense',
      date: dateFromOffset(2)
    }
  ]);

  return {
    categories,
    transactions,
    health: {
      status: 'ok',
      service: 'controle-financeiro-api',
      database: 'demo',
      timestamp: new Date().toISOString()
    }
  };
}

function getTotals(transactions = []) {
  return transactions.reduce(
    (accumulator, transaction) => {
      const amount = Math.abs(Number(transaction.amount || 0));

      if (transaction.type === 'income') {
        accumulator.income += amount;
      } else {
        accumulator.expenses += amount;
      }

      accumulator.balance = accumulator.income - accumulator.expenses;
      return accumulator;
    },
    {
      income: 0,
      expenses: 0,
      balance: 0
    }
  );
}

function getFilteredTransactions() {
  const { startDate, endDate, categoryId } = state.filters;
  const selectedCategoryId = categoryId ? Number(categoryId) : null;

  return state.transactions.filter((transaction) => {
    if (startDate && transaction.date < startDate) {
      return false;
    }

    if (endDate && transaction.date > endDate) {
      return false;
    }

    if (selectedCategoryId && Number(transaction.categoryId) !== selectedCategoryId) {
      return false;
    }

    return true;
  });
}

function buildMonthlySeries(transactions = []) {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentDate = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    const monthTransactions = transactions.filter((transaction) =>
      String(transaction.date || '').startsWith(key)
    );

    const income = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const expenses = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      key,
      label: monthNames[monthDate.getMonth()],
      income,
      expenses,
      balance: income - expenses
    };
  });
}

function buildExpenseCategories(transactions = []) {
  const totalsByCategory = new Map();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense') {
      return;
    }

    const categoryId = Number(transaction.categoryId);
    const currentTotal = totalsByCategory.get(categoryId) || 0;
    totalsByCategory.set(categoryId, currentTotal + Number(transaction.amount || 0));
  });

  return state.categories
    .filter((category) => category.type === 'expense')
    .map((category) => ({
      ...category,
      total: totalsByCategory.get(Number(category.id)) || 0
    }))
    .filter((category) => category.total > 0)
    .sort((left, right) => right.total - left.total);
}

function ensureChartDefaults() {
  if (typeof Chart === 'undefined' || state.chartDefaultsConfigured) {
    return;
  }

  Chart.defaults.font.family = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  Chart.defaults.color = '#5b6475';
  Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.2)';
  state.chartDefaultsConfigured = true;
}

function destroyChart(chartKey) {
  if (state.charts[chartKey]) {
    state.charts[chartKey].destroy();
    state.charts[chartKey] = null;
  }
}

function setPageBanner(kind, title, message, detail) {
  if (!title && !message) {
    elements.pageBanner.hidden = true;
    elements.pageBanner.innerHTML = '';
    return;
  }

  const detailMarkup = detail ? `<p class="page-banner-detail">${escapeHtml(detail)}</p>` : '';

  elements.pageBanner.hidden = false;
  elements.pageBanner.className = `page-banner page-banner-${kind}`;
  elements.pageBanner.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(message)}</span>
    ${detailMarkup}
  `;
}

function setChartFrameState(frame, kind, message) {
  if (!frame) {
    return;
  }

  frame.classList.remove('is-loading', 'is-empty', 'is-error');
  delete frame.dataset.overlayText;

  if (!kind) {
    return;
  }

  frame.classList.add(`is-${kind}`);
  frame.dataset.overlayText = message || '';
}

function clearChartFrameState(frame) {
  setChartFrameState(frame, null, '');
}

function renderSkeletonSummaryCards() {
  elements.summaryCards.innerHTML = Array.from({ length: 3 }, () => `
    <article class="metric metric-skeleton" aria-busy="true">
      <div class="skeleton skeleton-line skeleton-title"></div>
      <div class="skeleton skeleton-value"></div>
      <div class="skeleton skeleton-line skeleton-note"></div>
    </article>
  `).join('');
}

function renderSkeletonTransactions() {
  elements.transactionsCount.textContent = 'Carregando...';
  elements.transactionsList.innerHTML = Array.from({ length: 4 }, () => `
    <article class="transaction-card transaction-skeleton" aria-busy="true">
      <div class="transaction-copy">
        <div class="skeleton skeleton-line skeleton-title"></div>
        <div class="skeleton skeleton-line skeleton-note"></div>
      </div>
      <div class="transaction-side">
        <div class="skeleton skeleton-line skeleton-amount"></div>
        <div class="action-row">
          <span class="skeleton skeleton-chip"></span>
          <span class="skeleton skeleton-chip"></span>
        </div>
      </div>
    </article>
  `).join('');
}

function renderLoadingState() {
  renderSkeletonSummaryCards();
  renderSkeletonTransactions();
  elements.filterSummary.textContent = 'Carregando filtros e dados do painel...';
  elements.monthlyChartNote.textContent = 'Carregando grafico mensal...';
  elements.categoryChartNote.textContent = 'Carregando grafico por categoria...';

  destroyChart('monthly');
  destroyChart('category');
  setChartFrameState(elements.monthlyChart.parentElement, 'loading', 'Carregando grafico mensal...');
  setChartFrameState(elements.categoryChart.parentElement, 'loading', 'Carregando grafico por categoria...');

  setPageBanner('info', 'Carregando painel', 'Buscando dados da API e atualizando os graficos.');
  renderConnectionStatus();
}

function renderConnectionStatus() {
  if (state.loadState === 'loading') {
    elements.apiStatus.innerHTML = `
      <div class="status-chip warn">Carregando</div>
      <p>Estamos buscando categorias, lancamentos e graficos.</p>
      <p><strong>Base:</strong> ${escapeHtml(API_BASE_URL)}</p>
      <p><strong>Resumo:</strong> sincronizando dados iniciais.</p>
    `;
    elements.sidebarStatus.textContent = 'Carregando dados...';
    return;
  }

  if (state.loadState === 'error') {
    elements.apiStatus.innerHTML = `
      <div class="status-chip warn">Modo demonstracao</div>
      <p>Conseguimos manter o painel funcionando, mas a API nao respondeu agora.</p>
      <p><strong>Base:</strong> ${escapeHtml(API_BASE_URL)}</p>
      <p><strong>Erro:</strong> ${escapeHtml(state.lastErrorMessage || 'Nao foi possivel validar a conexao.')}</p>
      <p><strong>Base local:</strong> dados de demonstracao ativos.</p>
    `;
    elements.sidebarStatus.textContent = 'Demo ativa';
    return;
  }

  const sourceLabel = state.source === 'api' ? 'API conectada' : 'Modo demonstracao';
  const tone = state.source === 'api' ? 'ok' : 'warn';
  const sourceMessage =
    state.source === 'api'
      ? `Ultima sincronizacao em ${state.lastSyncMessage}.`
      : 'Os dados exibidos abaixo sao de demonstracao.';

  elements.apiStatus.innerHTML = `
    <div class="status-chip ${tone}">${escapeHtml(sourceLabel)}</div>
    <p>${escapeHtml(sourceMessage)}</p>
    <p><strong>Base:</strong> ${escapeHtml(API_BASE_URL)}</p>
    <p><strong>Categoria</strong> ${state.categories.length} cadastradas</p>
    <p><strong>Lancamentos</strong> ${state.transactions.length} registrados</p>
  `;

  elements.sidebarStatus.textContent = state.source === 'api' ? 'API online' : 'Demo ativa';
}

function setLoading(isLoading) {
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.textContent = isLoading
    ? state.transactions.length || state.categories.length
      ? 'Atualizando...'
      : 'Carregando...'
    : 'Recarregar';
}

function setSaving(isSaving) {
  elements.saveTransactionButton.disabled = isSaving;
  elements.saveTransactionButton.textContent = isSaving
    ? 'Salvando...'
    : state.editingTransactionId
      ? 'Atualizar lancamento'
      : 'Salvar lancamento';
}

function renderSummaryCards(transactions) {
  const totals = getTotals(transactions);
  const balanceTone = totals.balance >= 0 ? 'amount-income' : 'amount-expense';

  elements.summaryCards.innerHTML = `
    <article class="metric">
      <p class="metric-label">Receitas</p>
      <p class="metric-value amount-income">${formatCurrency(totals.income)}</p>
      <p class="metric-help">${transactions.filter((transaction) => transaction.type === 'income').length} lancamentos no periodo</p>
    </article>
    <article class="metric">
      <p class="metric-label">Despesas</p>
      <p class="metric-value amount-expense">${formatCurrency(totals.expenses)}</p>
      <p class="metric-help">${transactions.filter((transaction) => transaction.type === 'expense').length} lancamentos no periodo</p>
    </article>
    <article class="metric">
      <p class="metric-label">Saldo</p>
      <p class="metric-value ${balanceTone}">${formatCurrency(totals.balance)}</p>
      <p class="metric-help">Saldo calculado com base nos filtros atuais</p>
    </article>
  `;
}

function renderMonthlyChart(transactions) {
  const series = buildMonthlySeries(transactions);
  const monthlyFrame = elements.monthlyChart.parentElement;

  if (!transactions.length) {
    destroyChart('monthly');
    setChartFrameState(monthlyFrame, 'empty', 'Nenhum lancamento para montar o grafico mensal.');
    elements.monthlyChartNote.textContent = 'Use os filtros ou crie um lancamento para ver a evolucao mensal.';
    return;
  }

  if (typeof Chart === 'undefined') {
    elements.monthlyChartNote.textContent =
      'Chart.js nao carregou. Recarregue a pagina quando a biblioteca estiver disponivel.';
    destroyChart('monthly');
    setChartFrameState(monthlyFrame, 'error', 'Biblioteca de grafico indisponivel.');
    return;
  }

  ensureChartDefaults();
  clearChartFrameState(monthlyFrame);

  const labels = series.map((item) => item.label);
  const incomeData = series.map((item) => item.income);
  const expenseData = series.map((item) => item.expenses);

  const chartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Entradas',
          data: incomeData,
          backgroundColor: 'rgba(37, 99, 235, 0.82)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 28
        },
        {
          label: 'Saidas',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 4,
          right: 8,
          bottom: 4,
          left: 4
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false,
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            boxHeight: 10
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y || 0)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return formatCurrency(Number(value) || 0);
            }
          }
        }
      }
    }
  };

  if (state.charts.monthly) {
    state.charts.monthly.data.labels = labels;
    state.charts.monthly.data.datasets[0].data = incomeData;
    state.charts.monthly.data.datasets[1].data = expenseData;
    state.charts.monthly.update();
    elements.monthlyChartNote.textContent = `Baseado em ${transactions.length} lancamentos filtrados.`;
    return;
  }

  state.charts.monthly = new Chart(elements.monthlyChart, chartConfig);
  elements.monthlyChartNote.textContent = `Baseado em ${transactions.length} lancamentos filtrados.`;
}

function renderCategoryChart(transactions) {
  const categories = buildExpenseCategories(transactions);
  const categoryFrame = elements.categoryChart.parentElement;

  if (!transactions.length) {
    destroyChart('category');
    setChartFrameState(categoryFrame, 'empty', 'Nenhuma despesa para mostrar neste periodo.');
    elements.categoryChartNote.textContent = 'Crie despesas ou ajuste os filtros para ver a distribuicao por categoria.';
    return;
  }

  if (typeof Chart === 'undefined') {
    elements.categoryChartNote.textContent =
      'Chart.js nao carregou. Recarregue a pagina quando a biblioteca estiver disponivel.';
    destroyChart('category');
    setChartFrameState(categoryFrame, 'error', 'Biblioteca de grafico indisponivel.');
    return;
  }

  ensureChartDefaults();

  if (!categories.length) {
    destroyChart('category');
    setChartFrameState(categoryFrame, 'empty', 'Sem despesas para este periodo.');
    elements.categoryChartNote.textContent = 'Nao ha despesas no periodo filtrado para distribuir por categoria.';
    return;
  }

  clearChartFrameState(categoryFrame);
  const labels = categories.map((category) => category.name);
  const values = categories.map((category) => category.total);
  const colors = categories.map((category) => category.color);

  const chartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Gasto por categoria',
          data: values,
          backgroundColor: colors.map((color) => `${color}CC`),
          borderColor: colors,
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 26
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatCurrency(context.parsed.x || 0)}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return formatCurrency(Number(value) || 0);
            }
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  };

  if (state.charts.category) {
    state.charts.category.data.labels = labels;
    state.charts.category.data.datasets[0].data = values;
    state.charts.category.data.datasets[0].backgroundColor = colors.map((color) => `${color}CC`);
    state.charts.category.data.datasets[0].borderColor = colors;
    state.charts.category.update();
    elements.categoryChartNote.textContent = `${categories.length} categorias com despesas no periodo filtrado.`;
    return;
  }

  state.charts.category = new Chart(elements.categoryChart, chartConfig);
  elements.categoryChartNote.textContent = `${categories.length} categorias com despesas no periodo filtrado.`;
}

function renderTransactions(transactions) {
  const visibleTransactions = transactions.slice(0, 8);
  const totalItems = state.transactions.length;
  const isFiltered = state.filters.startDate || state.filters.endDate || state.filters.categoryId;
  elements.transactionsCount.textContent = `${visibleTransactions.length} de ${transactions.length} lancamentos`;

  if (!visibleTransactions.length) {
    const emptyTitle = totalItems === 0
      ? 'Ainda nao existem lancamentos'
      : 'Nenhum lancamento neste filtro';
    const emptyNote = totalItems === 0
      ? 'Use o formulario ao lado para registrar sua primeira receita ou despesa.'
      : isFiltered
        ? 'Altere o periodo ou a categoria para ver mais resultados.'
        : 'Nao ha lancamentos para mostrar agora.';

    elements.transactionsList.innerHTML = `
      <div class="empty-state">
        <strong>${escapeHtml(emptyTitle)}</strong>
        <p class="empty-note">${escapeHtml(emptyNote)}</p>
      </div>
    `;
    return;
  }

  elements.transactionsList.innerHTML = visibleTransactions
    .map((transaction) => {
      const amountClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';
      const sign = transaction.type === 'income' ? '+' : '-';

      return `
        <article class="transaction-card ${transaction.type}" data-transaction-id="${transaction.id}" data-transaction-type="${transaction.type}">
          <div class="transaction-copy">
            <div class="transaction-head">
              <p class="transaction-title">${escapeHtml(transaction.description)}</p>
              <span class="${typePillClass(transaction.type)}">${typeLabel(transaction.type)}</span>
            </div>
            <p class="transaction-meta">
              ${escapeHtml(transaction.categoryName || 'Sem categoria')} • ${escapeHtml(formatDateText(transaction.date))}
            </p>
          </div>

          <div class="transaction-side">
            <p class="transaction-amount ${amountClass}">${sign} ${formatCurrency(transaction.amount)}</p>
            <div class="action-row">
              <button class="button button-secondary button-small" type="button" data-action="edit" data-id="${transaction.id}">
                Editar
              </button>
              <button class="button button-danger button-small" type="button" data-action="delete" data-id="${transaction.id}">
                Excluir
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderFilterSummary(transactions) {
  const pieces = [];

  if (state.filters.startDate && state.filters.endDate && state.filters.startDate > state.filters.endDate) {
    elements.filterSummary.textContent = 'Periodo invalido: a data inicial esta depois da data final.';
    return;
  }

  if (state.filters.startDate) {
    pieces.push(`de ${formatDateText(state.filters.startDate)}`);
  }

  if (state.filters.endDate) {
    pieces.push(`ate ${formatDateText(state.filters.endDate)}`);
  }

  if (state.filters.categoryId) {
    const selectedCategory = state.categories.find((category) => String(category.id) === state.filters.categoryId);
    if (selectedCategory) {
      pieces.push(`categoria ${selectedCategory.name}`);
    }
  }

  if (!pieces.length) {
    pieces.push('nenhum filtro ativo');
  }

  elements.filterSummary.textContent = `${transactions.length} lancamentos visiveis, ${pieces.join(' • ')}.`;
}

function syncFilterOptions() {
  const options = [
    '<option value="">Todas as categorias</option>',
    ...state.categories
      .slice()
      .sort((left, right) => {
        if (left.type === right.type) {
          return String(left.name).localeCompare(String(right.name));
        }

        return left.type.localeCompare(right.type);
      })
      .map(
        (category) =>
          `<option value="${category.id}">${escapeHtml(category.name)} (${escapeHtml(typeLabel(category.type))})</option>`
      )
  ];

  elements.filterCategory.innerHTML = options.join('');

  if (!state.filters.categoryId) {
    elements.filterCategory.value = '';
    return;
  }

  const exists = state.categories.some((category) => String(category.id) === state.filters.categoryId);
  elements.filterCategory.value = exists ? state.filters.categoryId : '';
  if (!exists) {
    state.filters.categoryId = '';
  }
}

function syncFormCategoryOptions() {
  const type = elements.transactionType.value;
  const availableCategories = state.categories.filter((category) => category.type === type);
  const currentValue = elements.transactionCategoryId.value;
  const options = availableCategories.map(
    (category) =>
      `<option value="${category.id}">${escapeHtml(category.name)}</option>`
  );

  if (!options.length) {
    elements.transactionCategoryId.innerHTML = '<option value="">Nenhuma categoria disponivel</option>';
    elements.transactionCategoryId.disabled = true;
    elements.saveTransactionButton.disabled = true;
    elements.formHint.textContent = `Crie ao menos uma categoria do tipo ${typeLabel(type).toLowerCase()} para salvar lancamentos.`;
    return;
  }

  elements.transactionCategoryId.disabled = false;
  elements.saveTransactionButton.disabled = false;
  elements.transactionCategoryId.innerHTML = options.join('');

  const preferredValue = availableCategories.some((category) => String(category.id) === currentValue)
    ? currentValue
    : String(availableCategories[0].id);

  elements.transactionCategoryId.value = preferredValue;
}

function syncFormMode() {
  const isEditing = Boolean(state.editingTransactionId);

  elements.formModeBadge.textContent = isEditing
    ? `Editando #${state.editingTransactionId}`
    : 'Novo lancamento';

  elements.cancelEditButton.hidden = !isEditing;
  elements.saveTransactionButton.textContent = isEditing ? 'Atualizar lancamento' : 'Salvar lancamento';
  elements.formHint.textContent = isEditing
    ? 'Ajuste os campos e confirme para atualizar o lancamento.'
    : 'Preencha os campos para registrar uma receita ou despesa.';
}

function resetFormDefaults() {
  elements.transactionId.value = '';
  elements.transactionDescription.value = '';
  elements.transactionAmount.value = '';
  elements.transactionDate.value = formatDateInput();
  elements.transactionType.value = 'income';
  syncFormCategoryOptions();
  syncFormMode();
}

function fillForm(transaction) {
  elements.transactionId.value = String(transaction.id);
  elements.transactionDescription.value = transaction.description || '';
  elements.transactionAmount.value = Number(transaction.amount || 0).toFixed(2);
  elements.transactionDate.value = formatDateInput(transaction.date);
  elements.transactionType.value = transaction.type || 'income';
  syncFormCategoryOptions();
  elements.transactionCategoryId.value = String(transaction.categoryId || '');
  state.editingTransactionId = transaction.id;
  syncFormMode();
  elements.transactionDescription.focus();
}

function clearEditMode() {
  state.editingTransactionId = null;
  resetFormDefaults();
}

function getTransactionById(id) {
  return state.transactions.find((transaction) => Number(transaction.id) === Number(id));
}

function setActiveNav(navKey) {
  state.activeNav = navKey;

  elements.navItems.forEach((item) => {
    const isActive = item.dataset.nav === navKey;
    item.classList.toggle('active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function scrollToPanel(panel) {
  if (!panel) {
    return;
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDashboard() {
  const filteredTransactions = sortTransactions(getFilteredTransactions());

  renderSummaryCards(filteredTransactions);
  renderMonthlyChart(filteredTransactions);
  renderCategoryChart(filteredTransactions);
  renderTransactions(filteredTransactions);
  renderFilterSummary(filteredTransactions);

  if (state.loadState === 'ready') {
    setPageBanner('', '');
  }

  renderConnectionStatus();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (response.status !== 204 && contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message = payload?.message || `Falha ao acessar ${path}`;
    throw new Error(message);
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  return payload;
}

async function loadData() {
  state.loadState = 'loading';
  setLoading(true);
  renderLoadingState();

  try {
    const [health, categories, transactions] = await Promise.all([
      apiRequest('/health'),
      apiRequest('/categories'),
      apiRequest('/transactions')
    ]);

    state.online = true;
    state.categories = Array.isArray(categories) ? categories : [];
    state.transactions = sortTransactions(
      (Array.isArray(transactions) ? transactions : []).map(normalizeTransactionForView)
    );
    state.lastSyncMessage = health?.timestamp
      ? new Date(health.timestamp).toLocaleString('pt-BR')
      : new Date().toLocaleString('pt-BR');
    state.source = 'api';
    state.online = true;
    state.loadState = 'ready';
    state.lastErrorMessage = '';
  } catch (error) {
    const fallback = buildFallbackData();

    console.error(error);

    state.online = false;
    state.source = 'demo';
    state.loadState = 'error';
    state.lastErrorMessage = error?.message || 'Nao foi possivel carregar a API.';
    state.categories = fallback.categories;
    state.transactions = fallback.transactions.map(normalizeTransactionForView);
    state.lastSyncMessage = new Date(fallback.health.timestamp).toLocaleString('pt-BR');

    setPageBanner(
      'warn',
      'API indisponivel',
      'Estamos mostrando dados de demonstracao para continuar a navegacao.',
      state.lastErrorMessage
    );
  } finally {
    setLoading(false);
  }

  syncFilterOptions();
  syncFormCategoryOptions();
  renderDashboard();
}

async function saveTransaction(event) {
  event.preventDefault();

  const payload = {
    description: elements.transactionDescription.value.trim(),
    amount: parseAmount(elements.transactionAmount.value),
    type: elements.transactionType.value,
    categoryId: Number(elements.transactionCategoryId.value),
    date: elements.transactionDate.value
  };

  if (!payload.description) {
    elements.formHint.textContent = 'Informe uma descricao para o lancamento.';
    return;
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    elements.formHint.textContent = 'O valor precisa ser maior que zero.';
    return;
  }

  if (!payload.categoryId) {
    elements.formHint.textContent = 'Escolha uma categoria valida.';
    return;
  }

  setSaving(true);

  try {
    if (state.editingTransactionId) {
      await apiRequest(`/transactions/${state.editingTransactionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    clearEditMode();
    await loadData();
    elements.formHint.textContent = 'Lancamento salvo com sucesso.';
  } catch (error) {
    elements.formHint.textContent = error.message || 'Nao foi possivel salvar o lancamento.';
  } finally {
    setSaving(false);
  }
}

async function deleteTransaction(id) {
  const transaction = getTransactionById(id);

  if (!transaction) {
    return;
  }

  const confirmed = window.confirm(`Excluir "${transaction.description}"?`);

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/transactions/${id}`, {
      method: 'DELETE'
    });

    if (Number(state.editingTransactionId) === Number(id)) {
      clearEditMode();
    }

    await loadData();
    elements.formHint.textContent = 'Lancamento removido.';
  } catch (error) {
    elements.formHint.textContent = error.message || 'Nao foi possivel excluir o lancamento.';
  }
}

function applyFilterChange() {
  state.filters.startDate = elements.filterStartDate.value;
  state.filters.endDate = elements.filterEndDate.value;
  state.filters.categoryId = elements.filterCategory.value;
  renderDashboard();
}

function clearFilters() {
  state.filters.startDate = '';
  state.filters.endDate = '';
  state.filters.categoryId = '';

  elements.filterStartDate.value = '';
  elements.filterEndDate.value = '';
  elements.filterCategory.value = '';

  renderDashboard();
}

function bindEvents() {
  elements.refreshButton.addEventListener('click', loadData);
  elements.clearFiltersButton.addEventListener('click', clearFilters);
  elements.filterStartDate.addEventListener('change', applyFilterChange);
  elements.filterEndDate.addEventListener('change', applyFilterChange);
  elements.filterCategory.addEventListener('change', applyFilterChange);
  elements.transactionType.addEventListener('change', syncFormCategoryOptions);
  elements.cancelEditButton.addEventListener('click', clearEditMode);
  elements.transactionForm.addEventListener('submit', saveTransaction);

  elements.navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const navKey = item.dataset.nav;

      if (!navKey) {
        return;
      }

      setActiveNav(navKey);
      clearEditMode();

      if (navKey === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (navKey === 'income' || navKey === 'expense') {
        elements.transactionType.value = navKey;
        syncFormCategoryOptions();
        syncFormMode();
        scrollToPanel(elements.transactionFormPanel);
        elements.transactionDescription.focus();
        return;
      }

      if (navKey === 'categories') {
        scrollToPanel(elements.categoryPanel);
      }
    });
  });

  elements.transactionsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) {
      return;
    }

    const transactionId = button.dataset.id;

    if (button.dataset.action === 'edit') {
      const transaction = getTransactionById(transactionId);

      if (transaction) {
        fillForm(transaction);
      }
      return;
    }

    if (button.dataset.action === 'delete') {
      deleteTransaction(transactionId);
    }
  });
}

function initialize() {
  bindEvents();
  setActiveNav('dashboard');
  resetFormDefaults();
  loadData();
}

initialize();
