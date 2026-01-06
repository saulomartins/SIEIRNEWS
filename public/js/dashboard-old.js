const API_URL = 'http://localhost:3000/api';

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado! Inicializando...');

// Elementos do DOM
const tickersContainer = document.getElementById('tickersContainer');
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
const resetColumnsBtn = document.getElementById('resetColumnsBtn');

// Debug: Verificar se elementos foram encontrados
console.log('=== DEBUG ELEMENTOS ===');
console.log('freezeBtn:', freezeBtn);
console.log('unfreezeBtn:', unfreezeBtn);
console.log('resetColumnsBtn:', resetColumnsBtn);
console.log('tickersContainer:', tickersContainer);
console.log('tableContainer:', document.getElementById('tableContainer'));

// Gerenciar lista de tickers no localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN'];
let updateCounter = 0;

// Gerenciar dados congelados
let frozenData = JSON.parse(localStorage.getItem('frozenData')) || {};
let isFrozen = Object.keys(frozenData).length > 0;

// Sistema de redimensionamento da tabela inteira
let isResizing = false;
let resizeDirection = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
const tableContainer = document.getElementById('tableContainer');
const savedTableWidth = localStorage.getItem('tableWidth');

// Aplicar largura salva
if (savedTableWidth) {
  tableContainer.style.width = savedTableWidth;
}

// Função para inicializar redimensionamento da tabela
function initTableResize() {
  const handles = document.querySelectorAll('.resize-handle');
  
  if (handles.length === 0) {
    console.warn('Nenhum handle de resize encontrado');
    return;
  }
  
  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      resizeDirection = handle.dataset.direction || 'bottom';
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = tableContainer.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      // Adicionar classe baseada na direção
      if (resizeDirection.includes('corner')) {
        document.body.classList.add('resizing-nwse');
      } else if (resizeDirection === 'bottom' || resizeDirection === 'top') {
        document.body.classList.add('resizing-ns');
      } else {
        document.body.classList.add('resizing');
      }
    });
  });
  
  console.log('Resize handles inicializados:', handles.length);
}

// Função para resetar tamanho da tabela
function resetTableSize() {
  localStorage.removeItem('tableWidth');
  tableContainer.style.width = '100%';
  showAlert('Tamanho da tabela resetado', 'info');
}

