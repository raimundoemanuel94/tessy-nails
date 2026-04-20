# 🧪 GUIA DE TESTES - TESSY NAILS

## 🚀 COMEÇAR

```bash
# 1. Instalar
npm install

# 2. Configurar
# Criar .env.local com Firebase e Stripe (veja ENV_SETUP_FINAL.md)

# 3. Rodar
npm run dev

# 4. Acessar
# Browser: http://localhost:3000
```

---

## 👤 USUÁRIOS DE TESTE

### Admin
```
Email: admin@tessynails.com
Senha: admin123
Acesso: /dashboard, /servicos, /clientes, /agendamentos
```

### Profissional
```
Email: tessy@tessynails.com
Senha: tessy123
Acesso: /dashboard, /agendamentos
```

### Cliente
```
Email: (crie sua própria conta)
Senha: (6+ caracteres)
Acesso: /cliente/*, /cliente/agendar, /cliente/agendamentos
```

---

## ✅ TESTE 1: CRUD DE SERVIÇOS

### Criar Serviço
```
1. Login como admin
2. /servicos (menu lateral)
3. Clique "+ Novo Serviço"
4. Preencha:
   - Nome: "Manicure Especial"
   - Descrição: "Tratamento completo"
   - Duração: 60 minutos
   - Preço: 89,90
   - Categoria: "Manicure"
5. Clique "Salvar"
6. ✅ Toast verde: "Serviço cadastrado"
7. ✅ Serviço aparece na lista
```

### Editar Serviço
```
1. Na lista de serviços
2. Clique no card do serviço criado
3. Clique lápis (edit)
4. Altere preço para 99,90
5. Salve
6. ✅ Preço atualizado na lista
```

### Desativar Serviço
```
1. Na lista
2. Clique menu (...)
3. "Desativar"
4. ✅ Serviço fica cinzento (inactive)
5. Filtro "Inativos" mostra o serviço
```

### Reativar Serviço
```
1. Filtro "Inativos"
2. Clique menu (...)
3. "Ativar"
4. ✅ Serviço volta ao normal
```

---

## ✅ TESTE 2: CRUD DE CLIENTES

### Criar Cliente
```
1. /clientes
2. "+ Novo Cliente"
3. Preencha:
   - Nome: "Maria Silva"
   - Email: maria@email.com
   - Telefone: (11) 99999-9999
   - Notas: "Cliente VIP"
4. Salve
5. ✅ Aparece na tabela
```

### Editar Cliente
```
1. Clique ação (menu ...)
2. "Editar"
3. Altere telefone
4. Salve
5. ✅ Dados atualizados na tabela
```

### Desativar Cliente
```
1. Menu (...)
2. "Desativar"
3. ✅ Cliente fica cinzento
```

### Procurar Cliente
```
1. Barra de busca no topo
2. Digite "Maria"
3. ✅ Filtra para mostrar só Maria
```

---

## ✅ TESTE 3: AGENDAMENTO COMPLETO

### Cliente Agendar
```
1. Logout admin
2. Login como novo cliente
3. /cliente (home)
4. Clique "Agendar agora"
5. Selecione serviço
6. Escolha data (calendario)
7. Escolha horário
8. Revise resumo
9. Clique "Confirmar"
10. ✅ Página sucesso aparece
```

### Admin Ver Agendamento
```
1. Login como admin
2. /dashboard
3. "Próximos Atendimentos" mostra agendamento novo
4. /agendamentos para lista completa
5. ✅ Agendamento está lá com status "pending"
```

### Admin Confirmar
```
1. Na lista de agendamentos
2. Clique "Confirmar"
3. Status muda para "confirmed"
4. ✅ Cor da badge muda (amarelo → verde)
```

---

## ✅ TESTE 4: PWA (OFFLINE)

### Instalar no Mobile
```
1. Abrir no celular (Chrome)
2. Menu → "Instalar aplicativo"
3. Confirmar
4. ✅ Ícone aparece na home screen
```

