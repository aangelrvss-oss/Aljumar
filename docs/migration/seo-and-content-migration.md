# Migración SEO y de contenidos

## Principios

1. **Las URL con valor se conservan**: los 60 artículos, `/comprar/`, `/alquilar/`, `/aviso-legal/`, `/politica-privacidad/` y la portada mantienen su dirección.
2. **Lo que cambia, redirige con 301** a su equivalente más cercano (42 reglas en `redirect-map.csv`, generadas en `.htaccess`). Ninguna redirección apunta a otra redirección y ninguna tapa una página nueva: lo comprueban `tests/unit/migration.test.ts` y `npm run check`.
3. **Los inmuebles retirados responden 410** con una página útil, en lugar de 404 o de redirigir a la portada.
4. **Los entornos de prueba no se indexan** (`STAGING=1` → `noindex` en todas las páginas y `robots.txt` con `Disallow: /`); la compilación de producción falla si `STAGING` está activo.

## Inventario de URL

### Páginas

| URL antigua | Nueva | Tipo |
|---|---|---|
| `/` | `/` | Se conserva (título nuevo: sin «Look & Find») |
| `/comprar/` | `/comprar/` | Se conserva (ahora con resultados) |
| `/alquilar/` | `/alquilar/` | Se conserva (`noindex` mientras no haya alquileres) |
| `/quieres-vender/` | `/vender-mi-vivienda/` | 301 |
| `/nuestra-esencia/` | `/sobre-aljumar/` | 301 |
| `/formulario-cliente/` | `/contacto/` | 301 |
| `/blog/`, `/blog/page/N/` | `/consejos-inmobiliarios/` | 301 |
| `/buscador/`, `/resultados/`, `/buscador-mapa/` | `/comprar/` | 301 |
| `/inmueble/` (sin código) | `/comprar/` | 301 |
| `/inmueble/?…=<código>` | `/inmueble/<slug>/` | 301 (si el inmueble sigue publicado) |
| `/guia-comprador/` | `/consejos-inmobiliarios/tema/comprar-y-vender/` | 301 |
| `/guia-vendedor/` | `/vender-mi-vivienda/` | 301 |
| `/35450-2/` | `/sobre-aljumar/` | 301 |
| `/aviso-legal/`, `/politica-privacidad/` | mismas | Se conservan (texto revisado) |
| — | `/politica-cookies/`, `/traspasos/`, `/inmueble/<slug>/`, `/consejos-inmobiliarios/tema/<tema>/` | Nuevas |

### Inmuebles Houzez y taxonomías

| URL antigua | Nueva |
|---|---|
| `/property/` y `/property/page/N/` | `/comprar/` |
| 12 fichas `/property/<slug>/` | `/comprar/` (la de alquiler en Las Rozas → `/alquilar/`). **Pendiente**: si Aljumar confirma que alguna sigue activa y la da de alta en Inmovilla, cambiar su destino a la nueva ficha |
| `/status/alquilar/` | `/alquilar/` |
| `/status/*`, `/label/*`, `/property-type/*`, `/city/*`, `/area/*`, `/feature/*` (y variantes) | `/comprar/` |
| `/agent/*`, `/author/*` | `/sobre-aljumar/` |

### Blog

| URL antigua | Nueva |
|---|---|
| `/category/sin-categoria/` | `/consejos-inmobiliarios/` |
| `/category/blog-inmobiliario/` | `/consejos-inmobiliarios/tema/comprar-y-vender/` |
| `/category/consejos-hogar/` | `/consejos-inmobiliarios/tema/hogar-y-reformas/` |
| `/category/noticias-inmobiliarias/` | `/consejos-inmobiliarios/tema/mercado-y-normativa/` |
| `/tag/*`, `/feed/`, `/comments/feed/` | `/consejos-inmobiliarios/` |
| `/sitemap_index.xml`, `/*-sitemap.xml` | `/sitemap-index.xml` |

Los 60 artículos conservan su URL:

