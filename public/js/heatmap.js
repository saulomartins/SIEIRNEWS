// S&P 500 Stocks Data with market cap weights (simplified)
const stocksData = [
    {symbol: 'AAPL', name: 'Apple Inc.', sector: 'Information Technology', weight: 100},
    {symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Information Technology', weight: 95},
    {symbol: 'GOOGL', name: 'Alphabet Inc Class A', sector: 'Information Technology', weight: 65},
    {symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Discretionary', weight: 60},
    {symbol: 'NVDA', name: 'Nvidia Corporation', sector: 'Information Technology', weight: 90},
    {symbol: 'META', name: 'Meta Platforms', sector: 'Information Technology', weight: 45},
    {symbol: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Discretionary', weight: 50},
    {symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', weight: 42},
    {symbol: 'GOOG', name: 'Alphabet Inc Class C', sector: 'Information Technology', weight: 62},
    {symbol: 'UNH', name: 'United Health Group Inc.', sector: 'Health Care', weight: 40},
    {symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care', weight: 35},
    {symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', weight: 38},
    {symbol: 'V', name: 'Visa Inc.', sector: 'Information Technology', weight: 36},
    {symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', weight: 34},
    {symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', weight: 33},
    {symbol: 'MA', name: 'Mastercard Inc.', sector: 'Information Technology', weight: 32},
    {symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary', weight: 31},
    {symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', weight: 30},
    {symbol: 'AVGO', name: 'Broadcom', sector: 'Information Technology', weight: 35},
    {symbol: 'LLY', name: 'Lilly (Eli) & Co.', sector: 'Health Care', weight: 37},
    {symbol: 'MRK', name: 'Merck & Co.', sector: 'Health Care', weight: 28},
    {symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', weight: 27},
    {symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Health Care', weight: 26},
    {symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Consumer Staples', weight: 29},
    {symbol: 'KO', name: 'Coca-Cola Company (The)', sector: 'Consumer Staples', weight: 25},
    {symbol: 'WMT', name: 'Wal-Mart Stores', sector: 'Consumer Staples', weight: 34},
    {symbol: 'CRM', name: 'Salesforce.com', sector: 'Information Technology', weight: 24},
    {symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Information Technology', weight: 23},
    {symbol: 'MCD', name: 'McDonald\'s Corp.', sector: 'Consumer Discretionary', weight: 22},
    {symbol: 'CSCO', name: 'Cisco Systems', sector: 'Information Technology', weight: 21},

// Get symbols list
const symbols = stocksData.map(s => s.symbol);

// Global variables
let stocksCache = {};
let updateInterval;
let countdownInterval;
let countdownSeconds = 15;

// Auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Color calculation based on percentage change
function getColor(changePercent) {
    if (changePercent >= 3) return '#00ff00';
    if (changePercent >= 1) return '#66ff66';
    if (changePercent >= -1) return '#cccccc';
    if (changePercent >= -3) return '#ff6666';
    return '#ff0000';
}

// Fetch data from backend
async function fetchStockData() {
    const token = getAuthToken();
    if (!token) {
        console.error('Token não encontrado. Redirecionando para login...');
        window.location.href = 'login.html';
        return null;
    }

    try {
        const symbolsStr = symbols.join(',');
        const response = await fetch(`/api/data?symbols=${symbolsStr}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dataArray = await response.json();
        
        // Convert array to object indexed by ticker
        const data = {};
        dataArray.forEach(item => {
            if (item && item.ticker) {
                data[item.ticker] = item;
            }
        });

        return data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return null;
    }
}

// Group stocks by sector
function groupBySector(stocksArray) {
    const sectors = {};
    stocksArray.forEach(stock => {
        if (!sectors[stock.sector]) {
            sectors[stock.sector] = [];
        }
        sectors[stock.sector].push(stock);
    });
    return sectors;
}

// Create heatmap cells organized by sector
function renderHeatmap(data) {
    const heatmapContainer = document.getElementById('heatmap');
    heatmapContainer.innerHTML = '';

    let positiveCount = 0;
    let negativeCount = 0;
    let loadedCount = 0;

    // Group stocks by sector
    const sectorGroups = groupBySector(stocksData);
    
    // Sort sectors alphabetically
    const sortedSectors = Object.keys(sectorGroups).sort();

    sortedSectors.forEach(sectorName => {
        const stocks = sectorGroups[sectorName];
        
        // Create sector section
        const sectorSection = document.createElement('div');
        sectorSection.className = 'sector-section';
        
        // Count sector statistics
        let sectorPositive = 0;
        let sectorNegative = 0;
        let sectorLoaded = 0;
        
        // Create sector header
        const sectorHeader = document.createElement('div');
        sectorHeader.className = 'sector-header';
        
        // Create sector grid
        const sectorGrid = document.createElement('div');
        sectorGrid.className = 'sector-grid';
        
        // Add stocks to grid
        stocks.forEach(stock => {
            const stockData = data[stock.symbol];
            const cell = document.createElement('div');
            cell.className = 'stock-cell';
            
            if (stockData && stockData.regularMarketPrice) {
                const change = stockData.regularMarketChangePercent || 0;
                const price = stockData.regularMarketPrice || 0;
                const color = getColor(change);
                
                cell.style.backgroundColor = color;
                cell.innerHTML = `
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-change">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
                    <div class="stock-price">$${price.toFixed(2)}</div>
                    <div class="stock-name">${stock.name}</div>
                `;
                
                cell.title = `${stock.name}\nSetor: ${stock.sector}\nPreço: $${price.toFixed(2)}\nVariação: ${change.toFixed(2)}%`;
                
                if (change > 0) {
                    positiveCount++;
                    sectorPositive++;
                } else if (change < 0) {
                    negativeCount++;
                    sectorNegative++;
                }
                
                loadedCount++;
                sectorLoaded++;
            } else {
                cell.classList.add('loading-cell');
                cell.innerHTML = `
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-change">--</div>
                `;
                cell.title = stock.name;
            }
            
            sectorGrid.appendChild(cell);
        });
        
        // Update sector header with stats
        sectorHeader.innerHTML = `
            <h2>${sectorName}</h2>
            <div class="sector-stats">
                <span style="color: #90EE90;">▲ ${sectorPositive}</span> | 
                <span style="color: #FFB6C1;">▼ ${sectorNegative}</span> | 
                <span>Total: ${stocks.length}</span>
            </div>
        `;
        
        sectorSection.appendChild(sectorHeader);
        sectorSection.appendChild(sectorGrid);
        heatmapContainer.appendChild(sectorSection);
    });

    // Update statistics
    document.getElementById('totalStocks').textContent = stocksData.length;
    document.getElementById('positiveStocks').textContent = positiveCount;
    document.getElementById('negativeStocks').textContent = negativeCount;
    
    // Update status
    const statusEl = document.getElementById('status');
    statusEl.textContent = `✓ ${loadedCount}/${stocksData.length} carregados`;
    statusEl.className = 'status';
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR');
    document.getElementById('lastUpdate').textContent = timeStr;
}

// Countdown timer
function startCountdown() {
    countdownSeconds = 15;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        countdownSeconds--;
        document.getElementById('countdown').textContent = `${countdownSeconds}s`;
        
        if (countdownSeconds <= 0) {
            countdownSeconds = 15;
        }
    }, 1000);
}

// Main update function
async function updateHeatmap() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Atualizando...';
    statusEl.className = 'status loading';
    
    const data = await fetchStockData();
    
    if (data) {
        stocksCache = data;
        renderHeatmap(data);
        updateLastUpdateTime();
        startCountdown();
    } else {
        statusEl.textContent = '✗ Erro ao carregar';
        statusEl.className = 'status error';
    }
}

// Initialize
async function init() {
    // Initial load
    await updateHeatmap();
    
    // Set up auto-update every 15 seconds
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(updateHeatmap, 15000);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);
