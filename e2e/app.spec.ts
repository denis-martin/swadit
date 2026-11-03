import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'js-yaml';

const fixturesDir = path.join(__dirname, '..', 'src', 'testing', 'fixtures');
const minimalOas3 = path.join(fixturesDir, 'minimal-oas3.yaml');
const featuresOas3 = path.join(fixturesDir, 'features-oas3.yaml');
const petstoreOas2 = path.join(fixturesDir, 'petstore-oas2.yaml');
// the default API (loaded on startup)
const petstoreOas3 = path.join(__dirname, '..', 'src', 'assets', 'petstore.yaml');

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
	// match the beginning of the item text (e.g. "Convert to OAS2" must not match "Convert to OAS3")
	const startsWith = new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	await page.locator('app-header .dropdown-menu .dropdown-item', { hasText: startsWith }).first().click();
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
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');
	await expect(page.locator('app-header')).not.toContainText('ALPHA');
	await clickFileMenuItem(page, 'Source');
	await expect(page.locator('ace .ace_content')).toBeVisible();
	await expect(page.getByText('validation passed')).toBeVisible();
});

for (const [version, file] of [ [ 'OAS2', petstoreOas2 ], [ 'OAS3', petstoreOas3 ] ]) {
	test(`visits all pages without errors (${version})`, async ({ page }) => {
		const errors = collectErrors(page);
		await openFile(page, file);
		await expect(page.locator('app-header .spec-version')).toHaveText(version);
		await navigate(page, 'Definitions');
		await page.locator('.card-header', { hasText: 'Pet' }).first().click();
		await expect(page.locator('swadit-swagger-schema-view').first()).toBeVisible();
		await navigate(page, 'Paths');
		await expect(page.locator('.path')).toHaveCount(8);
		await navigate(page, '/pet/{petId}');
		await expect(page.locator('h1')).toHaveText('/pet/{petId}');
		await page.locator('.card-header', { hasText: 'successful operation' }).first().click();
		await expect(page.locator('swadit-response-view')).toBeVisible();
		await navigate(page, '/pet');
		await page.locator('.card-header').first().click();
		await expect(page.locator(version == 'OAS2' ? 'swadit-parameter-view' : 'swadit-request-body-view')).toBeVisible();
		await clickFileMenuItem(page, 'Source');
		await expect(page.getByText('validation passed')).toBeVisible();
		await clickFileMenuItem(page, 'Print Preview');
		await expect(page.locator('app-swadoc h1')).toHaveText('Swagger Petstore');
		await expect(page.locator('app-swadoc .methodheading')).toHaveCount(12);
		await clickFileMenuItem(page, 'Swagger UI');
		await expect(page.locator('#swaggerui .info')).toBeVisible();
		await navigate(page, 'API Info');
		await expect(page.locator('h1')).toContainText('Swagger Petstore');
		expect(errors).toEqual([]);
	});
}

