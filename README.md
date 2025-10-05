# TrustLend MVP - Plataforma de Crédito Colaborativo

Demo completo de uma plataforma de crédito colaborativo com garantia social, construído com Next.js 14, TypeScript, PostgreSQL e smart contracts na Sepolia.

## 🚀 Características Principais

- **Sistema Multiusuário**: 4 papéis distintos (Tomador, Apoiador, Provedor, Operador)
- **Scoring Determinístico**: Algoritmo transparente baseado em histórico de pagamentos
- **Garantia Social**: Sistema de endossos da comunidade com regras de concentração
- **Pagamentos Acelerados**: Simulação com parcelas de 10s para demonstração
- **Auditoria Completa**: Hash determinístico para todas as decisões
- **Analytics em Tempo Real**: Dashboard com métricas de TVL, liquidez e inadimplência
- **Waterfall Automático**: Distribuição justa de perdas (colateral → stakes → fundo)

## 🎭 Papéis de Usuário

### 1. **Tomador (Borrower)**

- Cria empréstimos com base no seu score social
- Visualiza seus pedidos e status de aprovação
- Gerencia pagamentos e parcelas
- Score: 0-100 pontos determina taxa e limite

### 2. **Apoiador (Endorser)**

- Apoia empréstimos de terceiros com stakes
- Endossa pedidos para aumentar cobertura social
- Ganha retornos proporcionais ao risco
- Máximo 5% do valor por empréstimo

### 3. **Provedor de Liquidez (Lender)**

- Adiciona fundos ao pool de liquidez
- Visualiza métricas de rentabilidade
- Financia empréstimos aprovados
- Recebe juros proporcionais

### 4. **Operador (Admin)**

- Monitora saúde do sistema
- Gerencia alertas de fraude
- Visualiza métricas operacionais
- Controla parâmetros do sistema

## 🎯 Demo Rápida (≤ 3 min)

### Fluxo Completo

1. **Login/Cadastro** (30s): Escolher papel → Inserir carteira fictícia → Entrar
2. **Criar Empréstimo** (30s): [Tomador] Preencher dados → Ver score → Confirmar
3. **Endossos** (45s): [Apoiador] Apoiar empréstimo → Atingir 80%+ cobertura → Aprovar
4. **Financiamento** (30s): [Provedor] Adicionar liquidez → Financiar empréstimo
5. **Pagamento** (30s): [Tomador] Pagar parcela → Ver score aumentar
6. **Auditoria** (15s): [Qualquer] Clicar HashBadge → Verificar integridade

## 🛠 Stack Técnica

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: API Routes, Prisma ORM
- **Database**: PostgreSQL (Docker) / SQLite (fallback)
- **Blockchain**: wagmi, viem, RainbowKit
- **UI**: Radix UI, Lucide Icons
- **Testing**: Jest, ts-jest
- **Containerização**: Docker, Docker Compose

## 📋 Pré-requisitos

- Node.js 18.17+
- Docker & Docker Compose
- npm ou yarn
- Git

## 🚀 Instalação e Execução

### 1. Clone e Configure

```bash
# Clone o repositório
git clone <repository-url>
cd TrustLand

# Instale as dependências
npm install

# Configure o ambiente
cp env.template .env.local
# Edite .env.local com suas configurações
```

### 2. Banco de Dados (Docker)

```bash
# Inicie o PostgreSQL
docker-compose up -d

# Configure o banco
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Execute a Aplicação

```bash
# Execute em modo desenvolvimento
npm run dev
```

nn
Acesse [http://localhost:3000](http://localhost:3000)

### 4. Acesso ao Banco (Opcional)

- **Adminer**: [http://localhost:8080](http://localhost:8080)
- **Server**: db
- **Username**: trustlend
- **Password**: trustlend123
- **Database**: trustlend

## 🔧 Configuração do Ambiente

### Variáveis Essenciais (.env.local)

```env
# Banco de dados (Docker)
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend"

# Banco de dados (SQLite fallback)
# DATABASE_URL="file:./dev.db"

# Blockchain (Sepolia)
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR-PROJECT-ID"
NEXT_PUBLIC_CHAIN_ID=11155111

# Contratos (opcional para demo)
NEXT_PUBLIC_USDC_ADDRESS="0x..."
NEXT_PUBLIC_MVP_ADDRESS="0x..."

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
```

### Modo Mock

Para demonstração sem blockchain:

- Acesse qualquer URL com `?mock=1`
- Exemplo: `http://localhost:3000?mock=1`

## 🎮 Guia de Uso Multiusuário

### Acesso Inicial

