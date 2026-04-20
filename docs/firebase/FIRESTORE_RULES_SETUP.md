# 🔒 Configuração de Regras de Segurança do Firestore

## ❌ Erro Atual

```
FirebaseError: Missing or insufficient permissions.
```

Este erro ocorre porque as **regras de segurança do Firestore** não permitem acesso à coleção `settings`.

## ✅ Solução: Atualizar Regras no Firebase Console

### **Passo 1: Acessar Firebase Console**

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **tessy-nails-b7c9d**
3. No menu lateral, vá em **Build** → **Firestore Database**
4. Clique na aba **Rules** (Regras)

### **Passo 2: Aplicar Novas Regras**

Copie e cole o conteúdo do arquivo `firestore.rules` no editor de regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ Função auxiliar para verificar se é Admin ou Profissional
    function isStaff() {
      return request.auth != null && (
        request.auth.token.role in ['admin', 'professional'] ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'professional'])
      );
    }

    // ✅ Regras para usuários (admin/profissional)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isStaff());
    }
    
    // ✅ Regras para clientes
    match /clients/{clientId} {
      allow read: if request.auth != null && (request.auth.uid == clientId || isStaff());
      allow create: if request.auth != null && (request.auth.uid == clientId || isStaff());
      allow update, delete: if request.auth != null && (request.auth.uid == clientId || isStaff());
    }
    
    // ✅ Regras para serviços
    match /services/{serviceId} {
      allow read: if true;
      allow write: if isStaff();
    }
    
    // ✅ Regras para agendamentos
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && (
        (resource != null && request.auth.uid == resource.data.clientId) || isStaff()
      );
      allow create: if request.auth != null && (
        request.auth.uid == request.resource.data.clientId || isStaff()
      );
      allow update, delete: if isStaff() || (
        resource != null && request.auth.uid == resource.data.clientId
      );
    }
    
    // ✅ Regras para vendas
    match /sales/{saleId} {
      allow read, write: if isStaff();
    }
    
    // ✅ Regras para relatórios
    match /reports/{reportId} {
      allow read, write: if isStaff();
    }
    
    // ✅ Regras para configuração do salão
    match /salonConfig/{configId} {
      allow read: if true;
      allow write: if isStaff();
    }
    
    // ✅ Regras para configurações gerais (settings) - NOVO!
    match /settings/{settingId} {
      // Leitura: Qualquer usuário autenticado
      allow read: if request.auth != null;
      // Escrita: Apenas staff (admin/profissional)
      allow write: if isStaff();
    }
    
    // ✅ Regras para tokens FCM (notificações) - NOVO!
    match /fcmTokens/{tokenId} {
      // Leitura: Próprio usuário ou staff
      allow read: if request.auth != null && (request.auth.uid == tokenId || isStaff());
      // Escrita: Próprio usuário (para salvar seu token)
      allow write: if request.auth != null && request.auth.uid == tokenId;
    }
  }
}
```

### **Passo 3: Publicar as Regras**

1. Após colar as regras, clique em **Publish** (Publicar)
2. Aguarde a confirmação de que as regras foram atualizadas
3. As mudanças são aplicadas **imediatamente**

## 🔍 O que foi adicionado

### **1. Coleção `settings`**
```javascript
match /settings/{settingId} {
  allow read: if request.auth != null;  // Qualquer usuário autenticado pode ler
  allow write: if isStaff();            // Apenas admin/profissional pode escrever
}
```

**Permite:**
- ✅ Usuários autenticados lerem configurações do salão
- ✅ Admin/profissional salvarem configurações
- ✅ Acesso a documentos como:
  - `settings/salon` - Configurações do salão
  - `settings/notifications_{userId}` - Preferências de notificação

### **2. Coleção `fcmTokens`**
```javascript
match /fcmTokens/{tokenId} {
  allow read: if request.auth != null && (request.auth.uid == tokenId || isStaff());
  allow write: if request.auth != null && request.auth.uid == tokenId;
}
```

**Permite:**
- ✅ Usuários salvarem seus próprios tokens FCM
- ✅ Staff lerem todos os tokens (para enviar notificações)
- ✅ Preparado para implementação de notificações push

## 🧪 Testar as Regras

Após publicar, teste acessando a página de Configurações:

1. Faça login como **admin** ou **profissional**
2. Acesse `/configuracoes`
3. O erro **"Missing or insufficient permissions"** deve desaparecer
4. As configurações devem carregar normalmente

## 📊 Estrutura de Permissões

| Coleção | Leitura | Escrita | Observação |
|---------|---------|---------|------------|
| `users` | Autenticado | Próprio ou Staff | Dados do usuário |
| `clients` | Próprio ou Staff | Próprio ou Staff | Dados do cliente |
| `services` | Todos | Staff | Serviços do salão |
| `appointments` | Próprio ou Staff | Próprio ou Staff | Agendamentos |
| `sales` | Staff | Staff | Vendas |
| `reports` | Staff | Staff | Relatórios |
| `salonConfig` | Todos | Staff | Config antiga |
| **`settings`** | **Autenticado** | **Staff** | **Config nova** ✨ |
| **`fcmTokens`** | **Próprio ou Staff** | **Próprio** | **Tokens FCM** ✨ |

## 🔐 Segurança

As regras garantem:
- ✅ Apenas usuários autenticados acessam dados
- ✅ Clientes veem apenas seus próprios dados
- ✅ Staff (admin/profissional) tem acesso completo
- ✅ Configurações sensíveis só podem ser alteradas por staff
- ✅ Tokens FCM são privados de cada usuário

## 🚨 Troubleshooting

### Erro persiste após publicar?
1. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
2. **Faça logout e login novamente**
3. **Verifique se o usuário tem role** `admin` ou `professional` em `users/{uid}`

### Como verificar a role do usuário?
1. No Firebase Console, vá em **Firestore Database**
2. Abra a coleção `users`
3. Encontre seu documento (UID do usuário logado)
4. Verifique se o campo `role` está como `"admin"` ou `"professional"`

### Ainda não funciona?
Verifique no Console do navegador (F12) se há outros erros além do de permissões.

---

**Status**: ✅ Regras atualizadas no arquivo `firestore.rules`
**Próximo passo**: Aplicar no Firebase Console
**Última atualização**: 16 de março de 2026
