# TrustLend MVP

🚀 **MVP de crédito colaborativo com garantia social**

Uma plataforma completa de empréstimos P2P que utiliza garantia social da comunidade, scoring determinístico, e auditoria transparente através de blockchain.

## 🚀 Setup Rápido

### **1. Instalação**

```bash
# Clone o repositório
git clone <your-repo>
cd TrustLand

# Instale dependências  
npm install

# Configure ambiente
cp env.template .env.local
# Edite .env.local com suas configurações (opcional para demo)
```

### **2. Inicialização**

```bash
# Configurar variáveis de ambiente (já configurado)
# cp env.template .env.local
# Adicionar as chaves fornecidas ao .env.local

# Gerar cliente Prisma e criar banco
DATABASE_URL="file:./dev.db" npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma db push

# Povoar banco com dados de teste
DATABASE_URL="file:./dev.db" npm run db:seed

# Iniciar servidor
npm run dev

# Ou tudo em uma linha:
# DATABASE_URL="file:./dev.db" npx prisma generate && DATABASE_URL="file:./dev.db" npx prisma db push && DATABASE_URL="file:./dev.db" npm run db:seed && npm run dev
```

**Acesse:** http://localhost:3000

## 🎮 Demo Rápido (≤ 2 min)

### **Modo Mock (Recomendado)**
Acesse: `http://localhost:3000?mock=1`
- ✅ Sem necessidade de blockchain real
- ✅ Transações simuladas
- ✅ Todos os fluxos funcionais

### **Roteiro de Demo**

#### **1. Criar Empréstimo (30s)**
1. Home → "Novo Empréstimo"
2. Preencher dados → Ver score → Confirmar

#### **2. Endossos & Aprovação (30s)**  
1. Página do empréstimo → Adicionar 2 endossos
2. Atingir cobertura ≥80% → Botão "Aprovar" disponível
3. Aprovar → Estado muda para "ATIVO"

#### **3. Pagamento (30s)**
1. Fazer pagamento → Parcelas atualizadas
2. Score aumenta automaticamente
3. Ver Timeline de eventos

#### **4. Default & Waterfall (30s)**
1. "Marcar Inadimplência" → Estado "INADIMPLENTE"  
2. "Executar Liquidação" → Breakdown do waterfall
3. Ver eventos DEFAULT, WATERFALL, LIBERACAO

#### **5. Auditoria (bonus)**
1. Clicar HashBadge → Página auditoria
2. Ver JSON + hash → "Recompute" → Integridade ✅

## 🏗️ Arquitetura

### **Stack Tecnológico**
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Web3**: wagmi v2, RainbowKit, viem (Sepolia testnet)  
- **Backend**: API Routes, Prisma ORM, SQLite
- **Validação**: Zod, React Query
- **Charts**: Recharts

### **Funcionalidades Principais**

#### **🎯 Core Business Logic**
- **Originação**: Criação com scoring automático
- **Endossos**: Garantia social com limite concentração  
- **Precificação**: 4 faixas risco (600-2200 bps)
- **Pagamentos**: Acelerado (1 parcela = 10s)
- **Inadimplência**: Waterfall automático de perdas
- **Auditoria**: Hash determinístico

#### **🔒 Fraud Detection**
- Detecção multi-contas
- Análise concentração (>50% apoiador)
- Timing suspeito
- Revisão manual

#### **📊 Dashboard**
- Métricas tempo real (TVL, liquidez, inadimplência)
- Distribuição empréstimos
- Timeline eventos auditáveis

## 📁 Estrutura Principal

```
src/
├── app/                    # Pages & API Routes
│   ├── api/               # Backend endpoints
│   ├── loans/             # Loan management
│   ├── dashboard/         # Analytics
│   └── audit/             # Audit trails
├── components/trust/      # Custom components  
│   ├── ScoreDial.tsx     # Credit score display
│   ├── EndorseList.tsx   # Endorsement UI
│   ├── Timeline.tsx      # Event timeline
│   └── LoanCard.tsx      # Loan cards
├── lib/domain/           # Business logic
│   ├── score.ts          # Credit scoring
│   ├── pricing.ts        # Risk pricing  
│   ├── waterfall.ts      # Loss distribution
│   └── fraud.ts          # Fraud detection
├── lib/infra/            # Infrastructure
│   ├── events.ts         # Event sourcing
│   ├── logger.ts         # Decision logging
│   └── repo.ts           # Data access
└── lib/web3/             # Blockchain
    ├── config.ts         # wagmi setup
    └── contracts.ts      # Contract calls
```

## 🔧 Configuração de Ambiente

**Arquivo `.env.local` (opcional para demo):**

```bash
# Sepolia RPC (Alchemy/Infura)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-KEY

# Contratos (deixe vazio para modo mock)
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_MVP_ADDRESS=0x...

# Desenvolvimento apenas
PRIVATE_KEY=0x...

# Database  
DATABASE_URL=file:./dev.db
USE_MEMORY=0  # 1 para memória
```

## 🧪 Testing

```bash
# Testes unitários
npm test

# Testes específicos implementados
npm test score        # Credit scoring
npm test pricing      # Risk pricing  
npm test waterfall    # Loss distribution
```

## 📊 Business Rules

### **Score Determinístico**
```javascript
score = base(50) 
  + pagamentosEmDia * 2     // cap 100
  - atrasos * 3             // mín 0  
  - inadimplente * 10       // única vez
  + (cobertura ≥ 80%) * 1   // bonus
  - sobRevisao * 5          // fraude
```

### **Faixas de Risco**
| Faixa | Score | APR | Limite | Cobertura |
|-------|-------|-----|---------|-----------|
| BAIXO | 0-39 | 22% | $2K | 100% |
| MEDIO | 40-69 | 14% | $5K | 50% |
| ALTO | 70-89 | 9% | $8K | 25% |  
| EXCELENTE | 90-100 | 6% | $10K | 0% |

### **Regras de Negócio**
- ✅ Máx 20% por endosso individual
- ✅ Mín 2 apoiadores distintos
- ✅ Máx 3 empréstimos ativos por apoiador
- ✅ Auto-apoio proibido
- ✅ Waterfall: colateral → stakes → fundo

## 🔒 Segurança & Auditoria

- **Hash Keccak256** determinístico
- **Logs imutáveis** com trilha completa
- **Idempotência** em operações críticas  
- **Validação Zod** em todos endpoints
- **Verificação integridade** via recompute

## 🚨 Troubleshooting

### **Reset Database**
```bash
rm ./dev.db
npm run db:push  
npm run db:seed
```

### **Build Issues**
```bash
rm -rf .next
npm run build
```

### **Web3 Connection**
Use modo mock (`?mock=1`) para demo sem blockchain.

## ✅ Status de Implementação

### **Funcionalidades Completas**
- [x] Originação com wizard 3 passos
- [x] Scoring determinístico auditável
- [x] Endossos com regras concentração  
- [x] Aprovação automática por critérios
- [x] Pagamentos com update score
- [x] Inadimplência + waterfall
- [x] Auditoria hash verification
- [x] Dashboard métricas tempo real
- [x] Modo mock demonstração
- [x] UI responsiva acessível

### **Demo-Ready**  
- [x] Roteiro ≤ 2min implementado
- [x] Dados seed carregados
- [x] Mock mode funcional
- [x] Banner simulação visível
- [x] Estados visuais claros

---

**🚀 TrustLend MVP - Crédito colaborativo determinístico**  
*Simulação completa • Sem valor financeiro real*
