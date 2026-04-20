# ✅ CHECKLIST DE CONFIGURAÇÃO - TESSY NAILS

## 🟢 CONFIGURAÇÃO ESSENCIAL (OBRIGATÓRIO)

### 1. Firebase - Credenciais do Admin SDK
**Status**: ❌ NÃO CONFIGURADO
**Por quê**: APIs de notificação e verificação de pagamento precisam
**Como**: 
```bash
# 1. Abrir Firebase Console
# 2. Ir em Configurações do Projeto > Contas de Serviço
# 3. Gerar nova chave privada (JSON)
# 4. Copiar os valores para .env.local:

FIREBASE_PROJECT_ID=tessy-nails
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tessy-nails.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Impacto se não configurar**:
- ❌ Notificações não funcionam
- ❌ Verificação de pagamento não atualiza agendamento
- ❌ API `/api/appointments/availability` retorna erro 500

---

### 2. Stripe - Chave Secreta
**Status**: ❌ NÃO CONFIGURADO
**Por quê**: Pagamentos precisam da chave real (não dummy)
**Como**:
```bash
# 1. Abrir Stripe Dashboard
# 2. Ir em Chaves API
# 3. Copiar Chave Secreta (começa com sk_live_ ou sk_test_)
# 4. Adicionar em .env.local:

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

**Impacto se não configurar**:
- ❌ Checkout criado com chave dummy (falha em produção)
- ⚠️ Teste funciona, mas pagamentos reais falham
- ❌ Verificação de pagamento não consegue validar

---

## 🟡 CONFIGURAÇÃO RECOMENDADA (FUNCIONALIDADES EXTRAS)

### 3. Stripe - Chave Publicável (Frontend)
**Status**: ⚠️ OPCIONAL
**Por quê**: Para validação frontend (não crítico)
**Como**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

---

### 4. Firebase Messaging - Service Worker
**Status**: ✅ JÁ CONFIGURADO
**Arquivo**: `public/firebase-messaging-sw.js`
**Funciona**: Notificações push no celular

---

## 🔵 ESTADO ATUAL DO SISTEMA

| Funcionalidade | Status | Dependência |
|---|---|---|
| Login | ✅ Funciona | Firebase Auth |
| Criar Agendamento | ✅ Funciona | Firestore |
| Listar Agendamentos | ✅ Funciona | Firestore |
| Dashboard Admin | ✅ Funciona | Firestore |
| Buscar Slots | ⚠️ Parcial | Firebase Admin |
| Checkout Stripe | ⚠️ Parcial | STRIPE_SECRET_KEY |
| Atualizar Pagamento | ❌ Falha | Firebase Admin |
| Notificações Push | ❌ Falha | Firebase Admin |

---

## 🚀 GUIA DE TESTE

### Sem Configuração (Agora)
```
✅ Login com admin@tessynails.com / admin123
✅ Ver dashboard com gráficos
✅ Criar agendamento (salva em Firestore)
✅ Listar agendamentos cliente
⚠️ Buscar horários disponíveis (pode falhar)
⚠️ Checkout (usa chave dummy)
❌ Notificação push (não funciona)
```

### Com Configuração (Depois)
```
✅ TUDO funciona
✅ Pagamentos reais processam
✅ Notificações chegam no celular
✅ Sistema pronto para produção
```

---

## 📋 PASSOS FINAIS

1. **Preencher `.env.local`**:
   ```bash
   # Copia valores reais do Firebase e Stripe
   # Não colocar NUNCA em git!
   ```

2. **Testar APIs**:
   ```bash
   # Teste local
   curl "http://localhost:3000/api/appointments/availability?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z"
   
   # Deve retornar JSON (mesmo que vazio)
   # Se retornar 500, Firebase Admin não está configurado
   ```

3. **Deploy em Produção**:
   ```bash
   # Adicionar variáveis em Vercel > Settings > Environment Variables
   # Não colocar no git!
   ```

---

## ⚠️ SEGURANÇA

**NUNCA commitar em git**:
- ❌ `FIREBASE_PRIVATE_KEY`
- ❌ `STRIPE_SECRET_KEY`
- ❌ `.env` ou `.env.local` com valores reais

**Sempre usar**:
- ✅ `.env.example` para template
- ✅ Variáveis de Ambiente no Vercel
- ✅ Secret Manager em produção

---

## 🆘 TROUBLESHOOTING

### API retorna 500 - Firebase Admin não configurado
```
Solução: Adicionar FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL
```

### Stripe retorna erro de chave inválida
```
Solução: Adicionar STRIPE_SECRET_KEY real (não dummy)
```

### Notificações não chegam
```
Solução: Verificar se Firebase Admin está configurado
```

---

**Última atualização**: Abril 2026
**Versão do Sistema**: 1.0
**Status geral**: 70% Funcional (bloqueado por 2 configurações)
