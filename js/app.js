const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

function buildFallbackData() {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const today = new Date();

  const monthlySeries = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const factor = index + 1;
    const income = 4200 + factor * 320;
    const expenses = 1800 + factor * 150;

    return {
      label: monthNames[monthDate.getMonth()],
      income,
      expenses,
      balance: income - expenses
    };
  });

  return {
    totals: {
      income: 6000,
      expenses: 2150,
      balance: 3850
    },
    counts: {
      categories: 5,
      transactions: 5
    },
    recentTransactions: [
      {
        id: 1,
        description: 'Salário CLT',
        amount: 5200,
        type: 'income',
        categoryName: 'Salário',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10)
          .toISOString()
          .slice(0, 10)
      },
      {
        id: 2,
        description: 'Supermercado',
        amount: 430,
        type: 'expense',
        categoryName: 'Alimentação',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8)
          .toISOString()
          .slice(0, 10)
      },
      {
        id: 3,
        description: 'Freelance design',
        amount: 800,
        type: 'income',
        categoryName: 'Freelance',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
          .toISOString()
          .slice(0, 10)
      }
    ],
    monthlySeries,
    expensesByCategory: [
      { id: 3, name: 'Alimentação', color: '#dc2626', total: 430 },
      { id: 4, name: 'Transporte', color: '#ea580c', total: 120 },
      { id: 5, name: 'Moradia', color: '#475569', total: 1600 }
    ]
  };
}

const elements = {
  summaryCards: document.getElementById('summaryCards'),
  monthlyChart: document.getElementById('monthlyChart'),
  categoryChart: document.getElementById('categoryChart'),
  transactionsList: document.getElementById('transactionsList'),
  apiStatus: document.getElementById('apiStatus'),
  sidebarStatus: document.getElementById('sidebarStatus'),
  refreshButton: document.getElementById('refreshButton')
};

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function buildMetricCard(label, value, help, tone) {
  return `
    <article class="metric">
      <p class="metric-label">${label}</p>
      <p class="metric-value ${tone}">${value}</p>
      <p class="metric-help">${help}</p>
    </article>
  `;
}

function renderSummary(summary) {
  elements.summaryCards.innerHTML = [
    buildMetricCard(
      'Receitas',
      formatCurrency(summary.totals.income),
      `${summary.counts.transactions} lançamentos registrados`,
      'amount-income'
    ),
    buildMetricCard(
      'Despesas',
      formatCurrency(summary.totals.expenses),
      `${summary.counts.categories} categorias cadastradas`,
      'amount-expense'
    ),
    buildMetricCard(
      'Saldo',
      formatCurrency(summary.totals.balance),
      'Saldo disponível no período atual',
      summary.totals.balance >= 0 ? 'amount-income' : 'amount-expense'
    )
  ].join('');
}

function renderMonthlyChart(series) {
  const maxValue = Math.max(...series.map((item) => Math.max(item.income, item.expenses, 1)));

  elements.monthlyChart.innerHTML = series
    .map((item) => {
      const incomeHeight = Math.max((item.income / maxValue) * 100, 6);
      const expenseHeight = Math.max((item.expenses / maxValue) * 100, 6);

      return `
        <div class="month-column">
          <div class="month-stack">
            <div class="bar-wrap">
              <div class="bar bar-income" style="height: ${incomeHeight}%"></div>
              <div class="bar-value">${formatCurrency(item.income)}</div>
            </div>
            <div class="bar-wrap">
              <div class="bar bar-expense" style="height: ${expenseHeight}%"></div>
              <div class="bar-value">${formatCurrency(item.expenses)}</div>
            </div>
          </div>
          <div class="bar-label">${item.label}</div>
        </div>
      `;
    })
    .join('');
}

function renderCategories(categories) {
  const maxValue = Math.max(...categories.map((item) => item.total), 1);

  elements.categoryChart.innerHTML = categories.length
    ? categories
        .map((category) => {
          const width = Math.max((category.total / maxValue) * 100, 8);

          return `
            <div class="category-row">
              <div>
                <p class="category-name">${category.name}</p>
                <p class="category-meta">Despesas concentradas nesta categoria</p>
                <div class="progress">
                  <div class="progress-fill" style="width: ${width}%; background: ${category.color}"></div>
                </div>
              </div>
              <div class="transaction-amount amount-expense">${formatCurrency(category.total)}</div>
            </div>
          `;
        })
        .join('')
    : '<p class="category-meta">Nenhuma despesa encontrada.</p>';
}

function renderTransactions(transactions) {
  elements.transactionsList.innerHTML = transactions.length
    ? transactions
        .map((transaction) => {
          const amountClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';
          const sign = transaction.type === 'income' ? '+' : '-';

          return `
            <div class="transaction-row ${transaction.type}">
              <div>
                <p class="transaction-title">${transaction.description}</p>
                <p class="transaction-meta">
                  ${transaction.categoryName} • ${transaction.date}
                </p>
              </div>
              <div class="transaction-amount ${amountClass}">
                ${sign} ${formatCurrency(transaction.amount)}
              </div>
            </div>
          `;
        })
        .join('')
    : '<p class="transaction-meta">Nenhuma transação encontrada.</p>';
}

function renderStatus(online, message) {
  const tone = online ? 'ok' : 'warn';
  const label = online ? 'API conectada' : 'Modo local';

  elements.apiStatus.innerHTML = `
    <div class="status-chip ${tone}">${label}</div>
    <p>${message}</p>
    <p>Base da API: <strong>${API_BASE_URL}</strong></p>
  `;

  elements.sidebarStatus.textContent = online ? 'API online' : 'Usando dados locais';
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  const payload = await response.json();
  return payload.data;
}

async function loadDashboard() {
  try {
    const [health, summary] = await Promise.all([
      fetchJson('/health'),
      fetchJson('/dashboard/summary')
    ]);

    renderSummary(summary);
    renderMonthlyChart(summary.monthlySeries);
    renderCategories(summary.expensesByCategory);
    renderTransactions(summary.recentTransactions);
    renderStatus(true, `Serviço ativo desde ${new Date(health.timestamp).toLocaleString('pt-BR')}.`);
  } catch (error) {
    const fallbackData = buildFallbackData();
    renderSummary(fallbackData);
    renderMonthlyChart(fallbackData.monthlySeries);
    renderCategories(fallbackData.expensesByCategory);
    renderTransactions(fallbackData.recentTransactions);
    renderStatus(false, 'A interface está usando dados de demonstração até a API ficar disponível.');
    console.error(error);
  }
}

elements.refreshButton.addEventListener('click', loadDashboard);

loadDashboard();
