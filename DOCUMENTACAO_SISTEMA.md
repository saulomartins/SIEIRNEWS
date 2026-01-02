# Documentação do Sistema SIEIRNEWS

## 1. Regras de Negócio

### 1.1. Usuários
- O sistema permite autenticação de usuários via login e senha.
- Existem diferentes níveis de acesso (ex: usuário comum, administrador).
- Usuários autenticados podem acessar dashboards e visualizar dados extraídos.

### 1.2. Extração de Dados
- O sistema realiza extração automática de notícias e dados financeiros de fontes externas:
  - Yahoo Finance
  - FinancialJuice
- Os dados extraídos incluem manchetes, resumos, datas, tickers e outras informações relevantes.
- As extrações são feitas periodicamente (agendamento automático) para manter os dados atualizados.

### 1.3. Armazenamento e Apresentação
- Os dados extraídos são armazenados em banco de dados local.
- Dashboards apresentam os dados em tempo real ou quase real, com visualizações como heatmaps, listas e gráficos.
- Usuários podem filtrar, buscar e visualizar detalhes das notícias e dados financeiros.

### 1.4. Segurança
- As rotas de API protegidas exigem autenticação JWT.
- Dados sensíveis são protegidos e não expostos diretamente ao frontend.

---

## 2. Interface do Aplicativo

### 2.1. Frontend
- Desenvolvido em Vue.js (src/)
- Telas principais:
  - Login
  - Dashboard Modular
  - Dashboard Pro
  - Heatmap
- Componentes reutilizáveis para exibição de notícias, gráficos e filtros.
- Consome APIs para buscar dados atualizados.

### 2.2. Backend
- Node.js com Express (server.js)
- Rotas principais:
  - /auth (autenticação)
  - /data (dados extraídos)
- Serviços de scraping em services/:
  - financialjuice-scraper.js
  - news-scraper.js
  - news-scraper-simple.js
- Middleware de autenticação em middleware/auth.js

---

## 3. Atualização Automática dos Dados

### 3.1. Yahoo Finance
- O serviço `news-scraper.js` realiza scraping periódico das notícias do Yahoo Finance.
- O agendamento é feito via `setInterval` ou bibliotecas de agendamento (ex: node-cron).
- Os dados extraídos são salvos no banco de dados e disponibilizados via API.

### 3.2. FinancialJuice
- O serviço `financialjuice-scraper.js` faz scraping periódico do FinancialJuice.
- O processo é similar ao do Yahoo Finance: agendamento automático, extração, armazenamento e exposição via API.

### 3.3. Fluxo Geral
1. Serviço de scraping é executado automaticamente em intervalos definidos.
2. Dados são extraídos das fontes externas.
3. Dados são processados e armazenados localmente.
4. APIs fornecem os dados atualizados para o frontend.
5. Dashboards consomem as APIs e exibem as informações em tempo real.

---

## 4. Estrutura de Pastas Relevantes
- `services/`: scripts de scraping e integração com fontes externas
- `routes/`: rotas de API
- `models/`: modelos de dados (ex: usuário)
- `public/`: arquivos estáticos e dashboards
- `src/`: frontend Vue.js

---

## 5. Observações
- O sistema pode ser expandido para incluir novas fontes de dados.
- O agendamento pode ser ajustado conforme a necessidade de atualização dos dados.
- Recomenda-se monitorar logs dos scrapers para garantir a integridade das extrações.
