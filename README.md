# Aljumar Inmuebles · nueva web

Nueva web de [aljumar.es](https://aljumar.es/): sitio estático generado con [Astro](https://astro.build) y alimentado por el CRM **Inmovilla**. Buscador con filtros reales, fichas con URL propia, captación de propietarios, formularios con PHP, blog migrado en sus URL originales y panel de contenidos en `/admin/`.

> **Estado**: construida y probada, **sin publicar**. Antes de publicar, ver [docs/FINAL-REPORT.md](docs/FINAL-REPORT.md) (sección 10) y [docs/operations/deploy.md](docs/operations/deploy.md).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/FINAL-REPORT.md](docs/FINAL-REPORT.md) | Informe final: qué hay, cómo se ha probado y qué falta |
| [docs/project-status.md](docs/project-status.md) | Estado, pruebas y decisiones pendientes |
| [docs/audit/current-state.md](docs/audit/current-state.md) | Auditoría de la web actual |
| [docs/audit/functionality-inventory.md](docs/audit/functionality-inventory.md) | Funcionalidades antes y después |
| [docs/architecture/target-architecture.md](docs/architecture/target-architecture.md) | Arquitectura, modelo de datos e integración con Inmovilla |
| [docs/decisions/architecture-decisions.md](docs/decisions/architecture-decisions.md) | Decisiones (ADR) |
| [docs/migration/seo-and-content-migration.md](docs/migration/seo-and-content-migration.md) | URL, redirecciones, contenidos y medios |
| [docs/design-system.md](docs/design-system.md) | Sistema visual y componentes |
| [docs/operations/deploy.md](docs/operations/deploy.md) | Publicación y reversión |
| [docs/operations/admin.md](docs/operations/admin.md) | Uso diario: Inmovilla, `/admin/`, formularios |

## Requisitos

- Node.js 22.18 o superior (ejecuta los scripts TypeScript directamente) y npm.
- Para los formularios: PHP 7.4+ (probado con 8.3) con `mail()` en el alojamiento.

## Desarrollo

```bash
npm ci
npm run sync -- --snapshot   # inventario de muestra (o INMOVILLA_XML_URL=… npm run sync)
npm run dev                  # http://localhost:4321
```

| Comando | Qué hace |
|---|---|
| `npm run sync` | Descarga el XML de Inmovilla y genera `src/data/inventory.json` (con salvaguardas) |
| `npm run build` | Genera `.htaccess` y compila en `dist/` (con `SITE_ENV=production` exige inventario real) |
| `npm test` | Tipos + unitarias + build + comprobaciones estáticas + formulario PHP + e2e |
| `npm run check` | Comprobaciones SEO/enlaces/redirecciones sobre `dist/` |
| `npm run test:php` | Prueba el formulario con `php -S` en modo prueba |
| `npm run media:fetch` | Descarga logotipo, icono, fotos del equipo e imágenes del blog de la web antigua |
| `npm run import:blog` | Reimporta los artículos desde `migration/wp-posts-export-*.json` |
| `node scripts/make-og.ts` | Regenera la imagen para redes sociales |
| `node scripts/qa-states.ts <carpeta>` | Capturas de revisión de páginas y estados (con `npm run preview` en marcha) |
| `node scripts/qa-screenshots.ts <carpeta> [rutas]` | Capturas de página completa de rutas concretas |

## Estructura

```
src/
  lib/inventory/   adaptador de Inmovilla, modelo, filtros, formato
  components/      componentes (cabecera, tarjeta, buscador, galería, formularios…)
  pages/           rutas (inmueble/[slug], [slug] = artículos del blog…)
  content/blog/    60 artículos en Markdown
  data/            inventory.json (generado), retired.json, settings.json (editable en /admin/), site.ts
public/
  api/contacto.php receptor de formularios (config.php solo en el servidor)
  admin/           panel de contenidos (Sveltia CMS)
scripts/           sincronización, redirecciones, comprobaciones, importación, medios
migration/         exportaciones y muestra de inventario usadas en la migración
docs/              documentación
tests/             unitarias, e2e y fixtures
```
