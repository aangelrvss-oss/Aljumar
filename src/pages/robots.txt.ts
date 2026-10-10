import type { APIRoute } from 'astro';

/**
 * robots.txt. En entornos de prueba (STAGING=1) bloquea todo el sitio; en
 * producción permite el rastreo (la web antigua bloqueaba a todos los robots
 * salvo Google y Bing, lo que impedía, entre otros, a los asistentes de IA y
 * a otros buscadores leer la web).
 */
export const GET: APIRoute = ({ site }) => {
  const staging = process.env.STAGING === '1';
  const sitemap = new URL('/sitemap-index.xml', site).href;
  const body = staging
    ? 'User-agent: *\nDisallow: /\n'
    : ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /admin/', 'Disallow: /contacto/enviado/', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
