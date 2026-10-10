# Inventario de funcionalidades: web actual → nueva web

| Funcionalidad | Web actual (aljumar.es) | Nueva web | Estado |
|---|---|---|---|
| Portada | Slider, tarjetas Inmovilla con títulos concatenados, equipo, 3 servicios, blog, testimonios genéricos | Propuesta de valor + buscador visible sin desplazarse, inmuebles reales, bloque de propietarios, servicios, zonas con inventario, equipo, consejos, contacto | Implementada y verificada (e2e, axe, Lighthouse) |
| Buscador / Comprar | `/comprar/`: formulario sin resultados; filtros con listas fijas que mezclan estados | `/comprar/`: resultados en HTML + filtros reales calculados del inventario, orden, URL compartible, carga incremental, estado vacío | Implementada y verificada |
| Alquilar | `/alquilar/`: igual que comprar | `/alquilar/` con la misma lógica; `noindex` y fuera del sitemap mientras no haya alquileres | Implementada; sin inventario de alquiler en la muestra |
| Traspaso | Pestaña en la portada y valor «Traspasar» en el filtro | `/traspasos/` (enlazada en el pie), misma lógica | Implementada; sin datos en la muestra |
| Buscador con mapa | `/buscador-mapa/` | No se incluye mapa de resultados (el XML no garantiza coordenadas y las ubicaciones exactas no deben publicarse); 301 a `/comprar/` | Decisión documentada (ADR-007) |
| Ficha de inmueble | Plantilla `/inmueble/` dependiente de JS (sin URL propia por inmueble); fichas Houzez con dirección exacta | `/inmueble/<tipo-operación-lugar-código>/`: galería con visor, características, descripción limpia, gastos separados, certificado energético, ubicación aproximada, parecidos, formulario con referencia, llamada | Implementada y verificada |
| Inmueble retirado | Sin gestión | 410 + página con alternativas (registro automático en `retired.json`) | Implementada; verificación en servidor Apache pendiente |
| Comparar listados | Botón «Comparar listados» del tema | No se incluye (poco uso esperado en una cartera pequeña) | Descartada |
| Registro / acceso de usuarios | Modal visible, registro desactivado | Eliminado | — |
| Vender | `/quieres-vender/`: texto + correo de la marca anterior | `/vender-mi-vivienda/`: servicios reales, proceso, qué pasa después, FAQ, formulario de captación | Implementada y verificada |
| Contacto | `/formulario-cliente/` (WPForms, sin consentimiento, `noindex`) | `/contacto/` con canales, mapa enlazado y formulario; formularios también en portada, fichas y vender | Implementada y verificada (incluido PHP) |
| Envío de formularios | WPForms (destino desconocido) | `api/contacto.php`: validación, antispam, límite, correo; alta opcional en Inmovilla | Implementada; **envío real pendiente de configurar** (`config.php`) |
| WhatsApp | Botón flotante (número no verificado) | Botón en la barra móvil **solo si** se configura un número en `/admin/` | Preparada; número pendiente |
| Llamada | `tel:` en cabecera | Cabecera, barra fija móvil, fichas, contacto, pie | Verificada |
| Equipo | Portada + perfiles `/agent/` | Portada + «Sobre Aljumar» (`#equipo`); `/agent/*` → 301 | Implementada; fotos pendientes de migrar |
| Sobre nosotros | `/nuestra-esencia/` | `/sobre-aljumar/` | Implementada |
| Blog | `/blog/` + 60 artículos en la raíz | `/consejos-inmobiliarios/` paginado, 3 temas, artículos en las mismas URL, aviso de vigencia en normativa antigua | Implementada y verificada |
| Guías comprador / vendedor | `/guia-comprador/`, `/guia-vendedor/` | 301 al tema «Comprar y vender» y a «Vender mi vivienda» | Implementada |
| Legales | Aviso legal y privacidad (2021) con errores | Aviso legal, privacidad y cookies revisados | Implementadas; **revisión jurídica pendiente** |
| Cookies | Panel de consentimiento | No hay cookies → no hace falta panel | Verificado en el código (sin analítica ni terceros) |
| Analítica | Site Kit (probable Google Analytics) | No incluida | Pendiente de decisión (ADR-009) |
| Administración de inmuebles | Inmovilla + Houzez (duplicado) | Solo Inmovilla; la web se sincroniza | Preparada; falta la URL del XML |
| Administración de contenidos | WordPress | `/admin/` (Sveltia CMS): artículos, contacto, horario, WhatsApp, equipo | Implementada; acceso pendiente de configurar |