| URL antigua | Nueva | |
|---|---|---|
| `/35961-2/` | `/35961-2/` | Se conserva |
| `/5-razones-para-alquilar-un-inmueble-como-propietario/` | `/5-razones-para-alquilar-un-inmueble-como-propietario/` | Se conserva |
| `/alquilar-tu-vivienda-en-plataformas-de-alquiler-turistico-te-contamos-los-pros-y-los-contras-de-esta-practica/` | `/alquilar-tu-vivienda-en-plataformas-de-alquiler-turistico-te-contamos-los-pros-y-los-contras-de-esta-practica/` | Se conserva |
| `/alquiler-con-opcion-a-compra-un-metodo-que-gana-territorio-en-espana/` | `/alquiler-con-opcion-a-compra-un-metodo-que-gana-territorio-en-espana/` | Se conserva |
| `/buscas-opciones-de-financiacion-las-hipotecas-a-tipo-mixto-pueden-ser-la-solucion/` | `/buscas-opciones-de-financiacion-las-hipotecas-a-tipo-mixto-pueden-ser-la-solucion/` | Se conserva |
| `/buscas-un-salon-familiar-mas-acogedor-te-ayudamos-a-conseguirlo/` | `/buscas-un-salon-familiar-mas-acogedor-te-ayudamos-a-conseguirlo/` | Se conserva |
| `/check-list-de-los-documentos-que-necesitas-para-vender-tu-propiedad/` | `/check-list-de-los-documentos-que-necesitas-para-vender-tu-propiedad/` | Se conserva |
| `/como-decorar-la-cocina-sin-salirse-del-presupuesto/` | `/como-decorar-la-cocina-sin-salirse-del-presupuesto/` | Se conserva |
| `/como-los-profesionales-inmobiliarios-afrontamos-la-venta-de-pisos-quemados/` | `/como-los-profesionales-inmobiliarios-afrontamos-la-venta-de-pisos-quemados/` | Se conserva |
| `/como-mejorar-la-eficiencia-energetica-en-el-hogar-y-vender-antes/` | `/como-mejorar-la-eficiencia-energetica-en-el-hogar-y-vender-antes/` | Se conserva |
| `/como-tener-un-hogar-libre-de-estres/` | `/como-tener-un-hogar-libre-de-estres/` | Se conserva |
| `/comprar-para-alquilar-es-este-un-buen-momento-para-invertir-en-propiedades/` | `/comprar-para-alquilar-es-este-un-buen-momento-para-invertir-en-propiedades/` | Se conserva |
| `/consejos-para-decorar-tu-cocina-de-manera-funcional/` | `/consejos-para-decorar-tu-cocina-de-manera-funcional/` | Se conserva |
| `/consejos-para-recibir-el-invierno-sin-que-te-pille-por-sorpresa/` | `/consejos-para-recibir-el-invierno-sin-que-te-pille-por-sorpresa/` | Se conserva |
| `/consejos-para-vender-una-vivienda-mas-rapido/` | `/consejos-para-vender-una-vivienda-mas-rapido/` | Se conserva |
| `/contrato-de-reserva-de-vivienda-todo-lo-que-necesitas-saber-antes-de-firmar/` | `/contrato-de-reserva-de-vivienda-todo-lo-que-necesitas-saber-antes-de-firmar/` | Se conserva |
| `/cual-es-la-actualidad-del-mercado-inmobiliario-en-madrid/` | `/cual-es-la-actualidad-del-mercado-inmobiliario-en-madrid/` | Se conserva |
| `/cuales-son-los-documentos-que-hacen-falta-para-vender-una-vivienda/` | `/cuales-son-los-documentos-que-hacen-falta-para-vender-una-vivienda/` | Se conserva |
| `/cuales-son-los-gastos-que-se-afrontan-al-vender-un-inmueble/` | `/cuales-son-los-gastos-que-se-afrontan-al-vender-un-inmueble/` | Se conserva |
| `/cuando-es-necesaria-la-inspeccion-tecnica-de-edificios/` | `/cuando-es-necesaria-la-inspeccion-tecnica-de-edificios/` | Se conserva |
| `/cuatro-propuestas-de-renovacion-para-la-cocina-con-poco-presupuesto/` | `/cuatro-propuestas-de-renovacion-para-la-cocina-con-poco-presupuesto/` | Se conserva |
| `/cuatro-puntos-para-saber-si-estas-preparado-para-comprar-una-vivienda/` | `/cuatro-puntos-para-saber-si-estas-preparado-para-comprar-una-vivienda/` | Se conserva |
| `/cuestiones-a-una-inmobiliaria-si-quiero-vender-mi-vivienda/` | `/cuestiones-a-una-inmobiliaria-si-quiero-vender-mi-vivienda/` | Se conserva |
| `/el-juego-de-contrastes-como-mezclar-estilos-y-patrones-sin-que-parezca-un-accidente/` | `/el-juego-de-contrastes-como-mezclar-estilos-y-patrones-sin-que-parezca-un-accidente/` | Se conserva |
| `/el-numero-de-actas-de-transparencia-y-prestamos-hipotecarios-se-estabiliza-segun-un-informe-publicado-por-el-consejo-general-del-notariado/` | `/el-numero-de-actas-de-transparencia-y-prestamos-hipotecarios-se-estabiliza-segun-un-informe-publicado-por-el-consejo-general-del-notariado/` | Se conserva |
| `/energia-solar-ahorro-energetico-y-mucho-mas/` | `/energia-solar-ahorro-energetico-y-mucho-mas/` | Se conserva |
| `/entra-en-vigor-la-ley-para-la-rehabilitacion-de-edificios-y-la-ley-de-calidad-de-la-arquitectura/` | `/entra-en-vigor-la-ley-para-la-rehabilitacion-de-edificios-y-la-ley-de-calidad-de-la-arquitectura/` | Se conserva |
| `/estafa-mediante-anuncio-de-piso-como-protegerse/` | `/estafa-mediante-anuncio-de-piso-como-protegerse/` | Se conserva |
| `/grandes-ideas-de-renovacion-de-tu-hogar/` | `/grandes-ideas-de-renovacion-de-tu-hogar/` | Se conserva |
| `/hipoteca-solo-o-en-pareja/` | `/hipoteca-solo-o-en-pareja/` | Se conserva |
| `/home-staging-aplica-estas-tecnicas-y-vende-antes-y-mejor/` | `/home-staging-aplica-estas-tecnicas-y-vende-antes-y-mejor/` | Se conserva |
| `/ideas-de-decoracion-con-plantas-de-interior/` | `/ideas-de-decoracion-con-plantas-de-interior/` | Se conserva |
| `/invertir-en-rehabilitacion-es-invertir-en-salud/` | `/invertir-en-rehabilitacion-es-invertir-en-salud/` | Se conserva |
| `/invertir-en-vivienda-la-alternativa-para-aprovechar-la-inflacion-y-ahorrar/` | `/invertir-en-vivienda-la-alternativa-para-aprovechar-la-inflacion-y-ahorrar/` | Se conserva |
| `/la-casa-perfecta-para-los-millennials-que-buscan-los-jovenes-en-un-hogar/` | `/la-casa-perfecta-para-los-millennials-que-buscan-los-jovenes-en-un-hogar/` | Se conserva |
| `/la-creciente-obsesion-de-ultima-tendencia-una-despensa-de-lujo/` | `/la-creciente-obsesion-de-ultima-tendencia-una-despensa-de-lujo/` | Se conserva |
| `/la-herencia-de-viviendas-ha-disminuido-notablemente-mientras-los-beneficiarios-buscan-vender/` | `/la-herencia-de-viviendas-ha-disminuido-notablemente-mientras-los-beneficiarios-buscan-vender/` | Se conserva |
| `/la-novacion-de-la-hipoteca-una-alternativa-viable/` | `/la-novacion-de-la-hipoteca-una-alternativa-viable/` | Se conserva |
| `/la-profesionalizacion-de-los-alquileres-un-tema-necesario-en-espana/` | `/la-profesionalizacion-de-los-alquileres-un-tema-necesario-en-espana/` | Se conserva |
| `/las-cargas-de-una-vivienda/` | `/las-cargas-de-una-vivienda/` | Se conserva |
| `/las-ideas-mas-divertidas-para-anadir-color-a-tu-cocina/` | `/las-ideas-mas-divertidas-para-anadir-color-a-tu-cocina/` | Se conserva |
| `/las-mejores-formas-de-dar-vida-a-tus-habitaciones/` | `/las-mejores-formas-de-dar-vida-a-tus-habitaciones/` | Se conserva |
| `/las-ventajas-de-vender-una-vivienda-con-lookfind-moratalaz/` | `/las-ventajas-de-vender-una-vivienda-con-lookfind-moratalaz/` | Se conserva |
| `/lo-que-puede-ofrecerte-un-personal-shopper-inmobiliario/` | `/lo-que-puede-ofrecerte-un-personal-shopper-inmobiliario/` | Se conserva |
| `/los-costos-que-asume-cada-una-de-las-partes-en-la-compraventa/` | `/los-costos-que-asume-cada-una-de-las-partes-en-la-compraventa/` | Se conserva |
| `/los-expertos-inmobiliarios-preven-bajadas-en-las-compraventas-y-el-encarecimiento-de-los-alquileres/` | `/los-expertos-inmobiliarios-preven-bajadas-en-las-compraventas-y-el-encarecimiento-de-los-alquileres/` | Se conserva |
| `/los-mejores-sitios-para-practicar-deporte-al-aire-libre-en-madrid/` | `/los-mejores-sitios-para-practicar-deporte-al-aire-libre-en-madrid/` | Se conserva |
| `/los-trucos-que-necesitas-para-que-tu-salon-parezca-mas-grande/` | `/los-trucos-que-necesitas-para-que-tu-salon-parezca-mas-grande/` | Se conserva |
| `/planes-de-pension-o-amortizar-hipoteca-cual-es-mas-conveniente/` | `/planes-de-pension-o-amortizar-hipoteca-cual-es-mas-conveniente/` | Se conserva |
| `/por-que-el-coworking-se-ha-consolidado-como-una-tendencia-en-el-mercado-inmobiliario/` | `/por-que-el-coworking-se-ha-consolidado-como-una-tendencia-en-el-mercado-inmobiliario/` | Se conserva |
| `/por-que-es-necesario-el-certificado-de-eficiencia-energetica/` | `/por-que-es-necesario-el-certificado-de-eficiencia-energetica/` | Se conserva |
| `/preguntas-necesarias-antes-de-comprar-una-vivienda/` | `/preguntas-necesarias-antes-de-comprar-una-vivienda/` | Se conserva |
| `/principales-puntos-de-la-nueva-ley-de-vivienda-2023/` | `/principales-puntos-de-la-nueva-ley-de-vivienda-2023/` | Se conserva |
| `/que-tan-buen-negocio-es-el-alquiler-turistico/` | `/que-tan-buen-negocio-es-el-alquiler-turistico/` | Se conserva |
| `/son-las-viviendas-sostenibles-el-verdadero-futuro/` | `/son-las-viviendas-sostenibles-el-verdadero-futuro/` | Se conserva |
| `/todo-lo-que-necesitas-saber-sobre-el-diseno-y-la-renovacion-de-ventanas/` | `/todo-lo-que-necesitas-saber-sobre-el-diseno-y-la-renovacion-de-ventanas/` | Se conserva |
| `/una-demanda-al-alza-impulsa-el-precio-de-la-vivienda/` | `/una-demanda-al-alza-impulsa-el-precio-de-la-vivienda/` | Se conserva |
| `/vender-o-no-vender-es-la-decision/` | `/vender-o-no-vender-es-la-decision/` | Se conserva |
| `/vendiendo-la-propiedad-familiar-en-un-divorcio-consideraciones-claves/` | `/vendiendo-la-propiedad-familiar-en-un-divorcio-consideraciones-claves/` | Se conserva |
| `/vendiendo-mi-casa-con-un-impago-en-la-hipoteca-cuales-son-las-consecuencias/` | `/vendiendo-mi-casa-con-un-impago-en-la-hipoteca-cuales-son-las-consecuencias/` | Se conserva |

