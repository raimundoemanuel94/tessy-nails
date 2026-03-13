# VERCEL DEPLOY INSTRUCTIONS - TESSY NAILS

## 🚀 PROJECT CONFIGURATION
- **Project ID:** prj_sEqr5GAkQVwmG72o8gRKPKwsTniI
- **Repository:** https://github.com/raimundoemanuel94/tessy-nails.git
- **Framework:** Next.js

## 🔥 ENVIRONMENT VARIABLES

Copie e cole estas variáveis no dashboard da Vercel:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tessy-nails.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tessy-nails
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tessy-nails.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=229831786550
NEXT_PUBLIC_FIREBASE_APP_ID=1:229831786550:web:187fea7504f60afc90d897
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8HVWP6L1F7
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://tessy-nails.vercel.app
NODE_ENV=production
```

## 📋 DEPLOY STEPS

1. **Add New Project** → Import GitHub → tessy-nails
2. **Configure** Environment Variables (acima)
3. **Deploy** → Automatic trigger
4. **Wait** for build completion
5. **Test** the deployed app

## 🧪 POST-DEPLOY TESTS

### URLs to Test:
- **Home:** https://tessy-nails.vercel.app
- **Login:** https://tessy-nails.vercel.app/login
- **Services:** https://tessy-nails.vercel.app/cliente/servicos
- **Dashboard:** https://tessy-nails.vercel.app/dashboard

### Firebase Actions:
1. **Apply Firestore Rules** via Firebase Console
2. **Test Authentication** (Email + Google)
3. **Verify Data Creation** (users + clients + appointments)

## 🎯 SUCCESS CRITERIA
- ✅ Build completes without errors
- ✅ Home loads services from Firestore
- ✅ Login/Signup works
- ✅ Appointment flow complete
- ✅ Dashboard shows real data
- ✅ Mobile responsive

## 🚨 TROUBLESHOOTING

### If build fails:
- Check environment variables
- Verify Firebase configuration
- Review build logs

### If auth fails:
- Check Firebase Auth providers
- Verify API keys
- Test in Firebase Console

### If data doesn't load:
- Check Firestore rules
- Verify collection names
- Test permissions

---

**DEPLOY READY! GO TO VERCEL NOW!** 🚀
