// Teste da API
const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('Testando API...');
        
        const response = await fetch('http://localhost:3000/api/data/ticker/AAPL', {
            headers: {
                'Authorization': 'Bearer test'
            }
        });
        
        const data = await response.json();
        console.log('\n=== RESPOSTA DA API ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n=== TESTE CONCLUÍDO ===');
        
    } catch (error) {
        console.error('ERRO:', error.message);
    }
}

testAPI();