test('visits all pages of a minimal API without errors (OAS3)', async ({ page }) => {
	const errors = collectErrors(page);
	await openFile(page, minimalOas3);
	await expect(page.locator('h1')).toContainText('Minimal OAS3');
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');
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
	await clickFileMenuItem(page, 'Print Preview');
	await expect(page.locator('app-swadoc h1')).toHaveText('Minimal OAS3');
	await expect(page.locator('app-swadoc .propertycell', { hasText: 'tags' })).toBeVisible();
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

test('edits a new OpenAPI 3.0 API', async ({ page }) => {
	const errors = collectErrors(page);
	const modal = page.locator('ngb-modal-window');
	await clickFileMenuItem(page, 'New (OAS3)');
	await expect(page.locator('h1')).toContainText('My new API');
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');

	// schema component
	await navigate(page, 'Definitions');
	await page.locator('.edit-subsection[title="Add item"]').click();
	await modal.locator('#definitionKey').fill('Item');
	await modal.locator('select#definitionSchema').selectOption('object');
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await expect(page.locator('.card-header', { hasText: 'Item' })).toBeVisible();

	// operation with a parameter and a request body
	await navigate(page, 'Paths');
	await page.locator('.edit-section').click();
	await modal.locator('#methodKey').selectOption('post');
	await modal.locator('#pathKey').fill('/items');
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await navigate(page, '/items');
	await page.locator('.edit-subsection[title="Add parameter"]').click();
	await modal.locator('input#name').fill('q');
	await modal.locator('select#in').selectOption('query');
	await modal.locator('select#schema').selectOption('string');
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await page.getByText('Add a request body...').click();
	await modal.getByPlaceholder('Media type, e.g. application/json').fill('application/json');
	await modal.getByPlaceholder('Media type, e.g. application/json').press('Enter');
	await modal.locator('select[title="Reference to a #/definition"]').first().selectOption('#/components/schemas/Item');
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await expect(page.locator('.card-header', { hasText: 'Request Body (application/json)' })).toBeVisible();
	await expect(page.locator('.card-header', { hasText: 'q in query (string)' })).toBeVisible();

	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	const text = await page.evaluate(() => (window as any).ace.edit(document.querySelector('ace')).getValue());
	const api: any = YAML.load(text);
	expect(api.openapi).toBe('3.0.3');
	expect(api.components.schemas.Item).toEqual({ type: 'object' });
	expect(api.paths['/items'].post.parameters).toEqual([ { name: 'q', in: 'query', schema: { type: 'string' } } ]);
	expect(api.paths['/items'].post.requestBody).toEqual({ content: { 'application/json': { schema: { '$ref': '#/components/schemas/Item' } } } });
	expect(errors).toEqual([]);
});

test('edits servers and security schemes without changing them (OAS3)', async ({ page }) => {
	const errors = collectErrors(page);
	const modal = page.locator('ngb-modal-window');
	await openFile(page, featuresOas3);
	await expect(page.locator('h2', { hasText: 'Servers' })).toBeVisible();
	await page.locator('.edit-section').click();
	for (const tab of ['Servers', 'Security', 'Tags', 'Contact', 'Info']) {
		await modal.locator('.nav-link', { hasText: tab }).click();
		if (tab == 'Security') {
			// expand all security schemes and their flows (expanded items do not match anymore)
			for (const collapsed of [ modal.locator('.fa-caret-right'), modal.locator('label', { hasText: '...' }) ]) {
				for (let i = 0; i < 20 && await collapsed.count() > 0; i++) {
					await collapsed.first().click();
				}
				await expect(collapsed).toHaveCount(0);
			}
			await expect(modal.getByText('Authorization Url').first()).toBeVisible();
		}
	}
	await modal.getByRole('button', { name: 'Apply' }).click();
	await expect(modal).toHaveCount(0);
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	const text = await page.evaluate(() => (window as any).ace.edit(document.querySelector('ace')).getValue());
	expect(YAML.load(text)).toEqual(YAML.load(fs.readFileSync(featuresOas3, 'utf8')));
	expect(errors).toEqual([]);
});

test('applies changes in the source editor', async ({ page }) => {
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	await setSource(page, fs.readFileSync(minimalOas3, 'utf8'));
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByText('changes applied')).toBeVisible();
	// the other parts of the app know about the new API
	await expect(page.locator('app-header')).toContainText('Minimal OAS3');
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/items/{id}' })).toBeVisible();
	// ... and its version
	await setSource(page, fs.readFileSync(petstoreOas2, 'utf8'));
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByText('changes applied')).toBeVisible();
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS2');
});

test('does not apply invalid source', async ({ page }) => {
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	await setSource(page, 'openapi: 3.0.3\n');
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByText('validation failed', { exact: true })).toBeVisible();
	await expect(page.locator('app-header')).toContainText('Swagger Petstore');
});

test('converts the API to OpenAPI 3.0', async ({ page }) => {
	await openFile(page, petstoreOas2);
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS2');
	await clickFileMenuItem(page, 'Convert to OAS3');
	const modal = page.locator('ngb-modal-window');
	await expect(modal).toContainText('may be incomplete');
	await modal.getByRole('button', { name: 'Ok' }).click();
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	const text = await page.evaluate(() => (window as any).ace.edit(document.querySelector('ace')).getValue());
	expect(YAML.load(text)['openapi']).toBe('3.0.3');
});

test('converts the API to Swagger 2.0', async ({ page }) => {
	const errors = collectErrors(page);
	await clickFileMenuItem(page, 'Convert to OAS2');
	const modal = page.locator('ngb-modal-window');
	await expect(modal).toContainText('converted to Swagger 2.0');
	await modal.getByRole('button', { name: 'Ok' }).click();
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS2');
	await clickFileMenuItem(page, 'Source');
	await expect(page.getByText('validation passed')).toBeVisible();
	const text = await page.evaluate(() => (window as any).ace.edit(document.querySelector('ace')).getValue());
	const api: any = YAML.load(text);
	expect(api['swagger']).toBe('2.0');
	expect(Object.keys(api.paths)).toHaveLength(8);
	expect(errors).toEqual([]);
});

test('creates new OAS3 and OAS2 files', async ({ page }) => {
	await clickFileMenuItem(page, 'New (OAS2)');
	await expect(page.locator('h1')).toContainText('My new API');
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS2');
	await clickFileMenuItem(page, 'New (OAS3)');
	await expect(page.locator('app-header .spec-version')).toHaveText('OAS3');
});

test('downloads the API', async ({ page }) => {
	await clickFileMenuItem(page, 'Download');
	const modal = page.locator('ngb-modal-window');
	await expect(modal.locator('input[name=fileName]')).toHaveValue('openapi.yaml');
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
		openapi: '3.0.3', info: { title: 'Other', version: '1' },
		paths: { '/other': { get: { responses: { default: { description: 'd' } } } } }
	}));
	await clickFileMenuItem(page, 'Add');
	await page.locator('ngb-modal-window input[type=file]').setInputFiles(other);
	await page.locator('ngb-modal-window').getByRole('button', { name: 'Add' }).click();
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/other', exact: true })).toBeVisible();
	await expect(page.locator('app-sidebar').getByRole('link', { name: '/pet', exact: true })).toBeVisible();
	await expect(page.locator('app-header')).toContainText('Swagger Petstore');
});
