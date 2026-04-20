# 📋 Como Executar o Script de Popularização

## 🚀 **Método 1: Via Cloud Shell (Recomendado)**

Execute estes comandos no Cloud Shell do Firebase:

```bash
# 1. Instalar Firebase CLI (se ainda não tiver)
curl -sL https://firebase.tools | bash

# 2. Login no Firebase (se necessário)
firebase login

# 3. Ir para a pasta do projeto
cd tessy-nails

# 4. Instalar dependências
npm install firebase

# 5. Executar o script
node scripts/populate-services.js
```

## 🖥️ **Método 2: Via Terminal Local**

Se você tem o projeto localmente:

```bash
# 1. Instalar Firebase
npm install firebase

# 2. Executar script
node scripts/populate-services.js
```

## 📦 **O que o script cria:**

### **✅ 10 Serviços Populares:**
1. Manicure Simples - R$ 50 (60min)
2. Manicure em Gel - R$ 80 (90min)
3. Pedicure Completa - R$ 70 (75min)
4. Alongamento de Unhas - R$ 120 (120min)
5. Esmaltação em Gel - R$ 60 (45min)
6. Spa das Mãos - R$ 90 (60min)
7. Spa dos Pés - R$ 80 (60min)
8. Manutenção de Gel - R$ 45 (30min)
9. Unhas Decoradas - R$ 100 (90min)
10. Tratamento Fortalecedor - R$ 55 (40min)

### **✅ Configuração do Salão:**
- Nome: "Tessy Nails"
- Horários de funcionamento
- Endereço e contato
- Configurações de agendamento

## ⚡ **Após Executar:**

1. ✅ Serviços aparecerão em: https://tessy-nails.vercel.app/servicos
2. ✅ Clientes poderão agendar normalmente
3. ✅ Admin poderá gerenciar tudo

---

## 🔧 **Se o Script Falhar:**

Execute manualmente no Firebase Console:
1. Coleção: `services`
2. Adicionar documentos com os campos acima

**Pronto para testar!** 🎉
