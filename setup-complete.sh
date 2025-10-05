#!/bin/bash

echo "🚀 TrustLend Sepolia - Setup Completo"
echo "====================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar pré-requisitos
echo ""
print_info "Verificando pré-requisitos..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado. Instale Node.js 18.17+"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm encontrado: $NPM_VERSION"
else
    print_error "npm não encontrado"
    exit 1
fi

# Docker/Podman
if command -v podman-compose &> /dev/null; then
    print_status "podman-compose encontrado"
    DOCKER_CMD="podman-compose"
elif command -v docker-compose &> /dev/null; then
    print_status "docker-compose encontrado"
    DOCKER_CMD="docker-compose"
else
    print_error "Docker ou Podman não encontrado"
    exit 1
fi

# Instalar dependências
echo ""
print_info "Instalando dependências..."
if npm install; then
    print_status "Dependências instaladas"
else
    print_error "Falha ao instalar dependências"
    exit 1
fi

# Verificar arquivo .env.local
echo ""
print_info "Verificando configuração de ambiente..."
if [ ! -f ".env.local" ]; then
    print_warning "Arquivo .env.local não encontrado"
    if [ -f "env-config.txt" ]; then
        cp env-config.txt .env.local
        print_status "Arquivo .env.local criado a partir do template"
    else
        print_error "Template env-config.txt não encontrado"
        exit 1
    fi
else
    print_status "Arquivo .env.local encontrado"
fi

# Iniciar containers
echo ""
print_info "Iniciando containers Docker/Podman..."
if $DOCKER_CMD up -d; then
    print_status "Containers iniciados"
    sleep 5  # Aguardar containers iniciarem
else
    print_error "Falha ao iniciar containers"
    exit 1
fi

# Verificar se PostgreSQL está rodando
echo ""
print_info "Verificando conexão com PostgreSQL..."
sleep 3
if $DOCKER_CMD ps | grep -q "trustland_db"; then
    print_status "PostgreSQL está rodando"
else
    print_error "PostgreSQL não está rodando"
    exit 1
fi

# Aplicar schema do banco
echo ""
print_info "Aplicando schema do banco de dados..."
if DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx prisma db push; then
    print_status "Schema aplicado com sucesso"
else
    print_error "Falha ao aplicar schema"
    exit 1
fi

# Executar seed
echo ""
print_info "Populando banco com carteiras Sepolia..."
if DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx tsx prisma/seed-sepolia-clean.ts; then
    print_status "Banco populado com sucesso"
else
    print_error "Falha ao popular banco"
    exit 1
fi

# Verificar se tudo está funcionando
echo ""
print_info "Verificando configuração..."

# Testar conexão com banco
if DATABASE_URL="postgresql://trustlend:trustlend123@localhost:5432/trustlend" npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    print_status "Conexão com banco OK"
else
    print_warning "Problema na conexão com banco"
fi

echo ""
echo "🎉 Setup completo!"
echo "=================="
echo ""
print_info "Para iniciar o servidor:"
echo "DATABASE_URL=\"postgresql://trustlend:trustlend123@localhost:5432/trustlend\" npm run dev"
echo ""
print_info "Carteiras Sepolia disponíveis:"
echo "• PROVEDOR: 0x58213dC88141ac1D30d94ACF7007C7e5938f9600"
echo "• TOMADOR:  0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06"
echo "• APOIADOR: 0x294C347EA5Bf8496391cD424eFe04D0C6C650933"
echo "• ADMIN:    0x0000000000000000000000000000000000000001"
echo ""
print_info "Contratos Sepolia:"
echo "• TrustLend MVP: 0x7767005fdcDBF5d88C419f8fdFd549B786648C7e"
echo "• Mock USDC:     0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E"
echo ""
print_info "Acesse: http://localhost:3000/auth"
echo ""
print_status "Sistema pronto para demonstração! 🚀"
