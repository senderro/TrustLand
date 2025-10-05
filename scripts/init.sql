-- Inicialização básica do banco de dados TrustLend
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Garantir que o banco está preparado para extensões
SELECT 'Database initialized for TrustLend' as status;
