import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'js-yaml';

const fixturesDir = path.join(__dirname, '..', 'src', 'testing', 'fixtures');
const minimalOas3 = path.join(fixturesDir, 'minimal-oas3.yaml');

/** Collects uncaught exceptions and console errors of the page. */
function collectErrors(page: Page): string[]
{
	const errors: string[] = [];
	page.on('pageerror', err => errors.push(err.message));
	page.on('console', msg => {
		if (msg.type() == 'error') {
			errors.push(msg.text());
		}
	});
	return errors;
}

async function openFileMenu(page: Page): Promise<void>
{
	await page.locator('app-header').getByRole('link', { name: 'File' }).click();
}

async function clickFileMenuItem(page: Page, name: string): Promise<void>
{
	await openFileMenu(page);
	await page.locator('app-header .dropdown-menu .dropdown-item', { hasText: name }).first().click();
}

async function openFile(page: Page, file: string): Promise<void>
{
	await clickFileMenuItem(page, 'Open');
	await page.locator('ngb-modal-window input[type=file]').setInputFiles(file);
	await page.locator('ngb-modal-window').getByRole('button', { name: 'Open' }).click();
	await expect(page.locator('ngb-modal-window')).toHaveCount(0);
}

async function navigate(page: Page, name: string): Promise<void>
{
	await page.locator('app-sidebar').getByRole('link', { name, exact: true }).click();
}

/** Sets the text of the Ace editor on the source page. */
async function setSource(page: Page, text: string): Promise<void>
{
	await page.evaluate(t => (window as any).ace.edit(document.querySelector('ace')).setValue(t, -1), text);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('Swagger Petstore');
});

test('shows the default API and validates its source', async ({ page }) => {
	await clickFileMenuItem(page, 'Source');
	await expect(page.locator('ace .ace_content')).toBeVisible();
	await expect(page.getByText('validation passed')).toBeVisible();
});

test('visits all pages without errors (OAS2)', async ({ page }) => {
	const errors = collectErrors(page);
	await navigate(page, 'Definitions');
	await page.locator('.card-header', { hasText: 'Pet' }).first().click();
	await expect(page.locator('swadit-swagger-schema-view').first()).toBeVisible();
	await navigate(page, 'Paths');
	await expect(page.locator('.path')).toHaveCount(8);
	await navigate(page, '/pet/{petId}');
	await expect(page.locator('h1')).toHaveText('/pet/{petId}');
	await page.locator('.card-header', { hasText: 'successful operation' }).first().click();
	await expect(page.locator('swadit-response-view')).toBeVisible();
	await clickFileMenuItem(page, 'Swagger UI');
	await expect(page.locator('#swaggerui .info')).toBeVisible();
	await navigate(page, 'API Info');
	await expect(page.locator('h1')).toContainText('Swagger Petstore');
	expect(errors).toEqual([]);
});

test('visits all pages without errors (OAS3)', async ({ page }) => {
	const errors = collectErrors(page);
	await openFile(page, minimalOas3);
	await expect(page.locator('h1')).toContainText('Minimal OAS3');
	await expect(page.locator('app-header')).toContainText('ALPHA');
	await navigate(page, 'Definitions');
	await expect(page.locator('.card-header')).toHaveCount(2);
	await page.locator('.card-header', { hasText: 'Item' }).click();
	await navigate(page, 'Paths');
	await navigate(page, '/items/{id}');
	await expect(page.locator('h1')).toHaveText('/items/{id}');
	for (const card of await page.locator('.card-header').all()) {
		await card.click();
	}
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	await clickFileMenuItem(page, 'Swagger UI');
	await expect(page.locator('#swaggerui .info')).toBeVisible();
	expect(errors).toEqual([]);
});

test('adds a path', async ({ page }) => {
	await navigate(page, 'Paths');
	await page.locator('.edit-section').click();
	const modal = page.locator('ngb-modal-window');
	await modal.locator('#methodKey').selectOption('get');
	await modal.locator('#pathKey').fill('/new');
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/new', exact: true })).toBeVisible();
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
});

test('applies changes in the source editor', async ({ page }) => {
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	await setSource(page, fs.readFileSync(minimalOas3, 'utf8'));
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByText('changes applied')).toBeVisible();
	// the other parts of the app know about the new API (and its version)
	await expect(page.locator('app-header')).toContainText('Minimal OAS3');
	await expect(page.locator('app-header')).toContainText('ALPHA');
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/items/{id}' })).toBeVisible();
});

test('does not apply invalid source', async ({ page }) => {
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	await setSource(page, 'swagger: "2.0"\n');
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByText('validation failed', { exact: true })).toBeVisible();
	await expect(page.locator('app-header')).toContainText('Swagger Petstore');
});

test('converts the API to OpenAPI 3.0', async ({ page }) => {
	await clickFileMenuItem(page, 'Convert to OAS 3');
	const modal = page.locator('ngb-modal-window');
	await expect(modal).toContainText('not yet fully supported');
	await modal.getByRole('button', { name: 'Ok' }).click();
	await expect(page.locator('app-header')).toContainText('ALPHA');
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	const text = await page.evaluate(() => (window as any).ace.edit(document.querySelector('ace')).getValue());
	expect(YAML.load(text)['openapi']).toBe('3.0.3');
});

test('downloads the API', async ({ page }) => {
	await clickFileMenuItem(page, 'Download');
	const modal = page.locator('ngb-modal-window');
	await expect(modal.locator('input[name=fileName]')).toHaveValue('swagger.yaml');
	const download = page.waitForEvent('download');
	await modal.getByRole('button', { name: 'Download' }).click();
	const file = await (await download).path();
	const api: any = YAML.load(fs.readFileSync(file, 'utf8'));
	expect(api.info.title).toBe('Swagger Petstore');
	expect(Object.keys(api.paths)).toHaveLength(8);
});

test('adds the paths of another file', async ({ page }) => {
	const other = test.info().outputPath('other.yaml');
	fs.writeFileSync(other, YAML.dump({
		swagger: '2.0', info: { title: 'Other', version: '1' },
		paths: { '/other': { get: { responses: { default: { description: 'd' } } } } }
	}));
	await clickFileMenuItem(page, 'Add');
	await page.locator('ngb-modal-window input[type=file]').setInputFiles(other);
	await page.locator('ngb-modal-window').getByRole('button', { name: 'Add' }).click();
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/other', exact: true })).toBeVisible();
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/pet', exact: true })).toBeVisible();
	await expect(page.locator('app-header')).toContainText('Swagger Petstore');
});
