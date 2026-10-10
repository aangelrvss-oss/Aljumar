# Informe final · Nueva web de Aljumar Inmuebles

Fecha: 10/10/2026 · Repositorio: `aangelrvss-oss/Aljumar` · Rama: `claude/tender-curie-irf7wq`

> **Estado**: web construida, probada y documentada, **sin publicar**. La web actual sigue intacta. Para publicarla faltan accesos y datos que solo puede aportar Aljumar (sección 10).

## 1. Resumen ejecutivo

La web actual (WordPress 5.5 de 2020 con el tema Houzez) tiene el buscador sin resultados, dos inventarios que no coinciden (Inmovilla y Houzez), restos de la marca anterior «Look & Find Moratalaz» en el título de la portada, el blog, los correos y las redes, y un aviso legal incompleto.

La nueva web es un **sitio estático rápido y seguro, alimentado directamente por Inmovilla**: el equipo sigue trabajando en su CRM y la web se actualiza sola. Incluye buscador con filtros reales, fichas completas con URL propia, captación de propietarios, contacto con formularios que funcionan, los 60 artículos del blog en sus mismas direcciones, redirecciones de todas las URL antiguas y un panel para editar contenidos sin tocar código. En laboratorio obtiene 99-100 en rendimiento y 100 en accesibilidad y SEO.

## 2. Cambios visuales y de arquitectura

**Visual**: identidad propia a partir del logotipo (azul marino `#17354f`/`#284b6a` y lima `#bfd600` como acento de acción), titulares en Fraunces y texto en Plus Jakarta Sans, composición editorial con fotografía real de la cartera, buscador visible sin desplazarse, tarjetas uniformes con encabezados legibles («Ático en venta en Madrid» en lugar de «ÁticoenMadrid»), barra de contacto fija en móvil. Detalle en `docs/design-system.md`.

**Arquitectura de información**: Inicio · Comprar · Alquilar · Vender mi vivienda · Sobre Aljumar · Consejos · Contacto (+ Traspasos en el pie).

**Técnica**: WordPress + Houzez + WPBakery + Slider Revolution + irdinmo → Astro 7 estático + adaptador del XML de Inmovilla + PHP para formularios + Sveltia CMS. Detalle en `docs/architecture/target-architecture.md`.

## 3. Tecnologías y decisiones principales

| Decisión | Motivo |
|---|---|
| Sitio estático (Astro 7, TypeScript) | Sin base de datos ni plugins que actualizar; muy rápido; cada ficha es HTML indexable |
| Inmovilla como única fuente de inmuebles (XML diario) | Es el CRM del equipo y publica en portales; su API REST está limitada (10 consultas de propiedades/min) y no sirve para cada visita |
| Salvaguardas en la sincronización | Un fallo de Inmovilla no puede vaciar la web (no se publica un inventario vacío o con una caída > 50 %) |
| PHP propio para formularios | El alojamiento ya ejecuta PHP; sin coste ni cesión de datos a terceros |
| Sveltia CMS con GitHub | Panel gratuito, sin servidor; cada cambio es reversible |
| Sin cookies ni analítica por defecto | Sin panel de cookies; la analítica se decide aparte con consentimiento |
| Publicación en carpeta nueva + cambio de raíz del dominio | Reversión inmediata a WordPress |

Las 13 decisiones con alternativas y consecuencias están en `docs/decisions/architecture-decisions.md`.

## 4. Funcionalidades y verificación

**Leyenda**: ✅ implementada y verificada aquí · 🟡 implementada, verificación pendiente en el servidor real · ⏳ pendiente · 🚫 no verificable sin accesos

