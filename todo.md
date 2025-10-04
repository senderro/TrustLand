# TrustLend — Frontend MVP (Next.js App Router)

MVP de simulação de crédito com **score social**, **endossos**, **pagamentos** e **auditoria**, usando **Tailwind + shadcn/ui**, **React Query** e **wagmi/viem** (MetaMask).  

Paleta inspirada na **QI Tech** (azul petróleo `#002B49`, azul royal `#004F91`, roxo `#5C2D91`, neutros `#F5F7FA`, `#E1E5EB`, `#1C1C1C`).

---

## App Structure
- [ ] Criar pastas e providers
  - [ ] `src/app/layout.tsx` com fonte global, tema e `<Providers>`
  - [ ] `src/app/page.tsx` (home com atalhos)
  - [ ] `src/app/loans/new/page.tsx`
  - [ ] `src/app/loans/[id]/page.tsx`
  - [ ] `src/app/audit/[id]/page.tsx`
  - [ ] `src/components/ui/*` (shadcn)
  - [ ] `src/components/trust/*` (componentes do produto)
  - [ ] `src/lib/api.ts` (fetchers)
  - [ ] `src/lib/wagmi.ts` (config carteira)
  - [ ] `src/abis/*.json` (ABIs dos contratos)

- [ ] Providers
  - [ ] React Query provider
  - [ ] Theme provider (next-themes)
  - [ ] Wagmi/RainbowKit ou ConnectButton simples (MetaMask)

---

## Components
- [ ] `ScoreDial.tsx` (client)
  - [ ] Recebe `{score:number}`; cores: vermelho <40, amarelo 40–79, verde ≥80
  - [ ] Acessível (`aria-label`), tamanho responsivo

- [ ] `EndorseList.tsx` (client)
  - [ ] Lista de apoiadores + botão **Endossar**
  - [ ] Mostra cobertura (%) e estado

- [ ] `Timeline.tsx` (server-friendly)
  - [ ] Renderiza eventos: CREATED, ENDORSED, APPROVED, DISBURSED, PAID, LATE, DEFAULTED, SLASHED, RELEASED
  - [ ] Suporte a `hash` por evento (abre `/audit/[id]`)

- [ ] `HashBadge.tsx` (client)
  - [ ] Mostra hash abreviado + **copiar** + link para auditoria

- [ ] `LoanCard.tsx` (server)
  - [ ] Resumo (valor, prazo, score, estado)

- [ ] `WizardStep.tsx` (server-friendly)
  - [ ] Container com título, descrição, ações (próximo/voltar)

- [ ] Feedback
  - [ ] `LoadingSkeleton.tsx`
  - [ ] `EmptyState.tsx`
  - [ ] Toasts (shadcn `useToast`)

---

## Pages
### `/` (Home)
- [ ] Cards de atalho: **Criar pedido**, **Meus pedidos** (mock), **Painel de auditoria**
- [ ] Alguns `LoanCard` de exemplo

### `/loans/new` (Originação — server component)
- [ ] **Step 1:** Inputs `principal` (mUSDC), `termDays`, `purpose`
  - [ ] Validação simples; dica de faixas por score
- [ ] **Step 2:** Botão **Calcular score social**
  - [ ] Chama `issueScore`; renderiza `ScoreDial` + `HashBadge`
- [ ] **Step 3:** Botão **Criar pedido**
  - [ ] Chama `createLoan`; toast de sucesso + link para `/loans/[id]`
- [ ] Estado: loading/error/empty

### `/loans/[id]` (Detalhe — server component)
- [ ] Carregar `{loan, events}` via `getLoan`
- [ ] Header com valor, prazo, estado, `ScoreDial`
- [ ] **Endossos:** `EndorseList` + ação **Endossar**
- [ ] **Aprovação/Desembolso:** ação **Aprovar** (admin/simulação)
- [ ] **Pagamento:** form **Pagar parcial** (principal/juros) + ação
- [ ] **Default:** ação **Marcar default**
- [ ] `Timeline` completa
- [ ] Refresh/revalidate após cada ação

### `/audit/[id]` (Transparência — server component)
- [ ] Carregar `getAudit(id)` → mostrar `HashBadge` + JSON pretty (colapsável)
- [ ] Botão **Recomputar** (client) → confirma determinismo
- [ ] Linka eventos de `/loans/[id]`

---

## Integration
- [ ] `src/lib/api.ts`
  - [ ] `issueScore({principal, termDays})`
  - [ ] `createLoan({principal, termDays, purpose})`
  - [ ] `getLoan(id)` → `{loan, events}`
  - [ ] `getAudit(id)` → `{payload, hash}`
  - [ ] `endorse(id)` / `approve(id)` / `repay(id, body)` / `markDefault(id)`
  - [ ] Tratamento de erros (mensagem amigável)

- [ ] React Query
  - [ ] Query keys por rota
  - [ ] Invalidate/refresh após mutações

- [ ] ABIs/contratos (opcional na demo)
  - [ ] `src/abis/TrustLendMVP.json`, `MockUSDC.json`
  - [ ] `readContract` simples para exibir saldos/endereços (se útil)

---

## Wallet & Simulation (MetaMask)
- [ ] `src/lib/wagmi.ts` com chain **Sepolia**
- [ ] Botão **Conectar carteira** no header
- [ ] Mostrar endereço curto / ENS quando conectado
- [ ] Flag `?mock=1` para rodar sem wallet (roteiro da demo)
- [ ] Ações on-chain podem ser **simuladas** (somente registro off-chain + toast)

---

## Polish / UX & Branding
- [ ] **Paleta QI Tech** em `globals.css`/tokens Tailwind
  - [ ] primary: `#002B49`, accent: `#004F91`, highlight: `#5C2D91`
  - [ ] background: `#F5F7FA`, borders: `#E1E5EB`, text: `#1C1C1C`
- [ ] Tema dark/light (next-themes)
- [ ] Tipografia consistente (títulos, legendas, números)
- [ ] Acessibilidade: roles/labels, foco visível, contraste
- [ ] Responsivo: md/lg; evitar overflow em tabelas/timeline
- [ ] `robots` meta para páginas de simulação (noindex)

---

## Aceitação (check final antes do pitch)
- [ ] Criar pedido → score + hash exibidos → navega para `/loans/[id]`
- [ ] 2 endossos → cobertura ≥ 80% → **Aprovar** habilita
- [ ] **Pagar parcial** atualiza `Timeline`
- [ ] **Marcar default** registra eventos e libera “release/slash” (simulado)
- [ ] `/audit/[id]` mostra JSON e **Recomputar** retorna “OK”
- [ ] Mensagem visível: **“Simulação — sem valor financeiro real”**
