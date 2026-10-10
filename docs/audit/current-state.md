# Auditoría del estado actual de aljumar.es

Fecha: 10/10/2026. Alcance: web pública https://aljumar.es/ y documentación pública de Inmovilla.

## Cómo se ha auditado (y límites)

- El entorno de trabajo en la nube **no tiene acceso de red a aljumar.es** (política de salida del proxy) y la herramienta de lectura web integrada no resolvía el dominio. Con autorización del propietario se usó **Firecrawl** (unos 31 créditos de los 40 autorizados) para leer: portada, `/comprar/` (con y sin espera de JavaScript), `/inmueble/`, `/quieres-vender/`, `/nuestra-esencia/`, `/formulario-cliente/`, `/property/`, un perfil de agente, aviso legal, política de privacidad, `robots.txt`, los sitemaps de Yoast (índice, páginas, inmuebles y entradas) y la API REST de WordPress (`/wp-json/wp/v2/posts` y `/categories`).
- **No se ha tenido acceso** al panel de WordPress, al alojamiento, a la base de datos, a Inmovilla, a Google Analytics, Search Console ni Google Business Profile. Todo lo que dependa de ellos figura como *no verificable*.
- El repositorio `aangelrvss-oss/Aljumar` estaba **vacío** (sin commits): no existía código previo que conservar. El repositorio `talleres-verjano` pertenece a otro negocio y no se ha modificado.

Leyenda: **[V]** verificado en la web · **[I]** inferido de indicios · **[NV]** no verificable sin accesos.

## 1. Tecnología

| Elemento | Situación | |
|---|---|---|
| CMS | WordPress **5.5** (publicado en agosto de 2020: seis años sin actualizar el núcleo) | [V] metadatos `generator` |
| Tema | **Houzez** (tema inmobiliario): rutas `/property/`, `/agent/`, `/status/`, `/label/` y sitemaps `houzez_agent` | [V] |
| Constructores | WPBakery Page Builder y **Slider Revolution 6.0.9** (versión antigua; históricamente este plugin ha tenido vulnerabilidades graves en versiones sin actualizar) | [V] versión · riesgo [I] |
| SEO | Yoast SEO (sitemaps `sitemap_index.xml`) | [V] |
| Formularios | WPForms Lite (formulario 40961) | [V] |
| Cookies | «GDPR Cookie Consent» (CookieLawInfo) | [V] |
| WhatsApp | WP Social Chat (botón `qlwapp`); el número no aparece en el HTML leído | [V] botón · número [NV] |
| Google | Site Kit by Google 1.182.0 (suele conectar Analytics y Search Console) | [V] plugin · cuentas [NV] |
| Inmuebles (1) | Plugin **irdinmo** («Irdinmo para Inmovilla», de Inforrada, ~30 instalaciones) que muestra inmuebles de **Inmovilla** (agencia **4397**, fotos en `fotos15.apinmo.com/4397/…`) | [V] |
| Inmuebles (2) | Entradas `property` del propio tema Houzez | [V] |
| Alojamiento | Dinahosting (el dominio temporal `aljumar.es.mialias.net` es el alias que asigna Dinahosting) | [I] |
| Copias de seguridad, accesos, base de datos | — | [NV] |

## 2. Inventario: dos fuentes que no coinciden

1. **Inmovilla (CRM)** — la portada muestra 6 inmuebles en venta con fotos de Inmovilla: piso en Moratalaz/Estrella (285.000 €), chalet en Rivas-Vaciamadrid (970.000 €), piso en Vinateros (270.000 €), piso en calle San Germán (485.000 €), ático en Las Tablas (700.000 €) y chalet tipo hostel en Seseña (750.000 €). El paginador indica al menos una segunda página. [V]
2. **Houzez (WordPress)** — 12 fichas en `/property/` (actualizadas entre marzo y mayo de 2026), con **dirección completa a nivel de calle**, agente asignado y etiquetas («Buen estado», «Para reformar»): Lavapiés, Pinar del Rey (Hortaleza), Pozuelo, Las Rozas (alquiler 1.850 €/mes), La Elipa, Quintana, garajes en Moratalaz y Rivas, local en Arganda… [V]

**Ninguna de las fichas de Houzez aparece entre las de Inmovilla de la portada.** No es posible saber desde fuera cuáles siguen activas. **Fuente oficial elegida para la nueva web: Inmovilla** (es el CRM, publica en portales y es donde trabaja el equipo). Las fichas de Houzez se redirigen al buscador y **Aljumar debe confirmar** si alguna sigue en cartera para darla de alta en Inmovilla (ver «Decisiones pendientes»).

## 3. Defectos funcionales detectados

