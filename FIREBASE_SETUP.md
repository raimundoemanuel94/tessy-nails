# Configuração do Firebase - Tessy Nails

Para que o projeto funcione corretamente, siga os passos abaixo para configurar seu ambiente Firebase.

## 1. Criar Projeto no Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Clique em **Adicionar projeto** e dê o nome de `Tessy Nails`.
3. (Opcional) Desative o Google Analytics para este projeto se preferir.

## 2. Ativar Autenticação
1. No menu lateral, vá em **Build > Authentication**.
2. Clique em **Get Started**.
3. Na aba **Sign-in method**, ative:
   - **E-mail/Senha**
   - **Google**

## 3. Criar Banco de Dados Firestore
1. No menu lateral, vá em **Build > Firestore Database**.
2. Clique em **Create database**.
3. Escolha o local do servidor (ex: `southamerica-east1` para Brasil).
4. Comece em **Modo de Produção** ou **Modo de Teste** (se for modo de teste, lembre-se de atualizar as regras depois).

## 4. Obter Credenciais
1. No console do Firebase, clique no ícone de engrenagem (Configurações do Projeto) > **Project settings**.
2. Na aba **General**, role até "Your apps" e clique no ícone `</>` (Web).
3. Registre o app como `Tessy Nails Web`.
4. Copie o objeto `firebaseConfig`.

## 5. Configurar Variáveis de Ambiente
1. No diretório raiz do projeto, renomeie `.env.example` para `.env.local`.
2. Preencha as variáveis com os valores obtidos:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

## 6. Regras do Firestore (Sugestão Inicial)
No console do Firestore, aba **Rules**, você pode usar estas regras básicas para começar:

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

---
Agora seu projeto está pronto para realizar operações reais no Firebase!
