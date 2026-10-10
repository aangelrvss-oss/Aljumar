<?php
/**
 * Plantilla de configuración del formulario. En el servidor, copiar como
 * config.php (en esta misma carpeta) y rellenar. config.php NO se versiona y
 * el .htaccess de esta carpeta impide descargarlo.
 */
return [
    // Buzón que recibe las solicitudes. Confirmar con Aljumar antes de publicar.
    'to' => 'oficina@aljumar.es',
    // Remitente técnico del propio dominio (debe existir o estar autorizado
    // en SPF/DKIM del dominio para no acabar en spam).
    'from' => 'web@aljumar.es',
    'allowed_hosts' => ['aljumar.es', 'www.aljumar.es'],
    'max_per_hour' => 5,
    'min_seconds' => 3,
    'dry_run' => false,
    // Carpeta FUERA de la raíz pública para el registro técnico (sin datos personales).
    'log_dir' => '/ruta/fuera/de/public_html/logs',
    // Cadena aleatoria larga (p. ej. `openssl rand -hex 32`).
    'hash_salt' => '',
    // Opcional: token de la API REST de Inmovilla (Ajustes > Opciones > Token
    // para API Rest). Vacío = no se crea el contacto en Inmovilla.
    'inmovilla_token' => '',
];