// Função para buscar dados de múltiplos tickers
async function fetchAllTickersData() {
  try {
    // Não desabilitar botão nem mostrar spinner para não atrapalhar UX
    updateCounter++;
    
    // Piscar indicador ao vivo
    if (liveIndicator) {
      liveIndicator.style.opacity = '0.5';
      setTimeout(() => {
        if (liveIndicator) liveIndicator.style.opacity = '1';
      }, 100);
    }
    
    const response = await fetch(`${API_URL}/data/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbols: watchlist })
    });
    
    if (response.status === 401) {
      showAlert('Sessão expirada. Faça login novamente.', 'warning');
      setTimeout(() => {
        logout();
      }, 2000);
      return;
    }
    
    const data = await response.json();
    
    if (response.ok) {
      // Converter objeto para array
      const tickersArray = Object.values(data);
      displayTickers(tickersArray);
      lastUpdate.textContent = new Date().toLocaleString('pt-BR');
      
      // Mostrar alerta de sucesso apenas na primeira atualização ou a cada 60 atualizações
      if (updateCounter === 1 || updateCounter % 60 === 0) {
        showAlert(`${tickersArray.length} ativos atualizados • Atualização automática a cada 1 segundo`, 'success');
        
        setTimeout(() => {
          alertContainer.innerHTML = '';
        }, 3000);
      }
    } else {
      if (updateCounter === 1) {
        showAlert(data.message || 'Erro ao buscar dados', 'danger');
      }
    }
  } catch (error) {
    console.error('Erro:', (error && error.stack) ? error.stack : (typeof error === 'object' ? JSON.stringify(error) : String(error)));
    if (updateCounter === 1) {
      showAlert('Erro ao conectar com o servidor', 'danger');
    }
  }
}

// Função para exibir os tickers em tabela
function displayTickers(tickers) {
  if (!tickers || tickers.length === 0) {
    tickersContainer.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
          <p class="mt-3 text-muted">Nenhum ativo adicionado ainda</p>
          <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTickerModal">
            <i class="bi bi-plus-circle"></i> Adicionar Primeiro Ativo
          </button>
        </td>
      </tr>
    `;
    return;
  }

  // Se é a primeira renderização, criar as linhas
  if (tickersContainer.querySelector('.spinner-border') || tickersContainer.children.length === 0) {
    createTickerCards(tickers);
  } else {
    // Atualizar apenas os valores das linhas existentes
    updateTickerValues(tickers);
  }
}

// Função para criar as linhas da tabela inicialmente
function createTickerCards(tickers) {
  const { marketTime, preMarketTime } = getMarketTimes();
  
  tickersContainer.innerHTML = tickers.map((ticker) => {
    const atClosePercent = parseFloat(ticker.atClose.changePercent) || 0;
    const atClosePositive = atClosePercent >= 0;
    const atCloseColor = atClosePositive ? 'text-success' : 'text-danger';
    const atCloseIcon = atClosePositive ? '▲' : '▼';
    const atCloseSign = atClosePositive ? '+' : '';
    
    let preMarketHTML = '<td class="text-center text-muted">-</td><td class="text-center text-muted">-</td>';
    
    if (ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
      const preMarketPercent = parseFloat(ticker.preMarket.changePercent) || 0;
      const preMarketPositive = preMarketPercent >= 0;
      const preMarketColor = preMarketPositive ? 'text-success' : 'text-danger';
      const preMarketIcon = preMarketPositive ? '▲' : '▼';
      const preMarketSign = preMarketPositive ? '+' : '';
      
      preMarketHTML = `
        <td class="text-center fw-bold fs-5" data-premarket-price>${ticker.preMarket.price}</td>
        <td class="text-center ${preMarketColor} fw-bold" data-premarket-percent>
          ${preMarketIcon} ${preMarketSign}${Math.abs(preMarketPercent).toFixed(2)}%
        </td>
      `;
    }
    
    // HTML para dados congelados (colunas ocultas por padrão)
    const frozen = frozenData[ticker.ticker];
    let frozenHTML = '';
    
    if (isFrozen && frozen) {
      const frozenPercent = frozen.percent;
      const frozenPositive = frozenPercent >= 0;
      const frozenColor = frozenPositive ? 'text-success' : 'text-danger';
      const frozenIcon = frozenPositive ? '▲' : '▼';
      const frozenSign = frozenPositive ? '+' : '';
      
      // Calcular comparação
      let currentPercent;
      if (frozen.period === 'premarket' && ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
        currentPercent = parseFloat(ticker.preMarket.changePercent) || 0;
      } else {
        currentPercent = parseFloat(ticker.atClose.changePercent) || 0;
      }
      
      const diff = currentPercent - frozenPercent;
      const diffPositive = diff >= 0;
      const diffColor = diffPositive ? 'text-success' : 'text-danger';
      const diffIcon = diffPositive ? '▲' : '▼';
      const diffSign = diffPositive ? '+' : '';
      
      frozenHTML = `
        <td class="text-center ${frozenColor} fw-bold frozen-column" style="background-color: rgba(13, 110, 253, 0.1);">
          ${frozenIcon} ${frozenSign}${Math.abs(frozenPercent).toFixed(2)}%<br>
          <small class="text-muted">${frozen.time}</small>
        </td>
        <td class="text-center ${diffColor} fw-bold frozen-column" style="background-color: rgba(25, 135, 84, 0.1);">
          ${diffIcon} ${diffSign}${Math.abs(diff).toFixed(2)}%
        </td>
      `;
    } else {
      frozenHTML = `
        <td class="frozen-column" style="display: none;"></td>
        <td class="frozen-column" style="display: none;"></td>
      `;
    }
    
    return `
      <tr data-ticker="${ticker.ticker}" class="fade-in">
        <td class="text-center fw-bold fs-5">${ticker.ticker}</td>
        <td class="text-center fw-bold fs-5" data-atclose-price>${ticker.atClose.price}</td>
        <td class="text-center ${atCloseColor} fw-bold" data-atclose-percent>
          ${atCloseIcon} ${atCloseSign}${Math.abs(atClosePercent).toFixed(2)}%
        </td>
        ${preMarketHTML}
        ${frozenHTML}
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" onclick="removeTicker('${ticker.ticker}')" title="Remover ${ticker.ticker}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Atualizar os valores após criar as linhas
  updateTickerValues(tickers);
}

// Função para calcular horários de acordo com as regras
function getMarketTimes() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  // Horário do MERCADO: 11:30 - 18:00 (atualiza de 1 em 1 min)
  // Após 18h mostra apenas a data
  const marketOpenTime = 11 * 60 + 30; // 11:30 = 690 minutos
  const marketCloseTime = 18 * 60; // 18:00 = 1080 minutos
  
  let marketTime;
  let isMarketActive = false;
  if (currentMinutes >= marketOpenTime && currentMinutes < marketCloseTime) {
    // Mercado aberto: mostra hora
    marketTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    isMarketActive = true;
  } else {
    // Mercado fechado: mostra apenas data
    marketTime = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  
  // Horário do PRE-MARKET: 19:20 - 10:59 (atualiza de 1 em 1 min)
  const preMarketOpenTime = 19 * 60 + 20; // 19:20 = 1160 minutos
  const preMarketCloseTime = 10 * 60 + 59; // 10:59 = 659 minutos
  
  let preMarketTime;
  let isPreMarketActive = false;
  // Pre-Market funciona overnight: 19:20 até meia-noite OU 00:00 até 10:59
  if (currentMinutes >= preMarketOpenTime || currentMinutes <= preMarketCloseTime) {
    // Pre-Market aberto: mostra hora
    preMarketTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    isPreMarketActive = true;
  } else {
    // Pre-Market fechado: mostra traço
    preMarketTime = '-';
  }
  
  return { marketTime, preMarketTime, isPreMarketActive, isMarketActive };
}

// Função para atualizar apenas os valores das linhas existentes
function updateTickerValues(tickers) {
  const { marketTime, preMarketTime, isPreMarketActive, isMarketActive } = getMarketTimes();
  
  tickers.forEach(ticker => {
    const row = tickersContainer.querySelector(`[data-ticker="${ticker.ticker}"]`);
    if (!row) return;
    
    // Atualizar At Close (Mercado)
    const atClosePercent = parseFloat(ticker.atClose.changePercent) || 0;
    const atClosePositive = atClosePercent >= 0;
    const atCloseColor = atClosePositive ? 'text-success' : 'text-danger';
    const atCloseIcon = atClosePositive ? '▲' : '▼';
    const atCloseSign = atClosePositive ? '+' : '';
    
    const priceEl = row.querySelector('[data-atclose-price]');
    const percentEl = row.querySelector('[data-atclose-percent]');
    const marketTimeEl = row.querySelector('[data-market-time]');
    
    if (priceEl) priceEl.textContent = ticker.atClose.price;
    if (percentEl) {
      percentEl.className = `text-center ${atCloseColor} fw-bold border-end`;
      percentEl.textContent = `${atCloseIcon} ${atCloseSign}${Math.abs(atClosePercent).toFixed(2)}%`;
    }
    if (marketTimeEl) marketTimeEl.textContent = marketTime;
    
    // Atualizar Pre-Market
    const preMarketPercentEl = row.querySelector('[data-premarket-percent]');
    const preMarketTimeEl = row.querySelector('[data-premarket-time]');
    
    if (ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
      const preMarketPercent = parseFloat(ticker.preMarket.changePercent) || 0;
      const preMarketPositive = preMarketPercent >= 0;
      const preMarketColor = preMarketPositive ? 'text-success' : 'text-danger';
      const preMarketIcon = preMarketPositive ? '▲' : '▼';
      const preMarketSign = preMarketPositive ? '+' : '';
      
      if (preMarketPercentEl) {
        preMarketPercentEl.className = `text-center ${preMarketColor} fw-bold`;
        preMarketPercentEl.textContent = `${preMarketIcon} ${preMarketSign}${Math.abs(preMarketPercent).toFixed(2)}%`;
      }
      if (preMarketTimeEl) {
        preMarketTimeEl.className = 'text-center border-end';
        preMarketTimeEl.textContent = preMarketTime;
      }
    } else {
      if (preMarketPercentEl) {
        preMarketPercentEl.className = 'text-center text-muted';
        preMarketPercentEl.textContent = '-';
      }
      if (preMarketTimeEl) {
        preMarketTimeEl.className = 'text-center border-end text-muted';
        preMarketTimeEl.textContent = preMarketTime;
      }
    }
    
    // Atualizar comparação se houver dados congelados
    const frozen = frozenData[ticker.ticker];
    if (frozen) {
      const comparisonEl = row.querySelector('[data-comparison]');
      if (comparisonEl) {
        let currentPercent;
        let comparisonText = '';
        
        // Determinar qual percentual usar para comparação baseado no período congelado
        if (frozen.period === 'premarket') {
          // Se foi congelado no PRE-MARKET, comparar com PRE-MARKET atual
          if (ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
            currentPercent = parseFloat(ticker.preMarket.changePercent) || 0;
          } else {
            currentPercent = null;
          }
        } else {
          // Se foi congelado no MERCADO, comparar com MERCADO atual
          currentPercent = atClosePercent;
        }
        
        if (currentPercent !== null) {
          const difference = currentPercent - frozen.percent;
          const isRising = difference > 0;
          const isFalling = difference < 0;
          
          let comparisonColor = 'text-muted';
          let comparisonIcon = '━';
          let comparisonSign = '';
          
          if (isRising) {
            comparisonColor = 'text-success';
            comparisonIcon = '▲';
            comparisonSign = '+';
          } else if (isFalling) {
            comparisonColor = 'text-danger';
            comparisonIcon = '▼';
            comparisonSign = '';
          }
          
          comparisonText = `<span class="${comparisonColor} fw-bold">${comparisonIcon} ${comparisonSign}${Math.abs(difference).toFixed(2)}%</span>`;
        } else {
          comparisonText = '<span class="text-muted">-</span>';
        }
        
        comparisonEl.innerHTML = comparisonText;
      }
    }
  });
}

// Função para adicionar novo ticker
addTickerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const ticker = tickerInput.value.trim().toUpperCase();
  
  if (!ticker) {
    showModalAlert('Digite um símbolo válido', 'danger');
    return;
  }
  
  if (watchlist.includes(ticker)) {
    showModalAlert('Este ativo já está sendo monitorado', 'warning');
    return;
  }
  
  // Adicionar à watchlist
  watchlist.push(ticker);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  
  // Fechar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addTickerModal'));
  modal.hide();
  
  // Limpar input
  tickerInput.value = '';
  modalAlertContainer.innerHTML = '';
  
  // Atualizar dados - recriar cards após adicionar
  showAlert(`Ativo ${ticker} adicionado com sucesso!`, 'success');
  updateCounter = 0;
  tickersContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border"></div></div>';
  fetchAllTickersData();
});

// Função para remover ticker
window.removeTicker = function(ticker) {
  if (confirm(`Deseja remover ${ticker} da lista de monitoramento?`)) {
    watchlist = watchlist.filter(t => t !== ticker);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showAlert(`Ativo ${ticker} removido`, 'info');
    // Recriar cards após remoção
    updateCounter = 0;
    tickersContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border"></div></div>';
    fetchAllTickersData();
  }
};

// Função para mostrar alertas
function showAlert(message, type) {
  alertContainer.innerHTML = '';
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.appendChild(alert);
}

// Função para mostrar alertas no modal
function showModalAlert(message, type) {
  modalAlertContainer.innerHTML = '';
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  modalAlertContainer.appendChild(alert);
}

// Função de logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Função para congelar dados
async function freezeData() {
  try {
    const response = await fetch(`${API_URL}/data/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbols: watchlist })
    });
    
    if (!response.ok) {
      showAlert('Erro ao obter dados para congelar', 'danger');
      return;
    }
    
    const data = await response.json();
    const { isPreMarketActive, isMarketActive } = getMarketTimes();
    const now = new Date();
    const freezeTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Congelar dados de cada ticker
    frozenData = {};
    const tickersArray = Object.values(data);
    tickersArray.forEach(ticker => {
      let percentToFreeze;
      let period;
      
      // Determinar qual percentual congelar baseado no período atual
      if (isPreMarketActive && ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
        percentToFreeze = parseFloat(ticker.preMarket.changePercent) || 0;
        period = 'premarket';
      } else if (isMarketActive) {
        percentToFreeze = parseFloat(ticker.atClose.changePercent) || 0;
        period = 'market';
      } else {
        // Fora dos períodos, usar o último dado disponível
        if (ticker.preMarket && ticker.preMarket.price && ticker.preMarket.isActive) {
          percentToFreeze = parseFloat(ticker.preMarket.changePercent) || 0;
          period = 'premarket';
        } else {
          percentToFreeze = parseFloat(ticker.atClose.changePercent) || 0;
          period = 'market';
        }
      }
      
      frozenData[ticker.ticker] = {
        percent: percentToFreeze,
        time: freezeTime,
        period: period
      };
    });
    
    // Salvar no localStorage
    localStorage.setItem('frozenData', JSON.stringify(frozenData));
    isFrozen = true;
    
    // Mostrar colunas congeladas
    document.querySelectorAll('.frozen-column').forEach(col => {
      col.style.display = '';
    });
    
    // Atualizar UI
    if (freezeBtn) freezeBtn.style.display = 'none';
    if (unfreezeBtn) unfreezeBtn.style.display = 'inline-block';
    
    // Recriar tabela para mostrar dados congelados
    tickersContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border"></div></div>';
    fetchAllTickersData();
    
    showAlert(`Dados congelados às ${freezeTime}`, 'info');
  } catch (error) {
    console.error('Erro ao congelar dados:', error);
    showAlert('Erro ao congelar dados', 'danger');
  }
}

