// Top S&P 500 stocks
const stocksData = [
    {symbol: 'AAPL', name: 'Apple', sector: 'Technology', weight: 50},
    {symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', weight: 48},
    {symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', weight: 35},
    {symbol: 'AMZN', name: 'Amazon', sector: 'Consumer', weight: 32},
    {symbol: 'NVDA', name: 'Nvidia', sector: 'Technology', weight: 45},
    {symbol: 'META', name: 'Meta', sector: 'Technology', weight: 28},
    {symbol: 'TSLA', name: 'Tesla', sector: 'Consumer', weight: 30},
    {symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', weight: 22},
    {symbol: 'ORCL', name: 'Oracle', sector: 'Technology', weight: 15},
    {symbol: 'CSCO', name: 'Cisco', sector: 'Technology', weight: 14},
    {symbol: 'NFLX', name: 'Netflix', sector: 'Technology', weight: 13},
    {symbol: 'ADBE', name: 'Adobe', sector: 'Technology', weight: 13},
    {symbol: 'CRM', name: 'Salesforce', sector: 'Technology', weight: 15},
    {symbol: 'AMD', name: 'AMD', sector: 'Technology', weight: 17},
    {symbol: 'INTC', name: 'Intel', sector: 'Technology', weight: 12},
    {symbol: 'IBM', name: 'IBM', sector: 'Technology', weight: 11},
    {symbol: 'QCOM', name: 'Qualcomm', sector: 'Technology', weight: 12},
    {symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology', weight: 11},
    {symbol: 'ACN', name: 'Accenture', sector: 'Technology', weight: 14},
    {symbol: 'JPM', name: 'JPMorgan', sector: 'Financial', weight: 24},
    {symbol: 'BAC', name: 'Bank of America', sector: 'Financial', weight: 17},
    {symbol: 'WFC', name: 'Wells Fargo', sector: 'Financial', weight: 13},
    {symbol: 'GS', name: 'Goldman Sachs', sector: 'Financial', weight: 12},
    {symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial', weight: 12},
    {symbol: 'V', name: 'Visa', sector: 'Financial', weight: 23},
    {symbol: 'MA', name: 'Mastercard', sector: 'Financial', weight: 20},
    {symbol: 'BLK', name: 'BlackRock', sector: 'Financial', weight: 15},
    {symbol: 'SCHW', name: 'Schwab', sector: 'Financial', weight: 13},
    {symbol: 'AXP', name: 'American Express', sector: 'Financial', weight: 14},
    {symbol: 'C', name: 'Citigroup', sector: 'Financial', weight: 12},
    {symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', weight: 22},
    {symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', weight: 25},
    {symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', weight: 24},
    {symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare', weight: 18},
    {symbol: 'ABBV', name: 'AbbVie', sector: 'Healthcare', weight: 17},
    {symbol: 'TMO', name: 'Thermo Fisher', sector: 'Healthcare', weight: 15},
    {symbol: 'ABT', name: 'Abbott', sector: 'Healthcare', weight: 14},
    {symbol: 'MRK', name: 'Merck', sector: 'Healthcare', weight: 18},
    {symbol: 'DHR', name: 'Danaher', sector: 'Healthcare', weight: 15},
    {symbol: 'BMY', name: 'Bristol Myers', sector: 'Healthcare', weight: 10},
    {symbol: 'WMT', name: 'Walmart', sector: 'Consumer', weight: 21},
    {symbol: 'HD', name: 'Home Depot', sector: 'Consumer', weight: 20},
    {symbol: 'PG', name: 'P&G', sector: 'Consumer', weight: 21},
    {symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer', weight: 16},
    {symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer', weight: 18},
    {symbol: 'COST', name: 'Costco', sector: 'Consumer', weight: 19},
    {symbol: 'MCD', name: "McDonald's", sector: 'Consumer', weight: 14},
    {symbol: 'NKE', name: 'Nike', sector: 'Consumer', weight: 11},
    {symbol: 'DIS', name: 'Disney', sector: 'Consumer', weight: 16},
    {symbol: 'LOW', name: "Lowe's", sector: 'Consumer', weight: 15},
    {symbol: 'TGT', name: 'Target', sector: 'Consumer', weight: 12},
    {symbol: 'SBUX', name: 'Starbucks', sector: 'Consumer', weight: 11},
    {symbol: 'XOM', name: 'Exxon', sector: 'Energy', weight: 22},
    {symbol: 'CVX', name: 'Chevron', sector: 'Energy', weight: 19},
    {symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', weight: 14},
    {symbol: 'SLB', name: 'Schlumberger', sector: 'Energy', weight: 11},
    {symbol: 'EOG', name: 'EOG Resources', sector: 'Energy', weight: 12},
    {symbol: 'BA', name: 'Boeing', sector: 'Industrial', weight: 12},
    {symbol: 'CAT', name: 'Caterpillar', sector: 'Industrial', weight: 13},
    {symbol: 'GE', name: 'GE', sector: 'Industrial', weight: 11},
    {symbol: 'HON', name: 'Honeywell', sector: 'Industrial', weight: 12},
    {symbol: 'UPS', name: 'UPS', sector: 'Industrial', weight: 11},
    {symbol: 'LMT', name: 'Lockheed Martin', sector: 'Industrial', weight: 13},
    {symbol: 'RTX', name: 'Raytheon', sector: 'Industrial', weight: 12},
    {symbol: 'DE', name: 'Deere', sector: 'Industrial', weight: 13},
    {symbol: 'UNP', name: 'Union Pacific', sector: 'Industrial', weight: 14},
    {symbol: 'NEE', name: 'NextEra', sector: 'Utilities', weight: 14},
    {symbol: 'DUK', name: 'Duke Energy', sector: 'Utilities', weight: 10},
    {symbol: 'SO', name: 'Southern Co', sector: 'Utilities', weight: 10},
    {symbol: 'D', name: 'Dominion', sector: 'Utilities', weight: 9},
    {symbol: 'AEP', name: 'AEP', sector: 'Utilities', weight: 10},
    {symbol: 'T', name: 'AT&T', sector: 'Telecom', weight: 11},
    {symbol: 'VZ', name: 'Verizon', sector: 'Telecom', weight: 11},
    {symbol: 'TMUS', name: 'T-Mobile', sector: 'Telecom', weight: 12},
    {symbol: 'CHTR', name: 'Charter', sector: 'Telecom', weight: 10}
];

// Global variables
let stocksCache = {};
let updateInterval;
let countdownInterval;
let countdownSeconds = 15;

// Auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Color calculation
function getColor(changePercent) {
    if (changePercent === null || changePercent === undefined) return '#2a2a2a';
    if (changePercent >= 3) return '#16a34a';
    if (changePercent >= 1) return '#22c55e';
    if (changePercent >= 0.5) return '#4ade80';
    if (changePercent >= -0.5) return '#6b7280';
    if (changePercent >= -1) return '#ef4444';
    if (changePercent >= -3) return '#dc2626';
    return '#b91c1c';
}

// Squarified treemap algorithm - proper implementation
function squarify(data, x, y, width, height) {
    if (data.length === 0) return [];
    
    // Sort by absolute value descending - larger changes get bigger tiles FIRST
    const sorted = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    const total = sorted.reduce((sum, item) => sum + Math.abs(item.value), 0);
    if (total === 0) return [];
    
    const result = [];
    
    function layoutRow(row, x, y, width, height) {
        const rowTotal = row.reduce((sum, item) => sum + Math.abs(item.value), 0);
        const isHorizontal = width >= height;
        
        if (isHorizontal) {
            // Layout horizontally (left to right)
            const rowHeight = height;
            let currentX = x;
            
            row.forEach(item => {
                const itemWidth = (Math.abs(item.value) / rowTotal) * width;
                result.push({
                    ...item,
                    x: currentX,
                    y: y,
                    width: itemWidth,
                    height: rowHeight
                });
                currentX += itemWidth;
            });
        } else {
            // Layout vertically (top to bottom)
            const rowWidth = width;
            let currentY = y;
            
            row.forEach(item => {
                const itemHeight = (Math.abs(item.value) / rowTotal) * height;
                result.push({
                    ...item,
                    x: x,
                    y: currentY,
                    width: rowWidth,
                    height: itemHeight
                });
                currentY += itemHeight;
            });
        }
    }
    
    function worst(row, sideLength) {
        if (row.length === 0) return Infinity;
        
        const rowSum = row.reduce((sum, item) => sum + Math.abs(item.value), 0);
        const rowMin = Math.min(...row.map(item => Math.abs(item.value)));
        const rowMax = Math.max(...row.map(item => Math.abs(item.value)));
        
        const side2 = sideLength * sideLength;
        const rowSum2 = rowSum * rowSum;
        
        return Math.max(
            (side2 * rowMax) / rowSum2,
            rowSum2 / (side2 * rowMin)
        );
    }
    
    let remaining = [...sorted];
    let currentX = x;
    let currentY = y;
    let remainingWidth = width;
    let remainingHeight = height;
    
    while (remaining.length > 0) {
        const isHorizontal = remainingWidth >= remainingHeight;
        const sideLength = isHorizontal ? remainingHeight : remainingWidth;
        
        let row = [];
        let bestWorst = Infinity;
        
        // Build optimal row
        for (let i = 0; i < remaining.length; i++) {
            const testRow = [...row, remaining[i]];
            const testWorst = worst(testRow, sideLength);
            
            if (testWorst <= bestWorst) {
                row = testRow;
                bestWorst = testWorst;
            } else {
                break;
            }
        }
        
        if (row.length === 0) row = [remaining[0]];
        
        // Layout this row
        const rowTotal = row.reduce((sum, item) => sum + Math.abs(item.value), 0);
        const rowSize = (rowTotal / total) * (isHorizontal ? remainingWidth : remainingHeight);
        
        if (isHorizontal) {
            layoutRow(row, currentX, currentY, rowSize, remainingHeight);
            currentX += rowSize;
            remainingWidth -= rowSize;
        } else {
            layoutRow(row, currentX, currentY, remainingWidth, rowSize);
            currentY += rowSize;
            remainingHeight -= rowSize;
        }
        
        remaining = remaining.slice(row.length);
    }
    
    return result;
}

// Fetch data
async function fetchStockData() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const symbols = stocksData.map(s => s.symbol).join(',');
        const response = await fetch(`/api/data?symbols=${symbols}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const dataArray = await response.json();
        const data = {};
        dataArray.forEach(item => {
            if (item && item.ticker) data[item.ticker] = item;
        });

        return data;
    } catch (error) {
        console.error('Erro ao buscar dados:', (error && error.stack) ? error.stack : (typeof error === 'object' ? JSON.stringify(error) : String(error)));
        return null;
    }
}

// Render treemap
function renderTreemap(data) {
    const container = document.getElementById('heatmap');
    const width = container.clientWidth;
    const height = container.clientHeight;
    container.innerHTML = '';
    
    console.log('Renderizando mapa com dados:', data);

    // Group by sector
    const sectors = {};
    stocksData.forEach(stock => {
        if (!sectors[stock.sector]) sectors[stock.sector] = [];
        sectors[stock.sector].push(stock);
    });

    // Prepare sector data with total absolute changes
    const sectorData = Object.keys(sectors).map(sector => {
        const stocks = sectors[sector];
        const totalAbsChange = stocks.reduce((sum, s) => {
            const stockData = data[s.symbol];
            const change = Math.abs(stockData?.regularMarketChangePercent || 0);
            return sum + change;
        }, 0);
        return {sector, stocks, value: totalAbsChange};
    });

    // Layout sectors using treemap
    const sectorLayouts = squarify(sectorData, 0, 0, width, height);

    // Render each sector
    sectorLayouts.forEach(sectorLayout => {
        // Create sector container
        const sectorDiv = document.createElement('div');
        sectorDiv.className = 'sector-group';
        sectorDiv.style.position = 'absolute';
        sectorDiv.style.left = `${sectorLayout.x}px`;
        sectorDiv.style.top = `${sectorLayout.y}px`;
        sectorDiv.style.width = `${sectorLayout.width}px`;
        sectorDiv.style.height = `${sectorLayout.height}px`;
        sectorDiv.style.border = '2px solid rgba(0,0,0,0.8)';
        sectorDiv.style.overflow = 'hidden';

        // Sector label
        const label = document.createElement('div');
        label.className = 'sector-label';
        label.textContent = sectorLayout.sector;
        label.style.position = 'absolute';
        label.style.top = '0';
        label.style.left = '0';
        label.style.right = '0';
        label.style.height = '28px';
        label.style.padding = '4px 8px';
        label.style.fontSize = '0.85rem';
        label.style.fontWeight = '700';
        label.style.color = 'rgba(255,255,255,0.9)';
        label.style.background = 'rgba(0,0,0,0.5)';
        label.style.zIndex = '10';
        sectorDiv.appendChild(label);

        // Prepare stocks data for this sector
        const stocksWithData = sectorLayout.stocks.map(stock => {
            const stockData = data[stock.symbol];
            const change = stockData?.regularMarketChangePercent || 0;
            return {
                ...stock,
                value: Math.abs(change) || 0.1, // Use small value if no change
                change: change,
                price: stockData?.regularMarketPrice || 0,
                hasData: !!stockData && stockData.regularMarketPrice
            };
        }); // Don't filter - show all stocks

        // Sort by absolute change descending (biggest first)
        stocksWithData.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        // Layout stocks with proportional widths based on percentage
        const labelHeight = 28;
        const padding = 3;
        const availableWidth = sectorLayout.width - padding * 2;
        const availableHeight = sectorLayout.height - labelHeight - padding * 2;
        
        const totalChange = stocksWithData.reduce((sum, s) => sum + Math.abs(s.change), 0);
        
        // Calculate optimal tile height to fit all stocks
        const estimatedRows = Math.ceil(stocksWithData.length / 4); // Estimate ~4 per row
        const optimalTileHeight = Math.max(40, Math.min(60, availableHeight / estimatedRows - 2));
        
        let currentX = padding;
        let currentY = labelHeight + padding;
        let rowHeight = optimalTileHeight;
        const minTileWidth = 50; // Minimum width for readability
        
        stocksWithData.forEach((stock, index) => {
            // Calculate proportional width based on percentage
            const proportionalWidth = (Math.abs(stock.change) / totalChange) * availableWidth * stocksWithData.length * 0.5;
            const tileWidth = Math.max(minTileWidth, Math.min(proportionalWidth, availableWidth / 2));
            const tileHeight = optimalTileHeight;
            
            // Check if we need to wrap to next row
            if (currentX + tileWidth > availableWidth + padding) {
                currentX = padding;
                currentY += rowHeight + 2;
            }
            
            // Skip if it would overflow (but this should rarely happen now)
            if (currentY + tileHeight > labelHeight + padding + availableHeight) {
                console.warn(`Skipping ${stock.symbol} - overflow`);
                return;
            }
            
            const tile = document.createElement('div');
            tile.className = 'stock-tile';
            tile.style.position = 'absolute';
            tile.style.left = `${currentX}px`;
            tile.style.top = `${currentY}px`;
            tile.style.width = `${tileWidth}px`;
            tile.style.height = `${tileHeight}px`;
            
            // Size class based on width
            if (tileWidth > 100) tile.classList.add('large');
            else if (tileWidth > 75) tile.classList.add('medium');
            else if (tileWidth > 60) tile.classList.add('small');
            else tile.classList.add('tiny');

            if (stock.hasData) {
                const change = stock.change;
                const price = stock.price;
                tile.style.backgroundColor = getColor(change);
                
                console.log(`${stock.symbol}: ${change.toFixed(2)}% - Preço: $${price.toFixed(2)}`);
                
                tile.innerHTML = `
                    <div class="tile-symbol">${stock.symbol}</div>
                    <div class="tile-change">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
                `;
                
                tile.title = `${stock.name}\nSetor: ${sectorLayout.sector}\nPreço: $${price.toFixed(2)}\nVariação: ${change.toFixed(2)}%`;
            } else {
                tile.style.backgroundColor = '#2a2a2a';
                console.log(`${stock.symbol}: SEM DADOS`);
                tile.innerHTML = `
                    <div class="tile-symbol">${stock.symbol}</div>
                    <div class="tile-change">--</div>
                `;
                tile.title = `${stock.name}\nSetor: ${sectorLayout.sector}\nCarregando...`;
            }
            
            sectorDiv.appendChild(tile);
            currentX += tileWidth + 2; // Add gap between tiles
        });

        container.appendChild(sectorDiv);
    });

    updateLastUpdateTime();
}

// Update time
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('pt-BR');
}

// Countdown
function startCountdown() {
    countdownSeconds = 15;
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        countdownSeconds--;
        document.getElementById('countdown').textContent = `${countdownSeconds}s`;
        if (countdownSeconds <= 0) countdownSeconds = 15;
    }, 1000);
}

// Update
async function updateHeatmap() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Atualizando...';
    statusEl.className = 'status loading';
    
    const data = await fetchStockData();
    
    if (data) {
        stocksCache = data;
        renderTreemap(data);
        statusEl.textContent = 'Conectado';
        statusEl.className = 'status';
        startCountdown();
    } else {
        statusEl.textContent = 'Erro';
        statusEl.className = 'status error';
    }
}

// Init
async function init() {
    await updateHeatmap();
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateHeatmap, 15000);
    
    // Resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (Object.keys(stocksCache).length > 0) {
                renderTreemap(stocksCache);
            }
        }, 250);
    });
}

document.addEventListener('DOMContentLoaded', init);
