# n8n Webhook Setup Guide

## El Problema

El webhook de n8n no se está llamando cuando creas un usuario.

## Causas Posibles

1. **Variables de entorno no configuradas** - El webhook URL no está en `.env`
2. **Webhook fallando silenciosamente** - Por diseño, no bloquea la creación del usuario
3. **n8n no está escuchando** - El workflow no está activo o la URL es incorrecta

## Solución

### 1. Configurar Variables de Entorno

Edita `/frontend/.env` y agrega:

```bash
# n8n Webhook URL
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/jci-connect

# n8n Webhook Basic Auth (opcional)
VITE_N8N_WEBHOOK_USERNAME=your-username
VITE_N8N_WEBHOOK_PASSWORD=your-password
```

**Importante**: Después de editar `.env`, debes **reiniciar el servidor de desarrollo**:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
cd /Users/israteneda/code/jci/jci-connect/frontend
npm run dev
```

### 2. Verificar en la Consola del Navegador

Abre las **Developer Tools** (F12) y ve a la pestaña **Console** cuando crees un usuario.

Deberías ver uno de estos mensajes:

✅ **Si funciona:**
```
✅ n8n webhook triggered: member.created
```

⚠️ **Si no está configurado:**
```
n8n webhook URL not configured
```

❌ **Si falla:**
```
❌ n8n webhook error: [error details]
```

### 3. Configurar n8n Workflow

#### Paso 1: Crear Webhook en n8n

1. Abre n8n
2. Crea un nuevo workflow
3. Agrega un nodo **Webhook**
4. Configura:
   - **Method**: POST
   - **Path**: `jci-connect` (o el que prefieras)
   - **Authentication**: None (o Basic Auth si lo configuraste)
5. Copia la URL generada

#### Paso 2: Configurar Autenticación (Opcional)

Si quieres seguridad adicional:

1. En el nodo Webhook, cambia **Authentication** a **Basic Auth**
2. Establece username y password
3. Agrega esas credenciales a tu `.env`:
   ```bash
   VITE_N8N_WEBHOOK_USERNAME=tu-usuario
   VITE_N8N_WEBHOOK_PASSWORD=tu-contraseña
   ```

#### Paso 3: Procesar los Datos

El webhook envía este formato:

```json
{
  "event": "member.created",
  "timestamp": "2025-10-05T10:30:00.000Z",
  "data": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "role": "member",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1 1234567890",
    "member_number": "JCI-NYC-2025-001",
    "membership_type": "local"
  }
}
```

Ejemplo de workflow n8n:

```
Webhook (POST) 
  ↓
IF Node (check event type)
  ↓ member.created
Send Welcome Email
  ↓ member.updated
Log Update
  ↓ member.deleted
Archive User
```

### 4. Probar el Webhook

#### Opción A: Desde Postman/Curl

```bash
curl -X POST https://your-n8n-instance.com/webhook/jci-connect \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.created",
    "timestamp": "2025-10-05T10:30:00.000Z",
    "data": {
      "user_id": "test-id",
      "email": "test@example.com",
      "role": "member",
      "first_name": "Test",
      "last_name": "User"
    }
  }'