// Função para descongelar dados
function unfreezeData() {
  frozenData = {};
  localStorage.removeItem('frozenData');
  isFrozen = false;
  
  // Ocultar colunas congeladas
  document.querySelectorAll('.frozen-column').forEach(col => {
    col.style.display = 'none';
  });
  
  // Atualizar UI
  if (freezeBtn) freezeBtn.style.display = 'inline-block';
  if (unfreezeBtn) unfreezeBtn.style.display = 'none';
  
  // Recriar tabela sem dados congelados
  tickersContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border"></div></div>';
  fetchAllTickersData();
  
  showAlert('Dados descongelados', 'info');
}

// Event listeners
if (refreshBtn) refreshBtn.addEventListener('click', fetchAllTickersData);
if (logoutBtn) logoutBtn.addEventListener('click', logout);
if (freezeBtn) freezeBtn.addEventListener('click', freezeData);
if (unfreezeBtn) unfreezeBtn.addEventListener('click', unfreezeData);
if (resetColumnsBtn) resetColumnsBtn.addEventListener('click', resetTableSize);

// Limpar alertas do modal ao abrir
document.getElementById('addTickerModal').addEventListener('show.bs.modal', () => {
  modalAlertContainer.innerHTML = '';
  tickerInput.value = '';
});

