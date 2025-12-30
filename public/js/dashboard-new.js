const API_URL = 'http://localhost:3000/api';

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// Elementos do DOM
const lastUpdate = document.getElementById('lastUpdate');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const alertContainer = document.getElementById('alert-container');
const addTickerForm = document.getElementById('addTickerForm');
const tickerInput = document.getElementById('tickerInput');
const modalAlertContainer = document.getElementById('modal-alert-container');
const liveIndicator = document.getElementById('liveIndicator');
const freezeBtn = document.getElementById('freezeBtn');
const unfreezeBtn = document.getElementById('unfreezeBtn');
const resetLayoutBtn = document.getElementById('resetLayoutBtn');

// Gerenciar lista de tickers no localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN'];
let updateCounter = 0;

// Gerenciar dados congelados
let frozenData = JSON.parse(localStorage.getItem('frozenData')) || {};
let isFrozen = Object.keys(frozenData).length > 0;

// Inicializar GridStack
let grid;
let panelCounter = 0;

function initGrid() {
  grid = GridStack.init({
    column: 12,
    cellHeight: 80,
    acceptWidgets: true,
    removable: false,
    float: true,
    animate: true,
    resizable: {
      handles: 'e, se, s, sw, w'
    }
  });

  // Carregar layout salvo
  const savedLayout = localStorage.getItem('dashboardLayout');
  if (savedLayout) {
    const layout = JSON.parse(savedLayout);
    layout.forEach(item => {
      addPanelToGrid(item.type, item);
    });
  } else {
    // Adicionar painel padrão de tabela
    addPanelToGrid('table', { x: 0, y: 0, w: 12, h: 8 });
  }

  // Salvar layout ao mover ou redimensionar
  grid.on('change', saveLayout);
}

function saveLayout() {
  const items = grid.save();
  const layout = items.map(item => ({
    ...item,
    type: item.content ? getPanelType(item.id) : 'custom'
  }));
  localStorage.setItem('dashboardLayout', JSON.stringify(layout));
}

function getPanelType(panelId) {
  const panel = document.getElementById(panelId);
  return panel ? panel.dataset.panelType : 'custom';
}

// Função para adicionar painel ao grid
function addPanelToGrid(type, options = {}) {
  const panelId = options.id || `panel-${++panelCounter}`;
  const panelConfig = {
    x: options.x || 0,
    y: options.y || 0,
    w: options.w || 6,
    h: options.h || 6,
    id: panelId,
    content: createPanelContent(type, panelId)
  };

  const widget = grid.addWidget(panelConfig);
  
  // Inicializar conteúdo específico do painel
  if (type === 'table') {
    setTimeout(() => initTablePanel(panelId), 100);
  }
  
  return widget;
}

// Criar conteúdo do painel
function createPanelContent(type, panelId) {
  let icon, title, content;
  
  switch(type) {
    case 'table':
      icon = 'table';
      title = 'Tabela de Ativos';
      content = createTableContent();
      break;
    case 'chart':
      icon = 'graph-up';
      title = 'Gráfico';
      content = '<div class="empty-panel"><div><i class="bi bi-graph-up"></i><p>Gráfico em desenvolvimento</p></div></div>';
      break;
    case 'news':
      icon = 'newspaper';
      title = 'Notícias';
      content = '<div class="empty-panel"><div><i class="bi bi-newspaper"></i><p>Feed de notícias em desenvolvimento</p></div></div>';
      break;
    case 'custom':
      icon = 'card-text';
      title = 'Painel Personalizado';
      content = '<div class="empty-panel"><div><i class="bi bi-card-text"></i><p>Adicione seu conteúdo aqui</p></div></div>';
      break;
    default:
      icon = 'question-circle';
      title = 'Painel';
      content = '<div class="empty-panel"><div><i class="bi bi-question-circle"></i><p>Conteúdo não definido</p></div></div>';
  }
  
  return `
    <div id="${panelId}" data-panel-type="${type}">
      <div class="panel-header">
        <h5 class="panel-title"><i class="bi bi-${icon}"></i> ${title}</h5>
        <div class="panel-controls">
          <button class="btn btn-sm btn-outline-danger" onclick="removePanel('${panelId}')" title="Remover painel">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <div class="panel-content" id="${panelId}-content">
        ${content}
      </div>
    </div>
  `;
}

// Criar conteúdo da tabela
function createTableContent() {
  return `
    <div class="table-responsive" style="height: 100%; overflow: auto;">
      <table class="table table-hover align-middle mb-0" id="stockTable">
        <thead class="premium-table-header sticky-top">
          <tr>
            <th class="text-center border-end" rowspan="2">ATIVO</th>
            <th class="text-center border-end" colspan="2">MERCADO</th>
            <th class="text-center border-end" colspan="2">PRE-MARKET</th>
            <th class="text-center border-end" colspan="2" style="background-color: rgba(13, 110, 253, 0.1);">CONGELADO</th>
            <th class="text-center border-end" rowspan="2" style="background-color: rgba(25, 135, 84, 0.1);">COMP.</th>
            <th class="text-center border-end" rowspan="2">Hora</th>
            <th class="text-center" rowspan="2">AÇÕES</th>
          </tr>
          <tr>
            <th class="text-center">ÚLTIMO</th>
            <th class="text-center border-end">VAR.%</th>
            <th class="text-center">VAR.%</th>
            <th class="text-center border-end">Hora</th>
            <th class="text-center" style="background-color: rgba(13, 110, 253, 0.1);">VAR.%</th>
            <th class="text-center border-end" style="background-color: rgba(13, 110, 253, 0.1);">Hora</th>
          </tr>
        </thead>
        <tbody id="tickersContainer">
          <tr>
            <td colspan="10" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
              </div>
              <p class="mt-3 text-muted">Carregando ativos...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// Inicializar painel de tabela
function initTablePanel(panelId) {
  fetchAllTickersData();
}

// Função para remover painel
window.removePanel = function(panelId) {
  if (confirm('Deseja remover este painel?')) {
    const el = document.getElementById(panelId);
    if (el) {
      grid.removeWidget(el.closest('.grid-stack-item'));
      saveLayout();
      showAlert('Painel removido', 'info');
    }
  }
};

// Função para adicionar painel (chamada do modal)
window.addPanel = function(type) {
  addPanelToGrid(type);
  saveLayout();
  
  // Fechar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addPanelModal'));
  if (modal) modal.hide();
  
  showAlert(`Painel ${type} adicionado com sucesso!`, 'success');
};

// Resetar layout
function resetLayout() {
  if (confirm('Deseja resetar o layout para o padrão? Todos os painéis serão removidos.')) {
    localStorage.removeItem('dashboardLayout');
    grid.removeAll();
    addPanelToGrid('table', { x: 0, y: 0, w: 12, h: 8 });
    showAlert('Layout resetado', 'info');
  }
}

// Resto do código da tabela (mantém toda lógica existente)
// ... (continua no próximo arquivo)
