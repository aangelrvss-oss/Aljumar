# Estado del proyecto

Última actualización: 10/10/2026 (iteración 2)

## Fase actual

**Iteración 2 (nivel de agencia prémium) terminada y lista para revisión.** La publicación sigue **pendiente de autorización y de accesos**. Nada se ha publicado ni se ha modificado la web actual, el dominio ni ninguna cuenta externa.

## Cambios de la iteración 2

- Auditoría crítica de la iteración 1 con capturas reales (`docs/design-review/initial-audit.md`).
- Dirección de arte documentada (`docs/design-review/art-direction.md`) y sistema visual nuevo.
- Logotipo original incorporado (cabecera, pie, presentación, favicon, imagen para redes, marcador de fotos).
- Presentación de marca en la portada y sistema de movimiento que nunca oculta contenido.
- Portada, listados, ficha, vender, sobre, contacto, blog, legales, 404 y 410 rediseñados.
- Buscador escalable: páginas estáticas de 24, índice JSON solo al filtrar, pintado incremental real.
- Blog: formato, títulos, listas y enlaces internos recuperados del HTML original.
- QA visual con 44 capturas (`docs/design-review/visual-qa.md`).

## Pruebas ejecutadas (10/10/2026, en el entorno de desarrollo)

| Prueba | Resultado |
|---|---|
| `astro check` (TypeScript) | 0 errores |
| Unitarias (Vitest) | 70/70 |
| Comprobación estática de `dist/` | 87 páginas, sin errores (aviso: medios de la web antigua pendientes) |
| Formulario PHP real (`php -S`, modo prueba) | todas superadas (15) |
| E2E Playwright (escritorio, móvil, tableta) + axe WCAG 2.2 AA | 135 superadas, 9 omitidas por dispositivo |
| Lighthouse móvil con 1.373 inmuebles (XML de demostración de Inmovilla) | Rendimiento 97-99 · Accesibilidad 100 · Buenas prácticas 96-100 · SEO 100 (sin fotos reales: ver limitaciones) |

## Problemas pendientes

1. Inventario real: falta la URL del XML de Inmovilla (la web usa una muestra de 6 inmuebles con aviso visible y la compilación de producción se bloquea con ella).
2. Fotos del equipo, imágenes del blog y logotipos vectoriales: `npm run media:fetch` desde un equipo con acceso a aljumar.es.
3. Aviso legal: faltan los datos del Registro Mercantil.
4. Formularios: falta `config.php` con buzón y remitente; no se ha podido probar el envío real de correo ni el alta en Inmovilla.
5. La rama `main` no existe en GitHub y es la que usan el panel `/admin/` y el despliegue (ver informe final).

## Decisiones pendientes de autorización

- Crear `main` a partir de esta rama (fusión) para activar el panel de contenidos.
- Publicar (procedimiento en `docs/operations/deploy.md`) y activar `DEPLOY_ENABLED`.
- Fichas de Houzez: cuáles siguen activas.
- Analítica (requiere consentimiento), WhatsApp, horario y cargos del equipo.
- Redes sociales con la marca anterior.
- Promoción «Edificio EL-EM, 16 viviendas en Chiloeches»: la web antigua la destaca, pero no está en la muestra de inventario; si sigue a la venta, debe darse de alta en Inmovilla.

## Siguiente paso

Aljumar: revisar la iteración 2 (capturas en `docs/design-review/capturas/`), pedir a Inmovilla la URL del XML, ejecutar `npm run media:fetch` y completar los datos legales; después, publicar en un subdominio de prueba.
