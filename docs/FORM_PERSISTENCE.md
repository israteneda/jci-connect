# Form Persistence con React Hook Form y Zod

## Descripción General

Este documento describe la implementación de persistencia de formularios utilizando React Hook Form, Zod para validación, y localStorage para guardar datos automáticamente mientras el usuario completa los formularios.

## Características Implementadas

✅ **Validación en tiempo real** con Zod  
✅ **Auto-guardado** a localStorage mientras el usuario escribe  
✅ **Auto-carga** de datos guardados al abrir el formulario  
✅ **Expiración automática** después de 24 horas  
✅ **Seguridad**: Las contraseñas nunca se guardan en localStorage  
✅ **Botón de limpieza manual** para borrar datos guardados  
✅ **Type-safe** con TypeScript

## Archivos Creados

### 1. `/frontend/src/hooks/useFormPersistence.ts`

Custom hook que maneja la persistencia de formularios en localStorage.

**Funcionalidad:**
- Auto-guarda valores del formulario en localStorage cuando cambian
- Auto-carga valores guardados al montar el componente
- Permite excluir campos específicos (ej: contraseñas)
- Implementa expiración de datos (por defecto 24 horas)
- Proporciona función para limpiar datos manualmente

**Ejemplo de uso:**

```typescript
const { clearStoredData } = useFormPersistence({
  watch,
  setValue,
  storageKey: 'my-form-key',
  excludeFields: ['password'],
  expirationHours: 24,
})
```

### 2. `/frontend/src/lib/validations/auth.ts`

Schema de validación Zod para el formulario de login.

**Validaciones:**
- Email válido requerido
- Contraseña mínimo 6 caracteres

