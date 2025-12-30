const API_URL = 'http://localhost:3000/api';

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard Modular inicializado!');

  // Elementos
  const addPanelBtn = document.getElementById('addPanelBtn');
  const saveLayoutBtn = document.getElementById('saveLayoutBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const dashboardGrid = document.getElementById('dashboardGrid');

  // Carregar watchlist
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META'];

  // Função para buscar dados das ações
  async function fetchStocksData() {
    try {
      const response = await fetch(`${API_URL}/data/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbols: watchlist })
      });

      if (response.ok) {
        const data = await response.json();
        displayStocksData(data);
        displayNasdaqData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  }

  // Exibir dados das ações
  function displayStocksData(data) {
    const tbody = document.getElementById('stocksTableBody');
    if (!tbody) return;

    const tickersArray = Object.values(data);
    
    tbody.innerHTML = tickersArray.map(ticker => {
      const percent = parseFloat(ticker.atClose.changePercent) || 0;
      const positive = percent >= 0;
      const colorClass = positive ? 'text-success' : 'text-danger';
      const icon = positive ? '▲' : '▼';
      const sign = positive ? '+' : '';
      
      return `
        <tr>
          <td class="fw-bold">${ticker.ticker}</td>
          <td>${ticker.atClose.price}</td>
          <td class="${colorClass}">${icon} ${sign}${Math.abs(percent).toFixed(2)}%</td>
          <td class="text-muted small">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      `;
    }).join('');
  }

  // Exibir dados do NASDAQ (usa os mesmos dados)
  function displayNasdaqData(data) {
    const tbody = document.getElementById('nasdaqTableBody');
    if (!tbody) return;

    const tickersArray = Object.values(data).slice(0, 5); // Mostra apenas 5
    
    tbody.innerHTML = tickersArray.map(ticker => {
      const percent = parseFloat(ticker.atClose.changePercent) || 0;
      const positive = percent >= 0;
      const colorClass = positive ? 'text-success' : 'text-danger';
      const sign = positive ? '+' : '';
      
      return `
        <tr>
          <td class="fw-bold">${ticker.ticker}</td>
          <td>${ticker.atClose.price}</td>
          <td class="${colorClass}">${sign}${Math.abs(percent).toFixed(2)}%</td>
          <td class="${colorClass}">${sign}${Math.abs(percent).toFixed(2)}%</td>
        </tr>
      `;
    }).join('');
  }

  // Abrir modal de adicionar painel
  if (addPanelBtn) {
    addPanelBtn.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('addPanelModal'));
      modal.show();
    });
  }

  // Salvar layout
  if (saveLayoutBtn) {
    saveLayoutBtn.addEventListener('click', () => {
      // Aqui você salvaria o layout no localStorage
      showNotification('Layout salvo com sucesso!', 'success');
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  // Fechar painéis
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-panel-close')) {
      const panel = e.target.closest('.dashboard-panel');
      if (confirm('Deseja remover este painel?')) {
        panel.remove();
        showNotification('Painel removido', 'info');
      }
    }
  });

  // Adicionar novo painel
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.panel-type-card');
    if (card) {
      const type = card.dataset.panelType;
      addNewPanel(type);
      bootstrap.Modal.getInstance(document.getElementById('addPanelModal')).hide();
    }
  });

  // Função para adicionar novo painel
  function addNewPanel(type) {
    const panelTemplates = {
      stocks: createStocksPanel(),
      metals: createMetalsPanel(),
      news: createNewsPanel(),
      chart: createChartPanel(),
      heatmap: createHeatmapPanel(),
      watchlist: createWatchlistPanel()
    };

    const panelHTML = panelTemplates[type];
    if (panelHTML) {
      dashboardGrid.insertAdjacentHTML('beforeend', panelHTML);
      showNotification(`Painel ${type} adicionado!`, 'success');
    }
  }

  // Templates de painéis
  function createStocksPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="stocks-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-graph-up panel-icon"></i>
            <h5 class="mb-0">Ações</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Novo painel de ações adicionado!</p>
        </div>
      </div>
    `;
  }

  function createMetalsPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="metals-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-gem panel-icon"></i>
            <h5 class="mb-0">Metais</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Novo painel de metais adicionado!</p>
        </div>
      </div>
    `;
  }

  function createNewsPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="news-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-newspaper panel-icon"></i>
            <h5 class="mb-0">Notícias</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Novo feed de notícias adicionado!</p>
        </div>
      </div>
    `;
  }

  function createChartPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="chart-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bar-chart panel-icon"></i>
            <h5 class="mb-0">Gráfico</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Gráfico será exibido aqui</p>
        </div>
      </div>
    `;
  }

  function createHeatmapPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="heatmap-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-grid-3x3 panel-icon"></i>
            <h5 class="mb-0">Mapa de Calor</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Mapa de calor S&P500</p>
        </div>
      </div>
    `;
  }

  function createWatchlistPanel() {
    return `
      <div class="dashboard-panel" data-panel-id="watchlist-${Date.now()}">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-star panel-icon"></i>
            <h5 class="mb-0">Favoritos</h5>
          </div>
          <div class="panel-actions">
            <button class="btn-panel btn-panel-close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>
        <div class="panel-body">
          <p class="text-muted">Lista de favoritos</p>
        </div>
      </div>
    `;
  }

  // Função para mostrar notificações
  function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Buscar dados inicialmente
  fetchStocksData();

  // Atualizar a cada 1 segundo
  setInterval(fetchStocksData, 1000);

  console.log('Dashboard Modular pronto!');
});
