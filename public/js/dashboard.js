// SEIER TRADER - Dashboard com GridStack
const API_URL = 'http://localhost:3000/api';

// Variáveis globais
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META'];
let frozenData = JSON.parse(localStorage.getItem('frozenData')) || null;
let updateInterval;
let grid;
let panels = {};

// Limpar layout corrupto na inicialização
try {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout && (savedLayout === '[]' || savedLayout === 'null')) {
        console.log('Layout corrupto detectado, limpando...');
        localStorage.removeItem('dashboardLayout');
        localStorage.removeItem('dashboardPanels');
    }
} catch (e) {
    console.error('Erro ao verificar layout:', (e && e.stack) ? e.stack : (typeof e === 'object' ? JSON.stringify(e) : String(e)));
}

// ==================== AUTENTICAÇÃO ====================
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard iniciando...');
    
    checkAuth();
    console.log('✅ Autenticação verificada');
    
    initGrid();
    console.log('✅ Grid inicializado');
    
    initEventListeners();
    console.log('✅ Event listeners configurados');
    
    loadLayout();
    console.log('✅ Layout carregado');
    
    startAutoUpdate();
    console.log('✅ Auto-update iniciado');
    
    console.log('🎉 Dashboard pronto!');
});

// ==================== GRIDSTACK ====================
function initGrid() {
    console.log('Iniciando GridStack...');
    
    if (typeof GridStack === 'undefined') {
        console.error('❌ GridStack não foi carregado!');
        showAlert('Erro ao carregar GridStack. Recarregue a página.', 'danger');
        return;
    }
    
    grid = GridStack.init({
        column: 12,
        cellHeight: 70,
        margin: 10,
        float: true,
        animate: true,
        resizable: {
            handles: 'e, se, s, sw, w'
        },
        draggable: {
            handle: '.panel-header'
        }
    });
    
    console.log('GridStack criado:', grid);

    // Salvar layout ao mover ou redimensionar
    grid.on('change', () => {
        saveLayout();
    });
}

function saveLayout() {
    const items = grid.save(false);
    localStorage.setItem('dashboardLayout', JSON.stringify(items));
    localStorage.setItem('dashboardPanels', JSON.stringify(panels));
    console.log('Layout salvo:', items, 'Panels:', panels);
}

function loadLayout() {
    const savedLayout = localStorage.getItem('dashboardLayout');
    const savedPanels = localStorage.getItem('dashboardPanels');
    
    // Restaurar metadados dos painéis
    if (savedPanels) {
        try {
            panels = JSON.parse(savedPanels);
            console.log('Metadados de painéis carregados:', panels);
        } catch (e) {
            console.error('Erro ao carregar metadados:', (e && e.stack) ? e.stack : (typeof e === 'object' ? JSON.stringify(e) : String(e)));
        }
    }
    
    if (savedLayout && savedLayout !== 'null' && savedLayout !== '[]') {
        try {
            const items = JSON.parse(savedLayout);
            console.log('Layout salvo encontrado:', items);
            
            // Recriar cada painel
            items.forEach(item => {
                const panelId = item.id || `panel-${Date.now()}`;
                const panelData = panels[panelId] || { type: 'table', title: 'Monitoramento de Ações' };
                addPanelToGrid(panelData.type, panelData.title, item.x, item.y, item.w, item.h, panelId);
            });
        } catch (error) {
            console.error('Erro ao carregar layout:', (error && error.stack) ? error.stack : (typeof error === 'object' ? JSON.stringify(error) : String(error)));
            createDefaultPanel();
        }
    } else {
        console.log('Nenhum layout salvo, criando painel padrão');
        createDefaultPanel();
    }
}

function createDefaultPanel() {
    // Layout padrão: um painel de tabela
    addPanelToGrid('table', 'Monitoramento de Ações', 0, 0, 12, 8);
}

