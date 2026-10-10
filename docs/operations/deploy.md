# Publicación y reversión

> **Nada se ha publicado.** La web actual sigue intacta. Cada paso marcado con 🔐 requiere acceso o autorización de Aljumar.

## Antes de publicar (bloqueantes)

| # | Tarea | Responsable |
|---|---|---|
| 1 | 🔐 Pedir a Inmovilla (soporte@inmovilla.com) la **URL del XML para web** de la agencia 4397 y guardarla como secreto `INMOVILLA_XML_URL` | Aljumar |
| 2 | 🔐 Ejecutar `npm run media:fetch` desde un equipo con acceso a aljumar.es y hacer commit de `public/brand/`, `public/favicon.png` y `public/wp-content/` | Aljumar / técnico |
| 3 | 🔐 Completar en el aviso legal los **datos del Registro Mercantil** y validar los textos legales con un asesor | Aljumar |
| 4 | 🔐 Confirmar buzón de destino y crear un remitente del dominio (p. ej. `web@aljumar.es`) con SPF/DKIM | Aljumar |
| 5 | 🔐 Confirmar qué fichas de Houzez siguen activas (ver `docs/audit/current-state.md`) | Aljumar |
| 6 | Confirmar el número de WhatsApp y el horario (opcional; desde `/admin/`) | Aljumar |

## Procedimiento recomendado (sin cortes y reversible)

1. **Copia de seguridad** completa del WordPress actual (archivos + base de datos) desde el panel del alojamiento. 🔐
2. Crear en el alojamiento una **carpeta nueva** (p. ej. `/www-nueva`). No se borra ni se toca la carpeta de WordPress.
3. Subir `config.php` del formulario a `/www-nueva/api/config.php` (a partir de `config.example.php`). 🔐
4. Compilar para producción en local o en CI:
   ```bash
   npm ci
   INMOVILLA_XML_URL=… npm run sync      # inventario real
   SITE_ENV=production npm run build     # falla si el inventario es de muestra o tiene > 48 h
   npm run check
   ```
5. Subir `dist/` a `/www-nueva` (SFTP o el flujo `deploy.yml`).
6. **Prueba en un subdominio** (p. ej. `nueva.aljumar.es` apuntando a `/www-nueva`) compilado con `STAGING=1 SITE_URL=https://nueva.aljumar.es` para que no se indexe. Probar formularios reales, redirecciones (`curl -sI`), fichas y móvil. 🔐
7. **Cambio**: apuntar el dominio `aljumar.es` a `/www-nueva` en el panel del alojamiento (sin tocar DNS ni correo). 🔐
8. Verificar: portada, `/comprar/`, una ficha, envío de un formulario real, `curl -sI https://aljumar.es/quieres-vender/` → 301, `robots.txt` y `sitemap-index.xml`.
9. Search Console: enviar el sitemap. 🔐

### Reversión

- **Inmediata**: volver a apuntar el dominio a la carpeta de WordPress (paso 7 a la inversa). WordPress no se ha modificado.
- **De una versión de la web nueva**: `git revert` del commit problemático y volver a publicar; `deploy.yml` guarda en `../web-backups/<fecha>` cada archivo sustituido o borrado.
- **Del inventario**: cada sincronización es un commit (`Inventario: sincronización automática…`); revertirlo y publicar.
- Mantener WordPress (sin enlazar) al menos 2-3 meses antes de retirarlo, por si hace falta recuperar algo.

## Publicación automática (opcional)

`.github/workflows/deploy.yml` sincroniza con Inmovilla cada 3 horas y publica por SSH. Está **desactivado** hasta que se configuren:

- Variable `DEPLOY_ENABLED=true`
- Secretos `INMOVILLA_XML_URL`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` (la carpeta nueva), `DEPLOY_SSH_KEY`
- Entorno `production` con revisores obligatorios (cada publicación espera aprobación)

Requiere acceso SSH al alojamiento. Si no lo hay, la alternativa es compilar en CI y subir por SFTP o publicar desde un equipo local con `rsync`/cliente SFTP.

## Entornos

| Entorno | Variables | Indexación |
|---|---|---|
| Desarrollo | — | inventario de muestra con aviso |
| Vista previa / staging | `STAGING=1`, `SITE_URL=https://nueva.aljumar.es` | `noindex` + `robots.txt` cerrado |
| Producción | `SITE_ENV=production`, `INMOVILLA_XML_URL` | abierta; la compilación se detiene si algo no es apto |
