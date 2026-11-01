import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { ApiInfoModule } from '../api-info.module';
import { ApiInfoEditComponent } from './api-info-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ApiInfoEditComponent', () => {
	const render = (api?: any) => renderComponent(ApiInfoEditComponent, { imports: [ApiInfoModule], api });

	const tabs = (element: HTMLElement) => Array.from(element.querySelectorAll('.nav-link')).map(e => e.textContent.trim());
	const openTab = (fixture: any, element: HTMLElement, name: string): HTMLElement => {
		const tab = Array.from<HTMLElement>(element.querySelectorAll('a.nav-link')).find(a => a.textContent.trim() == name);
		tab.click();
		fixture.detectChanges();
		return element.querySelector('#' + tab.getAttribute('aria-controls'));
	};

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', ['Info', 'Contact', 'General', 'Tags', 'Security'] ],
		[ 'OAS3', 'petstoreOas3Yaml', ['Info', 'Contact', 'Servers', 'Tags', 'Security'] ]
	] as const)('renders the editors (%s)', (version, fixture, expectedTabs) => {
		const { element } = render(loadFixture(fixture));
		expect(tabs(element)).toEqual(expectedTabs);
		expect(element.querySelectorAll('swadit-schema-editor, swadit-object-editor').length).toBeGreaterThan(0);
		expect(element.textContent).toContain('Title');
	});

	it('shows only the root properties not covered by other tabs in the General tab (OAS2)', () => {
		const { fixture, element } = render(loadFixture('petstoreOas2Yaml'));
		const pane = openTab(fixture, element, 'General');
		const labels = Array.from<HTMLElement>(pane.querySelectorAll('.tab-content > swadit-object-editor > div > div > div > div > label'))
			.map(l => l.textContent.trim());
		expect(labels).toEqual(['Schemes', 'Host', 'Base Path', 'Consumes', 'Produces']);
	});

	it('shows the servers in the Servers tab (OAS3)', async () => {
		const { fixture, element } = render();
		const pane = openTab(fixture, element, 'Servers');
		await fixture.whenStable();
		const urls = Array.from<HTMLInputElement>(pane.querySelectorAll('input')).map(i => i.value);
		expect(urls).toContain('/v1');
	});

	it('applies changes from the General tab (OAS2)', async () => {
		const { component, apis } = render(loadFixture('petstoreOas2Yaml'));
		component.api.host = 'example.com';
		component.api.basePath = '';
		component.api.schemes = [];
		component.ok();
		expect(apis.current.host).toBe('example.com');
		expect(apis.current.basePath).toBeUndefined();
		expect(apis.current.schemes).toBeUndefined();
		expect(apis.current.consumes).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('applies changes from the Servers tab (OAS3)', async () => {
		const { component, apis } = render();
		component.api.servers[0].url = 'https://example.com/v2';
		component.api.servers.push({ url: 'http://localhost', description: '', variables: {} });
		component.ok();
		expect(apis.current.servers).toEqual([ { url: 'https://example.com/v2' }, { url: 'http://localhost' } ]);
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		component.api.servers = [];
		component.ok();
		expect(apis.current.servers).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it.each([ 'petstoreOas2Yaml', 'petstoreOas3Yaml', 'minimalOas3Yaml' ] as const)('does not change the API if nothing has been changed (%s)', (fixture) => {
		const { component, apis } = render(loadFixture(fixture));
		const orig = _cloneDeep(apis.current);
		component.ok();
		expect(apis.current).toEqual(orig);
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
	});

	it('applies changes and removes empty values', async () => {
		const { component, apis } = render();
		component.api.info.title = 'Changed';
		component.api.info.contact = {};
		component.api.tags = [];
		component.api.info.description = '';
		component.ok();
		expect(apis.current.info.title).toBe('Changed');
		expect(apis.current.info.contact).toBeUndefined();
		expect(apis.current.info.description).toBeUndefined();
		expect(apis.current.tags).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('shows the servers and security tabs (OAS3)', () => {
		const { element } = render(loadFixture('featuresOas3Yaml'));
		expect(tabs(element)).toEqual(['Info', 'Contact', 'Servers', 'Tags', 'Security']);
	});

	it('does not change servers, security schemes and requirements if nothing has been changed (OAS3)', () => {
		const { component, apis } = render(loadFixture('featuresOas3Yaml'));
		const orig = _cloneDeep(apis.current);
		component.ok();
		expect(apis.current).toEqual(orig);
	});

	it('applies the edited servers and security schemes (OAS3)', async () => {
		const { component, apis } = render(loadFixture('featuresOas3Yaml'));
		component.api.servers.push({ url: 'https://new.example.com', description: '', variables: {} });
		// properties of other security scheme types are removed
		component.securitySchemes['basic']['in'] = 'header';
		component.securitySchemes['basic']['name'] = 'n';
		// OAuth flows require scopes
		component.securitySchemes['code'] = { type: 'oauth2', flows: { authorizationCode: { authorizationUrl: 'https://a', tokenUrl: 'https://t' } } };
		component.api.security = [];
		component.ok();
		expect(apis.current.servers[2]).toEqual({ url: 'https://new.example.com' });
		expect(apis.current.components.securitySchemes.basic).toEqual({ type: 'http', scheme: 'basic' });
		expect(apis.current.components.securitySchemes.code.flows.authorizationCode.scopes).toEqual({});
		expect(apis.current.security).toBeUndefined();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('removes the security schemes and empty components (OAS3)', async () => {
		const api = loadFixture('minimalOas3Yaml');
		api.components = { securitySchemes: api.components.securitySchemes };
		api.paths = {};
		const { component, apis } = render(api);
		delete component.securitySchemes['key'];
		component.ok();
		expect(apis.current.components).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('keeps the other components when removing the security schemes (OAS3)', async () => {
		const { component, apis } = render(loadFixture('minimalOas3Yaml'));
		component.securitySchemes = {};
		component.ok();
		expect(apis.current.components.securitySchemes).toBeUndefined();
		expect(Object.keys(apis.current.components)).toEqual(['schemas', 'parameters', 'responses']);
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('adds security schemes to an API without components (OAS3)', async () => {
		const api = loadFixture('minimalOas3Yaml');
		delete api.components;
		api.paths = {};
		const { component, apis } = render(api);
		component.securitySchemes['key'] = { type: 'apiKey', name: 'k', in: 'query', flows: {} };
		component.ok();
		expect(apis.current.components).toEqual({ securitySchemes: { key: { type: 'apiKey', name: 'k', in: 'query' } } });
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});
});
