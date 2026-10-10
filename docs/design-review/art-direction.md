# Dirección de arte · Aljumar Inmuebles (iteración 2)

**Idea:** *oficio de barrio en clave editorial*. Una agencia pequeña, con oficina a pie de calle en Moratalaz desde 1998, que se presenta con la calma y el cuidado tipográfico de una revista de arquitectura, no con los recursos de un portal inmobiliario. La autoridad viene de lo verificable (año, dirección, cartera real, personas con nombre), no de adjetivos.

## Principios

1. **La marca manda, sin imitarla.** Se usa el logotipo original (versiones claras extraídas de la web oficial, `public/brand/`, procedimiento en `migration/brand-captures/`). Nunca se redibuja. Vive sobre su azul: cabecera, pie, presentación, marcador de fotos ausentes, imagen para redes.
2. **Una foto buena vale más que seis medianas.** La portada muestra una sola fotografía real, elegida con una regla explicable (ver más abajo). No hay fotos de banco, ni renders, ni imágenes generadas.
3. **Tipografía como estructura.** Titulares en Fraunces ligera (380) con cursiva para el matiz; texto en Plus Jakarta Sans; etiquetas en versalitas espaciadas precedidas de un filete, eco directo del «— INMUEBLES —» del logotipo.
4. **Filetes en lugar de cajas.** Las secciones se ordenan con líneas finas, números grandes y blanco; casi no hay bordes redondeados, sombras ni píldoras. Una sola sombra («flotante») para lo que de verdad flota: buscador, formulario y caja de contacto.
5. **El lima es un acento, no un color de fondo.** Botón principal de captación («Vender mi vivienda», «Solicitar valoración»), cursivas sobre azul, numerales del método y subrayados activos. Nunca como texto sobre blanco (contraste insuficiente; lo comprueba `tests/unit/contrast.test.ts`).
6. **Movimiento con intención y sin riesgo.** Entrada coreografiada de cada cabecera, apariciones suaves al hacer scroll, transiciones de fotos y de filtros. Nada esencial depende de una animación (ver «Movimiento»).
7. **Texto sobrio.** Frases cortas y comprobables. Se evitan «líderes», «los mejores», «experiencia única». Lo que no está confirmado por Aljumar no se publica.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--navy-900` | #17354f | Azul de marca: cabecera, bloques de propietarios, botones |
| `--navy-950` | #0f2537 | Pie |
| `--navy-800/700/500/300/200/100` | | Escala para fondos de foto ausente, textos sobre azul, separadores |
| `--lime-500` | #bfd600 | Acento (moderado) |
| `--paper` | #f6f4ef | Papel cálido: cabeceras de página y secciones alternas |
| `--paper-2` | #efebe3 | Banda de llamada a la acción |
| `--white` | #ffffff | Fondo de lectura |
| `--ink` / `--ink-2` / `--ink-3` | #1c2631 / #565f69 / #646c75 | Texto, secundario, terciario |
| `--line` / `--line-strong` | #e4dfd6 / #c9c1b4 | Filetes |

El papel cálido sustituye al gris azulado de la iteración 1: hace que el azul y la fotografía respiren y aleja la web del aspecto de plantilla.

## Tipografía: evaluación crítica

- **Fraunces** se mantiene, pero con otro uso. En la iteración 1 se usaba en peso 560 sin variación y resultaba blanda y pesada. Ahora: peso 380, eje óptico al máximo (`opsz 144`) en titulares, cursiva 340 para el énfasis y numerales de línea para cifras y precios. Así aporta carácter editorial sin ser decorativa. Riesgo conocido: en tamaños pequeños pierde legibilidad, por eso nunca se usa por debajo de ~1,3 rem.
- **Plus Jakarta Sans** se mantiene para texto e interfaz: geométrica, clara en móvil y con buen soporte de español. Pesos 550–650 para interfaz, nunca 800.
- Alternativas valoradas y descartadas: una sans de rejilla neutra (más «tecnológica» que de barrio) y una serif clásica de texto (más institucional, menos actual). Fraunces + Jakarta da el contraste editorial buscado con solo dos familias autoalojadas.

## Componentes y patrones

- **Etiqueta con filete** (`.label`): una por bloque, nunca dos seguidas.
- **Titular con cursiva** (`h2 em`): la cursiva lleva el matiz («Disponibles *ahora*»).
- **Cifras** (`.facts`, `.keys`): números grandes en Fraunces con su rótulo debajo, separados por filetes verticales.
- **Listas editoriales**: método numerado 01–04 en cursiva, servicios como lista de definición, equipo como lista de nombres, artículos como índice.
- **Tarjeta de inmueble** (`src/lib/inventory/card.ts` + `styles/cards.css`): foto 4:3 sin marco, precio en Fraunces, título generado de dos líneas como máximo, lugar y cifras separadas por puntos. Sin borde ni sombra; al pasar el cursor, la foto se acerca un 4 % y el título se subraya.
- **Marcador de foto ausente o rota**: azul con el símbolo del logotipo, nunca un icono de cámara genérico.

## Qué se evita (y dónde se comprobó)

| Recurso de plantilla | Situación |
|---|---|
| Degradados y círculos decorativos | Eliminados del hero, la banda de llamada a la acción y las tarjetas de blog |
| Iconos genéricos como sustituto de contenido | Eliminados de servicios, vender, contacto y pie; se conservan solo los funcionales (teléfono, flechas, cerrar) |
| «Título + párrafo + tres tarjetas» en cada sección | Sustituido por composiciones distintas: foto + buscador superpuesto, cifras, método numerado con columna fija, lista de nombres, índice de artículos |
| Fotos de banco o falsas | Ninguna. Sin foto real, marcador de marca |
| Sombras y píldoras indiscriminadas | Una sola sombra; botones y filtros rectos |
| Iniciales en círculos como «equipo» | Sustituidas por nombres; retratos solo si existen los originales |
| Texto grandilocuente | Reescrito con datos verificables |

## Fotografía principal de la portada

`heroProperty()` / `pickHero()` en `src/lib/inventory/index.ts`:

1. Si en `/admin/` (Ajustes → «Inmueble de portada») se indica un código o referencia y el inmueble sigue publicado y con fotos, se usa ese.
2. Si no, entre los inmuebles disponibles en venta o alquiler con fotos: primero los destacados en Inmovilla, después el que tiene más fotos (suele indicar reportaje completo), después el de mayor precio, y por último el identificador (resultado estable entre compilaciones).

La regla no puede saber si la primera foto de un inmueble es un baño o un plano (es lo que pasaba en la iteración 1). Para eso existe la elección manual. Con la muestra actual, la regla elige el chalet de Rivas-Vaciamadrid (terraza con piscina). La tarjeta grande de «Cartera» solo se usa si Aljumar marca un inmueble como destacado; si no, todas las tarjetas tienen el mismo tamaño, para no ampliar sin criterio una foto poco representativa.

## Movimiento

| Pieza | Comportamiento |
|---|---|
| Presentación de marca (`BrandIntro.astro`) | Solo en la portada, una vez por sesión: el logotipo original aparece sobre el azul (0–420 ms) y la cortina se retira hacia arriba (360–780 ms). No bloquea (`pointer-events: none`, página ya interactiva debajo), no desplaza nada (capa fija), no existe sin JavaScript ni con movimiento reducido, y un temporizador la retira a los 1,2 s si las animaciones CSS no se ejecutan. |
| Cabeceras de página (`[data-hero]`) | Entrada escalonada (90 ms entre piezas); la foto se descubre de derecha a izquierda. Tras la presentación de marca, la coreografía empieza cuando se retira la cortina. Solo con JavaScript. |
| Apariciones al hacer scroll (`src/scripts/motion.ts`) | Solo se marcan como pendientes los bloques que están por debajo de la pantalla al cargar; se muestran al entrar, al pasar de largo con un scroll rápido, al llegar al final, al imprimir o al saltar a un ancla. Los que entran a la vez se escalonan. Corrige el defecto crítico de la iteración 1 (bloques en blanco). |
| Tarjetas, enlaces y botones | Acercamiento lento de la foto, subrayados que crecen, flechas que se alargan. |
| Buscador | Recuento con transición numérica, etiquetas de filtros que entran, resultados que aparecen escalonados, panel móvil que sube, «Más filtros» que se despliega. |
| Galería | Pista deslizable con scroll-snap (gesto nativo en móvil), miniaturas con indicador, visor con fundido entre fotos. |
| Formularios | Foco con anillo lima, error con aviso animado, botón «Enviando…» con línea de progreso, confirmación que entra. |

Con `prefers-reduced-motion: reduce` todo lo anterior queda en su estado final sin transiciones.
