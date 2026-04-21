# Tessy Nails

Sistema de agendamento e gestao para studio de manicure/pedicure.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Firebase Auth, Firestore e Messaging
- Stripe Checkout
- PWA via `next-pwa`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run seed:services
```

## Arvore Organizada

```text
src/
  app/                  rotas, layouts e APIs do Next
  components/
    cliente/            componentes da area do cliente em uso
    dashboard/          graficos do dashboard
    layout/             layout administrativo
    shared/             componentes reutilizaveis
    ui/                 componentes base shadcn/ui em uso
  contexts/             AuthContext
  features/             features isoladas, como formulario de agendamento
  hooks/                hooks compartilhados
  lib/                  Firebase, Stripe, storage e helpers
  services/             camada de acesso ao Firestore/APIs
  store/                cache global client-side
  types/                tipos e schemas Zod

public/
  brand/                logos e icones oficiais
  images/services/      imagens dos servicos
  firebase-messaging-sw.js
  manifest.json

scripts/
  seed/                 seed de servicos

docs/
  firebase/             setup, regras e notificacoes
  maintenance/          instrucoes de manutencao/cache
  seed/                 seed de dados
  vercel/               deploy e variaveis da Vercel
```

## Configuracao

Copie `.env.example` para `.env.local` e preencha as variaveis do Firebase, Stripe e app URL. As regras principais do Firestore ficam em `firestore.rules`.

## Observacoes

Arquivos gerados pelo PWA, logs locais, `node_modules` e artefatos antigos ficam ignorados pelo Git. Se precisar recriar o service worker, rode o build:

```bash
npm run build
```
