import { test, expect, isMobile } from './fixtures';
import inventory from '../../src/data/inventory.json' with { type: 'json' };

/**
 * Movimiento, presentación de marca y degradación sin JavaScript.
 * Las demás pruebas se ejecutan con movimiento reducido; estas lo activan
 * expresamente para comprobar que ninguna animación oculta contenido.
 */

test.describe('Apariciones al hacer scroll', () => {
  test('con movimiento activado no queda ningún bloque oculto tras recorrer la página', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    // Lo que se ve al cargar nunca se oculta.
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.locator('.hero [data-motion].is-pending').count()).toBe(0);
    // Salto brusco al final (como una rueda rápida o la tecla Fin).
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(page.locator('[data-motion].is-pending')).toHaveCount(0);
  });

  test('un salto a un ancla muestra el contenido de destino', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/sobre-aljumar/');
    await page.evaluate(() => (location.hash = '#equipo'));
    await expect(page.locator('[data-motion].is-pending')).toHaveCount(0);
  });

  test('con movimiento reducido no se oculta nada en ningún momento', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('[data-motion].is-pending').count()).toBe(0);
    await expect(page.locator('html')).not.toHaveClass(/reveal/);
  });
});

test.describe('Presentación de marca', () => {
  test('aparece en la portada una vez por sesión, no bloquea y se retira sola', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/reveal/);
    const intro = page.locator('.intro');
    // Usa el logotipo original y no recibe eventos del puntero.
    await expect(intro.locator('img')).toHaveAttribute('src', '/brand/logo-vertical.png');
    expect(await intro.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    // A los 1,3 s ya no tapa la página.
    await page.waitForTimeout(1300);
    await expect(intro).toBeHidden();
    // Segunda visita en la misma sesión: sin presentación.
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/reveal/);
    await expect(intro).toBeHidden();
  });

  test('no se muestra en otras páginas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/comprar/');
    await expect(page.locator('.intro')).toHaveCount(0);
  });
});

test.describe('Sin JavaScript', () => {
  test('el contenido, las fichas y la paginación siguen accesibles', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
    await ctx.route(/apinmo\.com|inmovilla\.com/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('.intro')).toBeHidden();
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll('[data-motion], [data-hero]')].filter((el) => getComputedStyle(el).opacity === '0').length,
    );
    expect(hidden).toBe(0);
    await page.goto('/comprar/');
    const sale = inventory.properties.filter((p) => p.operations.includes('venta')).length;
    await expect(page.locator('[data-results] > li')).toHaveCount(Math.min(sale, 24));
    // Sin JavaScript no se ofrecen filtros que no funcionarían.
    await expect(page.locator('[data-filters]')).toBeHidden();
    await ctx.close();
  });
});

test.describe('Fotos externas que fallan', () => {
  test('las tarjetas muestran el marcador de marca en lugar de una imagen rota', async ({ page }) => {
    await page.route(/apinmo\.com|inmovilla\.com/, (r) => r.abort());
    await page.goto('/comprar/');
    const first = page.locator('.pcard').first();
    await expect(first.locator('img')).toHaveAttribute('data-broken', '');
    await expect(first.locator('.pcard__ph')).toBeVisible();
  });
});

test.describe('Buscador con inventario grande', () => {
  // Índice sintético (60 inmuebles derivados de los reales) servido solo en la
  // prueba, para comprobar el pintado incremental sin depender del inventario.
  const base = inventory.properties.filter((p) => p.operations.includes('venta'));
  const big = Array.from({ length: 60 }, (_, i) => {
    const p = base[i % base.length]!;
    const id = `${p.id}-${i}`;
    return {
      id,
      operations: ['venta'],
      city: p.city,
      zone: p.zone,
      typeGroup: p.typeGroup,
      price: { venta: 100000 + i * 1000, alquiler: null, traspaso: null },
      area: p.builtArea,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      features: p.features,
      rank: i,
      card: {
        id,
        href: `/inmueble/${p.slug}/`,
        operation: 'venta',
        price: `${100 + i}.000 €`,
        headline: `Inmueble de prueba ${i + 1}`,
        place: 'Madrid',
        specs: [],
        photo: null,
        photoCount: 0,
        status: null,
      },
    };
  });

  test('«Mostrar más» añade de verdad 24 tarjetas cada vez y mueve el foco', async ({ page }) => {
    await page.route('**/datos/inmuebles-venta.json', (r) => r.fulfill({ json: { operation: 'venta', count: big.length, items: big } }));
    await page.goto('/comprar/?orden=precio-desc');
    const cards = page.locator('[data-results] > li');
    await expect(cards).toHaveCount(24);
    await expect(page.locator('[data-count]')).toContainText('60 inmuebles');
    await page.getByRole('button', { name: 'Mostrar 24 más' }).click();
    await expect(cards).toHaveCount(48);
    await expect(cards.nth(24).getByRole('link')).toBeFocused();
    await page.getByRole('button', { name: 'Mostrar 12 más' }).click();
    await expect(cards).toHaveCount(60);
    await expect(page.locator('[data-more-wrap]')).toBeHidden();
    // Nunca hay tarjetas ocultas en el DOM.
    await expect(page.locator('[data-results] > li[hidden]')).toHaveCount(0);
  });

  test('si el índice no se puede descargar, avisa y mantiene el listado', async ({ page }) => {
    await page.route('**/datos/inmuebles-venta.json', (r) => r.abort());
    await page.goto('/comprar/?orden=precio-asc');
    await expect(page.locator('[data-status]')).toContainText('No se ha podido cargar el buscador');
    await expect(page.locator('[data-results] > li').first()).toBeVisible();
  });

  test('estado vacío: propone qué filtro quitar con su recuento real', async ({ page }) => {
    test.skip(isMobile(page), 'Misma lógica en todos los tamaños');
    await page.goto('/comprar/?precio_max=60000&dormitorios=4');
    await expect(page.locator('[data-empty]')).toBeVisible();
    const sale = inventory.properties.filter((p) => p.operations.includes('venta'));
    const n = sale.filter((p) => (p.bedrooms ?? 0) >= 4).length;
    if (n > 0) await expect(page.locator('[data-suggest]')).toContainText(`Sin «Hasta 60.000 €»: ${n}`);
  });
});