| # | Defecto | Dónde | |
|---|---|---|---|
| 1 | **«Comprar» y «Alquilar» no muestran ningún inmueble**: solo el formulario de búsqueda, también tras esperar 8 s a que se ejecute JavaScript | `/comprar/`, `/alquilar/` | [V] |
| 2 | El filtro «Operación» mezcla operaciones con estados internos: *ALQUILADO, VENDIDO, RESERVADO, EN TRÁMITES, Nuda* | buscador | [V] |
| 3 | Las listas de «Ciudad» y «Barrio» no corresponden al inventario (no incluyen Seseña ni Las Tablas; sí «ARGANDA DE REY (MADRID)») | buscador | [V] |
| 4 | Títulos concatenados en las tarjetas: «PisoenMadrid», «ChaletenRivas - Vaciamadrid», «ÁticoenMadrid» | portada | [V] |
| 5 | Las descripciones terminan con restos de HTML roto: «…Comunidad de Madrid.bbr>» | portada | [V] |
| 6 | Dato incoherente en el CRM: piso de Vinateros con «1 dormitorio, 1 m²» frente a «una habitación doble y otra sencilla… 48 m²» en su descripción | ficha 29821198 | [V] |
| 7 | El título SEO y Open Graph de la portada sigue siendo **«Look & Find Moratalaz - Inmobiliaria en Madrid.»** | portada | [V] |
| 8 | El correo de «¿Quieres vender?» muestra `oficina@aljumar.es` pero el enlace abre **`m-moratalaz@lookandfind.es`** | `/quieres-vender/` | [V] |
| 9 | Enlaces del pie a **`aljumar.es.mialias.net`** (dominio temporal) e imágenes de «Nuestra esencia» servidas desde ese dominio | pie, `/nuestra-esencia/` | [V] |
| 10 | Facebook e Instagram enlazan a cuentas **«MoratalazLookAndFind» / «lookandfindmoratalaz»** | cabecera | [V] |
| 11 | El teléfono del perfil de agente está mal formado: «913339083913339........» | `/agent/juan-jose-jareno-ruiz/` | [V] |
| 12 | Formulario: etiqueta confusa «NECESITAS? Teléfono *», el teléfono visible no es obligatorio, **sin casilla de consentimiento** ni enlace a la política de privacidad («acepto los términos y condiciones» sin enlace) | `/formulario-cliente/` | [V] |
| 13 | `/formulario-cliente/` está en `noindex` pero enlazado como página principal del menú | | [V] |
| 14 | `robots.txt` bloquea a **todos** los rastreadores salvo Googlebot y Bingbot (con `Crawl-delay: 300`), lo que impide la lectura por otros buscadores y asistentes de IA | | [V] |
| 15 | Ventana de «Iniciar sesión / Registro» del tema visible para el público aunque «el registro está desactivado» | todas | [V] |
| 16 | Testimonios genéricos repetidos (Javier Martín, Laura Sánchez, María Gómez, Laura Alarcón) sin fuente comprobable | portada | [V] presencia · veracidad [NV] |
| 17 | Página sin título `/35450-2/` y páginas de 2019 (`/buscador/`, `/resultados/`) en el sitemap | | [V] |

## 4. Contenidos y datos

- **Blog**: 60 artículos (2021-2025) en 4 categorías. **57 de ellos dicen «En Look and Find Moratalaz…»** refiriéndose a la propia agencia; uno ya se retituló «…con Aljumar» pero conserva el slug `…-con-lookfind-moratalaz`. Imágenes con nombres «LYF», «look-and-find». [V]
- **Equipo publicado**: Juan José Jareño Ruiz, Estrella Benito, Juan José Jareño Martínez y Leidy (fotos en `wp-content/uploads`). Existe además una foto `EMPLEADOS_Aljumar_ALEX.jpg` subida en 2025 que no aparece publicada. [V] · si Alex forma parte del equipo [NV]
- **Trayectoria**: «desde 1998», «más de 20 años», «agencia dedicada a la compraventa de inmuebles en exclusiva», «colaboración con varias MLS de la zona», especialización en Moratalaz. [V] (afirmaciones del propio negocio)

### Datos de contacto (contrastados en varias páginas)

| Dato | Valor | Fuentes |
|---|---|---|
| Razón social / CIF | ALJUMAR INMUEBLES E INVERSIONES S.L. · B85663631 | aviso legal, privacidad; el CIF y la dirección coinciden con un directorio mercantil público |
| Dirección | Calle Arroyo Belincoso, 38 · 28030 Madrid (Esquina Vinateros) | pie, aviso legal |
| Teléfonos | 91 333 90 83 (oficina) · 645 825 636 | cabecera, pie, aviso legal |
| Correo | oficina@aljumar.es | cabecera, pie (el aviso legal y la privacidad usan todavía `jj.jareno@lookandfind.es`) |
| WhatsApp | botón presente, número no verificado | [NV] |
| Horario | no publicado | [NV] |

## 5. Legal

- **Aviso legal**: deja sin rellenar «[DATOS DE INSCRIPCIÓN EN EL REGISTRO MERCANTIL, EN SU CASO]» (obligatorio para sociedades según la LSSI), cita como web `http://aljumar.es.mialias.net/` y un correo de la marca anterior. [V]
- **Privacidad**: los derechos solo pueden ejercerse por correo postal; correo de contacto de la marca anterior; base legal «ejecución de contrato» para simples consultas. [V]
- No existe política de cookies propia (solo el panel del plugin). [V]

## 6. SEO

- URL del blog en la raíz (`/slug/`), fichas Houzez en `/property/slug/`, fichas Inmovilla sin URL propia indexable (la plantilla `/inmueble/` depende de JavaScript). [V]
- Sitemaps de Yoast: páginas (15), entradas (60), `property` (13), agentes, taxonomías de Houzez y `e-landing-page-sitemap.xml` (no inspeccionado). [V]
- Tráfico, consultas, enlaces entrantes y estado en Search Console. [NV]

## 7. Diagnóstico

| Conservar | Corregir | Reconstruir | Riesgos |
|---|---|---|---|
| Inmovilla como CRM y fuente del inventario · URL de los 60 artículos · URL `/comprar/`, `/alquilar/`, legales · datos de contacto · fotos del equipo y de los artículos · textos corporativos propios | Marca anterior en blog, títulos, correos y redes · dominio temporal en enlaces · aviso legal incompleto · consentimiento del formulario · robots.txt · dato de Vinateros en el CRM | Toda la capa web: WordPress 5.5 + Houzez + WPBakery + Slider Revolution + irdinmo se sustituyen por un sitio estático alimentado por Inmovilla | Fichas Houzez posiblemente activas · medios aún alojados en WordPress (hay que migrarlos antes de apagarlo) · URL privada del XML de Inmovilla y accesos al alojamiento no disponibles · revisión jurídica de los textos legales |