## Contenido migrado

- **Artículos**: importados desde la API REST de WordPress (`scripts/import-wp-posts.ts`). El volcado llegó sin etiquetas HTML de apertura: se reconstruyen párrafos, encabezados (23 artículos los tienen) y listas; **se pierden las negritas y los enlaces internos de los textos** (pocos). Si se quiere recuperar el formato exacto, repetir la exportación con acceso directo a WordPress (`/wp-json/wp/v2/posts?per_page=100`) y volver a ejecutar el script.
- **Marca anterior**: «Look and Find Moratalaz» → «Aljumar Inmuebles» en 57 artículos (`legacyBrandReplaced: true`). Original intacto en `migration/`.
- **Temas**: las 4 categorías de WordPress se reorganizan en 3 temas por necesidad del lector.
- **Artículos de normativa con más de 18 meses** muestran un aviso de que la ley o los datos pueden haber cambiado (p. ej. «Principales puntos de la nueva Ley de Vivienda 2023»). Recomendación editorial: revisar o actualizar «Ley de Vivienda 2023», las previsiones de mercado de 2022-2023 y los artículos sobre hipotecas.
- **Textos corporativos**: «Nuestra esencia» y «¿Quieres vender?» se reescriben sin añadir afirmaciones nuevas (fuente citada en el código de cada página).
- **Testimonios**: no se migran (nombres genéricos repetidos, sin fuente). Si Aljumar tiene reseñas reales y autorizadas, se pueden añadir.