// Carregar dados ao iniciar
fetchAllTickersData();

// Eventos globais para arrastar tabela
document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  
  let newWidth = startWidth;
  let newHeight = startHeight;
  
  switch(resizeDirection) {
    case 'right':
      newWidth = startWidth + deltaX;
      break;
    case 'left':
      newWidth = startWidth - deltaX;
      break;
    case 'bottom':
      newHeight = startHeight + deltaY;
      break;
    case 'corner-br':
      newWidth = startWidth + deltaX;
      newHeight = startHeight + deltaY;
      break;
    case 'corner-bl':
      newWidth = startWidth - deltaX;
      newHeight = startHeight + deltaY;
      break;
  }
  
  // Aplicar limites
  const minWidth = 600;
  const maxWidth = window.innerWidth - 100;
  const minHeight = 300;
  
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    tableContainer.style.width = newWidth + 'px';
  }
  
  if (newHeight >= minHeight && resizeDirection.includes('bottom')) {
    tableContainer.style.height = newHeight + 'px';
    tableContainer.style.maxHeight = newHeight + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    resizeDirection = null;
    
    // Remover todas as classes de redimensionamento
    document.body.classList.remove('resizing', 'resizing-ns', 'resizing-nwse', 'resizing-nesw');
    
    // Salvar largura no localStorage
    localStorage.setItem('tableWidth', tableContainer.style.width);
  }
});