function addPanelToGrid(type, title, x, y, width, height, customId = null) {
    const panelId = customId || `panel-${Date.now()}`;
    
    console.log(`Criando painel: ${type}, ID: ${panelId}`);
    
    const content = createPanelContent(type, panelId);
    
    const widget = `
        <div class="grid-stack-item" gs-x="${x}" gs-y="${y}" gs-w="${width}" gs-h="${height}" gs-id="${panelId}">
            <div class="grid-stack-item-content">
                <div class="panel-header">
                    <i class="bi bi-grip-vertical me-2"></i>
                    <span class="panel-title">${title}</span>
                    <button class="btn btn-sm btn-link text-light ms-auto" onclick="removePanel('${panelId}')">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="panel-content" id="${panelId}">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    grid.addWidget(widget);
    
    // Salvar metadados do painel
    panels[panelId] = { type, title };
    
    // Se for painel de tabela, inicializar
    if (type === 'table') {
        console.log('Inicializando painel de tabela:', panelId);
        setTimeout(() => initTablePanel(panelId), 100);
    }
    
    saveLayout();
}

function createPanelContent(type, panelId) {
    switch(type) {
        case 'table':
            return `
                <div class="table-panel-controls mb-3">
                    <button class="btn btn-sm btn-success" onclick="showAddTickerModal('${panelId}')">
                        <i class="bi bi-plus-circle"></i> Adicionar Ação
                    </button>
                    <button class="btn btn-sm btn-warning" id="freezeBtn-${panelId}" onclick="freezeData('${panelId}')">
                        <i class="bi bi-pause-circle"></i> Congelar
                    </button>
                    <button class="btn btn-sm btn-info d-none" id="unfreezeBtn-${panelId}" onclick="unfreezeData('${panelId}')">
                        <i class="bi bi-play-circle"></i> Descongelar
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-hover table-striped" id="stockTable-${panelId}">
                        <thead>
                            <tr>
                                <th>TICKER</th>
                                <th>MERCADO</th>
                                <th>VAR.%</th>
                                <th>PRÉ-MARKET</th>
                                <th>VAR.%</th>
                                <th class="frozen-column d-none">CONGELADO</th>
                                <th class="frozen-column d-none">COMPARAÇÃO</th>
                                <th>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody-${panelId}">
                            <tr><td colspan="8" class="text-center">Carregando...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        
        case 'chart':
            return `
                <div class="chart-panel text-center">
                    <i class="bi bi-bar-chart-line display-1 text-muted"></i>
                    <p class="text-muted mt-3">Gráficos em desenvolvimento</p>
                </div>
            `;
        
        case 'news':
            return `
                <div class="news-panel">
                    <i class="bi bi-newspaper display-1 text-muted"></i>
                    <p class="text-muted mt-3">Feed de notícias em desenvolvimento</p>
                </div>
            `;
        
        case 'custom':
            return `
                <div class="custom-panel text-center">
                    <p class="text-muted">Painel personalizado</p>
                </div>
            `;
        
        default:
            return '<p>Tipo de painel desconhecido</p>';
    }
}

function removePanel(panelId) {
    const element = document.getElementById(panelId)?.closest('.grid-stack-item');
    if (element) {
        grid.removeWidget(element);
        delete panels[panelId];
        saveLayout();
    }
}

// ==================== TABELA DE AÇÕES ====================
function initTablePanel(panelId) {
    displayTickers(panelId);
    
    // Verificar se há dados congelados
    if (frozenData) {
        showFrozenColumns(panelId);
        document.getElementById(`freezeBtn-${panelId}`).classList.add('d-none');
        document.getElementById(`unfreezeBtn-${panelId}`).classList.remove('d-none');
    }
}

