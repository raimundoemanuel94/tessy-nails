# 🚀 Deploy Instructions for Tessy Nails on Vercel

## 📋 Prerequisites

1. **Vercel Account**: https://vercel.com/signup
2. **Firebase Project**: Configured with Firestore and Auth
3. **Git Repository**: GitHub, GitLab, or Bitbucket
4. **Node.js**: Version 18+ (for local testing)

## 🔧 Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## 🔐 Step 2: Login to Vercel

```bash
vercel login
```

## 📦 Step 3: Deploy Project

### Option A: From Git Repository (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your repository
5. Vercel will auto-detect Next.js framework

### Option B: Direct Deploy

```bash
cd "c:/laragon/www/Tessy Nails/Tessy Nails"
vercel
```

## ⚙️ Step 4: Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🗄️ Step 5: Setup Firebase Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Run setup script:
   ```bash
   node scripts/setup-firestore.js
   ```
4. Or manually add data via Firestore Console

## 🔍 Step 6: Verify Deployment

1. Check build logs in Vercel Dashboard
2. Test all routes:
   - `/` - Client landing page
   - `/servicos` - Services catalog
   - `/agendar` - Booking flow
   - `/agendamentos` - Client appointments
   - `/perfil` - Client profile
   - `/admin/dashboard` - Admin dashboard

## 🚨 Step 7: Production Checks

- ✅ Firebase rules are secure
- ✅ Environment variables are set
- ✅ All pages load without errors
- ✅ Authentication works
- ✅ Firestore data loads
- ✅ Navigation is functional

## 🔄 Step 8: Redeploy (if needed)

```bash
vercel --prod
```

## 🛠️ Troubleshooting

### Build Errors
```bash
# Clean build
rm -rf .next
npm run build
```

### Firebase Connection Issues
- Verify environment variables in Vercel
- Check Firebase project settings
- Ensure Firestore rules allow access

### Routing Issues
- Verify all pages have `page.tsx`
- Check file naming conventions
- Ensure proper Next.js App Router structure

## 📱 Post-Deploy

1. **Test Authentication**: Create test users
2. **Test Booking**: Complete full booking flow
3. **Test Admin**: Access admin dashboard
4. **Monitor**: Check Vercel Analytics
5. **Backup**: Export Firestore data

---

**🎉 Your Tessy Nails app is now live on Vercel!**
