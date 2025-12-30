# SIEIRNEWS - Sistema de Monitoramento de Ativos do Yahoo Finance

Sistema web completo com autenticação de usuários e monitoramento em tempo real de múltiplos ativos do Yahoo Finance.

## 🚀 Funcionalidades

- ✅ Login seguro com email e senha
- ✅ Autenticação JWT
- ✅ Interface responsiva (Bootstrap)
- ✅ **Monitoramento de múltiplos ativos simultaneamente**
- ✅ **Adicionar/Remover ativos dinamicamente**
- ✅ Scraping de dados do Yahoo Finance
- ✅ Exibição de "At Close" e "Pre-Market" para cada ativo
- ✅ Auto-atualização de dados a cada 5 minutos
- ✅ Design moderno e responsivo
- ✅ Links diretos para Yahoo Finance

## 📊 Ativos Monitorados por Padrão

- **TSLA** - Tesla, Inc.
- **AAPL** - Apple Inc.
- **GOOGL** - Alphabet Inc.
- **MSFT** - Microsoft Corporation
- **AMZN** - Amazon.com, Inc.

Você pode adicionar qualquer ativo disponível no Yahoo Finance!

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - O arquivo `.env` já está configurado
   - Altere o `JWT_SECRET` em produção

## ▶️ Como Executar

1. Inicie o servidor:
```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

2. Acesse no navegador:
```
http://localhost:3000
```

## 🔐 Credenciais de Teste

### Usuário 1:
- **Email:** admin@sieirnews.com
- **Senha:** admin123

### Usuário 2:
- **Email:** user@sieirnews.com
- **Senha:** user123

## 📁 Estrutura do Projeto

```
SIEIRNEWS/
├── middleware/
│   └── auth.js              # Middleware de autenticação JWT
├── models/
│   └── user.js              # Mock de banco de dados de usuários
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   └── data.js              # Rotas de dados TSLA
├── services/
│   └── scraper.js           # Serviço de scraping Yahoo Finance
├── public/
│   ├── css/
│   │   └── styles.css       # Estilos customizados
│   ├── js/
│   │   ├── login.js         # Lógica do login
│   │   └── dashboard.js     # Lógica do dashboard
│   ├── login.html           # Página de login
│   └── dashboard.html       # Dashboard com dados TSLA
├── .env                     # Variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo Git
├── package.json            # Dependências do projeto
├── server.js               # Servidor Express
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend:
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **axios** - Requisições HTTP
- **cheerio** - Scraping HTML
- **dotenv** - Variáveis de ambiente

### Frontend:
- **HTML5** - Estrutura
- **CSS3** - Estilização
- **Bootstrap 5** - Framework CSS responsivo
- **JavaScript** - Lógica do cliente

## 📊 API Endpoints

### Autenticação

#### POST `/api/auth/login`
Login de usuário

**Body:**
```json
{
  "email": "admin@sieirnews.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "admin@sieirnews.com"
  }
}
```

### Dados

#### GET `/api/data/ticker/:symbol`
Obter dados de um ticker específico (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Exemplo:**
```
GET /api/data/ticker/AAPL
```

**Response:**
```json
{
  "ticker": "AAPL",
  "atClose": "195.50",
  "preMarket": "196.20",
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

#### POST `/api/data/multiple`
Obter dados de múltiplos tickers (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "tickers": ["TSLA", "AAPL", "GOOGL"]
}
```

**Response:**
```json
{
  "tickers": [
    {
      "ticker": "TSLA",
      "atClose": "248.50",
      "preMarket": "249.20",
      "timestamp": "2025-12-18T10:30:00.000Z"
    },
    {
      "ticker": "AAPL",
      "atClose": "195.50",
      "preMarket": "196.20",
      "timestamp": "2025-12-18T10:30:00.000Z"
    }
  ],
  "total": 2
}
```

#### GET `/api/data/default-tickers`
Obter lista de tickers padrão (requer autenticação)

## 🔒 Segurança

- Senhas são criptografadas com bcryptjs
- Autenticação via JWT
- Tokens expiram em 24 horas
- Middleware de proteção de rotas

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops

## ⚠️ Observações Importantes

1. **Banco de Dados Mock:** O sistema usa um array em memória para armazenar usuários. Em produção, use um banco de dados real (MongoDB, PostgreSQL, etc.)

2. **API do Yahoo Finance:** O sistema utiliza a **API pública oficial do Yahoo Finance** (query1.finance.yahoo.com) para obter dados em tempo real. Esta é uma solução mais confiável e estável do que scraping HTML.

3. **CORS:** O CORS está habilitado para desenvolvimento. Configure adequadamente em produção.

4. **Rate Limiting:** Considere adicionar rate limiting para prevenir abusos da API.

5. **Dados em Tempo Real:** Os preços são atualizados diretamente da API do Yahoo Finance e refletem:
   - **At Close**: Preço atual do mercado regular
   - **Pre-Market**: Preço durante o horário pré-mercado (quando disponível)

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Integrar com banco de dados real (MongoDB/PostgreSQL)
- [ ] Adicionar registro de novos usuários
- [ ] Implementar recuperação de senha
- [ ] Criar gráficos de histórico de preços
- [ ] Adicionar notificações de preço (alertas)
- [ ] Implementar cache para reduzir scraping
- [ ] Adicionar testes automatizados
- [ ] Salvar watchlist no backend (por usuário)
- [ ] Adicionar mais informações dos ativos (volume, market cap, etc)
- [ ] Criar visualizações de performance (ganhos/perdas)

## 💡 Como Usar

1. **Faça login** com as credenciais fornecidas
2. **Visualize os ativos padrão** já monitorados (TSLA, AAPL, GOOGL, MSFT, AMZN)
3. **Adicione novos ativos** clicando no botão "Adicionar Ativo"
4. **Digite o símbolo** do ativo do Yahoo Finance (ex: NVDA, AMD, META)
5. **Remova ativos** clicando no ícone de lixeira no card do ativo
6. **Atualize os dados** manualmente ou aguarde a atualização automática

## 🌐 Exemplos de Tickers Populares

- **Tecnologia**: AAPL, GOOGL, MSFT, META, NVDA, AMD
- **Carros Elétricos**: TSLA, RIVN, LCID
- **E-commerce**: AMZN, SHOP, EBAY
- **Streaming**: NFLX, DIS, SPOT
- **Finanças**: JPM, BAC, GS
- **Criptomoedas**: BTC-USD, ETH-USD

## 📸 Capturas de Tela

### Dashboard com Múltiplos Ativos
- Cards coloridos para cada ativo
- Valores de At Close e Pre-Market lado a lado
- Links diretos para Yahoo Finance
- Botão de remoção em cada card

### Adicionar Novo Ativo
- Modal simples e intuitivo
- Validação de símbolos
- Feedback imediato

## 📝 Licença

ISC

## 👤 Autor

Desenvolvido para SIEIRNEWS

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
