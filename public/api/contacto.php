<?php
/**
 * Aljumar Inmuebles — receptor de los formularios de la web.
 *
 * Requisitos: PHP 7.4+ (probado con 8.3), extensión mbstring y mail() operativo
 * en el alojamiento (Dinahosting lo ofrece). Opcional: cURL para Inmovilla.
 *
 * Configuración: public/api/config.php en el servidor (NO se versiona; ver
 * config.example.php). Sin config.php el formulario responde con error 503:
 * nunca se envía a direcciones supuestas.
 *
 * Respuestas:
 *  - Con «Accept: application/json»: {ok: bool, error?: string, fields?: {campo: mensaje}}
 *  - Sin JavaScript: redirección 303 a /contacto/enviado/ o página de error.
 *
 * Registro: una línea JSON por envío con fecha, tipo de formulario, referencia
 * del inmueble, resultado y un hash de la IP. No se guardan nombres, correos,
 * teléfonos ni mensajes.
 */

declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

$config = [
    'to' => '',                 // Buzón que recibe las solicitudes (p. ej. oficina@aljumar.es)
    'from' => '',               // Remitente técnico del dominio (p. ej. web@aljumar.es)
    'allowed_hosts' => ['aljumar.es', 'www.aljumar.es'],
    'max_per_hour' => 5,        // Envíos por IP y hora
    'min_seconds' => 3,         // Tiempo mínimo para rellenar el formulario (con JS)
    'dry_run' => false,         // true = no envía; guarda el correo en el registro (solo pruebas)
    'log_dir' => sys_get_temp_dir(),
    'hash_salt' => '',          // Sal para el hash de IP (cadena aleatoria)
    'inmovilla_token' => '',    // Opcional: token API REST de Inmovilla para crear el contacto
];
$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    $config = array_merge($config, (array) require $configFile);
}
if (getenv('ALJ_FORM_DRY_RUN') === '1') {
    $config['dry_run'] = true;
}
if (getenv('ALJ_FORM_TO')) {
    $config['to'] = (string) getenv('ALJ_FORM_TO');
}
if (getenv('ALJ_FORM_FROM')) {
    $config['from'] = (string) getenv('ALJ_FORM_FROM');
}
if (getenv('ALJ_ALLOWED_HOSTS')) {
    $config['allowed_hosts'] = array_map('trim', explode(',', (string) getenv('ALJ_ALLOWED_HOSTS')));
}

