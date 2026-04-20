# 🔥 SETUP DO FIREBASE ADMIN SDK

## 📋 PASSO 1: OBTER CHAVE DE SERVIÇO

### 1.1 Acessar Firebase Console
- Vá para: https://console.firebase.google.com
- Selecione projeto: **tessy-nails**
- Clique no ⚙️ **Configurações do projeto** (ícone de engrenagem)

### 1.2 Criar Conta de Serviço
- Vá para: **Contas de serviço** (menu lateral)
- Clique em: **Gerar nova chave privada**
- Selecione: **Firebase Admin SDK**
- Clique em: **Gerar chave**
- Faça download do arquivo JSON

### 1.3 Configurar Arquivo de Chave
- Renomeie o arquivo baixado para: `tessy-nails-firebase-key.json`
- Coloque na raiz do projeto: `C:/laragon/www/Tessy Nails/`
- **NÃO** envie este arquivo para o GitHub!

---

## 📋 PASSO 2: INSTALAR DEPENDÊNCIAS

```bash
# Instalar ts-node para executar TypeScript
npm install --save-dev ts-node @types/node

# Verificar se firebase-admin já está instalado
npm install firebase-admin
```

---

## 📋 PASSO 3: CONFIGURAR GITIGNORE

Adicione ao arquivo `.gitignore`:

```gitignore
# Firebase Admin Key
tessy-nails-firebase-key.json
```

---

## 📋 PASSO 4: EXECUTAR SCRIPT

### 4.1 Comando para executar:
```bash
npm run seed:services
```

### 4.2 O que o script faz:
- ✅ Verifica se serviço já existe (não sobrescreve)
- ✅ Cria apenas serviços novos
- ✅ Usa IDs amigáveis (manicure-simples, etc.)
- ✅ Mostra resumo da importação
- ✅ Valida serviços criados

---

## 📋 PASSO 5: VALIDAR NO FIRESTORE

### 5.1 Acessar Firestore Console
- Firebase Console → Firestore Database → Data
- Verifique coleção: `services`

### 5.2 Serviços esperados:
- manicure-simples
- manicure-francesa  
- pedicure-completa
- unhas-gel
- nail-art
- alongamento-unhas
- manicure-executiva
- pedicure-terapeutica

---

## 🚀 COMANDOS ÚTEIS

```bash
# Executar script de seed
npm run seed:services

# Verificar serviços no app
https://tessy-nails.vercel.app/cliente/servicos

# Testar página de detalhes
https://tessy-nails.vercel.app/cliente/servicos/manicure-simples
```

---

## ⚠️ IMPORTANTE

### 🔐 SEGURANÇA:
- **NUNCA** envie a chave do Firebase para o GitHub
- **NUNCA** compartilhe o arquivo JSON
- **SEMPRE** mantenha a chave em local seguro

### 📝 ESTRUTURA:
```
C:/laragon/www/Tessy Nails/
├── scripts/
│   └── seedServices.ts          ← Script de seed
├── tessy-nails-firebase-key.json ← Chave do Firebase (NÃO enviar para Git)
├── package.json                  ← Script npm
└── .gitignore                    ← Ignorar chave
```

---

## 🎯 RESULTADO ESPERADO

Após executar `npm run seed:services`:

```
🚀 Iniciando importação de serviços para o Firestore...
✅ Serviço "Manicure Simples" criado com sucesso!
✅ Serviço "Manicure Francesa" criado com sucesso!
✅ Serviço "Pedicure Completa" criado com sucesso!
✅ Serviço "Unhas em Gel" criado com sucesso!
✅ Serviço "Nail Art" criado com sucesso!
✅ Serviço "Alongamento de Unhas" criado com sucesso!
✅ Serviço "Manicure Executiva" criado com sucesso!
✅ Serviço "Pedicure Terapêutica" criado com sucesso!

📊 RESUMO DA IMPORTAÇÃO:
✅ Criados: 8 serviços
⏭️  Pulados: 0 serviços (já existiam)
❌ Erros: 0 serviços
📋 Total processados: 8 serviços

🔍 Validando serviços criados...
📋 Total de serviços na coleção: 8
  - Manicure Simples (manicure-simples) - R$ 45
  - Manicure Francesa (manicure-francesa) - R$ 65
  - Pedicure Completa (pedicure-completa) - R$ 80
  - Unhas em Gel (unhas-gel) - R$ 120
  - Nail Art (nail-art) - R$ 150
  - Alongamento de Unhas (alongamento-unhas) - R$ 180
  - Manicure Executiva (manicure-executiva) - R$ 95
  - Pedicure Terapêutica (pedicure-terapeutica) - R$ 110

🏁 Script concluído!
```

---

**Pronto! Seus serviços estarão disponíveis no app Tessy Nails!** 🎉
