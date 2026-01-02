const { scrapeYahooFinance } = require('./services/scraper');

async function testAPI() {
  console.log('🔍 Testando scraper diretamente...\n');
  
  const symbols = ['AAPL', 'MSFT', 'GOOGL'];
  
  for (const symbol of symbols) {
    console.log(`📊 Buscando ${symbol}...`);
    const result = await scrapeYahooFinance(symbol);
    
    if (result.success) {
      console.log('✅ Sucesso!');
      console.log('Dados:', JSON.stringify(result.data, null, 2));
      console.log('\n');
    } else {
      console.log('❌ Erro:', result.error);
      console.log('\n');
    }
  }
}

testAPI().catch(console.error);
