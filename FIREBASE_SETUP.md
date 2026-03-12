# 🔥 Configuração Completa do Firebase - Tessy Nails

Para que o projeto funcione corretamente, siga os passos abaixo para configurar seu ambiente Firebase completo.

## 📋 Passo 1: Criar Projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **Adicionar projeto**
3. Nome do projeto: `tessy-nails`
4. Continue com as configurações padrão

## 🔐 Passo 2: Configurar Authentication
1. No menu lateral, vá em **Authentication**
2. Clique em "Começar"
3. Na aba "Método de login", habilite:
   - ✅ **Email/Senha**
   - ✅ **Google** (opcional)
4. Salve as configurações

## 🗄️ Passo 3: Configurar Firestore Database
1. No menu lateral, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **Iniciar em modo de teste** (temporariamente)
4. Selecione uma localização (ex: `southamerica-east1`)
5. Clique em "Criar"

## � Passo 4: Configurar com Firebase Admin SDK (Recomendado)

### Método 1: Script Automático com Admin SDK

1. **Obter Service Account Key**:
   - Vá ao Firebase Console > Configurações do Projeto > Contas de serviço
   - Clique em "Gerar nova chave privada"
   - Baixe o arquivo JSON
   - Renomeie para `serviceAccountKey.json`
   - Coloque na pasta `scripts/`

2. **Instalar dependências**:
   ```bash
   npm install firebase-admin
   ```

3. **Executar script de configuração**:
   ```bash
   node scripts/setup-firestore-admin.js
   ```

### Método 2: Script Manual (sem Admin SDK)
```bash
# Instalar dependências do script
npm install firebase@10.7.1

# Executar script de configuração
node scripts/setup-firestore.js
```

O script vai criar automaticamente:
- ✅ 2 usuários (admin + professional)
- ✅ 4 serviços (manicure, pedicure, alongamento, etc)
- ✅ 2 clientes demo
- ✅ 2 agendamentos exemplo
- ✅ Configurações do salão

## 📝 Passo 5: Configurar Regras de Segurança
1. Em Firestore > Regras
2. Substitua o conteúdo com:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Clique em "Publicar"

## 🔑 Passo 6: Obter Credenciais
1. Em Configurações do projeto > Geral
2. Role até "Seus apps" e clique em **Web**
3. Copie as credenciais que aparecem

## ⚙️ Passo 7: Configurar Variáveis de Ambiente
No Vercel (ou `.env.local` para desenvolvimento):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

## 👥 Usuários Criados Automaticamente

### Administrador
- **Email**: `admin@tessynails.com`
- **Senha**: `admin123`
- **Função**: Administrador

### Profissional
- **Email**: `tessy@tessynails.com`
- **Senha**: `tessy123`
- **Função**: Profissional

## 📊 Estrutura do Banco de Dados Criada

### Coleções:
- `users` - Usuários do sistema
- `services` - Catálogo de serviços
- `clients` - Cadastro de clientes
- `appointments` - Agendamentos
- `salon` - Configurações do salão

## 🎯 Passo 8: Testar Sistema
1. Execute `npm run dev`
2. Acesse `http://localhost:3000`
3. Faça login com os usuários criados
4. Verifique se os dados aparecem corretamente

## ⚠️ Importante
- Em produção, mude as senhas padrão
- Configure regras de segurança mais restritas
- Monitore o uso do Firestore para controlar custos

---

**🎉 Firebase configurado! Seu sistema está pronto para uso!**
