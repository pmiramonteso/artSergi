# Guía del panel de administración

El panel está en **`/admin`** (por ejemplo `https://<dominio>/admin`). Está en inglés y nunca aparece en Google.

## Requisitos para que funcione

El panel necesita que el servidor tenga configurado (ver DEPLOYMENT.md):

1. **Base de datos** (`NUXT_DATABASE_URL`).
2. **Secreto de cuentas** (`NUXT_AUTH_SECRET`) y **email** (`NUXT_SMTP_URL`) para verificar cuentas.
3. Tu email en **`NUXT_ADMIN_EMAILS`**.

Hoy el preview de Vercel no tiene base de datos, por eso allí `/admin` no funciona todavía.

## Primera vez

1. Ve a `/es/account/sign-up` y crea tu cuenta con el email de administrador.
2. Confirma el email con el enlace que recibirás.
3. Ve a `/es/account/security` y activa la **verificación en dos pasos** (escanea el QR con Google Authenticator, Authy, 1Password…). **Guarda los códigos de respaldo.**
4. Entra en `/admin`. La verificación en dos pasos es obligatoria para administradores.

## Añadir una obra nueva

1. `/admin` → pestaña **Artworks** → **+ New artwork**.
2. Rellena el título en inglés (la dirección web se genera sola), y si quieres el español y el catalán.
3. Elige el estado (**available** = disponible, **sold** = vendida, **archived** = archivo), el año, la técnica y las medidas.
4. Marca **Featured** si quieres que salga en la portada. Las 3 primeras marcadas aparecen en el hero.
5. Pulsa **Create artwork**. Debajo aparece el apartado **Photo**:
   - Sube la foto (JPEG, PNG, WebP o TIFF, máx. 20 MB): frontal, con colores fieles y sin reflejos.
   - Escribe una descripción de lo que se ve (obligatoria en inglés). La usan las personas ciegas con lectores de pantalla.
   - El servidor crea automáticamente los tamaños para la web y **elimina los datos de ubicación y cámara**.
6. La obra aparece al momento en `/works` y en la portada si está destacada.

Para **editar** una obra existente: botón **Edit** en su tarjeta. Para retirarla sin borrarla: estado **archived**.

## Ver y gestionar compras

`/admin` → pestaña **Orders** → pulsa el número de pedido. Verás:

- Cliente, idioma y fechas.
- **Dirección de envío.**
- **Productos**, cantidades y totales.
- **Pago**, con un enlace directo al pago en Stripe.
- Historial de envíos y cambios.

Botones para avanzar el pedido: **Mark fulfilled** (preparado) → **Mark shipped** (con transportista y nº de seguimiento) → **Mark delivered**.

- Los pedidos **pagados** solo los marca Stripe automáticamente; nadie puede marcarlos a mano.
- Los **reembolsos** se hacen en el panel de Stripe y el pedido se actualiza solo.

## Otras pestañas

- **Overview:** pedidos por estado, suscripciones activas y stock de la edición.
- **Catalogue & stock:** precios (en euros), productos a la venta y unidades disponibles.
- **Customers & subscriptions:** listados de clientes y suscripciones.
- **Audit log:** registro de todo lo que se ha cambiado, quién y cuándo.

## Si algo falla

- "Sign in with an admin account" → inicia sesión.
- "Two-factor authentication is required" → activa la verificación en dos pasos en `/es/account/security`.
- "You do not have access" → tu email no está en `NUXT_ADMIN_EMAILS` o no está verificado.
