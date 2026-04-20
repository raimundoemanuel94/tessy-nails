# 💳 STRIPE - GUIA COMPLETO DE CONFIGURAÇÃO

## ⚡ TL;DR (Rápido)

1. **Stripe Dashboard** → Developers → API Keys
2. **Copiar Secret Key** (começa com `sk_live_` ou `sk_test_`)
3. **Adicionar em `.env.local`**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
   ```
4. **Pronto!** Checkout e verificação de pagamento funcionam

---

## 📋 PASSO-A-PASSO DETALHADO

### 1️⃣ Abrir Stripe Dashboard

1. Ir para https://dashboard.stripe.com
2. Fazer login com sua conta Stripe
3. Selecionar sua conta (se tiver múltiplas)

### 2️⃣ Acessar API Keys

1. Menu lateral → **Developers**
2. Clicar em **API keys**
3. Você verá duas seções:
   - **Publishable key** (pública, pode estar no git)
   - **Secret key** (PRIVADA, NUNCA no git)

### 3️⃣ Copiar Chaves

**Secret Key** (PRIVADO):
```
sk_test_51234567890abcdefghijklmnop
↑ Esta começa com "sk_"
```

**Publishable Key** (PÚBLICO):
```
pk_test_51234567890abcdefghijklmnop
↑ Esta começa com "pk_"
```

### 4️⃣ Adicionar em `.env.local`

```bash
# PRIVADO - Nunca em git!
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop

# PÚBLICO - Pode ir no git
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop
```

### 5️⃣ Verificar no Terminal

```bash
echo $STRIPE_SECRET_KEY
# Deve mostrar: sk_test_... ou sk_live_...

echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Deve mostrar: pk_test_... ou pk_live_...
```

### 6️⃣ Reiniciar App

```bash
npm run dev
```

### 7️⃣ Testar Checkout

No browser:
1. Ir para `/cliente/agendar`
2. Selecionar um serviço
3. Clicar em "Pagar"
4. Deve abrir página do Stripe

### 8️⃣ Testar Pagamento (em modo teste)

Usar cartão de teste Stripe:
```
Número:    4242 4242 4242 4242
Expiração: Qualquer mês/ano futuro (ex: 12/25)
CVC:       Qualquer 3 dígitos (ex: 123)
```

---

## 🔄 DESENVOLVIMENTO vs PRODUÇÃO

### 🟢 Development (sk_test_)
- Modo teste
- Cartões fictícios funcionam
- Sem cobrar nada real
- Ideal para desenvolvimento

### 🔴 Produção (sk_live_)
- Modo real
- Cobra de verdade
- Nunca commitar em git
- Usar Vercel Environment Variables

---

## ⚠️ ARMADILHAS COMUNS

### ❌ Commitar `STRIPE_SECRET_KEY` no git
```bash
# ERRADO
git add .env.local
git commit -m "Add Stripe keys"

# CERTO
# .env.local deve estar em .gitignore
echo ".env.local" >> .gitignore
git add .gitignore
```

### ❌ Usar chave de teste em produção
```bash
# ERRADO (em produção)
STRIPE_SECRET_KEY=sk_test_...

# CERTO (em produção)
STRIPE_SECRET_KEY=sk_live_...
```

### ❌ Usar Publishable Key onde precisa Secret Key
```bash
# ERRADO
// src/app/api/stripe/checkout/route.ts
const stripe = new Stripe(pk_test_...); // ❌ Publishable

# CERTO
const stripe = new Stripe(sk_test_...); // ✅ Secret
```

---

## 📊 O QUE FUNCIONA APÓS CONFIGURAR

| Funcionalidade | Antes | Depois |
|---|---|---|
| `/api/stripe/checkout` | ⚠️ Chave dummy | ✅ Funciona |
| Criar sessão de pagamento | ❌ Falha | ✅ Cria |
| Redirecionar para Stripe | ⚠️ Erro | ✅ Abre modal |
| Verificar pagamento | ❌ Não valida | ✅ Atualiza status |

---

## 🧪 TESTE RÁPIDO

### 1. Testar via API

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "Manicure",
    "price": 50.00,
    "appointmentId": "test123",
    "isDeposit": false
  }'

# Resposta esperada:
# {"url":"https://checkout.stripe.com/pay/...", "sessionId":"cs_test_..."}
```

