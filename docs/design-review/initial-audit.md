# Auditoría crítica de la primera versión (iteración 1)

Fecha: 10/10/2026 · Estado auditado: commit `8d2a3aa` (rama `claude/tender-curie-irf7wq`, sin cambios locales pendientes).

Método: compilación de producción servida con `astro preview`; capturas reales con Playwright (`scripts/qa-screenshots.ts`) a 1440 px y 390 px, página completa, con las animaciones activas. Como el entorno no alcanza el CDN de Inmovilla, las fotos se sirvieron desde recortes de las fotos reales de los 6 inmuebles tomados de una captura de la web antigua (solo para revisión, no se publican). Comparación con capturas de aljumar.es obtenidas el mismo día.

Conclusión honesta: la versión 1 es **más ordenada, legible y funcional** que la web antigua (hay resultados, títulos legibles, formularios y accesibilidad), pero **no da un salto visual evidente**. Repite la estructura de «tema inmobiliario» (cabecera blanca, hero azul con tarjeta de buscador, rejillas de tarjetas idénticas), no muestra el logotipo y tiene un defecto grave de animación. Un propietario podría verla como una plantilla correcta con sus colores.

## Defectos por impacto

### Críticos

1. **Bloques enteros en blanco.** El sistema de aparición al hacer scroll oculta el contenido hasta que entra en pantalla; con desplazamiento rápido, saltos a anclas o capturas de página completa, la segunda fila de inmuebles, el bloque de propietarios, los servicios y los artículos quedan invisibles (3 de 17 bloques sin mostrar en una prueba real de scroll). En móvil, más de 2.000 px de la portada aparecían vacíos. Las pruebas no lo detectaron porque se ejecutaban con movimiento reducido.
2. **La marca no está.** El logotipo se sustituye por el nombre en texto; el favicon es una «A» provisional. El logotipo oficial es claro sobre fondo oscuro, y la cabecera blanca ni siquiera permitiría usarlo.
3. **Selección de fotos de portada arbitraria.** `heroPhotos` toma las dos primeras propiedades con fotos: el resultado es **un baño** (piso de Estrella) y, en la siguiente posición, la foto principal de Seseña es **un plano**. La imagen que debería vender la agencia es la peor posible.

### Altos

4. **Hero de plantilla.** Fondo azul con degradado, líneas verticales y un círculo decorativo sin propósito; collage de dos fotos flotantes inclinado; titular serif en peso 560 (pesado y «blando»); buscador como tarjeta blanca con sombra. Es el patrón más común de los temas inmobiliarios.
5. **Ritmo repetitivo.** Casi todas las secciones son «etiqueta con guion lima + H2 + párrafo + rejilla de tarjetas iguales» (inmuebles, pasos, servicios con iconos, artículos, equipo). La etiqueta con guion lima aparece 8 veces en la portada y pierde valor.
6. **Iconos genéricos como sustituto de dirección de arte** en servicios y vender (casa, llave, gráfica, cámara, escudo, documento).
7. **Tarjetas de inmueble pesadas**: borde + sombra + radio de 18 px + etiqueta «Venta» negra en todas (redundante dentro de «Comprar») + contador de fotos + dos píldoras lima; alturas desiguales; el subtítulo del CRM repite el título.
8. **Portada móvil de 14.000 px**: cada tarjeta ocupa una pantalla, y los bloques no se adaptan (servicios, pasos y equipo se apilan uno tras otro).
9. **Equipo con iniciales en círculos con anillo lima**: parecen marcadores de posición y restan confianza en lugar de sumarla.
10. **Buscador: «Ver más» falso.** Todas las tarjetas están en el HTML y el botón solo deja de ocultarlas. Medido compilando con el XML público de demostración de Inmovilla (1.373 inmuebles válidos): `/comprar/` pasa a **4,3 MB de HTML (113 KB comprimido) con 1.106 tarjetas en el DOM**.

### Medios

11. **Ficha**: mosaico con huecos cuando hay 3 fotos; sin miniaturas; visor sin transiciones ni tira de miniaturas; «Características» como tabla de base de datos; formulario largo en la columna lateral que compite con el contenido; barras del certificado energético sobredimensionadas.
12. **Tipografía sin sistema**: todos los H2 iguales; Fraunces se usa siempre en el mismo peso; no hay contraste entre titular editorial, cifras y etiquetas.
13. **Blog**: sin imágenes migradas, cada tarjeta muestra el mismo degradado azul con un círculo lima: tres «marcadores» idénticos seguidos.
14. **Cifras pobres**: «1 oficina en Moratalaz» como dato destacado.
15. **Sobre Aljumar**: valores en lista de comprobación, sin ninguna imagen; plano.
16. **Microinteracciones uniformes**: todo aparece con el mismo desplazamiento de 14 px; los botones solo cambian de color.

### Bajos

17. Cabecera: teléfono en píldora oscura que compite con la navegación.
18. Pie correcto pero genérico, sin la marca.
19. Formularios largos en la portada (8 campos) para un primer contacto.

## Lo que sí funciona y se conserva

Arquitectura (estática + Inmovilla), modelo de datos y limpieza del CRM, filtros reales y URL compartible, accesibilidad base (contrastes, foco, etiquetas), formularios con validación en servidor, SEO y redirecciones, panel de contenidos.

## Prioridades de la iteración 2

1. Identidad: logotipo original en cabecera, pie, presentación y favicon; cabecera azul.
2. Sistema de movimiento robusto (nada oculto si falla JS o el observador) + presentación de marca.
3. Portada editorial nueva con una única fotografía principal elegida con una regla explicable.
4. Tarjetas y ficha rediseñadas; buscador con paginación real y renderizado incremental.
5. Ritmo: menos tarjetas, más composición tipográfica, hairlines y fotografía grande.
6. Blog con formato recuperado.
