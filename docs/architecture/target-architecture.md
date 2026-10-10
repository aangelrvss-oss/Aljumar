# Arquitectura de la nueva web

## Resumen

```
 Inmovilla (CRM)                 GitHub (repositorio)                     Alojamiento (Apache + PHP)
 ───────────────                 ────────────────────                     ──────────────────────────
 Equipo de Aljumar  ──▶  XML diario «web» ──▶ Actions: npm run sync  ──▶  HTML/CSS/JS estáticos
 da de alta, edita      (solo inmuebles     │  (salvaguardas)              /inmueble/<slug>/ …
 y retira inmuebles     publicados)         ▼                              .htaccess (301/410, cabeceras)
                                    src/data/inventory.json                api/contacto.php ──▶ correo
 Fotos en fotos15.apinmo.com ◀── las carga el navegador del visitante       │                 └─▶ Inmovilla
                                            │                               ▼ (opcional, API REST /clientes/)
 Panel /admin/ (Sveltia CMS) ──commits──▶  src/content/blog, settings.json
                                            ▼
                                   astro build → dist/ ──rsync──▶ carpeta nueva del alojamiento
```

- **Fuente de verdad de los inmuebles: Inmovilla.** La web no tiene base de datos propia de inmuebles ni panel para duplicarlos. Alta, precio, fotos, estado y retirada se gestionan en Inmovilla como hasta ahora.
- **Fuente de verdad del contenido editorial**: el repositorio (Markdown y JSON), editable desde `/admin/`.
- **Fuente de verdad de los contactos**: el buzón de correo de Aljumar y, si se activa el token, Inmovilla.

## Componentes