### 2. Testar no App

1. Login com `admin@tessynails.com`
2. Ir para Dashboard
3. Clicar em "Novo Agendamento"
4. Preencher dados
5. Clicar em "Pagar"
6. Deve abrir Stripe Checkout

### 3. Usar cartão de teste

```
Número:    4242 4242 4242 4242
Expiração: 12/25 (ou qualquer futuro)
CVC:       123
Nome:      Cualquier nombre
```

Resultado esperado:
- ✅ Pagamento marcado como "paid"
- ✅ Agendamento atualizado para "confirmed"
- ✅ Usuário redirecionado para página de sucesso

---

## 🔄 EM PRODUÇÃO (VERCEL)

1. **Gerar chaves reais** em Stripe (não teste)
2. **Ir para Vercel** → Project → Settings
3. **Environment Variables** → Add
4. **Adicionar**:
   ```
   STRIPE_SECRET_KEY = sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
   ```
5. **Deploy**

---

## 🆘 TROUBLESHOOTING

### API retorna 503 - Stripe não configurado
**Erro**:
```
{
  "error": "Sistema de pagamento não configurado",
  "message": "Entre em contato com o suporte"
}
```

**Solução**:
1. Verificar se `STRIPE_SECRET_KEY` está em `.env.local`
2. Verificar se começa com `sk_`
3. Não commitar! Deve estar em `.gitignore`
4. Reiniciar app: `npm run dev`

### Stripe retorna "Invalid request"
**Erro**:
```
Error: Invalid API Key provided
```

**Solução**:
1. Verificar se chave está correta
2. Copiar novamente do Stripe Dashboard
3. Não adicionar espaços ou quebras
4. Deve ser exatamente: `sk_test_...` ou `sk_live_...`

### Cartão de teste não funciona
**Situação**: Usa cartão 4242... mas recusa

**Solução**:
- Em modo teste, cartão 4242 sempre é aceito
- Se rejeita, verificar se tem `STRIPE_SECRET_KEY` real
- Com chave dummy, cartões teste são rejeitados

### Webhook não recebe notificação
**Situação**: Pagamento completo mas webhook não dispara

**Solução**:
1. Verificar se Webhook está configurado em Stripe
2. Usar Stripe CLI para testar local: `stripe listen`
3. Em produção, Stripe chama o webhook automaticamente

---

## 📚 ENDPOINTS STRIPE NO APP

### 1. Criar Sessão de Checkout
```bash
POST /api/stripe/checkout
Content-Type: application/json

{
  "serviceName": "Manicure",
  "price": 50.00,
  "appointmentId": "apt_123",
  "clientId": "client_456",
  "isDeposit": false
}

Resposta:
{
  "url": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_test_..."
}
```

### 2. Verificar Pagamento
```bash
POST /api/stripe/verify
Content-Type: application/json

{
  "sessionId": "cs_test_..."
}

Resposta:
{
  "success": true,
  "message": "Pagamento validado e agendamento confirmado."
}
```

---

## 💡 DICAS

1. **Usar modo teste primeiro** (`sk_test_`)
   - Desenvolva e teste sem risco
   - Use cartões 4242...

2. **Migrar para modo real** quando pronto
   - Gerar novas chaves `sk_live_`
   - Copiar em Vercel (não git!)
   - Deploy

3. **Monitorar pagamentos**
   - Stripe Dashboard → Payments
   - Ver histórico de transações
   - Teste com seus cartões reais

4. **Usar Stripe Testing** para casos especiais:
   - 4000 0000 0000 0002 → Recusa (CVC falha)
   - 4000 0000 0000 0069 → Requer autenticação
   - [Mais cartões de teste](https://stripe.com/docs/testing)

---

**Última atualização**: Abril 2026
**Status**: Pronto para usar
**Segurança**: ⭐⭐⭐⭐⭐
