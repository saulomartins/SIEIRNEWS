// TESTE SIMPLES - Dashboard GridStack
console.log('=== DASHBOARD INICIANDO ===');

const API_URL = 'http://localhost:3000/api';
let watchlist = ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META'];
let grid;

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
    console.log('Sem token, redirecionando...');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    
    // Verificar se GridStack está disponível
    if (typeof GridStack === 'undefined') {
        console.error('❌ GridStack NÃO carregado!');
        alert('Erro: GridStack não foi carregado. Verifique a conexão.');
        return;
    }
    
    console.log('✅ GridStack disponível');
    
    // Inicializar grid
    grid = GridStack.init({
        column: 12,
        cellHeight: 70
    });
    
    console.log('✅ Grid inicializado:', grid);
    
    // Criar painel simples de teste
    criarPainelTeste();
    
    // Iniciar atualização
    buscarDados();
    setInterval(buscarDados, 2000); // A cada 2 segundos
});

function criarPainelTeste() {
    console.log('Criando painel de teste...');
    
    const html = `
        <div class="grid-stack-item" gs-w="12" gs-h="8" gs-x="0" gs-y="0">
            <div class="grid-stack-item-content" style="background: #1a1a2e; border: 2px solid #d4af37; border-radius: 10px; padding: 20px;">
                <h3 style="color: #d4af37; margin-bottom: 20px;">
                    <i class="bi bi-table"></i> Monitoramento de Ações
                </h3>
                <div id="stockContainer" style="color: white;">
                    <p>Carregando dados...</p>
                </div>
            </div>
        </div>
    `;
    
    grid.addWidget(html);
    console.log('✅ Painel adicionado');
}

async function buscarDados() {
    try {
        console.log('Buscando dados...');
        
        const response = await fetch(`${API_URL}/data/multiple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ symbols: watchlist })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', Object.keys(data).length, 'tickers');
        
        exibirDados(data);
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        document.getElementById('stockContainer').innerHTML = `
            <div style="color: red;">
                <p>❌ Erro: ${error.message}</p>
                <p>Verifique se o servidor está rodando</p>
            </div>
        `;
    }
}

function exibirDados(data) {
    const container = document.getElementById('stockContainer');
    if (!container) {
        console.error('Container não encontrado!');
        return;
    }
    
    let html = '<table style="width: 100%; color: white; border-collapse: collapse;">';
    html += '<thead><tr style="border-bottom: 2px solid #d4af37;">';
    html += '<th style="padding: 10px; text-align: left;">TICKER</th>';
    html += '<th style="padding: 10px; text-align: right;">MERCADO</th>';
    html += '<th style="padding: 10px; text-align: right;">VAR.%</th>';
    html += '<th style="padding: 10px; text-align: right;">PRÉ-MARKET</th>';
    html += '<th style="padding: 10px; text-align: right;">VAR.%</th>';
    html += '</tr></thead><tbody>';
    
    watchlist.forEach(symbol => {
        const ticker = data[symbol];
        if (!ticker) {
            html += `<tr><td colspan="5" style="padding: 10px; color: #888;">Sem dados para ${symbol}</td></tr>`;
            return;
        }
        
        const marketPrice = ticker.atClose?.regularMarketPrice || 0;
        const marketChange = ticker.atClose?.regularMarketChangePercent || 0;
        const prePrice = ticker.preMarket?.preMarketPrice || 0;
        const preChange = ticker.preMarket?.preMarketChangePercent || 0;
        
        const marketColor = marketChange >= 0 ? '#00ff00' : '#ff0000';
        const preColor = preChange >= 0 ? '#00ff00' : '#ff0000';
        
        html += '<tr style="border-bottom: 1px solid #333;">';
        html += `<td style="padding: 10px; color: #d4af37; font-weight: bold;">${symbol}</td>`;
        html += `<td style="padding: 10px; text-align: right;">$${marketPrice.toFixed(2)}</td>`;
        html += `<td style="padding: 10px; text-align: right; color: ${marketColor};">${marketChange >= 0 ? '+' : ''}${marketChange.toFixed(2)}%</td>`;
        html += `<td style="padding: 10px; text-align: right;">${prePrice > 0 ? '$' + prePrice.toFixed(2) : '--'}</td>`;
        html += `<td style="padding: 10px; text-align: right; color: ${preColor};">${prePrice > 0 ? (preChange >= 0 ? '+' : '') + preChange.toFixed(2) + '%' : '--'}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += `<p style="margin-top: 20px; color: #888; font-size: 12px;">Última atualização: ${new Date().toLocaleTimeString()}</p>`;
    
    container.innerHTML = html;
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

console.log('=== SCRIPT CARREGADO ===');
