# Sistema visual

Dirección de arte, principios y motivos: [`design-review/art-direction.md`](design-review/art-direction.md). Este documento es la referencia técnica.

## Tokens (`src/styles/tokens.css`)

| Grupo | Valores |
|---|---|
| Azules | `navy-950 #0f2537` (pie) · `navy-900 #17354f` (marca: cabecera, bloques, botones) · `navy-800/700/500/300/200/100/50` |
| Lima | `lime-500 #bfd600` (acento) · `lime-600` (hover) · `lime-200/100` (selección) |
| Neutros cálidos | `white` · `paper #f6f4ef` · `paper-2 #efebe3` · `ink #1c2631` · `ink-2 #565f69` · `ink-3 #646c75` · `line #e4dfd6` · `line-strong #c9c1b4` |
| Estados | `danger`, `success`, `warning` con sus fondos |
| Tipografía | Fraunces Variable (titulares 380, cursiva 340, eje óptico 144; precios y cifras) · Plus Jakarta Sans Variable (texto e interfaz). Escala fluida `--fs-label`…`--fs-display` |
| Espaciado | escala `--s-1`…`--s-10`; `--section` fluido |
| Forma | radios 2/4/8/12 px (botones y filtros a 2 px); una sola sombra, `--shadow-float` |
| Retícula | `--max 1320px`, `--max-narrow 860px`, `--max-text 66ch`, `--gutter` fluido, 12 columnas en las composiciones de escritorio |
| Movimiento | `--ease-out cubic-bezier(.16,1,.3,1)`, `--dur 200ms`; a 0 con `prefers-reduced-motion` |

Contrastes verificados en `tests/unit/contrast.test.ts` (24 pares, WCAG AA). El lima nunca como texto sobre fondo claro.

## Piezas globales (`src/styles/global.css`, `cards.css`)

`.label` (etiqueta con filete) · `.lead` · `.link` y `.link-arrow` · `.btn` (`--accent`, `--ghost`, `--on-dark`, `--block`, `--sm`) · campos (`.input`, `.select`, `.textarea`, `.check`, `.field__error`) · `.alert` · `.prose` · `.faq` (details nativo con +/−) · `.page-head` y `.exits` (páginas sencillas) · `.posts` · `.pcard` (tarjeta de inmueble) · `[data-motion]` y `[data-hero]` (movimiento).

## Componentes

| Componente | Archivo | Notas |
|---|---|---|
| Presentación de marca | `BrandIntro.astro` | Portada, una vez por sesión; ver art-direction |
| Movimiento | `src/scripts/motion.ts` | Nunca deja contenido oculto |
| Logotipo | `Logo.astro` | Archivo original (svg/png); dimensiones reservadas |
| Cabecera | `Header.astro` | Azul; «Vender mi vivienda» como llamada a la acción; menú móvil editorial |
| Pie | `Footer.astro` | «¿Hablamos?» + teléfono; logotipo vertical |
| Barra de contacto móvil | `MobileContactBar.astro` | Llamar / WhatsApp (si existe) / Escribir o «Pedir visita» |
| Tarjeta de inmueble | `PropertyCard.astro` → `src/lib/inventory/card.ts` | Mismo HTML en servidor y navegador |
| Buscador | `PropertySearch.astro` | Barra horizontal + «Más filtros»; panel-diálogo en móvil; páginas estáticas de 24 + índice JSON al filtrar |
| Buscador rápido | `QuickSearch.astro` | Barra integrada en la portada |
| Galería | `Gallery.astro` | Pista con scroll-snap, miniaturas, visor `<dialog>` con fundido |
| Certificado energético | `EnergyRating.astro` | Escala compacta con letra textual |
| Formularios | `ContactForm.astro` | Validación accesible, estado «Enviando…», confirmación |
| Migas, paginación | `Breadcrumbs.astro`, `Pagination.astro` | Paginación con ventana (1 … 4 5 6 … 46) |
| Banda de llamada a la acción | `CtaBand.astro` | Papel, sin decoración |
| Equipo | `TeamGrid.astro` | Nombres; retratos solo si existen los originales |
| Artículos | `PostCard.astro`, `TopicNav.astro` | Índice tipográfico; imagen solo si existe |