```

#### Opción B: Desde tu App

1. Configura el `.env` con la URL de n8n
2. Reinicia el dev server
3. Crea un usuario de prueba
4. Verifica en n8n que el workflow se ejecutó

## Tipos de Eventos

El webhook se dispara en 3 eventos:

### 1. `member.created`

**Cuándo**: Después de crear un nuevo miembro exitosamente

**Datos enviados**:
```json
{
  "event": "member.created",
  "timestamp": "2025-10-05T10:30:00.000Z",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "member",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1 1234567890",
    "member_number": "JCI-NYC-2025-001",
    "membership_type": "local"
  }
}
```

### 2. `member.updated`

**Cuándo**: Después de actualizar un miembro

**Datos enviados**:
```json
{
  "event": "member.updated",
  "timestamp": "2025-10-05T10:30:00.000Z",
  "data": {
    "user_id": "uuid",
    "first_name": "Updated Name",
    "last_name": "Updated Last",
    "role": "senator",
    "memberships": { ... }
  }
}
```

### 3. `member.deleted`

**Cuándo**: Después de eliminar un miembro

**Datos enviados**:
```json
{
  "event": "member.deleted",
  "timestamp": "2025-10-05T10:30:00.000Z",
  "data": {
    "user_id": "uuid"
  }
}
```

## Troubleshooting

### Problema: "n8n webhook URL not configured"

**Solución**:
1. Verifica que `.env` existe en `/frontend/`
2. Verifica que `VITE_N8N_WEBHOOK_URL` está configurado
3. Reinicia el servidor de desarrollo

### Problema: Webhook falla con error CORS

**Causa**: n8n no permite requests desde tu dominio

**Solución**: En n8n, activa CORS en el nodo Webhook:
- **Response Mode**: Using Webhook
- **Response Code**: 200

### Problema: Webhook falla con 401 Unauthorized

**Causa**: Basic Auth configurado pero credenciales incorrectas

**Solución**:
1. Verifica username/password en n8n
2. Verifica que coinciden con tu `.env`
3. Reinicia el dev server

### Problema: El webhook se llama pero n8n no lo recibe

**Posibles causas**:
1. **Workflow no activo**: Actívalo en n8n
2. **URL incorrecta**: Verifica que coincide
3. **Firewall**: n8n debe ser accesible desde internet

**Solución**: Verifica en la consola del navegador que se envía el request correctamente

## Ejemplo de Workflow n8n Completo

```
┌─────────────┐
│   Webhook   │  POST /webhook/jci-connect
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  IF Node    │  Check: event = "member.created"
└─────┬───────┘
      │
      ├─── TRUE ──┐
      │           ▼
      │     ┌──────────────┐
      │     │ Send Email   │  Welcome email to new member
      │     └──────────────┘
      │           │
      │           ▼
      │     ┌──────────────┐
      │     │ Slack Notify │  Notify admins
      │     └──────────────┘
      │
      └─── FALSE ─┐
                  ▼
            ┌──────────────┐
            │ Log Event    │  Just log the event
            └──────────────┘
```

## Verificación Rápida

### Checklist ✓

- [ ] `.env` existe en `/frontend/`
- [ ] `VITE_N8N_WEBHOOK_URL` está configurado
- [ ] Dev server reiniciado después de editar `.env`
- [ ] n8n workflow está activo
- [ ] n8n webhook es accesible públicamente
- [ ] Consola del navegador muestra logs del webhook

### Test Rápido

```bash
# 1. Verifica que la variable está cargada
cd /Users/israteneda/code/jci/jci-connect/frontend
cat .env | grep VITE_N8N_WEBHOOK_URL

# 2. Prueba el webhook directamente
curl -X POST [TU_WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{}}'

# 3. Reinicia el dev server
npm run dev
```

## Mejoras Futuras (Opcional)

### 1. Retry Logic

Si el webhook falla, reintentar automáticamente:

```typescript
// En webhooks.ts
const MAX_RETRIES = 3
let retries = 0

while (retries < MAX_RETRIES) {
  try {
    const response = await fetch(webhookUrl, {...})
    if (response.ok) break
    retries++
    await new Promise(r => setTimeout(r, 1000 * retries))
  } catch (error) {
    retries++
  }
}
```

### 2. Queue System

Usar una queue para enviar webhooks en background:

```typescript
// Guardar en localStorage si falla
if (!response.ok) {
  const queue = JSON.parse(localStorage.getItem('webhook-queue') || '[]')
  queue.push({ event, data, timestamp })
  localStorage.setItem('webhook-queue', JSON.stringify(queue))
}
```

### 3. Webhook Dashboard

Crear una página para ver el estado de webhooks enviados

---

**Fecha**: Octubre 2025  
**Versión**: 1.0

