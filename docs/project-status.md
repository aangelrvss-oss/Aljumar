# Estado del proyecto

Última actualización: 10/10/2026

## Fase actual

**Lista para revisión y para la puesta en marcha** (fases 0-6 completadas; fase 7, publicación, preparada y **pendiente de autorización y de accesos**). Nada se ha publicado ni se ha modificado la web actual.

## Cambios realizados

- Auditoría de aljumar.es (tecnología, inventario, defectos, contenidos, legal, SEO).
- Nueva web estática (Astro 7) alimentada por Inmovilla: portada, compra, alquiler, traspasos, fichas, vender, sobre Aljumar, contacto, blog (60 artículos migrados en sus URL), legales, 404 y 410.
- Sistema visual con tokens y 18 componentes.
- Formularios con PHP (validación, antispam, límite, registro sin datos personales, alta opcional en Inmovilla).
- 42 redirecciones 301, sitemap, robots, datos estructurados.
- Panel de contenidos `/admin/`, CI y flujo de publicación desactivado por defecto.
- Documentación en `docs/`.

## Pruebas ejecutadas (10/10/2026, en el entorno de desarrollo)

| Prueba | Resultado |
|---|---|
| `astro check` (TypeScript) | 0 errores |
| Unitarias (Vitest) | 47/47 |
| Comprobación estática de `dist/` | 87 páginas, sin errores (2 avisos: logotipo y medios pendientes) |
| Formulario PHP real (`php -S`, modo prueba) | 14/14 |
| E2E Playwright (escritorio, móvil, tableta) + axe WCAG 2.2 AA | 107 superadas, 7 omitidas por dispositivo |
| CI en GitHub Actions (último commit) | Todos los pasos en verde |
| Lighthouse móvil (laboratorio) en 5 páginas | Rendimiento 99-100 · Accesibilidad 100 · Buenas prácticas 96-100 · SEO 100 |

## Problemas pendientes

1. Inventario real: falta la URL del XML de Inmovilla (la web usa una muestra de 6 inmuebles con aviso visible).
2. Logotipo, icono, fotos del equipo e imágenes del blog: hay que descargarlos de la web actual (`npm run media:fetch`); el entorno no tiene acceso a aljumar.es.
3. Aviso legal: faltan los datos del Registro Mercantil (tampoco están en la web actual).
4. Formularios: falta `config.php` con buzón y remitente (sin él responden 503 con vías alternativas).
5. Negritas y enlaces internos de los artículos se perdieron en la exportación (ver migración).

## Decisiones pendientes de autorización

- Publicar (procedimiento en `docs/operations/deploy.md`).
- Activar la publicación automática (`DEPLOY_ENABLED`) y su entorno con aprobación.
- Fichas de Houzez: cuáles siguen activas.
- Analítica: mantener o no Google Analytics (requiere consentimiento).
- Número de WhatsApp, horario y cargos del equipo.
- Sustitución de «Look and Find Moratalaz» por «Aljumar Inmuebles» en los artículos.
- Redes sociales con la marca anterior.

## Siguiente paso

Aljumar: pedir a Inmovilla la URL del XML, ejecutar `npm run media:fetch` y completar los datos legales; después, publicar en un subdominio de prueba siguiendo `docs/operations/deploy.md`.
