# Administración del día a día

## Inmuebles → en Inmovilla (como hasta ahora)

- Dar de alta, cambiar precio, fotos o descripción, reservar o retirar: **en Inmovilla**. Para que un inmueble salga en la web debe estar marcado para publicarse en la web.
- La web se actualiza en la siguiente sincronización (Inmovilla regenera el XML una vez al día).
- Si un inmueble se retira, su ficha responde «Este inmueble ya no está disponible» con alternativas.
- Revisar en Inmovilla: superficie, dormitorios y baños bien rellenados (el filtro los usa), zona/barrio asignado (alimenta el filtro «Zona») y certificado energético. Ejemplo detectado: el piso de Vinateros (cód. 29821198) tiene «1 m²» útiles y 1 dormitorio, pero su texto dice 48 m² y dos habitaciones.
- Títulos: escribirlos en minúsculas normales (la web corrige MAYÚSCULAS, pero queda mejor en origen).

## Artículos, contacto y equipo → en https://aljumar.es/admin/

1. Crear un token de GitHub de grano fino: GitHub → Settings → Developer settings → Fine-grained tokens → acceso solo al repositorio `aangelrvss-oss/Aljumar`, permiso **Contents: Read and write**.
2. Entrar en `/admin/` → «Iniciar sesión con token de acceso» y pegarlo.
3. «Consejos inmobiliarios»: crear o editar artículos (título, resumen, tema, fecha, imagen y texto). Marcar «Borrador» para guardar sin publicar.
4. «Datos del negocio»: correo, teléfonos, WhatsApp (vacío = sin botón), horario (vacío = no se muestra) y equipo (nombre, cargo opcional, foto).
5. Cada cambio queda guardado como un commit (se puede deshacer) y se publica con el flujo de publicación.

No cambies el identificador (slug) de un artículo ya publicado: es su URL.

## Formularios

- Llegan al buzón configurado en `public/api/config.php` (en el servidor). El correo trae «Responder a» con el correo del cliente.
- Si se configura `inmovilla_token`, cada solicitud se crea además como cliente en Inmovilla.
- Registro técnico (sin datos personales): `log_dir` del `config.php`. Sirve para ver si hay errores de envío o ataques de spam.
- Prueba local sin enviar correos: `npm run build && ALJ_FORM_DRY_RUN=1 php -S 127.0.0.1:8088 -t dist`.

## Desarrollo local

```bash
npm ci
npm run sync -- --snapshot   # o INMOVILLA_XML_URL=… npm run sync
npm run dev                  # http://localhost:4321
npm test                     # tipos + unitarias + build + comprobaciones + PHP + e2e
```
