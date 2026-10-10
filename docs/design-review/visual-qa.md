# QA visual · iteración 2

Fecha: 10/10/2026. Capturas reales de la web compilada (`astro preview`) con Playwright, a 1440 px (escritorio), 820 px (tableta) y 390 px (móvil), con las animaciones activadas salvo donde se indica.

- Páginas y estados: `node scripts/qa-states.ts <carpeta>` → [`capturas/iteracion-2/`](capturas/iteracion-2/) (44 capturas).
- Capturas de páginas completas sueltas: `node scripts/qa-screenshots.ts <carpeta> [rutas…]`.
- Referencias anteriores: [`capturas/antes/`](capturas/antes/) (web antigua e iteración 1).
- Comparación directa: [`comparacion_portada_antigua-it1-it2.jpg`](capturas/comparacion_portada_antigua-it1-it2.jpg) y [`comparacion_portada-movil_it1-it2.jpg`](capturas/comparacion_portada-movil_it1-it2.jpg).

**Fotografías en las capturas.** El entorno de trabajo no tiene acceso al CDN de Inmovilla. Las fotos de los inmuebles se sirvieron desde recortes (214×164 px) de las fotos reales publicadas en la web antigua, por eso se ven algo desenfocadas al ampliarse: en producción se cargan los originales del CDN. Todas las fotos de un inmueble aparecen como la misma imagen (solo había un recorte por inmueble). No se ha usado ninguna foto de banco ni generada.

## Cobertura

| Estado pedido | Captura |
|---|---|
| Portada escritorio / móvil | `escritorio_portada`, `movil_portada` |
| Presentación de marca (fotogramas y final) | `*_presentacion-150ms`, `*_presentacion-500ms`, `*_presentacion-final` |
| Resultados con varios filtros | `escritorio_comprar-filtrado` (precio + dormitorios, con etiquetas) |
| Panel «Más filtros» / panel móvil | `escritorio_comprar-mas-filtros`, `movil_comprar-panel-filtros` |
| Sin resultados | `escritorio_comprar-sin-resultados` (con sugerencias de qué filtro quitar) |
| Ficha en varios tamaños | `escritorio_ficha`, `tableta_ficha`, `movil_ficha` |
| Galería y visor | `escritorio_ficha-galeria-foto2`, `escritorio_ficha-visor`, `movil_ficha-visor` |
| Propietarios | `*_vender` |
| Formulario: errores, enviando, enviado | `escritorio_formulario-errores`, `-enviando`, `-enviado` (envío simulado) |
| Menú móvil | `movil_menu-abierto` |
| Blog y artículo | `*_blog`, `*_articulo` |
| Corporativa | `*_sobre` |
| Pie y contacto | final de cualquier página completa, `*_contacto` |
| Legal | `*_legal` |
| Error 404 / inmueble retirado (410) | `*_404`, `*_410` |
| Movimiento reducido | `escritorio_portada-movimiento-reducido` |
| Fallo de fotos externas | `escritorio_portada-fotos-fallidas`, `escritorio_ficha-fotos-fallidas` |
| Sin JavaScript | `movil_comprar-sin-javascript` |

La barra de contacto fija del móvil aparece a media altura en las capturas de página completa: es un efecto de la captura (un elemento fijo se pinta en la posición de la primera pantalla); en el navegador está siempre abajo.

## Defectos encontrados durante la QA y corregidos

| Defecto | Causa | Corrección |
|---|---|---|
| Bloques en blanco en capturas de página completa | El script de capturas usaba `scrollTo` con desplazamiento suave y la página no llegaba a recorrerse | Desplazamiento instantáneo y aviso si queda algún bloque pendiente; además, pruebas e2e del sistema de apariciones con movimiento activado |
| Barra de búsqueda de la portada en columna y tapando el pie de foto | Rejilla CSS inválida (`auto-fit` combinado con `auto`) | Barra en fila con flex |
| Botón del menú móvil partido en dos líneas («ABRIR / MENÚ») | Texto largo visible | Se muestra «Menú»; el nombre accesible sigue siendo «Abrir/Cerrar menú» |
| Migas de pan cortadas a la izquierda | El contenedor anulaba su relleno lateral | Contenedor separado de la lista |
| «(esquina vinateros)» en minúscula | `toLowerCase()` sobre un nombre propio | Solo se baja la primera letra |
| Etiquetas de «Características» en mayúsculas | Selector de etiquetas de campo demasiado amplio | Solo hijos directos |
| Nombres del equipo partidos palabra a palabra en «Sobre Aljumar» | La lista caía en la columna estrecha de la rejilla (estilo con ámbito de página sin efecto en el componente) | Celda de rejilla explícita |
| Tarjeta grande de «Cartera» con la foto de un baño | La primera tarjeta se ampliaba siempre | Solo se amplía si Aljumar marca el inmueble como destacado |
| Asteriscos «**» visibles en 7 artículos | Negritas que empezaban por puntuación o cruzaban un salto de línea en el HTML original | Corregido en el importador; `npm run check` lo vigila en todas las páginas |
| Formulario de la ficha: campos desalineados | `align-items: stretch` con textos de ayuda de distinta altura | Alineación al inicio |

## Comparación honesta con la web antigua y con la iteración 1

**Web antigua.** Cabecera y hero azul con el plano de una promoción en Chiloeches (Guadalajara) que no figura en la muestra de inventario publicada, tarjetas con títulos concatenados («PisoenMadrid»), barra lateral de noticias, aviso de cookies tapando contenido y botón de WhatsApp flotante. La nueva web es incomparablemente más legible y ordenada.

**Iteración 1.** Correcta pero de plantilla: hero azul con degradado y collage, tarjetas con borde y sombra, la misma estructura en todas las secciones, sin logotipo. La comparación lado a lado lo deja claro.

**Iteración 2.** ¿Parece una plantilla recoloreada? Con la comparación delante, mi respuesta es **no**: la portada se organiza alrededor de una única fotografía real, el buscador se superpone a ella uniendo las dos columnas, los titulares tienen voz propia (Fraunces ligera con cursiva), cada sección tiene una composición distinta y la marca original está presente de principio a fin. Lo que todavía se parece a cualquier portal es la rejilla de tarjetas del listado, que es deliberadamente convencional porque su trabajo es comparar inmuebles.

**Lo que aún limita el resultado** (no se resuelve con código):

1. **Fotografía.** Con fotos de móvil, baños o planos como primera imagen, ninguna dirección de arte luce. Recomendación a Aljumar: primera foto de cada inmueble = fachada, salón o terraza; marcar como destacados en Inmovilla los que tengan mejor reportaje; usar el ajuste «Inmueble de portada».
2. **Retratos del equipo.** Las fotos existen en la web antigua pero no se han podido descargar desde este entorno (`npm run media:fetch`); hasta entonces el equipo aparece solo con nombres.
3. **Logotipo vectorial.** Los PNG extraídos se ven bien en pantallas normales; en pantallas de alta densidad se notará cierta suavidad. Si Aljumar entrega el SVG transparente, basta con guardarlo como `public/brand/logo-*.svg`.

Que la web parezca más profesional no demuestra que vaya a captar más propietarios: eso solo lo dirán las métricas reales (solicitudes de valoración, llamadas) tras la publicación.