| Funcionalidad | Estado | Cómo se ha verificado |
|---|---|---|
| Portada con buscador, destacados, propietarios, servicios, zonas, equipo, consejos, contacto | ✅ | e2e, axe, Lighthouse, revisión visual (escritorio y móvil) |
| Buscador con filtros reales, orden, URL compartible, carga incremental, estado vacío | ✅ | 8 pruebas unitarias + 9 e2e por dispositivo |
| Panel de filtros accesible en móvil (diálogo, Escape, foco) | ✅ | e2e en móvil |
| Fichas: galería con visor, características, energía, ubicación aproximada, parecidos, solicitud con referencia | ✅ | e2e (teclado y foco), datos estructurados |
| Limpieza de datos del CRM (restos «bbr>», mayúsculas, títulos concatenados, «1 m²») | ✅ | unitarias |
| Inmuebles retirados → 410 con alternativas | 🟡 | página y reglas generadas; falta probar en Apache |
| Vender mi vivienda (captación) | ✅ | e2e del formulario |
| Formularios: validación cliente y servidor, antispam, límite por IP, origen, inyección de cabeceras, envío sin JS | ✅ | 14 comprobaciones contra el PHP real (modo prueba) + 4 e2e |
| Envío real de correo | ⏳ | falta `config.php` y remitente del dominio |
| Alta del contacto en Inmovilla | ⏳ | implementado; falta token y prueba real |
| Blog: 60 artículos en sus URL, 3 temas, paginación, aviso de vigencia | ✅ | build, comprobación de enlaces, unitarias |
| Redirecciones 301 (42 reglas) sin cadenas ni bucles | ✅ / 🟡 | validadas por pruebas; falta probarlas en Apache |
| SEO técnico (títulos únicos, canonical, sitemap, robots, JSON-LD, un h1) | ✅ | `npm run check` sobre las 87 páginas |
| Accesibilidad WCAG 2.2 AA | ✅ | axe sin incumplimientos graves en 9 páginas × 3 dispositivos; contrastes probados |
| Panel `/admin/` | 🟡 | configurado; requiere que el código esté en la rama `main` y un token de GitHub |
| Publicación automática con Inmovilla | ⏳ | flujo preparado y desactivado |
| Logotipo original | ⏳ | se muestra el nombre en texto hasta ejecutar `media:fetch` |

## 5. Integraciones

| Integración | Estado |
|---|---|
| Inmovilla · inventario (XML) | Adaptador probado con el XML público de demostración (156 campos). **Falta la URL privada de la agencia 4397.** La web usa una muestra de 6 inmuebles reales copiados de la portada actual, con aviso visible; la compilación de producción se niega a usarla. |
| Inmovilla · fotos | Se cargan desde `fotos15.apinmo.com` como hoy. No verificable desde este entorno (sin acceso de red); verificadas las URL y su formato. |
| Inmovilla · contactos (API REST `/clientes/`) | Implementado y opcional; sin token no se usa. 🚫 sin probar contra la API real. |
| Correo | `mail()` de PHP. ⏳ configuración. |
| WhatsApp | Preparado; se activa al rellenar el número en `/admin/`. 🚫 número no verificado. |
| Google Analytics / Search Console / Business Profile | No tocados. 🚫 sin acceso. |
| CRM antiguo Houzez | Sustituido; 12 fichas redirigidas. ⏳ confirmar cuáles siguen activas. |

## 6. Resultados de pruebas, accesibilidad, SEO y rendimiento

Ejecutadas el 10/10/2026 en el entorno de desarrollo (resultados de laboratorio, no de usuarios reales):

- TypeScript (`astro check`): 0 errores.
- Unitarias: 47/47 (adaptador de Inmovilla, limpieza de textos, filtros, formato, redirecciones, importación del blog, contrastes).
- Comprobación estática: 87 páginas (82 indexables), sitemap con 82 URL, 0 errores.
- Formulario PHP: 14/14.
- E2E (Chromium en escritorio 1366 px, Pixel 7 y tableta 820 px): 107 superadas, 7 omitidas por no aplicar al dispositivo. Incluye axe (WCAG 2.2 AA, sin incumplimientos graves o críticos) y ausencia de desbordamiento horizontal.
- Lighthouse 13.5 (móvil):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 99 | 100 | 96* | 100 | 1,9 s | 0 |
| `/comprar/` | 99 | 100 | 96* | 100 | 2,0 s | 0 |
| Ficha de inmueble | 99 | 100 | 96* | 100 | 1,8 s | 0 |
| `/vender-mi-vivienda/` | 100 | 100 | 100 | 100 | 1,5 s | 0 |
| Artículo del blog | 100 | 100 | 100 | 100 | 1,5 s | 0 |

\* Los 4 puntos se pierden solo porque este entorno no puede descargar las fotos de Inmovilla (error de red en consola). Por el mismo motivo, el rendimiento se midió **sin** las fotos: con ellas, el LCP real dependerá del peso de las imágenes de Inmovilla. Hay que repetir la medición en el entorno de prueba con conexión real y, tras el lanzamiento, seguir las métricas de campo (Core Web Vitals en Search Console).

**Integración continua (GitHub Actions)**: la ejecución completa (tipos, unitarias, compilación de pruebas y de producción, comprobaciones, formulario PHP y e2e) termina en verde sobre el último commit. Durante su puesta a punto la CI destapó un defecto real (en móvil la barra de contacto fija podía tapar un botón al desplazarse; corregido con `scroll-padding-bottom`, WCAG 2.4.11) y dos fallos de las propias pruebas, también corregidos.