function respond(bool $ok, int $status, string $error = '', array $fields = []): void
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        $body = ['ok' => $ok];
        if ($error !== '') {
            $body['error'] = $error;
        }
        if ($fields) {
            $body['fields'] = $fields;
        }
        echo json_encode($body, JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($ok) {
        header('Location: /contacto/enviado/', true, 303);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $msg = htmlspecialchars($error ?: 'Revisa los datos del formulario.', ENT_QUOTES, 'UTF-8');
    $list = '';
    foreach ($fields as $m) {
        $list .= '<li>' . htmlspecialchars((string) $m, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>No se ha podido enviar | Aljumar Inmuebles</title>'
        . '<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.6;color:#202a35}a{color:#284b6a}</style></head><body>'
        . '<h1>No se ha podido enviar tu mensaje</h1><p>' . $msg . '</p>' . ($list ? '<ul>' . $list . '</ul>' : '')
        . '<p><a href="javascript:history.back()">Volver al formulario</a> o llámanos al <a href="tel:+34913339083">91 333 90 83</a>.</p></body></html>';
    exit;
}

function log_event(array $config, array $event): void
{
    $dir = rtrim((string) $config['log_dir'], '/');
    if ($dir === '' || !is_dir($dir) || !is_writable($dir)) {
        return;
    }
    $event['t'] = gmdate('c');
    @file_put_contents($dir . '/aljumar-formularios.log', json_encode($event, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

/** Una línea, sin caracteres de control (evita inyección de cabeceras). */
function one_line(string $v, int $max): string
{
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

function multi_line(string $v, int $max): string
{
    $v = str_replace("\r\n", "\n", $v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

function post(string $k): string
{
    $v = $_POST[$k] ?? '';
    return is_string($v) ? $v : '';
}

// --- Método y origen -------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 405, 'Método no permitido.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origin !== '') {
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $self = strtolower(explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''))[0]);
    $allowed = array_merge((array) $config['allowed_hosts'], [$self, 'localhost', '127.0.0.1']);
    if ($host !== '' && !in_array($host, $allowed, true)) {
        log_event($config, ['r' => 'origen-rechazado']);
        respond(false, 403, 'Origen no permitido.');
    }
}

if (($config['to'] === '' || $config['from'] === '') && !$config['dry_run']) {
    log_event($config, ['r' => 'sin-configurar']);
    respond(false, 503, 'El formulario no está disponible en este momento. Escríbenos a oficina@aljumar.es o llámanos al 91 333 90 83.');
}

// --- Antispam --------------------------------------------------------------
$ipHash = substr(hash('sha256', ($config['hash_salt'] ?? '') . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);

if (post('web') !== '') {
    // Robot: se responde «ok» para no darle pistas, pero no se envía nada.
    log_event($config, ['r' => 'trampa', 'ip' => $ipHash]);
    respond(true, 200);
}

$ts = post('ts');
if ($ts !== '' && ctype_digit($ts)) {
    $elapsed = (int) floor(microtime(true) * 1000) - (int) $ts;
    if ($elapsed >= 0 && $elapsed < ((int) $config['min_seconds']) * 1000) {
        log_event($config, ['r' => 'demasiado-rapido', 'ip' => $ipHash]);
        respond(false, 429, 'Has enviado el formulario demasiado rápido. Espera unos segundos y vuelve a intentarlo.');
    }
}

$rateFile = rtrim(sys_get_temp_dir(), '/') . '/aljumar-rl-' . $ipHash;
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string) @file_get_contents($rateFile))),
        static fn (int $t): bool => $t > $now - 3600
    );
}
if (count($hits) >= (int) $config['max_per_hour']) {
    log_event($config, ['r' => 'limite', 'ip' => $ipHash]);
    respond(false, 429, 'Has enviado varios mensajes seguidos. Inténtalo más tarde o llámanos al 91 333 90 83.');
}

// --- Validación y normalización -------------------------------------------
$tipo = in_array(post('formulario'), ['general', 'inmueble', 'vender'], true) ? post('formulario') : 'general';
$motivos = [
    'comprar' => 'Busca vivienda para comprar',
    'alquilar' => 'Busca vivienda en alquiler',
    'vender' => 'Quiere vender su inmueble',
    'poner-en-alquiler' => 'Quiere alquilar su inmueble',
    'valorar' => 'Quiere conocer el valor de su inmueble',
    'otro' => 'Otra consulta',
];
$tiposInmueble = ['piso', 'atico', 'chalet', 'local', 'garaje', 'otro'];

$nombre = one_line(post('nombre'), 120);
$email = mb_strtolower(one_line(post('email'), 160));
$telefono = preg_replace('/[^\d+]/', '', one_line(post('telefono'), 25)) ?? '';
$mensaje = multi_line(post('mensaje'), 3000);
$motivo = array_key_exists(post('motivo'), $motivos) ? post('motivo') : ($tipo === 'inmueble' ? '' : 'otro');
$interes = post('interes') === 'informacion' ? 'Recibir más información' : (post('interes') === 'visita' ? 'Concertar una visita' : '');
$zona = one_line(post('zona'), 140);
$tipoInmueble = in_array(post('tipo_inmueble'), $tiposInmueble, true) ? post('tipo_inmueble') : '';
$ref = preg_replace('/[^A-Za-z0-9_-]/', '', one_line(post('inmueble_ref'), 40)) ?? '';
$tituloInmueble = one_line(post('inmueble_titulo'), 200);
$urlInmueble = one_line(post('inmueble_url'), 300);
$comunicaciones = post('comunicaciones') === '1';

$errors = [];
if (mb_strlen($nombre) < 2) {
    $errors['nombre'] = 'Escribe tu nombre.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Escribe un correo válido.';
}
$telRequired = $tipo !== 'general';
if ($telefono !== '' || $telRequired) {
    if (!preg_match('/^\+?\d{9,15}$/', $telefono)) {
        $errors['telefono'] = 'Escribe un teléfono válido (9 cifras como mínimo).';
    }
}
if ($tipo === 'vender' && mb_strlen($zona) < 3) {
    $errors['zona'] = 'Indica la zona o la calle del inmueble.';
}
if ($tipo === 'general' && mb_strlen($mensaje) < 5) {
    $errors['mensaje'] = 'Cuéntanos brevemente qué necesitas.';
}
if (post('privacidad') !== '1') {
    $errors['privacidad'] = 'Necesitamos tu consentimiento para poder responderte.';
}
// Enlaces masivos en el mensaje: patrón típico de spam.
if (preg_match_all('#https?://#i', $mensaje) > 3) {
    $errors['mensaje'] = 'El mensaje contiene demasiados enlaces.';
}
if ($urlInmueble !== '' && !preg_match('#^https?://#', $urlInmueble)) {
    $urlInmueble = '';
}
if ($errors) {
    log_event($config, ['r' => 'validacion', 'f' => $tipo, 'campos' => array_keys($errors)]);
    respond(false, 422, 'Revisa los campos marcados.', $errors);
}

// --- Correo ----------------------------------------------------------------
$asuntos = [
    'general' => 'Consulta web: ' . ($motivos[$motivo] ?? 'Contacto'),
    'inmueble' => 'Interés en inmueble' . ($ref !== '' ? " ref. $ref" : '') . ($interes ? " ($interes)" : ''),
    'vender' => 'Captación: ' . ($motivos[$motivo] ?? 'Propietario') . ($zona !== '' ? " — $zona" : ''),
];
$subject = one_line($asuntos[$tipo], 180);

$lines = [
    'Nueva solicitud desde aljumar.es',
    str_repeat('-', 40),
    'Formulario: ' . $tipo,
    'Nombre: ' . $nombre,
    'Correo: ' . $email,
    'Teléfono: ' . ($telefono !== '' ? $telefono : '(no indicado)'),
];
if ($motivo !== '' && $tipo !== 'inmueble') {
    $lines[] = 'Motivo: ' . $motivos[$motivo];
}
if ($tipo === 'inmueble') {
    $lines[] = 'Inmueble: ' . ($tituloInmueble !== '' ? $tituloInmueble : '(sin título)') . ($ref !== '' ? " — ref. $ref" : '');
    if ($urlInmueble !== '') {
        $lines[] = 'Ficha: ' . $urlInmueble;
    }
    if ($interes !== '') {
        $lines[] = 'Solicita: ' . $interes;
    }
}
if ($tipo === 'vender') {
    $lines[] = 'Tipo de inmueble: ' . ($tipoInmueble !== '' ? $tipoInmueble : '(no indicado)');
    $lines[] = 'Zona / calle: ' . $zona;
}
$lines[] = 'Acepta comunicaciones comerciales: ' . ($comunicaciones ? 'sí' : 'no');
$lines[] = '';
$lines[] = 'Mensaje:';
$lines[] = $mensaje !== '' ? $mensaje : '(sin mensaje)';
$lines[] = '';
$lines[] = 'Enviado el ' . date('d/m/Y H:i') . ' desde el formulario de la web. Responde directamente a este correo para contestar.';
$body = implode("\n", $lines);

$headers = [
    'From: Web Aljumar <' . $config['from'] . '>',
    'Reply-To: ' . (mb_encode_mimeheader($nombre, 'UTF-8') . ' <' . $email . '>'),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: aljumar-web',
];

$sent = false;
if ($config['dry_run']) {
    log_event($config, ['r' => 'prueba', 'f' => $tipo, 'ref' => $ref, 'asunto' => $subject, 'cuerpo' => $body]);
    $sent = true;
} else {
    $sent = @mail(
        (string) $config['to'],
        mb_encode_mimeheader($subject, 'UTF-8'),
        $body,
        implode("\r\n", $headers),
        '-f' . $config['from']
    );
}

if (!$sent) {
    log_event($config, ['r' => 'error-correo', 'f' => $tipo, 'ref' => $ref]);
    respond(false, 502, 'No hemos podido enviar tu mensaje por un problema técnico. Llámanos al 91 333 90 83 o escribe a oficina@aljumar.es.');
}

$hits[] = $now;
@file_put_contents($rateFile, implode(',', $hits), LOCK_EX);

// --- Inmovilla (opcional) ---------------------------------------------------
// Crea el contacto como cliente en el CRM para que no haya que teclearlo.
// Si falla, el correo ya se ha enviado: solo se registra el error.
$crm = 'desactivado';
if ($config['inmovilla_token'] !== '' && !$config['dry_run'] && function_exists('curl_init')) {
    $partes = preg_split('/\s+/u', $nombre, 2) ?: [$nombre];
    $payload = [
        'nombre' => $partes[0],
        'apellidos' => $partes[1] ?? '',
        'email' => $email,
        'observacion' => mb_substr($subject . "\n" . $mensaje, 0, 2000),
    ];
    if ($telefono !== '') {
        $payload['telefono2'] = (int) ltrim(preg_replace('/^\+34/', '', $telefono) ?? '', '+');
    }
    $ch = curl_init('https://procesos.inmovilla.com/api/v1/clientes/');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Token: ' . $config['inmovilla_token']],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $crm = $code >= 200 && $code < 300 ? 'ok' : 'error-' . $code;
}

log_event($config, ['r' => 'enviado', 'f' => $tipo, 'ref' => $ref, 'crm' => $crm, 'ip' => $ipHash]);
respond(true, 200);
