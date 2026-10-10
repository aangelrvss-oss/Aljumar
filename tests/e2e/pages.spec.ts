import AxeBuilder from '@axe-core/playwright';
import { test, expect, isMobile, noHorizontalOverflow } from './fixtures';
import inventory from '../../src/data/inventory.json' with { type: 'json' };

const property = inventory.properties.find((p) => p.photos.length > 1) ?? inventory.properties[0]!;
const KEY_PAGES = ['/', '/comprar/', `/inmueble/${property.slug}/`, '/vender-mi-vivienda/', '/sobre-aljumar/', '/contacto/', '/consejos-inmobiliarios/', '/check-list-de-los-documentos-que-necesitas-para-vender-tu-propiedad/', '/politica-privacidad/'];

test.describe('Páginas clave', () => {
  for (const path of KEY_PAGES) {
    test(`${path}: carga sin errores, metadatos y sin desbordamiento`, async ({ page, consoleErrors }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path.replace(/[/.]/g, '\\$&')}$`));
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc?.length ?? 0).toBeGreaterThan(50);
      await noHorizontalOverflow(page);
      expect(consoleErrors).toEqual([]);
    });
  }

  for (const path of KEY_PAGES) {
    test(`${path}: sin incumplimientos graves de accesibilidad (axe, WCAG 2.2 AA)`, async ({ page }) => {
      await page.goto(path);
      // Por si algún bloque quedara pendiente de aparecer: se analiza el estado final.
      await page.evaluate(() => document.querySelectorAll('[data-motion].is-pending').forEach((e) => e.classList.replace('is-pending', 'is-in')));
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }

  test('404 personalizada con salidas útiles', async ({ page }) => {
    const res = await page.goto('/no-existe-esta-pagina/');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('No encontramos esta página');
  });
});

test.describe('Ficha de inmueble', () => {
  test('datos principales, datos estructurados y acciones de contacto', async ({ page }) => {
    await page.goto(`/inmueble/${property.slug}/`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"RealEstateListing"'))).toBe(true);
    // Escritorio: caja de contacto fija junto al contenido; móvil: barra inferior.
    const call = isMobile(page)
      ? page.getByRole('region', { name: 'Contacto rápido' }).getByRole('link', { name: 'Llamar' })
      : page.locator('.contact-box').getByRole('link', { name: /Llamar al/ });
    await expect(call).toHaveAttribute('href', 'tel:+34913339083');
    await expect(page.locator('#form-inmueble input[name="inmueble_ref"]')).toHaveValue(property.ref ?? property.id);
    // La descripción no arrastra los restos «bbr>» de la web antigua.
    await expect(page.locator('.property__desc')).not.toContainText('bbr>');
  });

  test('galería: abre el visor, navega con teclado y devuelve el foco', async ({ page }) => {
    test.skip(property.photos.length < 2, 'Hace falta más de una foto');
    await page.goto(`/inmueble/${property.slug}/`);
    const opener = page.getByRole('button', { name: /Ver las \d+ fotografías/ });
    await opener.click();
    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-counter]')).toHaveText(`1 / ${property.photos.length}`);
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('[data-counter]')).toHaveText(`2 / ${property.photos.length}`);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('[data-counter]')).toHaveText(`${property.photos.length} / ${property.photos.length}`);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('en móvil la barra inferior permite llamar y pedir visita', async ({ page }) => {
    test.skip(!isMobile(page), 'Solo en móvil');
    await page.goto(`/inmueble/${property.slug}/`);
    const bar = page.getByRole('region', { name: 'Contacto rápido' });
    await expect(bar.getByRole('link', { name: 'Llamar' })).toHaveAttribute('href', 'tel:+34913339083');
    await expect(bar.getByRole('link', { name: 'Pedir visita' })).toHaveAttribute('href', '#solicitar');
  });
});

test.describe('Formularios', () => {
  test('validación en el navegador: mensajes por campo y foco en el primero', async ({ page }) => {
    await page.goto('/contacto/');
    const form = page.locator('#formulario');
    await form.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(form.locator('[data-form-error]')).toBeVisible();
    await expect(form.getByLabel('Nombre y apellidos')).toBeFocused();
    await expect(form.getByLabel('Nombre y apellidos')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('[data-error-for="privacidad"]')).toContainText('consentimiento');
  });

  test('envío correcto: confirmación visible y enfocada', async ({ page }) => {
    let payload = '';
    await page.route('**/api/contacto.php', async (route) => {
      payload = route.request().postData() ?? '';
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto('/vender-mi-vivienda/');
    const form = page.locator('#formulario');
    await form.getByLabel('Nombre y apellidos').fill('Ana Propietaria');
    await form.getByLabel('Teléfono').fill('600 112 233');
    await form.getByLabel('Correo electrónico').fill('ana@example.com');
    await form.getByLabel('Zona o calle del inmueble').fill('Moratalaz, calle Arroyo Belincoso');
    await form.getByRole('checkbox', { name: /política de privacidad/ }).check();
    await page.waitForTimeout(50);
    await form.getByRole('button', { name: 'Quiero que me llaméis' }).click();
    await expect(page.locator('[data-form-success]').first()).toBeVisible();
    await expect(page.locator('[data-form-success]').first()).toBeFocused();
    const field = (name: string) => payload.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1];
    expect(field('formulario')).toBe('vender');
    expect(field('zona')).toBe('Moratalaz, calle Arroyo Belincoso');
    expect(field('ts')).toMatch(/^\d{13}$/);
    expect(field('web')).toBe('');
  });

  test('error del servidor: se informa y se ofrecen alternativas', async ({ page }) => {
    await page.route('**/api/contacto.php', (route) =>
      route.fulfill({ status: 502, json: { ok: false, error: 'No hemos podido enviar tu mensaje por un problema técnico. Llámanos al 91 333 90 83.' } }),
    );
    await page.goto('/contacto/');
    const form = page.locator('#formulario');
    await form.getByLabel('Nombre y apellidos').fill('Ana');
    await form.getByLabel('Correo electrónico').fill('ana@example.com');
    await form.locator('textarea[name="mensaje"]').fill('Hola, quiero información.');
    await form.getByRole('checkbox', { name: /política de privacidad/ }).check();
    await form.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(form.locator('[data-form-error]')).toContainText('91 333 90 83');
    await expect(form.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
  });

  test('el motivo se preselecciona desde la URL', async ({ page }) => {
    await page.goto('/contacto/?motivo=alquilar');
    await expect(page.locator('#formulario select[name="motivo"]')).toHaveValue('alquilar');
  });
});

test.describe('Navegación', () => {
  test('menú móvil accesible', async ({ page }) => {
    test.skip(!isMobile(page), 'Solo en móvil');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#menu-movil')).toBeVisible();
    // El panel cubre la pantalla bajo la cabecera (no se ve el contenido detrás).
    const box = await page.locator('#menu-movil').boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(vh - 1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-movil')).toBeHidden();
  });

  test('enlace para saltar al contenido', async ({ page }) => {
    test.skip(isMobile(page), 'Teclado físico');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  });

  test('la página actual se marca en el menú', async ({ page }) => {
    test.skip(isMobile(page), 'Menú de escritorio');
    await page.goto('/vender-mi-vivienda/');
    await expect(page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Vender mi vivienda' })).toHaveAttribute('aria-current', 'page');
  });
});
