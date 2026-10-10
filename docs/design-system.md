# Sistema visual

## Dirección

Inmobiliaria de barrio consolidada (desde 1998), cercana y fiable. Composición editorial: titulares en serif contemporánea, mucho aire, fotografía real de la cartera como protagonista y el verde lima del logotipo como acento de acción, nunca como fondo dominante. Sin sliders automáticos, sin fotos de stock que puedan confundirse con inmuebles reales.

## Tokens (`src/styles/tokens.css`)

| Grupo | Valores |
|---|---|
| Azules | `navy-950 #0f2537` (pie) · `navy-900 #17354f` (titulares, bandas oscuras) · `navy-700 #284b6a` (principal, enlaces, botones) · `navy-500 #4a6d8c` (iconos) · `navy-200/100/50` (líneas y fondos suaves) |
| Lima | `lime-500 #bfd600` (botón de acento, subrayados, detalles sobre azul) · `lime-600` (hover) · `lime-200/100` (selección, etiquetas) |
| Neutros | `white` · `bg #f5f7f9` · `ink #202a35` (texto) · `ink-2 #5b6876` (texto secundario) · `line`, `line-strong` |
| Estados | `danger`, `success`, `warning` con sus fondos (contraste ≥ 4,5:1, probado) |
| Tipografía | Fraunces Variable (h1-h2, precios) · Plus Jakarta Sans Variable (resto). Escala fluida `--fs-xs`…`--fs-3xl` con `clamp()` |
| Espaciado | escala de 4 px `--s-1`…`--s-10`; `--section` fluido para bloques |
| Forma | radios 6/10/18/28 px y píldora; 3 sombras teñidas de azul |
| Retícula | `--max 1240px`, `--max-narrow 880px`, `--max-text 68ch`, márgenes fluidos `--gutter` |
| Movimiento | 180 ms; desactivado con `prefers-reduced-motion` |

Reglas: el lima nunca como texto sobre fondo claro (1,6:1); el foco visible es un contorno azul de 3 px (lima sobre fondos oscuros); el estado no se comunica solo con color (iconos y texto en errores, certificado energético con letra).

## Componentes

| Componente | Archivo | Comportamiento |
|---|---|---|
| Cabecera y navegación | `Header.astro` | Fija con sombra al desplazarse; página actual marcada (`aria-current`); menú móvil con `aria-expanded`, Escape y foco gestionado |
| Pie | `Footer.astro` | Navegación, oficina (dirección enlazada a mapa, teléfonos, correo), datos legales |
| Barra de contacto móvil | `MobileContactBar.astro` | Llamar / WhatsApp (si está configurado) / Escribir o «Pedir visita» en fichas |
| Botones y enlaces | `global.css` (`.btn`, `--accent`, `--ghost`, `--on-dark`, `.link-arrow`) | Altura mínima 48 px |
| Campos | `.input`, `.select`, `.textarea`, `.check`, `.field__error` | Etiqueta visible, error asociado con `aria-describedby` y `aria-invalid` |
| Tarjeta de inmueble | `PropertyCard.astro` | Precio, encabezado «Tipo en operación en zona», ubicación, subtítulo del CRM, dormitorios/baños/superficie, 2 extras; toda la tarjeta enlaza; marcador si falta la foto |
| Buscador | `PropertySearch.astro` | Filtros reales, etiquetas de filtros activos, orden, contador `aria-live`, «Ver más», estado vacío; en móvil, panel tipo diálogo |
| Buscador rápido | `QuickSearch.astro` | Comprar/Alquilar, localidad, tipo, precio máximo (se adapta a la operación), dormitorios |
| Galería | `Gallery.astro` | Mosaico + visor `<dialog>` con flechas, teclado, deslizar, contador y retorno del foco |
| Certificado energético | `EnergyRating.astro` | Escala A-G con letra textual |
| Formularios | `ContactForm.astro` | 3 variantes; validación accesible; confirmación enfocada |
| Migas de pan | `Breadcrumbs.astro` | + `BreadcrumbList` |
| Paginación | `Pagination.astro` | `rel=prev/next`, página actual anunciada |
| Bloque de llamada a la acción | `CtaBand.astro` | Fondo azul con acento lima |
| Equipo | `TeamGrid.astro` | Retrato o iniciales si falta la foto |
| Tarjeta de artículo | `PostCard.astro` | Tema, título, resumen, fecha |
| Alertas | `.alert--error/success/info/warning` | Icono + texto |
| Estados | carga («Enviando…», botón deshabilitado), vacío (buscador, galería sin fotos), error (formularios, 404, 410) | |