| Capa | Tecnología | Archivos |
|---|---|---|
| Generador | Astro 7 (salida estática), TypeScript estricto | `astro.config.mjs`, `src/` |
| Estilos | CSS propio con tokens (sin framework) | `src/styles/tokens.css`, `global.css`, estilos por componente |
| Tipografía | Fraunces (titulares) y Plus Jakarta Sans (texto), autoalojadas | `@fontsource-variable/*` |
| Inventario | Adaptador XML de Inmovilla → modelo normalizado | `src/lib/inventory/` |
| Buscador | Filtros en el navegador sobre datos incrustados; misma lógica en pruebas | `src/lib/inventory/filters.ts`, `PropertySearch.astro` |
| Contenidos | Colección `blog` (Markdown) + `settings.json` | `src/content/`, `src/data/` |
| Formularios | PHP sin dependencias | `public/api/contacto.php` |
| Redirecciones | Generadas desde CSV a `.htaccess` y `_redirects` | `docs/migration/redirect-map.csv`, `scripts/gen-redirects.ts` |
| Administración | Sveltia CMS (MIT) con GitHub como almacenamiento | `public/admin/` |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml`, `deploy.yml` |

## Modelo de datos del inmueble (`src/lib/inventory/types.ts`)

`id` (cod_ofer de Inmovilla, estable) · `ref` · `slug` · `operations[]` (venta, alquiler, traspaso) · `status` · `type` / `typeGroup` · `title` · `description` · `salePrice` / `rentPrice` / `transferPrice` · `city` · `zone` · `postalCode` · `bedrooms` (dobles + sencillas) · `bathrooms` · `toilets` · `builtArea` / `usableArea` / `plotArea` · `yearBuilt` · `condition` · `energy` / `emissions` · `communityFee` · `features[]` · `photos[]` (url + alt) · `approxLocation` · `featured` · `updatedAt`.

Regla: lo que Inmovilla no aporta queda en `null` y la interfaz lo oculta; no se rellena nada.

### Correspondencia con el XML de Inmovilla

| Modelo | XML | Notas |
|---|---|---|
| id | `id` | |
| operations | `accion` | «Vender», «Alquilar», «Vender o Alquilar», «Traspasar…»; «Alquiler vacacional» se excluye |
| salePrice / rentPrice | `precioinmo` / `precioalq` | `0` = sin precio |
| type | `tipo_ofer` | |
| city / zone | `ciudad` / `zona` | |
| bedrooms | `habdobles` + `habitaciones` | |
| bathrooms / toilets | `banyos` / `aseos` | |
| builtArea / usableArea / plotArea | `m_cons` / `m_uties` / `m_parcela` | < 8 m² se descarta (error de carga) |
| energy | `energialetra`, `energiavalor`, `energiarecibido` | |
| photos | `foto1…fotoN` (`numfotos`) | URL en el CDN de Inmovilla |
| approxLocation | `latitud`, `altitud` | Inmovilla publica la longitud en `altitud`; la web solo enlaza la zona (3 decimales) |
| features | booleanos (`ascensor`, `terraza`, `piscina_com`…) | etiquetas en español |
| title / description | `titulo1` / `descrip1` | limpieza de HTML, `~`, `|||`, restos «bbr>» y mayúsculas |

Formato validado con el XML público de demostración de Inmovilla (1.374 inmuebles, 156 campos); extracto en `tests/fixtures/`.

## Sincronización (`scripts/sync-inventory.ts`)

1. Descarga `INMOVILLA_XML_URL` (secreto; reintentos y tiempo máximo).
2. Valida que es un XML de propiedades, analiza y normaliza.
3. **No sobrescribe nada** si el resultado está vacío o si el inventario cae más de un 50 % respecto a la sincronización anterior (posible fallo de Inmovilla); se puede forzar con `--force` tras revisarlo.
4. Escribe `src/data/inventory.json` y añade a `src/data/retired.json` los inmuebles desaparecidos (→ 410). Si un inmueble vuelve a publicarse, sale de la lista.
5. En CI, el resultado se guarda como commit: queda historial de cada cambio de inventario y se puede volver a cualquier estado.

Frecuencia: cada 3 horas (`deploy.yml`). Inmovilla regenera el XML una vez al día, así que los cambios se reflejan como máximo al día siguiente; si se necesita tiempo real, la alternativa es la APIWEB de Inmovilla (requiere IP fija autorizada) — ver ADR-003.

### Por qué no la API REST en cada visita

La API REST v1 de Inmovilla limita las consultas de propiedades a **10 por minuto y 50 cada 10 minutos**, exige un token que no puede exponerse al navegador y su documentación desaconseja usarla para cargas masivas. Un sitio estático regenerado a partir del XML es más rápido, más barato y no depende de que Inmovilla responda en cada visita. La API REST sí se usa (opcionalmente) para **crear el contacto** desde los formularios (límite de 20/min).

## Formularios (`public/api/contacto.php`)

Validación y normalización en servidor, trampa invisible, tiempo mínimo de 3 s (con JS), límite de 5 envíos por IP y hora (IP con *hash* y sal), comprobación de `Origin`, longitudes máximas, saneado contra inyección de cabeceras, sin destinatario por defecto (sin `config.php` responde 503 con vías alternativas), registro técnico sin datos personales, alta opcional en Inmovilla (`POST /clientes/`) sin bloquear el correo si falla.

## Seguridad

- Sin base de datos ni panel PHP expuesto: la superficie de ataque se reduce a un único script de formulario.
- Cabeceras: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` (en `.htaccess`).
- `config.php` fuera del repositorio y bloqueado por `.htaccess`; secretos de CI en GitHub Secrets.
- `/admin/`: autenticación de GitHub (token de grano fino limitado a este repositorio); todo cambio queda en el historial y es reversible.
- Sin cookies ni rastreadores de terceros.

## Rendimiento

HTML estático comprimido, CSS por página, JavaScript solo donde hay interacción (el buscador, 7 KB y 2,7 KB comprimido; galería, formularios y menú, pequeños scripts en línea), fuentes autoalojadas, imágenes con dimensiones, `loading="lazy"` salvo la primera, `preconnect` al CDN de fotos. Lighthouse (laboratorio, móvil): rendimiento 99-100 en las páginas medidas (ver informe final para las limitaciones de la medición).