async function fetchAllTickersData() {
    try {
        console.log('Buscando dados para:', watchlist);
        
        const response = await fetch(`${API_URL}/data/multiple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ symbols: watchlist })
        });

        if (!response.ok) throw new Error('Erro ao buscar dados');
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        updateAllPanels(data);
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}

function updateAllPanels(data) {
    // Atualizar todos os painéis de tabela
    Object.keys(panels).forEach(panelId => {
        if (panels[panelId].type === 'table') {
            updateTablePanel(panelId, data);
        }
    });
}

function updateTablePanel(panelId, tickersData) {
    const tbody = document.getElementById(`tableBody-${panelId}`);
    if (!tbody) {
        console.warn('Tbody não encontrado para panelId:', panelId);
        return;
    }

    const { isPRE_MARKET, currentTime } = getMarketTimes();
    console.log(`Atualizando tabela. Período: ${isPRE_MARKET ? 'PRÉ-MARKET' : 'MERCADO'}, Hora: ${currentTime}`);
    
    tbody.innerHTML = watchlist.map(symbol => {
        const data = tickersData[symbol];
        
        if (!data) {
            console.warn(`Sem dados para ${symbol}`);
            return `
                <tr>
                    <td>${symbol}</td>
                    <td colspan="7" class="text-center text-muted">Dados não disponíveis</td>
                </tr>
            `;
        }

        // Valores de mercado e pré-market
        const marketPrice = parseFloat(data.atClose?.regularMarketPrice) || 0;
        const marketChange = parseFloat(data.atClose?.regularMarketChangePercent) || 0;
        const preMarketPrice = parseFloat(data.preMarket?.preMarketPrice) || 0;
        const preMarketChange = parseFloat(data.preMarket?.preMarketChangePercent) || 0;
        
        console.log(`${symbol}: Mercado=${marketPrice} (${marketChange}%), Pré=${preMarketPrice} (${preMarketChange}%)`);

        // Lógica de congelamento
        let frozenCell = '';
        let comparisonCell = '';
        
        if (frozenData && frozenData[symbol]) {
            const frozen = frozenData[symbol];
            const frozenValue = frozen.value;
            const frozenTime = frozen.time;
            const wasPRE_MARKET = frozen.isPRE_MARKET;
            
            // Valor atual baseado no período
            const currentValue = isPRE_MARKET ? preMarketChange : marketChange;
            const difference = currentValue - frozenValue;
            const icon = difference >= 0 ? '▲' : '▼';
            const colorClass = difference >= 0 ? 'text-success' : 'text-danger';
            
            frozenCell = `
                <td class="frozen-column">
                    <div class="fw-bold">${frozenValue.toFixed(2)}%</div>
                    <div class="small text-muted">${wasPRE_MARKET ? 'PRÉ' : 'MERCADO'}</div>
                    <div class="small text-muted">${frozenTime}</div>
                </td>
            `;
            
            comparisonCell = `
                <td class="frozen-column ${colorClass}">
                    <div class="fw-bold">${icon} ${Math.abs(difference).toFixed(2)}%</div>
                    <div class="small">${difference >= 0 ? 'Subiu' : 'Caiu'}</div>
                </td>
            `;
        } else {
            // Colunas vazias mas presentes (ocultas por CSS)
            frozenCell = '<td class="frozen-column d-none"></td>';
            comparisonCell = '<td class="frozen-column d-none"></td>';
        }

        return `
            <tr>
                <td class="fw-bold text-gold">${symbol}</td>
                <td>$${marketPrice.toFixed(2)}</td>
                <td class="${marketChange >= 0 ? 'text-success' : 'text-danger'}">
                    ${marketChange >= 0 ? '+' : ''}${marketChange.toFixed(2)}%
                </td>
                <td>$${preMarketPrice > 0 ? preMarketPrice.toFixed(2) : '--'}</td>
                <td class="${preMarketChange >= 0 ? 'text-success' : 'text-danger'}">
                    ${preMarketPrice > 0 ? `${preMarketChange >= 0 ? '+' : ''}${preMarketChange.toFixed(2)}%` : '--'}
                </td>
                ${frozenCell}
                ${comparisonCell}
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeTicker('${symbol}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function displayTickers(panelId) {
    fetchAllTickersData();
}

// ==================== GERENCIAMENTO DE TICKERS ====================
function showAddTickerModal(panelId) {
    const modal = new bootstrap.Modal(document.getElementById('addTickerModal'));
    
    // Armazenar panelId no modal para uso posterior
    document.getElementById('addTickerForm').dataset.panelId = panelId;
    
    modal.show();
}

function addTicker(event, panelId) {
    event.preventDefault();
    
    const tickerInput = document.getElementById('tickerInput');
    const newTicker = tickerInput.value.trim().toUpperCase();
    
    if (!newTicker) {
        showAlert('Por favor, insira um ticker válido', 'warning', 'modal-alert-container');
        return;
    }
    
    if (watchlist.includes(newTicker)) {
        showAlert('Este ticker já está na sua lista', 'info', 'modal-alert-container');
        return;
    }
    
    watchlist.push(newTicker);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    // Atualizar todos os painéis
    fetchAllTickersData();
    
    tickerInput.value = '';
    showAlert(`${newTicker} adicionado com sucesso!`, 'success', 'modal-alert-container');
    
    // Fechar modal após 1 segundo
    setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('addTickerModal')).hide();
    }, 1000);
}

function removeTicker(symbol) {
    if (!confirm(`Deseja remover ${symbol} da sua lista?`)) return;
    
    watchlist = watchlist.filter(ticker => ticker !== symbol);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    // Remover dados congelados deste ticker
    if (frozenData && frozenData[symbol]) {
        delete frozenData[symbol];
        if (Object.keys(frozenData).length === 0) {
            frozenData = null;
            localStorage.removeItem('frozenData');
        } else {
            localStorage.setItem('frozenData', JSON.stringify(frozenData));
        }
    }
    
    fetchAllTickersData();
    showAlert(`${symbol} removido com sucesso!`, 'success');
}

