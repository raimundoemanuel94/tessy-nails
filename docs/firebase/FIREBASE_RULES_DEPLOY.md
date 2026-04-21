# FIRESTORE RULES DEPLOY - TESSY NAILS

## 🚀 APPLY RULES TO FIREBASE

### Step 1: Firebase Console
1. Go to: https://console.firebase.google.com
2. Select project: **tessy-nails**
3. Firestore Database → Rules

### Step 2: Copy Rules
Copy the content from `firestore.rules` file:

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
  }
}
```

### Step 3: Publish Rules
1. **Paste** the rules in Firebase Console
2. **Click** "Publish"
3. **Wait** for deployment

## 🔥 AUTHENTICATION PROVIDERS

### Enable Required Providers:
1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Email/Password** → **ENABLE**
3. **Google** → **ENABLE** (configure OAuth)

## 🧪 TEST FIRESTORE CONNECTION

### Test Collections:
- **services** - Public read (landing page)
- **users** - Authenticated access only
- **clients** - Authenticated access only
- **appointments** - Authenticated access only

---

**FIREBASE READY FOR PRODUCTION!** 🔥
