# Documentação Avançada do Sistema SIEIRNEWS

## 1. Regras de Negócio (Detalhadas)

### 1.1. Autenticação e Perfis de Usuário
- **Regra:** Apenas usuários autenticados podem acessar dashboards e dados sensíveis.
- **Como foi feito:**
  - Implementação de tela de login (login.html) com validação de credenciais.
  - Backend valida usuário e retorna JWT.
  - Frontend armazena token e protege rotas.
- **Exemplo visual:**
  ![Tela de Login](public/images/print_login.png)

### 1.2. Atualização Automática de Dados
- **Regra:** Dados de ativos e notícias devem ser atualizados automaticamente sem ação do usuário.
- **Como foi feito:**
  - Scrapers em Node.js (news-scraper.js, financialjuice-scraper.js) executam periodicamente (node-cron/setInterval).
  - Backend expõe API REST com dados sempre atualizados.
  - Frontend consome API e atualiza dashboards em tempo real (AJAX/WebSocket/polling).
- **Exemplo visual:**
  ![Indicador de atualização ao vivo](public/images/print_dashboard_live.png)

### 1.3. Visualização Modular e Personalizável
- **Regra:** Usuário pode personalizar o layout dos painéis, arrastar, redimensionar e adicionar novos módulos.
- **Como foi feito:**
  - Uso de gridstack.js e componentes Vue para modularidade.
  - Estado do layout salvo localmente ou no backend.
- **Exemplo visual:**
  ![Dashboard Modular](public/images/print_dashboard_modular.png)

### 1.4. Filtros, Busca e Destaques
- **Regra:** Usuário pode filtrar notícias, buscar ativos e destacar palavras-chave.
- **Como foi feito:**
  - Filtros e buscas implementados no frontend (Vue.js) e backend (Express).
  - Palavras-chave destacadas dinamicamente no feed de notícias.
- **Exemplo visual:**
  ![Filtro de notícias](public/images/print_news_filter.png)

### 1.5. Segurança e Proteção de Dados
- **Regra:** APIs e dados sensíveis protegidos por autenticação e autorização.
- **Como foi feito:**
  - Middleware de autenticação JWT nas rotas protegidas.
  - Dados sensíveis nunca expostos diretamente ao frontend.

---

## 2. Prints de Tela (Sugestão de Organização)
- Salve prints reais das telas em `public/images/` com nomes como `print_login.png`, `print_dashboard_live.png`, etc.
- Inclua os prints na documentação usando a sintaxe `![descrição](caminho)`.

---

## 3. Atualização Automática dos Dados (Detalhamento Técnico)
- **Yahoo Finance:**
  - O serviço `news-scraper.js` executa scraping a cada X minutos.
  - Dados são processados e salvos no banco.
  - API `/data` retorna sempre os dados mais recentes.
- **FinancialJuice:**
  - O serviço `financialjuice-scraper.js` executa scraping periódico.
  - Dados são integrados ao mesmo fluxo do Yahoo Finance.
- **Frontend:**
  - Dashboards exibem indicador "AO VIVO" e banners de atualização.
  - Atualização visual a cada segundo/minuto, conforme contexto do mercado.

---

## 4. Observações
- Para cada nova regra de negócio, documente o fluxo, a implementação e inclua um print de tela correspondente.
- Mantenha a documentação atualizada conforme novas funcionalidades forem implementadas.