// Inicializar redimensionamento da tabela
initTableResize();

console.log('=== ANTES DE CONFIGURAR BOTÕES ===');
console.log('isFrozen:', isFrozen);
console.log('freezeBtn existe:', !!freezeBtn);
console.log('unfreezeBtn existe:', !!unfreezeBtn);

// Mostrar botão correto e colunas congeladas baseado no estado inicial
if (freezeBtn && unfreezeBtn) {
  console.log('Configurando visibilidade dos botões...');
  if (isFrozen) {
    console.log('Modo: CONGELADO - Mostrando unfreezeBtn');
    freezeBtn.style.display = 'none';
    unfreezeBtn.style.display = 'inline-block';
    // Mostrar colunas congeladas
    document.querySelectorAll('.frozen-column').forEach(col => {
      col.style.display = '';
    });
  } else {
    console.log('Modo: NORMAL - Mostrando freezeBtn');
    freezeBtn.style.display = 'inline-block';
    unfreezeBtn.style.display = 'none';
    // Ocultar colunas congeladas
    document.querySelectorAll('.frozen-column').forEach(col => {
      col.style.display = 'none';
    });
  }
  console.log('freezeBtn.style.display:', freezeBtn.style.display);
  console.log('unfreezeBtn.style.display:', unfreezeBtn.style.display);
} else {
  console.error('ERRO: freezeBtn ou unfreezeBtn não encontrados!');
}

console.log('=== INICIALIZAÇÃO COMPLETA ===');

// Auto-atualizar a cada 1 segundo
setInterval(fetchAllTickersData, 1000);
}); // Fim do DOMContentLoaded