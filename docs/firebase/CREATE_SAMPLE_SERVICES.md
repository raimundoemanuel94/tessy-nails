# CRIAR SERVIÇOS AMOSTRA NO FIRESTORE

## 📋 INSTRUÇÕES PARA CRIAR SERVIÇOS

### 1. Acessar Firebase Console
- Vá para: https://console.firebase.google.com
- Selecione projeto: **tessy-nails**
- Firestore Database → **Data**

### 2. Criar Coleção "services"
Se não existir, crie a coleção `services`

### 3. Adicionar Documentos de Serviço

#### Serviço 1: Manicure Simples
```json
{
  "name": "Manicure Simples",
  "description": "Limpeza, corte e esmaltação clássica para unhas bem cuidadas",
  "durationMinutes": 60,
  "price": 45.00,
  "category": "manicure",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

#### Serviço 2: Manicure Francesa
```json
{
  "name": "Manicure Francesa",
  "description": "Esmaltação francesa elegante com pontas brancas clássicas",
  "durationMinutes": 75,
  "price": 65.00,
  "category": "manicure",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

#### Serviço 3: Pedicure Completa
```json
{
  "name": "Pedicure Completa",
  "description": "Tratamento completo para pés com esfoliação e hidratação",
  "durationMinutes": 90,
  "price": 80.00,
  "category": "pedicure",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

#### Serviço 4: Unhas em Gel
```json
{
  "name": "Unhas em Gel",
  "description": "Aplicação de gel com durabilidade de 3 semanas",
  "durationMinutes": 120,
  "price": 120.00,
  "category": "gel",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

#### Serviço 5: Nail Art
```json
{
  "name": "Nail Art",
  "description": "Arte personalizada nas unhas com designs exclusivos",
  "durationMinutes": 150,
  "price": 150.00,
  "category": "arte",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

#### Serviço 6: Alongamento
```json
{
  "name": "Alongamento de Unhas",
  "description": "Alongamento com fibra de vidro ou acrílico",
  "durationMinutes": 180,
  "price": 180.00,
  "category": "alongamento",
  "isActive": true,
  "createdAt": "2024-03-13T00:00:00.000Z"
}
```

### 4. Verificar Criação
- Após criar todos os serviços
- Verifique se aparecem na coleção `services`
- Teste no app: https://tessy-nails.vercel.app/cliente/servicos

### 5. Resultado Esperado
- ✅ Serviços aparecendo no app
- ✅ Preços formatados corretamente
- ✅ Durações exibidas corretamente
- ✅ Descrições visíveis

---

## 🚀 IMPORTANTE

### Por que os serviços não aparecem?
1. **Coleção vazia** - Firestore não tem serviços cadastrados
2. **Estrutura incorreta** - Campos obrigatórios faltando
3. **isActive: false** - Serviços inativos não são mostrados

### Campos Obrigatórios:
- `name` (string)
- `durationMinutes` (number)
- `price` (number)
- `isActive` (boolean)
- `createdAt` (timestamp)

### Campos Opcionais:
- `description` (string)
- `category` (string)

---

**Crie estes serviços para testar o funcionamento completo do app!**
