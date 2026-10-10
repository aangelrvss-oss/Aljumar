# Registro de decisiones (ADR)

Formato breve: contexto → decisión → consecuencias / reversión.

## ADR-001 · Repositorio y alcance

- **Contexto**: la sesión empezó en el repositorio `talleres-verjano` (otro negocio). El propietario indicó usar `aangelrvss-oss/Aljumar`, que estaba vacío.
- **Decisión**: proyecto nuevo en `Aljumar`, rama `claude/tender-curie-irf7wq`. `talleres-verjano` no se modifica.

## ADR-002 · Sustituir WordPress por un sitio estático (Astro), conservando Inmovilla

- **Contexto**: WordPress 5.5 (2020) con Houzez, WPBakery, Slider Revolution 6.0.9 e irdinmo; buscador sin resultados; dos inventarios divergentes; sin URL indexable por inmueble de Inmovilla. El equipo ya trabaja en Inmovilla.
- **Alternativas**: (a) actualizar WordPress y el tema: mantiene la deuda, el riesgo de seguridad y el doble inventario; (b) WordPress sin cabeza: sigue habiendo que mantener y proteger WordPress solo para un blog; (c) aplicación con backend y base de datos propios: duplicaría lo que ya hace Inmovilla; (d) **sitio estático alimentado por Inmovilla**.
- **Decisión**: (d). Astro 7 genera HTML estático; Inmovilla sigue siendo el CRM; los contenidos editoriales se editan con un CMS basado en Git.
- **Consecuencias**: sin base de datos ni actualizaciones de plugins; coste de alojamiento igual o menor; las fichas tienen URL propia indexable; los cambios de Inmovilla se publican con la siguiente sincronización (no al instante).
- **Reversión**: el WordPress actual no se toca; la web nueva se publica en otra carpeta y se cambia la raíz del dominio (ver `docs/operations/deploy.md`).

## ADR-003 · Inventario desde el XML diario de Inmovilla

- **Contexto**: Inmovilla ofrece iframe, API web (APIWEB, tiempo real, requiere IP autorizada), API REST v1 (limitada, desaconsejada para cargas masivas) y un XML diario para webs externas.
- **Decisión**: XML diario como fuente; adaptador aislado (`inmovilla-xml.ts`) para poder cambiar a APIWEB sin tocar la web.
- **Consecuencias**: retraso de hasta un día en reflejar cambios. Si Aljumar necesita inmediatez, se puede añadir un adaptador APIWEB ejecutado desde el alojamiento (IP fija).

## ADR-004 · Inventario de muestra solo para vistas previas

- **Contexto**: sin la URL privada del XML no se puede descargar el inventario real; la red del entorno no llega a Inmovilla.
- **Decisión**: transcripción literal de los 6 inmuebles de la portada actual (`migration/inmovilla-snapshot-2026-10-10.json`) procesada por el mismo adaptador, con aviso visible «Vista previa» en todas las páginas. `scripts/guard-build.ts` **impide compilar para producción** con esa muestra o con un inventario de más de 48 h.
- **Consecuencias**: no se inventa ningún inmueble; los datos que la portada no mostraba quedan vacíos.

## ADR-005 · Fichas Houzez

- **Decisión**: no se migran como inventario (no hay forma de saber cuáles siguen activas y no están en Inmovilla). Sus URL redirigen (301) a `/comprar/` o `/alquilar/`.
- **Pendiente de Aljumar**: confirmar cuáles siguen en cartera y darlas de alta en Inmovilla; entonces se puede cambiar su redirección a la nueva ficha en `redirect-map.csv`.

## ADR-006 · URL de las fichas

- **Decisión**: `/inmueble/<tipo>-<operación>-<ciudad>[-<zona>]-<código>/`. El código de Inmovilla garantiza unicidad y estabilidad; el texto aporta contexto. Si cambia la zona o el tipo, cambia la URL, pero la antigua deja de existir sin redirección automática — aceptable porque esos cambios son raros y la página 410 ofrece alternativas.
- Las URL antiguas del plugin con código en la consulta (`/inmueble/?…=<código>`) redirigen a la ficha nueva.

## ADR-007 · Sin mapas incrustados

- **Decisión**: ni mapa de resultados ni mapa incrustado en las fichas. Se enlaza la zona en OpenStreetMap con coordenadas redondeadas (≈100 m) cuando Inmovilla las publica.
- **Motivos**: privacidad de los propietarios, rendimiento, evitar cookies de terceros. Reversible: el componente puede añadirse si Aljumar lo pide.

## ADR-008 · Formularios en PHP en el propio alojamiento

- **Decisión**: un único script PHP sin dependencias (el alojamiento ya ejecuta PHP), con correo vía `mail()` y alta opcional en Inmovilla.
- **Alternativas**: servicio de formularios de terceros (coste y cesión de datos) o función *serverless* (otro proveedor).
- **Pendiente**: crear `config.php` en el servidor con el buzón y un remitente del dominio con SPF/DKIM correctos.

## ADR-009 · Sin analítica ni cookies por defecto

- **Decisión**: la web se publica sin analítica ni cookies; la política de cookies lo refleja.
- **Pendiente de decisión**: si se quiere mantener Google Analytics, hay que añadir un panel de consentimiento (con modo de consentimiento) y actualizar la política **antes** de activarlo; alternativa sin cookies: Plausible o analítica de servidor.

## ADR-010 · Marca anterior en el blog

- **Decisión**: en los 57 artículos que decían «En Look and Find Moratalaz…» (refiriéndose a la propia agencia) se sustituye por «Aljumar Inmuebles». El original queda en `migration/wp-posts-export-2026-10-10.json`. Los slugs no se cambian (posicionamiento). Aljumar debe confirmar que no hay inconveniente en atribuirse esos textos con la nueva marca.

## ADR-011 · Logotipo

- **Contexto**: el logotipo se compartió como imagen en el chat, que no llega como archivo al entorno; los originales (`Aljumar_Inmuebles_V-FONDO.svg`, `Aljumar_Inmuebles_H-FONDO_www.jpg`) están en la web actual, inaccesible desde el entorno.
- **Decisión**: no redibujarlo. `Logo.astro` usa automáticamente `public/brand/logo-*.{svg,png,jpg}` si existe; mientras tanto muestra el nombre en texto (sin imitar el símbolo) y `npm run check` avisa. `npm run media:fetch` descarga los originales.

## ADR-012 · Panel de contenidos

- **Decisión**: Sveltia CMS (MIT, compatible con Decap) en `/admin/`, con GitHub como almacenamiento: no necesita servidor ni base de datos; cada cambio es un commit revisable y reversible y dispara la publicación.
- **Alcance**: artículos, contacto, horario, WhatsApp y equipo. Los inmuebles se editan en Inmovilla.

## ADR-013 · Tipografía y color

- Fraunces (titulares, serif contemporánea con eje óptico) y Plus Jakarta Sans (texto e interfaz), ambas OFL y autoalojadas.
- Paleta del encargo validada con pruebas de contraste (`tests/unit/contrast.test.ts`); el gris secundario se oscureció de `#647180` a `#5b6876` para dar margen (sobre el fondo neutro pasa de 4,64:1, justo por encima del mínimo, a 5,3:1). El lima no se usa como texto sobre blanco.