// ==================== CONGELAMENTO ====================
function freezeData(panelId) {
    const { isPRE_MARKET, currentTime } = getMarketTimes();
    const newFrozenData = {};
    
    // Buscar dados atuais de cada ticker na tabela
    const tbody = document.getElementById(`tableBody-${panelId}`);
    if (!tbody) {
        console.error('Tbody não encontrado para panelId:', panelId);
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const symbol = cells[0]?.textContent.trim();
            
            let value;
            if (isPRE_MARKET) {
                // Pegar VAR.% do pré-market (coluna 4, índice 4)
                const preMarketVarText = cells[4]?.textContent.trim();
                value = parseFloat(preMarketVarText.replace('%', '').replace('+', '').replace('--', '0')) || 0;
            } else {
                // Pegar VAR.% do mercado (coluna 2, índice 2)
                const marketVarText = cells[2]?.textContent.trim();
                value = parseFloat(marketVarText.replace('%', '').replace('+', '')) || 0;
            }
            
            newFrozenData[symbol] = {
                value,
                time: currentTime,
                isPRE_MARKET
            };
            
            console.log(`Congelando ${symbol}: ${value}% (${isPRE_MARKET ? 'PRÉ-MARKET' : 'MERCADO'})`);
        }
    });
    
    frozenData = newFrozenData;
    localStorage.setItem('frozenData', JSON.stringify(frozenData));
    
    // Mostrar colunas congeladas em todos os painéis
    Object.keys(panels).forEach(pid => {
        if (panels[pid].type === 'table') {
            showFrozenColumns(pid);
            document.getElementById(`freezeBtn-${pid}`)?.classList.add('d-none');
            document.getElementById(`unfreezeBtn-${pid}`)?.classList.remove('d-none');
        }
    });
    
    fetchAllTickersData();
    showAlert(`Dados congelados às ${currentTime} (${isPRE_MARKET ? 'PRÉ-MARKET' : 'MERCADO'})`, 'success');
}

function unfreezeData(panelId) {
    frozenData = null;
    localStorage.removeItem('frozenData');
    
    // Ocultar colunas congeladas em todos os painéis
    Object.keys(panels).forEach(pid => {
        if (panels[pid].type === 'table') {
            hideFrozenColumns(pid);
            document.getElementById(`freezeBtn-${pid}`).classList.remove('d-none');
            document.getElementById(`unfreezeBtn-${pid}`).classList.add('d-none');
        }
    });
    
    fetchAllTickersData();
    showAlert('Dados descongelados', 'info');
}

function showFrozenColumns(panelId) {
    const table = document.getElementById(`stockTable-${panelId}`);
    if (table) {
        table.querySelectorAll('.frozen-column').forEach(col => {
            col.classList.remove('d-none');
        });
    }
}

function hideFrozenColumns(panelId) {
    const table = document.getElementById(`stockTable-${panelId}`);
    if (table) {
        table.querySelectorAll('.frozen-column').forEach(col => {
            col.classList.add('d-none');
        });
    }
}

// ==================== HORÁRIOS E PERÍODOS ====================
function getMarketTimes() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // PRE-MARKET: 19:20 até 10:59 (overnight)
    // MERCADO: 11:30 até 18:00
    let isPRE_MARKET = false;
    
    if (hours >= 19 && minutes >= 20) {
        isPRE_MARKET = true; // Depois das 19:20
    } else if (hours < 11 || (hours === 10 && minutes <= 59)) {
        isPRE_MARKET = true; // Antes das 11:00
    } else if (hours === 11 && minutes < 30) {
        isPRE_MARKET = true; // Entre 11:00 e 11:29
    }
    
    return { isPRE_MARKET, currentTime };
}

// ==================== AUTO-UPDATE ====================
function startAutoUpdate() {
    fetchAllTickersData(); // Primeira chamada imediata
    
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
        fetchAllTickersData();
    }, 1000); // Atualizar a cada 1 segundo
}

function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = now.toLocaleTimeString('pt-BR');
    }
}

// ==================== EVENTOS ====================
function initEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Refresh manual
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        fetchAllTickersData();
        showAlert('Dados atualizados', 'success');
    });
    
    // Resetar layout
    document.getElementById('resetLayoutBtn')?.addEventListener('click', () => {
        if (confirm('Deseja resetar o layout do dashboard?')) {
            localStorage.removeItem('dashboardLayout');
            location.reload();
        }
    });
    
    // Adicionar novo painel
    document.getElementById('addPanelBtn')?.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('addPanelModal'));
        modal.show();
    });
    
    // Form adicionar ticker
    document.getElementById('addTickerForm')?.addEventListener('submit', (e) => {
        const panelId = e.target.dataset.panelId;
        addTicker(e, panelId);
    });
    
    // Opções de novo painel
    document.querySelectorAll('.panel-option').forEach(option => {
        option.addEventListener('click', () => {
            const type = option.dataset.type;
            const title = option.dataset.title;
            
            addPanelToGrid(type, title, 0, 0, 6, 6);
            
            bootstrap.Modal.getInstance(document.getElementById('addPanelModal')).hide();
            showAlert(`Painel "${title}" adicionado!`, 'success');
        });
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('watchlist');
    localStorage.removeItem('frozenData');
    localStorage.removeItem('dashboardLayout');
    window.location.href = 'login.html';
}

// ==================== UTILITÁRIOS ====================
function showAlert(message, type = 'info', containerId = 'alert-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}