1. Acesse [http://localhost:3000](http://localhost:3000)
2. Clique em "🔐 Entrar / Cadastrar"
3. Escolha entre **Login** (usuário existente) ou **Cadastro** (novo usuário)

### Usuários de Demonstração

```
Tomador: 0x3456789012345678901234567890123456789012
Apoiador: 0x4567890123456789012345678901234567890123
Provedor: 0x2345678901234567890123456789012345678901
Operador: 0x1234567890123456789012345678901234567890
```

### Dashboard por Papel

#### **Tomador Dashboard**

- Métricas: Score social, total emprestado, total pago, empréstimos ativos
- Ações: Criar novo empréstimo, visualizar detalhes, acompanhar parcelas
- Auditoria: Acesso aos hashes de cada empréstimo

#### **Apoiador Dashboard**

- Métricas: Total apostado, endossos ativos, retorno estimado, reputação
- Ações: Endossar empréstimos pendentes, gerenciar stakes
- Visão: Lista de empréstimos disponíveis com scores dos tomadores

#### **Provedor Dashboard**

- Métricas: TVL, liquidez disponível, taxa de utilização, APR médio
- Ações: Adicionar/retirar liquidez, financiar empréstimos
- Análise: Empréstimos aguardando financiamento, histórico de investimentos

#### **Operador Dashboard**

- Métricas: Usuários totais, volume, inadimplência, alertas de fraude
- Controles: Revisar alertas, monitorar atividade, métricas do sistema
- Auditoria: Log detalhado de todas as transações

## 📊 Regras de Negócio

### Scoring Social (0-100 pontos)

- **Excelente (90-100)**: 6% a.a., limite 10K mUSDC, cobertura 0%
- **Alto (70-89)**: 9% a.a., limite 8K mUSDC, cobertura 25%
- **Médio (40-69)**: 14% a.a., limite 5K mUSDC, cobertura 50%
- **Baixo (0-39)**: 22% a.a., limite 2K mUSDC, cobertura 100%

### Sistema de Endossos

- Máximo 5% do valor por apoiador individual
- Cobertura mínima varia por score (25-100%)
- Stakes bloqueados até quitação ou default
- Aprovação automática ao atingir cobertura mínima

### Waterfall de Inadimplência

1. **Colateral próprio** do tomador (se houver)
2. **Stakes dos apoiadores** (distribuição proporcional)
3. **Fundo de garantia** do pool (último recurso)

### Auditoria Automática

- Hash SHA-256 para cada empréstimo e evento
- Verificação de integridade em tempo real
- Log imutável de todas as decisões
- Rastreabilidade completa de transações

## 🧪 Testes e Validação

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Verificar build de produção
npm run build

# Validar banco de dados
npm run db:generate
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   │   ├── loans/         # Empréstimos
│   │   ├── endorsements/  # Endossos
│   │   ├── users/         # Usuários
│   │   └── pool/          # Pool de liquidez
│   ├── auth/              # Autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── loans/             # Páginas de empréstimos
│   └── audit/             # Páginas de auditoria
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── auth/             # Componentes de autenticação
│   ├── dashboards/       # Dashboards específicos
│   └── trust/            # Componentes específicos
├── contexts/             # Contextos React (UserContext)
├── lib/                  # Utilitários e lógica de negócio
│   ├── domain/          # Regras de negócio
│   ├── infra/           # Infraestrutura
│   └── utils/           # Utilitários gerais
└── shared/              # Tipos e constantes compartilhadas
```

## 🔍 APIs Principais

### Autenticação

- `POST /api/users/login` - Login de usuário
- `POST /api/users/register` - Cadastro de usuário

### Empréstimos

- `POST /api/loans` - Criar empréstimo
- `GET /api/loans` - Listar empréstimos (com filtros)
- `GET /api/loans/[id]` - Detalhes do empréstimo

### Endossos

- `POST /api/endorsements` - Criar endosso
- `GET /api/endorsements` - Listar endossos por usuário

### Pool de Liquidez

- `POST /api/pool/deposit` - Adicionar liquidez
- `POST /api/pool/withdraw` - Retirar liquidez
- `GET /api/pool/metrics` - Métricas do pool

### Auditoria

- `GET /api/audit/[id]` - Dados de auditoria
- `POST /api/audit/recompute` - Recomputar hash

## 🚨 Troubleshooting

### Erro de Banco de Dados

```bash
# Resetar banco PostgreSQL
docker-compose down
docker-compose up -d
npm run db:push
npm run db:seed

# Ou usar SQLite
# rm prisma/dev.db
# npm run db:push
# npm run db:seed
```

### Erro de Build

```bash
# Limpar cache
rm -rf .next
npm run build
```

### Erro de Autenticação

- Verifique se o usuário existe no banco
- Use as carteiras de demonstração fornecidas
- Limpe localStorage: `localStorage.clear()`

### Erro de Docker

```bash
# Verificar status
docker-compose ps

# Ver logs
docker-compose logs db

# Reiniciar serviços
docker-compose restart
```

## 🔄 Fluxo de Desenvolvimento

### 1. Modificações no Schema

```bash
# Após alterar prisma/schema.prisma
npm run db:generate
npm run db:push
npm run db:seed
```

### 2. Novos Componentes

```bash
# Criar componente
touch src/components/novo-componente.tsx

# Adicionar ao index se necessário
echo "export { default } from './novo-componente'" >> src/components/index.ts
```

### 3. Novas APIs

```bash
# Criar rota
mkdir src/app/api/nova-rota
touch src/app/api/nova-rota/route.ts
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎯 Roadmap

- [x] Sistema multiusuário completo
- [x] Dashboards específicos por papel
- [x] Banco PostgreSQL com Docker
- [x] Sistema de autenticação robusto
- [ ] APIs administrativas completas
- [ ] Sistema de notificações
- [ ] Integração com Chainlink
- [ ] Mobile app (React Native)
- [ ] Machine learning para scoring

---

**Desenvolvido para demonstração acadêmica • Carteiras fictícias • Sem valor financeiro real**
