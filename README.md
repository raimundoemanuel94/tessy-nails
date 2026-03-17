# Tessy Nails - Sistema de Agendamento

Uma plataforma moderna e escalável para gerenciamento de agendamentos, clientes e serviços para nail designers e manicures.

## 🚀 Stack Tecnológica

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Auth:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Cloud Functions)
- **PWA:** [next-pwa](https://github.com/shadowwalker/next-pwa)
- **Deploy:** [Vercel](https://vercel.com/)

## 📂 Estrutura do Projeto

```text
src/
├── app/              # Rotas e Páginas (App Router)
├── components/       # Componentes React
│   ├── layout/       # Componentes de estrutura (Sidebar, Header, etc)
│   ├── shared/       # Componentes reutilizáveis globais
│   └── ui/           # Componentes base (shadcn/ui)
├── config/           # Configurações de serviços externos
├── contexts/         # Contextos React (Auth, etc)
├── features/         # Lógica específica por funcionalidade
├── hooks/            # Hooks customizados
├── lib/              # Bibliotecas de terceiros (Firebase, Utils)
├── services/         # Camada de integração com API/Firestore
└── types/            # Definições de tipos TypeScript
```

## 🛠️ Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd tessy-nails
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env.local`
   - Preencha com suas credenciais do Firebase.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse:** `http://localhost:3000`

## � Deploy no Vercel

**O projeto está configurado e pronto para deploy automático!**

### Passos para Deploy:

1. **Acesse o Vercel**: [vercel.com](https://vercel.com)
2. **Importe o repositório**: `https://github.com/raimundoemanuel94/tessy-nails.git`
3. **Configure as variáveis de ambiente**:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave_api
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   ```
4. **Deploy**: Clique em "Deploy"

### Status do Projeto:
- ✅ Build funcionando
- ✅ TypeScript compilando
- ✅ PWA configurada
- ✅ Pronto para produção

---
Desenvolvido com ❤️ para Tessy Nails.

# FCM Notifica��es Atualizadas
