# 🚀 Tessy Nails - Update Deployment Commands

## 📋 Git Commands for Production Update

### 1. Stage All Changes
```bash
git add .
```

### 2. Commit Changes
```bash
git commit -m "feat: migrate routes - admin to /admin/* and client to public root

- Move admin routes from root to /admin/* structure
- Move client routes from /cliente/* to public root
- Implement role-based access control with AdminProtectedRoute and ClientProtectedRoute
- Update all navigation links and redirects
- Clean up old route structure
- Add TypeScript fixes for undefined IDs
- Prepare for production deployment"
```

### 3. Push to Trigger Vercel Deploy
```bash
git push origin main
```

## 🔍 Alternative: Step-by-Step Staging

### Stage Admin Routes
```bash
git add src/app/admin/
```

### Stage Client Routes  
```bash
git add src/app/agendar/ src/app/perfil/ src/app/agendamentos/ src/app/servicos/
```

### Stage Updated Components
```bash
git add src/components/client/ src/components/layout/ src/components/auth/
```

### Stage Updated Pages
```bash
git add src/app/page.tsx src/app/login/page.tsx
```

### Stage Configuration
```bash
git add src/contexts/AuthContext.tsx src/types/index.ts
```

### Remove Old Routes
```bash
git add src/app/agenda/ src/app/cliente/ src/app/clientes/ src/app/configuracoes/ src/app/dashboard/
```

### Commit and Push
```bash
git commit -m "feat: migrate routes - admin to /admin/* and client to public root"
git push origin main
```

## ⚡ Quick Deploy Commands

### One-Liner Deploy
```bash
git add . && git commit -m "feat: migrate routes - admin to /admin/* and client to public root" && git push origin main
```

### Force Deploy (if needed)
```bash
git add . && git commit -m "feat: migrate routes - admin to /admin/* and client to public root" && git push origin main --force
```

## 🔄 Post-Deploy Verification

### Check Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Tessy Nails project
3. Monitor build logs
4. Verify deployment success

### Test Routes in Production
```bash
# Admin routes
curl https://your-app.vercel.app/admin/dashboard
curl https://your-app.vercel.app/admin/agenda
curl https://your-app.vercel.app/admin/servicos

# Client routes  
curl https://your-app.vercel.app/
curl https://your-app.vercel.app/servicos
curl https://your-app.vercel.app/agendar
```

## 🛡️ Rollback Plan (if needed)

### Quick Rollback
```bash
git log --oneline -5  # Find previous commit
git revert HEAD  # Revert the migration
git push origin main
```

### Manual Rollback
```bash
git reset --hard HEAD~1  # Reset to previous commit
git push origin main --force
```

---

**🎉 Ready to execute update deployment!**
