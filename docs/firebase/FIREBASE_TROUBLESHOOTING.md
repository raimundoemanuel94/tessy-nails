# 🔥 Firebase Troubleshooting - Tessy Nails

## ❌ Erro Atual: `FirebaseError: Firebase: Error (auth/configuration-not-found)`

Este erro indica que o Firebase Authentication não está configurado corretamente no projeto Firebase.

## 🛠️ Solução - Configurar Firebase Authentication

### Passo 1: Acessar Firebase Console
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: `tessy-nails`

### Passo 2: Habilitar Authentication
1. No menu lateral, clique em **Authentication**
2. Clique em **"Get Started"** (ou "Começar")
3. Na aba **"Sign-in method"**:
   - Clique em **Email/Senha**
   - Ative a opção **"Email/Senha"**
   - Clique em **"Salvar"**
4. (Opcional) Ative **Google** se desejar login social

### Passo 3: Verificar Configuração do App
1. Vá em **Configurações do Projeto** > **Geral**
2. Role até **"Seus apps"**
3. Verifique se o app Web está configurado com:
   - **App ID**: `1:229831786550:web:187fea7504f60afc90d897`
   - **API Key**: `AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg`

### Passo 4: Testar Localmente
1. Execute `npm run dev` localmente
2. Tente fazer login com:
   - Email: `admin@tessynails.com`
   - Senha: `admin123`

### Passo 5: Redeploy no Vercel
1. Após configurar o Firebase, faça um novo deploy no Vercel
2. Vá para o projeto Vercel > **Deploys**
3. Clique em **"Redeploy"**

## 🔍 Outros Possíveis Problemas

### Problema 1: Variáveis de Ambiente Incorretas
Verifique se todas as variáveis estão configuradas no Vercel:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tessy-nails.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tessy-nails
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tessy-nails.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=229831786550
NEXT_PUBLIC_FIREBASE_APP_ID=1:229831786550:web:187fea7504f60afc90d897
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8HVWP6L1F7
```

### Problema 2: Firestore Rules
Se o Firestore estiver bloqueado, atualize as regras:
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

### Problema 3: App não registrado no Firebase
Se o app não estiver registrado:
1. Firebase Console > Configurações > Geral
2. Clique em **"Adicionar app"**
3. Selecione **Web**
4. Nome do app: `Tessy Nails Web`
5. Copie as credenciais

## 🧪 Teste Pós-Concerto

Após configurar, teste com:
- **Admin**: admin@tessynails.com / admin123
- **Professional**: tessy@tessynails.com / tessy123

## 📞 Se o Problema Persistir

1. Verifique o **URL do authDomain** está correto
2. Confirme que o **projeto ID** é `tessy-nails`
3. Verifique se o **Email/Senha** está realmente ativado
4. Limpe o cache do navegador e tente novamente

---

**Após seguir estes passos, o erro deve ser resolvido!** 🚀
