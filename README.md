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

## 📦 Próximos Passos

1. **Configurar Firebase:**
   - Criar um projeto no [Console do Firebase](https://console.firebase.google.com/).
   - Ativar Authentication (Email/Password e Google).
   - Criar banco de dados Firestore.
   - Criar coleções: `users`, `clients`, `services`, `appointments`.

2. **Deploy na Vercel:**
   - Conectar o repositório na Vercel.
   - Configurar as variáveis de ambiente no painel da Vercel.

3. **Funcionalidades Futuras:**
   - Notificações Push via Cloud Messaging.
   - Integração com gateways de pagamento.
   - Área do Cliente para auto-agendamento.

---
Desenvolvido com ❤️ para Tessy Nails.
