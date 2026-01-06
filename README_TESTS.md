Instruções rápidas para rodar testes locais

1. Variáveis de ambiente:
- Defina `DISABLE_SCRAPER=true` para evitar que os scrapers agendem tarefas automáticas durante testes.
- Se desejar permitir auto-login para testes locais, no navegador abra o console e rode:

  localStorage.setItem('ENABLE_DEV_AUTOLOGIN','true')

2. Iniciar servidor:

  node server.js

3. Rodar captura headless (requer Puppeteer):

  node scripts/capture_console.js

4. Rodar testes:

  node test-news.js
  node test-stocks.js

Observações:
- O auto-login em `public/js/dashboard-vue.js` só será executado se a flag `ENABLE_DEV_AUTOLOGIN` estiver definida como 'true' no `localStorage`.
- Os scrapers podem demorar e usar Puppeteer; use `DISABLE_SCRAPER=true` para testes rápidos.
