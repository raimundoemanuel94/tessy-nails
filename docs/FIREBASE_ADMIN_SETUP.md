# 🔐 FIREBASE ADMIN SDK - GUIA COMPLETO

## ⚡ TL;DR (Rápido)

1. **Firebase Console** → Project Settings → Service Accounts
2. **Generate New Private Key** → Baixa JSON
3. **Copiar valores para `.env.local`**:
   ```bash
   FIREBASE_PROJECT_ID=seu_project_id
   FIREBASE_CLIENT_EMAIL=seu_email_service_account
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
4. **Pronto!** APIs de notificação e pagamento funcionam

---

## 📋 PASSO-A-PASSO DETALHADO

### 1️⃣ Ir para Firebase Console

1. Abrir https://console.firebase.google.com
2. Selecionar projeto **tessy-nails**
3. Clicar em ⚙️ (Configurações) → **Project Settings**

### 2️⃣ Gerar Chave Privada

1. Ir para aba **Service Accounts**
2. Selecionar **Firebase Admin SDK**
3. Clicar em **Generate New Private Key**
4. Arquivo JSON será baixado automaticamente

### 3️⃣ Extrair Valores do JSON

Arquivo baixado se parece com:
```json
{
  "type": "service_account",
  "project_id": "tessy-nails",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### 4️⃣ Copiar para `.env.local`

**Arquivo**: `.env.local` (não commitar!)

```bash
# Copiar exatamente como está no JSON:
FIREBASE_PROJECT_ID=tessy-nails
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZ...\n-----END PRIVATE KEY-----\n"
```

### 5️⃣ Verificar no Terminal

```bash
# Teste se está correto
echo $FIREBASE_PROJECT_ID
# Deve mostrar: tessy-nails

echo $FIREBASE_CLIENT_EMAIL
# Deve mostrar: firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com
```

### 6️⃣ Reiniciar App

```bash
# Parar servidor (Ctrl+C)
# Reiniciar:
npm run dev
```

### 7️⃣ Testar APIs

```bash
# Teste de disponibilidade
curl "http://localhost:3000/api/appointments/availability?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z"

# Deve retornar:
# {"busySlots": [...]}  ← OK!
# ou
# {"error": "..."}      ← Falha
```

---

## ⚠️ ARMADILHAS COMUNS

### ❌ `FIREBASE_PRIVATE_KEY` com quebras de linha erradas
```bash
# ERRADO (quebra no meio)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----"

# CERTO (com \n literal)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### ❌ Esquecer de adicionar `\n` final
```bash
# ERRADO (sem \n no final)
FIREBASE_PRIVATE_KEY="...-----END PRIVATE KEY-----"

# CERTO (com \n no final)
FIREBASE_PRIVATE_KEY="...-----END PRIVATE KEY-----\n"
```

### ❌ Commitar `.env.local` no git
```bash
# Verificar gitignore
cat .gitignore | grep env.local

# Se não estiver, adicionar:
echo ".env.local" >> .gitignore
```

---

## 🔄 EM PRODUÇÃO (VERCEL)

Não colocar em git! Usar **Vercel Environment Variables**:

1. Vercel Dashboard → Project → Settings
2. Environment Variables
3. Adicionar as 3 variáveis (copiar do `.env.local`)
4. Deploy

```
FIREBASE_PROJECT_ID = tessy-nails
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-...
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

---

## 🧪 TESTE RÁPIDO

```bash
# 1. Abrir terminal na pasta do projeto
cd /path/to/tessy-nails

# 2. Carregar variáveis
source .env.local

# 3. Verificar se Firebase Admin está configurado
npm run dev

# 4. Em outro terminal, testar:
curl "http://localhost:3000/api/appointments/availability?start=$(date -u +%Y-%m-%dT00:00:00Z)&end=$(date -u +%Y-%m-%dT23:59:59Z)"

# Se receber JSON (mesmo que vazio), está funcionando! ✅
```

---

## 📊 O QUE FUNCIONA APÓS CONFIGURAR

| Funcionalidade | Antes | Depois |
|---|---|---|
| `/api/appointments/availability` | ❌ 500 | ✅ 200 |
| `/api/notifications/send` | ❌ Erro | ✅ Funciona |
| `/api/stripe/verify` | ❌ Não atualiza | ✅ Atualiza agendamento |
| Dashboard Admin | ✅ Funciona | ✅ Mesma coisa |
| Agendamento Cliente | ✅ Funciona | ✅ Mesma coisa |

---

## 🆘 TROUBLESHOOTING

### API retorna 500 - Firebase Admin não configurado
**Erro típico**:
```
Error: Firebase Admin não configurado
Status: 500
```

**Solução**:
1. Verificar se `.env.local` existe
2. Verificar se `FIREBASE_PRIVATE_KEY` tem `\n` literal
3. Reiniciar app: `npm run dev`
4. Testar novamente

### `FIREBASE_PRIVATE_KEY` com espaçamento errado
**Erro**:
```
Error: error:0906D06C:PEM routines:PEM_read_bio:no start line
```

**Solução**:
```bash
# ❌ ERRADO
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADA...

# ✅ CERTO (com \n literal, não quebra real)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADA\n-----END PRIVATE KEY-----\n"
```

### Variável não está sendo lida
```bash
# Verificar:
echo $FIREBASE_PROJECT_ID

# Se vazio, fazer:
source .env.local
echo $FIREBASE_PROJECT_ID

# Se ainda vazio, verificar se arquivo existe:
ls -la .env.local
```

---

## 📚 MAIS INFORMAÇÕES

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Service Account Setup](https://firebase.google.com/docs/app-check/custom-resource-backend?hl=pt-BR)
- [Environment Variables - Best Practices](https://12factor.net/config)

---

**Última atualização**: Abril 2026
**Status**: Pronto para usar
