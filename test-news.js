const { scrapeInvestingNews } = require('./services/news-scraper-simple.js');

scrapeInvestingNews()
  .then(result => {
    console.log('\n=== RESULTADO ===');
    console.log('Success:', result.success);
    console.log('Total:', result.data.length);
    
    if (result.data.length > 0) {
      console.log('\nPrimeiras 5 notícias:\n');
      result.data.slice(0, 5).forEach(n => {
        console.log(`[${n.time}] [${n.source}] ${n.title.substring(0, 70)}...`);
      });
    } else {
      console.log('Erro:', result.error);
    }
  })
  .catch(error => {
    console.error('\nERRO:', error.message);
  });
