# 🚀 TrustLend Sepolia - Sistema de Empréstimos Descentralizado

Sistema completo de empréstimos P2P com integração Sepolia, dashboards especializados e contratos inteligentes deployados.

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Completa](#configuração-completa)
- [Carteiras Sepolia](#carteiras-sepolia)
- [Contratos Deployados](#contratos-deployados)
- [Como Testar](#como-testar)
- [Fluxos de Teste](#fluxos-de-teste)
- [Troubleshooting](#troubleshooting)
- [Arquitetura](#arquitetura)

## 🎯 Visão Geral

TrustLend é uma plataforma descentralizada de empréstimos P2P que conecta:
- **Tomadores**: Solicitam empréstimos com taxas baseadas em score social
- **Apoiadores**: Endossam empréstimos, compartilhando risco e retorno
- **Provedores**: Fornecem liquidez ao pool, recebendo rendimentos
- **Operadores**: Administram o sistema e aprovam empréstimos

## 🔧 Pré-requisitos

- **Node.js** 18.17+ 
- **npm** ou **yarn**
- **Docker** ou **Podman** (para PostgreSQL)
- **Git**

## ⚡ Configuração Completa

### 1. Clone e instale dependências
```bash
git clone https://github.com/seu-repo/trustlend
cd TrustLand
npm install
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
DATABASE_URL=postgresql://trustlend:trustlend123@localhost:5432/trustlend
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l
PRIVATE_KEY=0x0145ecac895ec049c57e1f3eb10753021d489a2a16f7c108150382f981ae56bc
ETHERSCAN_API_KEY=QHUY3YUUS8G3V38YJ4EY8GQCXXYPBBZBQ4
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_USDC_ADDRESS=0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E
NEXT_PUBLIC_MVP_ADDRESS=0x7767005fdcDBF5d88C419f8fdFd549B786648C7e
```

### 3. Inicie o banco de dados PostgreSQL
```bash
# Usando podman-compose (recomendado)
podman-compose up -d

# Ou usando docker-compose
docker-compose up -d

# Verifique se está rodando
podman ps
# ou
docker ps
```

### 4. Configure o banco de dados
```bash
# Aplique o schema do Prisma
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx prisma db push

# Execute o seed com carteiras Sepolia
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx tsx prisma/seed-sepolia-clean.ts
```

### 5. Inicie o servidor de desenvolvimento
```bash
# Com variável de ambiente inline (recomendado)
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npm run dev

# Ou se o .env.local estiver configurado corretamente
npm run dev
```

### 6. Acesse o sistema
- **URL**: http://localhost:3000 (ou porta indicada no terminal)
- **Página de login**: http://localhost:3000/auth

## 🔑 Carteiras Sepolia

### Carteiras de Teste Pré-configuradas

| Papel | Nome | Endereço | Score |
|-------|------|----------|-------|
| **PROVEDOR** | Provedor Alpha | `0x58213dC88141ac1D30d94ACF7007C7e5938f9600` | 95 |
| **PROVEDOR** | Provedor Beta | `0x79F821FF94D3416C2C913a3960C8666813AAcF7F` | 88 |
| **TOMADOR** | Tomador Principal | `0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06` | 75 |
| **APOIADOR** | Apoiador Gamma | `0x294C347EA5Bf8496391cD424eFe04D0C6C650933` | 82 |
| **APOIADOR** | Apoiador Delta | `0x89a0293626D73a76c2e6547902F190343FBb54A1` | 78 |
| **ADMIN** | Admin Sistema | `0x0000000000000000000000000000000000000001` | 100 |

### Como Usar
1. Acesse http://localhost:3000/auth
2. Cole o endereço da carteira no campo de login
3. Selecione o tipo de usuário correspondente
4. Clique em "Entrar"

## 📜 Contratos Deployados

### Sepolia Testnet
- **TrustLend MVP**: [`0x7767005fdcDBF5d88C419f8fdFd549B786648C7e`](https://sepolia.etherscan.io/address/0x7767005fdcDBF5d88C419f8fdFd549B786648C7e)
- **Mock USDC**: [`0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E`](https://sepolia.etherscan.io/address/0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E)

### Recursos dos Contratos
- Criação de empréstimos com score social
- Sistema de endossos com stake
- Pool de liquidez com APY dinâmico
- Waterfall para inadimplência
- Auditoria on-chain

## 🧪 Como Testar

### 1. Fluxo do Tomador
```
Login → Dashboard → Criar Empréstimo → Aguardar Endossos → Receber Fundos
```
- Use a carteira: `0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06`
- Taxa automática: 14% a.a. (score 75)
- Limite: até 8 USDC
- Cobertura mínima: 25%

### 2. Fluxo do Apoiador
```
Login → Dashboard → Pesquisar Tomadores → Endossar → Acompanhar Retornos
```
- Use a carteira: `0x294C347EA5Bf8496391cD424eFe04D0C6C650933`
- Funcionalidades:
  - 🔍 Pesquisar por carteira/CPF
  - 💰 Endossar com valores decimais (0.10, 0.5)
  - 📊 Visualizar métricas de risco
  - 📈 Acompanhar rendimentos

### 3. Fluxo do Provedor
```
Login → Dashboard → Depositar Liquidez → Monitorar Pool → Sacar Rendimentos
```
- Use a carteira: `0x58213dC88141ac1D30d94ACF7007C7e5938f9600`
- Métricas disponíveis:
  - TVL (Total Value Locked)
  - APY dinâmico
  - Taxa de utilização
  - Default rate

### 4. Fluxo do Operador
```
Login → Dashboard → Gerenciar Sistema → Aprovar Empréstimos → Auditoria
```
- Use a carteira: `0x0000000000000000000000000000000000000001`
- Funcionalidades:
  - Gestão de usuários
  - Aprovação de empréstimos
  - Visualização de métricas
  - Logs de auditoria

## 🔄 Fluxos de Teste

### Cenário 1: Empréstimo com Endosso Completo
1. **Tomador** cria empréstimo de 1 USDC
2. **Apoiador Gamma** endossa 0.25 USDC
3. **Apoiador Delta** endossa 0.25 USDC
4. **Sistema** aprova automaticamente (cobertura > 25%)
5. **Provedor** fornece liquidez automaticamente
6. **Tomador** recebe fundos

### Cenário 2: Gestão de Liquidez
1. **Provedor Alpha** deposita 5 USDC
2. **Provedor Beta** deposita 3 USDC
3. **Pool** atualiza TVL e APY
4. **Tomadores** podem solicitar até o limite do pool
5. **Provedores** recebem rendimentos proporcionais

### Cenário 3: Pesquisa e Filtros
1. **Apoiador** pesquisa tomador por carteira
2. **Sistema** retorna perfil e empréstimos
3. **Apoiador** filtra empréstimos pendentes
4. **Apoiador** endossa múltiplos empréstimos

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Backend**: Node.js, Prisma ORM, PostgreSQL
- **Blockchain**: Ethereum Sepolia, Ethers.js
- **UI Components**: shadcn/ui, Lucide Icons

### Estrutura do Projeto
```
trustlend/
├── src/
│   ├── app/              # Páginas Next.js
│   ├── components/       # Componentes React
│   │   ├── dashboards/  # Dashboards por papel
│   │   └── ui/          # Componentes UI
│   ├── lib/             # Utilidades e configurações
│   └── contexts/        # Context API
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── seed-sepolia.ts  # Seed com carteiras Sepolia
├── contracts/           # Contratos Solidity
└── docker-compose.yml   # Configuração Docker
```

### Modelo de Dados
```prisma
Usuario {
  id, nome, carteira, tipo, score, status
}

Emprestimo {
  id, tomadorId, valorTotal, taxaAnualBps, estado
}

Endosso {
  id, emprestimoId, apoiadorId, valorStake, status
}
```

## 📊 Métricas e Regras de Negócio

### Cálculo de Taxa (APR)
| Score | Faixa | Taxa Anual | Limite | Cobertura |
|-------|-------|------------|--------|-----------|
| 0-39 | BAIXO | 22% | 2 USDC | 100% |
| 40-69 | MÉDIO | 18% | 5 USDC | 50% |
| 70-89 | BOM | 14% | 8 USDC | 25% |
| 90-100 | EXCELENTE | 9% | 10 USDC | 0% |

### Sistema de Waterfall
1. **Inadimplência**: Após 30 dias de atraso
2. **Liquidação**: Endossos são cortados proporcionalmente
3. **Recuperação**: Pool absorve perda residual
4. **Penalidade**: Score do tomador reduzido

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Banco de Dados
npm run db:push          # Aplicar schema ao banco
npm run db:seed          # Popular banco com dados

# Build
npm run build            # Build para produção
npm run start            # Iniciar servidor de produção

# Docker
podman-compose up -d     # Subir containers
podman-compose down      # Derrubar containers
podman-compose logs -f   # Ver logs

# Prisma
npx prisma studio        # Interface visual do banco
npx prisma generate      # Gerar cliente Prisma
```

## 🐛 Troubleshooting

### ❌ Erro: "Usuário não encontrado"
**Causa**: Banco não foi populado com as carteiras Sepolia
```bash
# Solução: Reexecute o seed
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx tsx prisma/seed-sepolia-clean.ts
```

### ❌ Erro: "Cannot connect to database"
**Causa**: PostgreSQL não está rodando
```bash
# Verifique se o container está ativo
podman ps
# ou
docker ps

# Reinicie os containers se necessário
podman-compose down && podman-compose up -d
```

### ❌ Erro: "Port already in use"
**Causa**: Porta 3000 ocupada por outro processo
```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 [PID]

# Ou use uma porta diferente
PORT=3001 npm run dev
```

### ❌ Erro: "Module build failed" ou "Syntax Error"
**Causa**: Erro de sintaxe no código
```bash
# Limpe o cache do Next.js
rm -rf .next

# Reinstale dependências
rm -rf node_modules package-lock.json
npm install

# Reinicie o servidor
npm run dev
```

### ❌ Erro: "Prisma Client not found"
**Causa**: Cliente Prisma não foi gerado
```bash
# Gere o cliente Prisma
npx prisma generate

# Aplique o schema novamente
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx prisma db push
```

### ❌ Erro: "Environment variable not found"
**Causa**: Arquivo .env.local não configurado
```bash
# Verifique se o arquivo existe
ls -la .env.local

# Copie a configuração correta do env-config.txt
cp env-config.txt .env.local
```

### 🔧 Comandos de Diagnóstico
```bash
# Verificar status dos containers
podman ps -a

# Verificar logs do banco
podman logs trustland_db_1

# Verificar conexão com o banco
DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx prisma db push --preview-feature

# Testar API diretamente
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"carteira":"0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06","tipo":"TOMADOR"}'
```

## 📝 Notas Importantes

1. **Carteiras Reais**: As carteiras Sepolia são reais e podem interagir com contratos na testnet
2. **Gas Fees**: Necessário ETH Sepolia para transações (obtenha em faucets)
3. **Mock USDC**: Token de teste, sem valor real
4. **Dados de Demo**: Empréstimos criados no seed são para demonstração

## 🔗 Links Úteis

- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Contrato TrustLend](https://sepolia.etherscan.io/address/0x7767005fdcDBF5d88C419f8fdFd549B786648C7e)
- [Mock USDC](https://sepolia.etherscan.io/address/0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E)

## 📄 Licença

MIT License - Veja LICENSE para detalhes

---

**Desenvolvido com ❤️ para demonstração de sistema DeFi na Sepolia Testnet**
