# 🏦 TrustLend - Fluxo Multiusuário V2

## 📋 **VISÃO GERAL**

O TrustLend V2 simula um ecossistema completo de crédito descentralizado com 3 papéis principais:

- **👤 Tomador (Borrower)**: Solicita empréstimos
- **🤝 Apoiador (Endorser)**: Oferece garantia social
- **💰 Lender**: Provê liquidez ao sistema

---

## 🎯 **OBJETIVO DA DEMO**

Demonstrar para a banca avaliadora um sistema financeiro onde:

- **Score social** determina condições de crédito
- **Apoio comunitário** reduz taxas de juros
- **Transparência blockchain** garante auditoria
- **Waterfall automático** distribui perdas de forma justa

---

## 🚀 **FLUXO PRINCIPAL DA DEMONSTRAÇÃO**

### **1. Tela Inicial - Seleção de Identidade**

```
┌─────────────────────────────────────┐
│        🏛️  TRUSTLEND DEMO           │
├─────────────────────────────────────┤
│ Wallet Address: [0x742d35Cc...]    │
│                                     │
│ Escolha seu papel:                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │👤 TOMADOR│ │🤝 APOIADOR│ │💰 LENDER │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│ [🚪 Entrar no Sistema]              │
└─────────────────────────────────────┘
```

**O que acontece:**

- Usuário insere uma wallet address fictícia
- Escolhe seu papel no sistema
- Sistema simula "login" e carrega contexto específico
- Redireciona para dashboard do papel selecionado

---

## 👤 **FLUXO DO TOMADOR**

### **Dashboard Principal**

```
┌─────────────────────────────────────────────────────────┐
│ 👤 João Silva (Score: 75/100) 📊                        │
├─────────────────────────────────────────────────────────┤
│ MEUS EMPRÉSTIMOS                                        │
│ ┌─────────────────┐ ┌─────────────────┐                │
│ │ 💲 5,000 mUSDC  │ │ 💲 2,000 mUSDC  │                │
│ │ ⏰ 12 meses     │ │ ⏰ 6 meses      │                │
│ │ 🟢 Ativo        │ │ 🟡 Pendente     │                │
│ │ APR: 9%         │ │ APR: 14%        │                │
│ └─────────────────┘ └─────────────────┘                │
│                                                         │
│ AÇÕES DISPONÍVEIS                                       │
│ [➕ Novo Empréstimo] [🤝 Apoiar Outros]                │
└─────────────────────────────────────────────────────────┘
```

### **Criação de Empréstimo**

**Campos obrigatórios:**

- Valor solicitado (respeitando limite do score)
- Prazo em meses
- Finalidade (opcional, para demonstração)
- Colateral próprio (opcional)

**Cálculo em tempo real:**

- Score atual → Faixa de risco
- Taxa APR baseada no score
- Limite máximo disponível
- Necessidade de apoio social

---

## 🤝 **FLUXO DO APOIADOR**

### **Dashboard de Oportunidades**

```
┌─────────────────────────────────────────────────────────┐
│ 🤝 Maria Santos - Apoiadora                             │
├─────────────────────────────────────────────────────────┤
│ EMPRÉSTIMOS DISPONÍVEIS PARA APOIO                      │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Carlos (Score 65) │ 💲 3,000 mUSDC │ ⏰ 8 meses │ │
│ │ Cobertura atual: 45% │ Necessário: 50% │ APR: 12%  │ │
│ │ [🤝 Apoiar] [👁️ Ver Detalhes]                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ MEUS APOIOS ATIVOS                                      │
│ • João Silva: 500 mUSDC (Ativo - Pagando em dia)       │
│ • Ana Costa: 800 mUSDC (Quitado - +2 pontos no score)  │
└─────────────────────────────────────────────────────────┘
```

### **Processo de Endosso**

1. **Seleção**: Apoiador escolhe um empréstimo pendente
2. **Análise**: Ve score do tomador, valor, e cobertura atual
3. **Decisão**: Define quanto apoiar (máx 20% do valor total)
4. **Confirmação**: Valor é bloqueado como garantia
5. **Resultado**: Score do tomador é recalculado, taxa pode diminuir

---

## 💰 **FLUXO DO LENDER**

### **Dashboard de Liquidez**

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Fundo Institucional XYZ                              │
├─────────────────────────────────────────────────────────┤
│ MÉTRICAS DO POOL                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ TVL         │ │ Liquidez    │ │ Inadimpl.   │        │
│ │ 850K mUSDC  │ │ 200K mUSDC  │ │ 2.1%        │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                         │
│ EMPRÉSTIMOS AGUARDANDO LIQUIDEZ                         │
│ • João Silva: 5,000 mUSDC (Score 75, Cobertura 85%)    │
│ • Maria Costa: 2,500 mUSDC (Score 82, Cobertura 90%)   │
│                                                         │
│ [💰 Adicionar Liquidez] [📊 Ver Performance Completa]   │
└─────────────────────────────────────────────────────────┘
```

### **Aporte de Liquidez**

- Lender adiciona fundos simulados ao pool global
- Empréstimos com cobertura ≥80% são liberados automaticamente
- TVL e métricas são atualizadas em tempo real

---

## 📊 **REGRAS DE NEGÓCIO**

### **Tabela de Score e Condições**

| Faixa Score        | Taxa APR | Limite Max   | Garantia Exigida |
| ------------------ | -------- | ------------ | ---------------- |
| 0-39 (Baixo)       | 22% a.a. | 2,000 mUSDC  | 100%             |
| 40-69 (Médio)      | 14% a.a. | 5,000 mUSDC  | 50%              |
| 70-89 (Alto)       | 9% a.a.  | 8,000 mUSDC  | 25%              |
| 90-100 (Excelente) | 6% a.a.  | 10,000 mUSDC | Opcional         |

### **Ajustes por Cobertura de Apoio**

- **≥80% cobertura**: -1pp na taxa
- **50-79% cobertura**: taxa padrão
- **<30% cobertura**: +1.5pp na taxa

### **Estados do Empréstimo**

```
Pendente → Aprovado → Ativo → [Quitado | Inadimplente]
    ↓         ↓        ↓          ↓           ↓
 Aguarda   Liberado  Pagando   Score+    Waterfall
  apoio    liquidez  parcelas   sobe      acionado
