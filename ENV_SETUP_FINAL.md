# 🚀 SETUP FINAL - VARIÁVEIS DE AMBIENTE

## ⚡ RÁPIDO (5 minutos)

### 1. Firebase Admin
```bash
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key

# Copiar para .env.local:
FIREBASE_PROJECT_ID=tessy-nails
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

### 2. Stripe
```bash
# Stripe Dashboard > Developers > API Keys > Copy Secret Key

# Copiar para .env.local:
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
```

### 3. Reiniciar
```bash
npm run dev
```

**Pronto! ✅**

---

## 📋 ARQUIVO `.env.local` COMPLETO

Criar arquivo na raiz do projeto:

```env
# ============================================
# FIREBASE - Web App (PÚBLICO)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tessy-nails.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tessy-nails
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tessy-nails.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=229831786550
NEXT_PUBLIC_FIREBASE_APP_ID=1:229831786550:web:187fea7504f60afc90d897
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8HVWP6L1F7

# ============================================
# FIREBASE - Admin SDK (PRIVADO)
# ============================================
# ⚠️ NÃO COMMITAR ESTES VALORES!

FIREBASE_PROJECT_ID=tessy-nails
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"

# ============================================
# STRIPE (PRIVADO)
# ============================================
# ⚠️ NÃO COMMITAR ESTES VALORES!

STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📍 COMO OBTER CADA VALOR

### Firebase Web (Public - pode commitir)
**Status**: ✅ JÁ PREENCHIDO (veja `.env.local` existente)

### Firebase Admin (Private - NÃO commitir)

**Passo 1**: Abrir https://console.firebase.google.com
**Passo 2**: Selecionar projeto `tessy-nails`
**Passo 3**: ⚙️ Settings → Service Accounts
**Passo 4**: Generate New Private Key → Baixa JSON

**Arquivo JSON terá**:
```json
{
  "project_id": "tessy-nails",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com"
}
```

**Copiar exatamente estes 3 valores para `.env.local`**

### Stripe (Private - NÃO commitir)

**Passo 1**: Abrir https://dashboard.stripe.com
**Passo 2**: Menu → Developers → API keys
**Passo 3**: Copiar "Secret key" (começa com `sk_test_` ou `sk_live_`)

**Para desenvolvimento**: Use `sk_test_...`
**Para produção**: Use `sk_live_...`

---

## ✅ VERIFICAÇÃO

```bash
# Testar se está tudo certo:
echo "Firebase Project: $FIREBASE_PROJECT_ID"
echo "Stripe Key: $STRIPE_SECRET_KEY"

# Deve mostrar valores reais, não vazios
```

---

## 🔒 SEGURANÇA

### `.gitignore` deve ter:
```bash
# Variáveis de ambiente
.env.local
.env.*.local
.env.production.local

# Service accounts
serviceAccountKey.json
*-credentials.json

# Cache
.next
node_modules
```

### Verificar:
```bash
cat .gitignore | grep -E "(env|serviceAccount)"
```

---

## 🚀 RESULTADO FINAL

Após adicionar `.env.local`, o sistema fica **100% funcional**:

| Funcionalidade | Status |
|---|---|
| ✅ Login | Funciona |
| ✅ Agendamentos | Funciona |
| ✅ Dashboard Admin | Funciona |
| ✅ Buscar Slots | Funciona |
| ✅ Pagamento Stripe | Funciona |
| ✅ Verificar Pagamento | Funciona |
| ✅ Notificações Push | Funciona |

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, ler:
- `docs/FIREBASE_ADMIN_SETUP.md` - Setup Firebase Admin passo-a-passo
- `docs/STRIPE_SETUP.md` - Setup Stripe com exemplos
- `SETUP_CHECKLIST.md` - Checklist completo
- `FIXES_APPLIED.md` - O que foi corrigido

---

## 🆘 CHECAGEM RÁPIDA

Se algo não funciona:

1. **Verificar se `.env.local` existe**:
   ```bash
   ls -la .env.local
   ```

2. **Verificar se tem valores**:
   ```bash
   grep FIREBASE_PROJECT_ID .env.local
   grep STRIPE_SECRET_KEY .env.local
   ```

3. **Reiniciar app**:
   ```bash
   npm run dev
   ```

4. **Verificar console**:
   - Abrir Developer Tools
   - Aba Console
   - Ver se tem errors de Firebase ou Stripe

---

**Última atualização**: Abril 2026
**Status**: 🟢 Pronto para usar
**Tempo estimado**: 5 minutos