### Instalar no Desktop (DevTools)
```
1. DevTools (F12)
2. Application > Manifest
3. Instalar prompt aparece
4. Clicar instalar
5. ✅ Abre como app
```

### Testar Offline
```
1. Abrir app (web ou mobile)
2. DevTools > Network > Offline
3. Navegar entre páginas
4. ✅ Funciona com cache
5. Tentar criar novo (offline)
6. ⚠️ Falha na criação (esperado, precisa conexão)
```

---

## ✅ TESTE 5: VALIDAÇÕES

### Validação de Serviço
```
1. /servicos
2. "+ Novo"
3. Deixe Nome vazio
4. Clique "Salvar"
5. ✅ Toast vermelho: "Preencha nome..."
```

### Validação de Email
```
1. /clientes
2. "+ Novo"
3. Email inválido (ex: "abc")
4. ✅ Campo fica vermelho
```

### Validação de Duração
```
1. /servicos
2. "+ Novo"
3. Duração: 0
4. ✅ Toast: "Duração ≥ 1 min"
```

---

## ✅ TESTE 6: SEARCH & FILTER

### Search Serviços
```
1. /servicos
2. Barra de busca
3. Digite "mani"
4. ✅ Filtra para "Manicure"
```

### Filter Status
```
1. Abas no topo: "Todos", "Ativos", "Inativos"
2. Clique "Inativos"
3. ✅ Mostra só desativados
```

### Search Clientes
```
1. /clientes
2. Busca por email
3. ✅ Encontra cliente
```

---

## ✅ TESTE 7: CHARTS & DASHBOARD

### Gráficos Carregam
```
1. /dashboard
2. ✅ Gráfico de receita mostra
3. ✅ Gráfico de serviços mostra
4. ✅ Cards de métricas mostram números
```

### Métricas Atualizam
```
1. Criar novo agendamento
2. Voltar para /dashboard
3. ✅ "Agendamentos Hoje" incrementa
```

---

## 🔴 TESTES QUE FALHAM (ESPERADO)

### Sem Firebase Admin
```
/api/appointments/availability
# ❌ Retorna 500 (esperado, Firebase Admin não configurado)
```

### Sem Stripe Key
```
POST /api/stripe/checkout
# ❌ Status 503 (esperado, Stripe não configurado)
```

### Offline - Criar Dados
```
1. DevTools > Network > Offline
2. "+ Novo Serviço"
3. Preencha e salve
4. ❌ Falha (esperado, sem internet)
5. Online novamente
6. Reenviar
7. ✅ Salva
```

---

## 📊 CHECKLIST DE TESTE

- [ ] Criar serviço
- [ ] Editar serviço
- [ ] Desativar/Ativar serviço
- [ ] Buscar serviço
- [ ] Criar cliente
- [ ] Editar cliente
- [ ] Desativar cliente
- [ ] Buscar cliente
- [ ] Cliente agendar
- [ ] Admin confirmar agendamento
- [ ] Dashboard mostra métricas
- [ ] Gráficos carregam
- [ ] PWA instala
- [ ] App funciona offline
- [ ] Validações funcionam
- [ ] Toast mensagens aparecem
- [ ] Dark mode funciona
- [ ] Mobile responsivo

---

## 🆘 TROUBLESHOOTING

### App não carrega
```bash
# Limpar cache Next
rm -rf .next
npm run dev
```

### Firebase error
```
Verificar .env.local tem valores
Verificar FIREBASE_PRIVATE_KEY tem \n corretos
```

### PWA não instala
```
DevTools > Application > Manifest
Verificar se manifest.json é válido
Service Worker deve estar "activated"
```

### Gráficos não aparecem
```
Abra console (F12)
Procure por warnings
Desça até seção de gráficos
Recarregue página
```

---

**Última atualização**: Abril 2026
**Tempo total de testes**: ~30 minutos
**Status**: 🟢 Pronto