## Medios que hay que migrar antes de apagar WordPress

`npm run media:fetch` (desde un equipo con acceso a aljumar.es) descarga y guarda **con la misma ruta**:

| Qué | Destino |
|---|---|
| Logotipo vertical (SVG) y horizontal (JPG) | `public/brand/logo-vertical.svg`, `public/brand/logo-horizontal.jpg` |
| Icono del sitio | `public/favicon.png` |
| 4 fotos del equipo | `public/wp-content/uploads/…` |
| Imágenes destacadas de los 60 artículos | `public/wp-content/uploads/…` |

Mantener `/wp-content/uploads/…` conserva las URL ya indexadas en Google Imágenes. Después: `npm run build && npm run check` (los avisos de logotipo y medios deben desaparecer) y commit de los archivos.

## SEO técnico implementado

Títulos y descripciones únicos por página (comprobado) · canonical absoluto · `sitemap-index.xml` sin páginas `noindex` · `robots.txt` abierto en producción · Open Graph con imagen por página (foto del inmueble o del artículo) · datos estructurados: `RealEstateAgent` (todas), `RealEstateListing` (fichas), `ItemList` (listados), `BlogPosting`, `FAQPage` (vender), `BreadcrumbList` · migas de pan visibles · jerarquía de encabezados (un `h1` por página, comprobado) · textos alternativos en todas las imágenes · enlazado interno entre fichas parecidas, temas y llamadas a la acción.

## SEO local

- Datos NAP idénticos en todas las páginas (nombre, dirección, teléfono) y en `RealEstateAgent`.
- Zonas: Moratalaz como especialidad (oficina y trayectoria declarada) y localidades con inmuebles publicados. **No se han creado páginas por barrio o municipio sin contenido real** para evitar páginas generadas en masa.
- No se publican reseñas, valoraciones ni horarios sin verificar.

## Tras el lanzamiento (acciones que requieren acceso de Aljumar)

1. Search Console: enviar `https://aljumar.es/sitemap-index.xml`, revisar «Páginas» y errores 404 durante 4-6 semanas.
2. Comprobar las redirecciones en el servidor real: `curl -sI https://aljumar.es/quieres-vender/` debe devolver `301` → `/vender-mi-vivienda/`.
3. Actualizar en Google Business Profile la URL si cambia algo, y revisar que el nombre y el teléfono coinciden.
4. Cambiar el nombre o los enlaces de las redes sociales que siguen con la marca anterior.
5. Si se activa analítica, hacerlo con consentimiento previo (ADR-009).
