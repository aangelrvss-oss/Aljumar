import { test, expect, isMobile, noHorizontalOverflow } from './fixtures';
import inventory from '../../src/data/inventory.json' with { type: 'json' };

const sale = inventory.properties.filter((p) => p.operations.includes('venta'));
const visibleCards = (page: import('@playwright/test').Page) => page.locator('[data-results] > li:not([hidden])');

async function openFilters(page: import('@playwright/test').Page) {
  if (isMobile(page)) {
    await page.getByRole('button', { name: /Filtros/ }).click();
    await expect(page.locator('[data-filters]')).toHaveAttribute('aria-modal', 'true');
  }
}

test.describe('Buscador de compra', () => {
  test('muestra todo el inventario en venta con su recuento', async ({ page, consoleErrors }) => {
    await page.goto('/comprar/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Viviendas en venta');
    await expect(page.locator('[data-count]')).toContainText(`${sale.length} inmuebles`);
    await expect(visibleCards(page)).toHaveCount(Math.min(sale.length, 12));
    await noHorizontalOverflow(page);
    expect(consoleErrors).toEqual([]);
  });

  test('filtra de verdad por dormitorios y guarda el criterio en la URL', async ({ page }) => {
    const expected = sale.filter((p) => (p.bedrooms ?? 0) >= 4).length;
    await page.goto('/comprar/');
    await openFilters(page);
    await page.locator('label.chip', { hasText: '4+' }).first().click();
    if (isMobile(page)) await page.locator('[data-apply]').click();
    await expect(page.locator('[data-count]')).toContainText(`${expected} inmueble`);
    await expect(visibleCards(page)).toHaveCount(expected);
    await expect(page).toHaveURL(/dormitorios=4/);

    // Al recargar (o compartir el enlace) se mantiene la búsqueda.
    await page.reload();
    await expect(visibleCards(page)).toHaveCount(expected);
    await expect(page.locator('[data-chips] .filter-chip').first()).toContainText('4+ dormitorios');

    // Quitar el filtro desde la etiqueta
    await page.locator('[data-chips] .filter-chip').first().click();
    await expect(visibleCards(page)).toHaveCount(sale.length);
    await expect(page).not.toHaveURL(/dormitorios/);
  });

  test('combina precio máximo y localidad; sin resultados muestra el estado vacío', async ({ page }) => {
    const max = 300000;
    const expected = sale.filter((p) => p.salePrice !== null && p.salePrice <= max).length;
    await page.goto(`/comprar/?precio_max=${max}`);
    await expect(visibleCards(page)).toHaveCount(expected);
    await page.goto(`/comprar/?precio_max=${max}&dormitorios=4`);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('[data-empty] h2')).toHaveText('No hay inmuebles con estos filtros');
    await page.getByRole('button', { name: 'Quitar todos los filtros' }).click();
    await expect(visibleCards(page)).toHaveCount(sale.length);
  });

  test('ordena por precio ascendente', async ({ page }) => {
    await page.goto('/comprar/?orden=precio-asc');
    const prices = await visibleCards(page)
      .locator('.card__price')
      .allTextContents()
      .then((t) => t.map((x) => Number(x.replace(/\D/g, ''))));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('las tarjetas enlazan a la ficha correcta', async ({ page }) => {
    const first = sale[0]!;
    await page.goto('/comprar/');
    await visibleCards(page).first().getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/inmueble/${first.slug}/$`));
    await expect(page.getByText(`Ref. ${first.ref ?? first.id}`).first()).toBeVisible();
  });

  test('alquiler sin inventario: estado vacío útil y página fuera del índice', async ({ page }) => {
    const rentals = inventory.properties.filter((p) => p.operations.includes('alquiler')).length;
    test.skip(rentals > 0, 'Solo aplica sin inmuebles en alquiler');
    await page.goto('/alquilar/');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cuéntanos qué buscas' })).toHaveAttribute('href', /motivo=alquilar/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test.describe('Panel de filtros en móvil', () => {
  test('se abre como diálogo, Escape lo cierra y devuelve el foco', async ({ page }) => {
    test.skip(!isMobile(page), 'Solo en móvil');
    await page.goto('/comprar/');
    const open = page.getByRole('button', { name: /Filtros/ });
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Cerrar filtros' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(open).toBeFocused();
  });
});

test.describe('Buscador rápido de la portada', () => {
  test('envía a /comprar/ con los criterios elegidos y sin campos vacíos', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Dormitorios').selectOption('2');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page).toHaveURL(/\/comprar\/\?dormitorios=2$/);
    const expected = sale.filter((p) => (p.bedrooms ?? 0) >= 2).length;
    await expect(visibleCards(page)).toHaveCount(expected);
  });

  test('con «Alquilar» envía a /alquilar/', async ({ page }) => {
    await page.goto('/');
    await page.locator('.qs__ops label', { hasText: 'Alquilar' }).click();
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page).toHaveURL(/\/alquilar\/$/);
  });
});
