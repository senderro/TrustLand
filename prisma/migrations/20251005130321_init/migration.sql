-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "endereco" TEXT,
    "carteira" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "network" TEXT NOT NULL DEFAULT 'sepolia',
    "isContract" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tomadorId" TEXT NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "taxaAnualBps" INTEGER NOT NULL,
    "prazoParcelas" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataInicio" DATETIME,
    "dataFim" DATETIME,
    "colateral" INTEGER NOT NULL DEFAULT 0,
    "valorPago" INTEGER NOT NULL DEFAULT 0,
    "hashRegras" TEXT NOT NULL,
    "contractAddress" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "network" TEXT NOT NULL DEFAULT 'sepolia',
    "onChainId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Emprestimo_tomadorId_fkey" FOREIGN KEY ("tomadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "emprestimoId" TEXT NOT NULL,
    "indice" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "paidAt" DATETIME,
    CONSTRAINT "Parcela_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "Emprestimo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Endosso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprestimoId" TEXT NOT NULL,
    "apoiadorId" TEXT NOT NULL,
    "valorStake" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataBloqueio" DATETIME,
    "dataLiberacao" DATETIME,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "onChainId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Endosso_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "Emprestimo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Endosso_apoiadorId_fkey" FOREIGN KEY ("apoiadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FlagFraude" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "resultado" TEXT,
    CONSTRAINT "FlagFraude_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParametrosSistema" (
    "versao" TEXT NOT NULL PRIMARY KEY,
    "tabelaPricing" TEXT NOT NULL,
    "toleranciaAtraso" INTEGER NOT NULL,
    "tempoParcelaS" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LogsDeDecisao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprestimoId" TEXT,
    "inputDados" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "hashDecisao" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PoolPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provedorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "depositDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "withdrawTxHash" TEXT,
    "withdrawDate" DATETIME,
    CONSTRAINT "PoolPosition_provedorId_fkey" FOREIGN KEY ("provedorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "network" TEXT NOT NULL,
    "poolAddress" TEXT,
    "factoryAddress" TEXT,
    "usdcAddress" TEXT NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "blockExplorer" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "network" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "amount" INTEGER,
    "gasUsed" INTEGER,
    "gasPrice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referenciaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_carteira_key" ON "Usuario"("carteira");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_emprestimoId_indice_key" ON "Parcela"("emprestimoId", "indice");

-- CreateIndex
CREATE UNIQUE INDEX "Evento_idempotencyKey_key" ON "Evento"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LogsDeDecisao_hashDecisao_key" ON "LogsDeDecisao"("hashDecisao");

-- CreateIndex
CREATE UNIQUE INDEX "ContractConfig_network_key" ON "ContractConfig"("network");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");