```

---

## ⚡ **SISTEMA DE WATERFALL (Inadimplência)**

Quando um tomador não paga, as perdas são cobertas nesta ordem:

1. **🏠 Colateral do Tomador** (usado primeiro)
2. **🤝 Stakes dos Apoiadores** (proporcional ao apoio)
3. **💰 Fundo de Reserva** (cobre o restante)

### **Exemplo Prático**

```
Empréstimo: 10,000 mUSDC
Valor não pago: 4,000 mUSDC

1. Colateral do tomador: 1,000 mUSDC ✅
   Restante a cobrir: 3,000 mUSDC

2. Apoios dos backers:
   • Apoiador A (50%): perde 1,500 mUSDC
   • Apoiador B (25%): perde 750 mUSDC
   • Apoiador C (25%): perde 750 mUSDC
   Restante: 0 mUSDC ✅

3. Fundo não é acionado (dívida coberta)
```

---

## 🔍 **AUDITORIA E TRANSPARÊNCIA**

### **HashBadge (Selo de Integridade)**

- Cada empréstimo possui hash único
- Clicável → redireciona para `/audit/[id]`
- Mostra JSON completo e dados on-chain
- Botão "Recomputar Integridade" para verificação

### **Página de Auditoria Detalhada**

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Auditoria - Empréstimo #EMP001                       │
├─────────────────────────────────────────────────────────┤
│ HASH DE INTEGRIDADE                                     │
│ 0x7a5f3c8e9b2d1a4f6e8c9d2b5a8f3c7e1d4b6a9c2f5e8d1a... │
│                                                         │
│ DADOS DO EMPRÉSTIMO                                     │
│ {                                                       │
│   "id": "EMP001",                                       │
│   "tomador": "0x742d35Cc...",                          │
│   "valor": 5000000,                                     │
│   "score_calculado": 75,                               │
│   "versao_regras": "v1.2.1"                           │
│ }                                                       │
│                                                         │
│ TRANSAÇÕES ON-CHAIN                                     │
│ • Bloqueio de garantias: 0xabc123...                   │
│ • Desembolso: 0xdef456...                              │
│ • Pagamento #1: 0x789ghi...                            │
│                                                         │
│ [🔄 Recomputar Hash] [📋 Exportar JSON]                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎭 **DEMO PARA A BANCA (2 minutos)**

### **Roteiro Sugerido:**

1. **[15s]** Mostra tela inicial, seleciona "Tomador"
2. **[30s]** Cria empréstimo, mostra score e taxa calculada
3. **[15s]** Muda para "Apoiador", endossa o empréstimo
4. **[20s]** Volta ao tomador, mostra taxa reduzida
5. **[15s]** Simula pagamento, score aumenta
6. **[15s]** Aciona inadimplência, mostra waterfall
7. **[10s]** Mostra auditoria com hash verificável

---

## 🛠️ **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos**

```
src/
├── app/
│   ├── role-selection/page.tsx     # Tela inicial
│   ├── borrower/page.tsx          # Dashboard Tomador
│   ├── endorser/page.tsx          # Dashboard Apoiador
│   ├── lender/page.tsx            # Dashboard Lender
│   └── audit/[id]/page.tsx        # Auditoria melhorada
├── lib/
│   ├── context/UserContext.tsx    # Contexto de papel
│   ├── contracts/demo.ts          # Contratos fictícios
│   └── types/business.ts          # Regras de negócio
└── components/
    ├── role/[Role]Dashboard.tsx   # Componentes específicos
    └── shared/UserHeader.tsx      # Header com papel atual
```

### **Tecnologias Utilizadas**

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Viem** - Interação blockchain
- **Zustand** - Gerenciamento de estado
- **RainbowKit** - Conectividade de carteiras

---

## ✅ **CRITÉRIOS DE ACEITE**

A demo estará pronta quando conseguir executar sem falhas:

1. ✅ **Seleção de papel** funcional
2. ✅ **Cálculo de score** determinístico
3. ✅ **Endosso** altera taxa em tempo real
4. ✅ **Pagamento** aumenta score
5. ✅ **Waterfall** redistribui perdas corretamente
6. ✅ **Auditoria** mostra dados íntegros
7. ✅ **Logout** reinicia sessão

---

## 🎯 **RESULTADO ESPERADO**

Ao final, a banca verá um sistema que:

- **Democratiza o crédito** através de score social
- **Incentiva colaboração** com taxas reduzidas
- **Garante transparência** com blockchain
- **Distribui riscos** de forma justa
- **Previne fraudes** com detecção automática

**TrustLend = Crédito + Confiança + Tecnologia** 🚀
