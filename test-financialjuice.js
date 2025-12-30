const { scrapeFinancialJuiceNews } = require('./services/financialjuice-scraper');

console.log('=== Teste do Scraper Financial Juice ===\n');

scrapeFinancialJuiceNews()
  .then(result => {
    console.log('\n=== RESULTADO ===');
    console.log('Sucesso:', result.success);
    console.log('Total de notícias:', result.data ? result.data.length : 0);
    
    if (result.success && result.data.length > 0) {
      console.log('\n=== Primeiras 3 notícias ===');
      result.data.slice(0, 3).forEach((news, index) => {
        console.log(`\n${index + 1}. ${news.title.substring(0, 80)}...`);
        console.log(`   Tempo: ${news.time} | Data: ${news.fullDate}`);
        console.log(`   Fonte: ${news.source}`);
        console.log(`   URL: ${news.url.substring(0, 60)}...`);
      });
    } else if (result.error) {
      console.log('\nErro:', result.error);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== ERRO ===');
    console.error(error.message);
    process.exit(1);
  });