**Ejemplo:**

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
})
```

### 3. `/frontend/src/lib/validations/member.ts`

Schema de validación Zod para el formulario de creación de miembros.

**Validaciones implementadas:**
- Nombres mínimo 2 caracteres
- Email válido
- Teléfono entre 7-15 dígitos
- Edad entre 18-120 años
- Fecha de expiración posterior a fecha de inicio
- Fee entre $0 y $10,000

**Ejemplo:**

```typescript
import { memberSchema, type MemberFormData } from '@/lib/validations/member'

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<MemberFormData>({
  resolver: zodResolver(memberSchema),
  defaultValues: {
    role: 'member',
    has_membership: true,
    payment_type: 'annual',
    annual_fee: 100,
    // ...
  },
})
```

## Archivos Modificados

### 4. `/frontend/src/pages/auth/Login.tsx`

**Cambios realizados:**
- ✅ Reemplazado `useState` con `useForm` de react-hook-form
- ✅ Integrado `zodResolver` para validación
- ✅ Agregado `useFormPersistence` (solo guarda email, no contraseña)
- ✅ Mensajes de error en línea debajo de cada campo
- ✅ Botón "Clear saved email"

**Comportamiento:**
- Al escribir el email, se guarda automáticamente en localStorage
- Al recargar la página, el email se restaura automáticamente
- La contraseña NUNCA se guarda por seguridad
- Después de login exitoso, los datos guardados se limpian

### 5. `/frontend/src/pages/dashboard/MemberFormDialog.tsx`

**Cambios realizados:**
- ✅ Reemplazado `FormData` con `useForm` de react-hook-form
- ✅ Integrado `zodResolver` para validación
- ✅ Agregado `useFormPersistence` (todos los campos excepto contraseña)
- ✅ Mensajes de error en línea para cada campo
- ✅ Botón "Clear saved data"
- ✅ Reset automático del formulario al cerrar el diálogo

**Comportamiento:**
- Todos los campos se guardan automáticamente mientras el usuario escribe
- La contraseña NO se guarda por seguridad
- Al reabrir el diálogo, los datos se restauran automáticamente
- Después de crear el miembro exitosamente, los datos guardados se limpian
- Si el usuario cierra sin guardar, los datos permanecen para la próxima vez

## Flujo de Usuario

### Login Form

1. Usuario abre `/login`
2. Si hay datos guardados (y no han expirado), el email se carga automáticamente
3. Usuario escribe email → se guarda automáticamente a localStorage
4. Usuario escribe contraseña → NO se guarda (solo en memoria)
5. Opción A: Login exitoso → datos guardados se limpian
6. Opción B: Usuario recarga página → email persiste, contraseña se pierde
7. Usuario puede hacer click en "Clear saved email" para borrar datos manualmente

### Member Form

1. Usuario abre el formulario "Add New Member"
2. Si hay datos guardados (y no han expirado), todos los campos se cargan
3. Usuario completa el formulario → cada campo se guarda automáticamente
4. Contraseña NO se guarda nunca
5. Opción A: Usuario crea el miembro → datos guardados se limpian
6. Opción B: Usuario cierra el diálogo sin guardar → datos persisten
7. Opción C: Usuario recarga página → datos persisten
8. Usuario puede hacer click en "Clear saved data" para borrar manualmente

## Seguridad

### ⚠️ Consideraciones de Seguridad

1. **Contraseñas**: NUNCA se guardan en localStorage
   - Campo `password` excluido explícitamente en `useFormPersistence`
   - localStorage es accesible por cualquier script en el mismo origen

2. **Expiración**: Datos expiran después de 24 horas
   - Previene acumulación de datos obsoletos
   - Reduce exposición de información sensible

3. **Almacenamiento Local**: Los datos se guardan en el navegador del usuario
   - No se transmiten automáticamente
   - Vulnerables si alguien tiene acceso físico al dispositivo
   - No almacenar información extremadamente sensible

## Testing

### Casos de Prueba - Login Form

1. **Auto-guardado**:
   - Escribir email → recargar página → email debe aparecer
   - Escribir contraseña → recargar página → contraseña debe estar vacía

2. **Limpieza después de login**:
   - Login exitoso → abrir login de nuevo → campos vacíos

3. **Botón de limpiar**:
   - Escribir email → click "Clear saved email" → campo se vacía

4. **Validación**:
   - Submit sin email → mensaje de error
   - Email inválido → mensaje de error
   - Contraseña < 6 caracteres → mensaje de error

### Casos de Prueba - Member Form

1. **Auto-guardado**:
   - Llenar campos → cerrar diálogo → reabrir → datos deben aparecer
   - Contraseña no debe persistir

2. **Limpieza después de crear**:
   - Crear miembro exitosamente → reabrir formulario → campos vacíos

3. **Expiración**:
   - Guardar datos → cambiar fecha del sistema +25 horas → datos no deben cargar

4. **Validación**:
   - Nombres < 2 caracteres → mensaje de error
   - Email inválido → mensaje de error
   - Fecha de expiración antes de fecha de inicio → mensaje de error
   - Fee negativo o > 10000 → mensaje de error

## Beneficios de la Implementación

1. **Mejor UX**: Los usuarios no pierden su trabajo si accidentalmente cierran el navegador
2. **Type-Safe**: TypeScript garantiza que los tipos sean correctos
3. **Validación Robusta**: Zod proporciona validación en tiempo de ejecución
4. **Mantenible**: Schemas de validación centralizados y reutilizables
5. **Testeable**: Lógica separada en hooks personalizados
6. **Seguro**: Contraseñas nunca se persisten

## Próximos Pasos (Opcionales)

- [ ] Agregar persistencia a otros formularios (Settings, Board Positions, etc.)
- [ ] Implementar sincronización entre pestañas usando `storage` event
- [ ] Agregar indicador visual cuando hay datos guardados
- [ ] Implementar opción para deshabilitar auto-guardado por formulario
- [ ] Agregar analytics para medir cuántos usuarios se benefician de la persistencia

## Dependencias Utilizadas

```json
{
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.4"
}
```

Todas las dependencias ya estaban instaladas en el proyecto.

## Soporte y Mantenimiento

- **Compatibilidad**: Navegadores modernos con soporte para localStorage (IE11+)
- **Límite de localStorage**: ~5-10MB dependiendo del navegador
- **Error Handling**: Manejo gracioso de errores de localStorage (ej: quota excedida)

---

**Fecha de implementación**: Octubre 2025  
**Autor**: Tenpisoft Development Team