Revisión visual: capturas de portada, compra, ficha, vender, menú y filtros en escritorio y móvil. Defectos encontrados y corregidos durante la revisión: alerta de error visible al cargar, iconos del menú duplicados, solapamiento del panel de filtros, menú móvil que no cubría la pantalla, URL con «?» vacío en el buscador rápido.

## 7. URL, rutas y datos migrados

- 60 artículos con la misma URL; 57 con la marca anterior sustituida por «Aljumar Inmuebles» (original conservado en `migration/`). Se perdieron negritas y enlaces internos del texto por un límite de la exportación.
- 42 redirecciones 301 (páginas renombradas, buscadores antiguos, 12 fichas Houzez, perfiles de agentes, taxonomías, categorías, etiquetas, feeds y sitemaps).
- Fichas antiguas del plugin con código en la URL → nueva ficha.
- Inventario completo en `docs/migration/seo-and-content-migration.md`.
- **Incidencias**: medios (logotipo, fotos del equipo, imágenes del blog) pendientes de descargar; fichas Houzez sin confirmar; testimonios no migrados por no ser verificables.

## 8. Variables de entorno y configuración (sin valores)

| Dónde | Nombre | Para qué |
|---|---|---|
| CI / local | `INMOVILLA_XML_URL` | URL privada del XML de la agencia (la facilita Inmovilla) |
| CI / local | `SITE_URL`, `SITE_ENV`, `STAGING` | Dominio, comprobaciones de producción, bloqueo de indexación |
| CI | `DEPLOY_ENABLED` (variable), `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY` (secretos) | Publicación automática por SSH |
| Servidor | `public/api/config.php` (`to`, `from`, `log_dir`, `hash_salt`, `inmovilla_token`…) | Formularios; plantilla en `config.example.php` |
| Panel | Token de GitHub de grano fino (personal, no se guarda) | Entrar en `/admin/` |

## 9. Instrucciones

- **Desarrollo local**: `npm ci` · `npm run sync -- --snapshot` · `npm run dev` · `npm test`. Ver `README.md`.
- **Administración**: inmuebles en Inmovilla; artículos, contacto y equipo en `/admin/`. Ver `docs/operations/admin.md`.
- **Mantenimiento**: actualizar dependencias con `npm outdated` / `npm update` y ejecutar `npm test`; el CI lo ejecuta en cada cambio.
- **Publicación y reversión**: `docs/operations/deploy.md`.

## 10. Limitaciones, autorizaciones y próximos pasos

**Bloqueantes para publicar** (requieren a Aljumar):

1. URL del XML de Inmovilla → secreto `INMOVILLA_XML_URL`.
2. Ejecutar `npm run media:fetch` con acceso a aljumar.es y guardar los archivos (logotipo original incluido).
3. Datos del Registro Mercantil en el aviso legal y revisión jurídica de aviso legal, privacidad y cookies.
4. `config.php` con buzón y remitente del dominio (SPF/DKIM).
5. Llevar el código a la rama `main` (el panel `/admin/` y la publicación automática trabajan sobre `main`).

**Decisiones pendientes**: fichas Houzez activas · analítica con consentimiento · WhatsApp, horario y cargos · cambio de marca en los artículos · redes sociales con la marca anterior · corregir en Inmovilla el piso de Vinateros (1 m² / 1 dormitorio frente a 48 m² y 2 habitaciones en su texto).

**Limitaciones conocidas**: los cambios de Inmovilla se reflejan con el XML diario (hasta un día de retraso); sin mapa de resultados (decisión de privacidad, reversible); la muestra de inventario no incluye alquileres, por lo que `/alquilar/` se ha probado en su estado vacío; las mediciones de rendimiento son de laboratorio y sin las fotos reales.

**Próximos pasos recomendados**: publicar en un subdominio de prueba sin indexar → probar formularios y redirecciones en el servidor real → medir con fotos reales → cambiar la raíz del dominio → enviar el sitemap en Search Console y vigilar errores 4-6 semanas → actualizar los artículos de normativa antiguos.

## Anexo: cómo se trabajó

- Herramientas: Firecrawl (≈31 de los 40 créditos autorizados, para leer la web actual y la documentación de Inmovilla, ya que el entorno no tenía acceso de red a esos dominios), búsqueda web, Playwright/Chromium, PHP 8.3, Lighthouse, axe-core.
- No se ha publicado nada, no se han modificado DNS, dominio, correo, cuentas externas ni la web actual, y no se han activado servicios de pago.
- El repositorio `talleres-verjano`, presente en la sesión, pertenece a otro negocio y no se ha modificado.
