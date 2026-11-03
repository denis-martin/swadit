import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiInfoModule } from './api-info.module';
import { ApiInfoComponent } from './api-info.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ApiInfoComponent', () => {
	const render = (api?: any) => renderComponent(ApiInfoComponent, { imports: [ApiInfoModule], api });
	const headings = (element: HTMLElement) => Array.from(element.querySelectorAll('h2')).map(e => e.textContent);

	it('shows the API info (OAS2)', () => {
		const { element } = render(loadFixture('petstoreOas2Yaml'));
		expect(element.querySelector('h1').textContent).toContain('Swagger Petstore');
		expect(element.querySelector('h1').textContent).toContain('v1.0.0');
		expect(element.textContent).toContain('demo@froschbach.io');
		expect(element.textContent).toContain('License: Apache 2.0');
		expect(headings(element)).toEqual(['Tags', 'General Information', 'Security']);
		expect(element.textContent).toContain('petstore_auth');
		expect(element.querySelector('.edit-section')).toBeTruthy();
	});

	it('shows the API info (OAS3)', () => {
		const { element } = render();
		expect(element.querySelector('h1').textContent).toContain('Swagger Petstore');
		expect(element.querySelector('h1').textContent).toContain('v1.0.0');
		expect(element.textContent).toContain('demo@froschbach.io');
		expect(element.textContent).toContain('License: Apache 2.0');
		expect(headings(element)).toEqual(['Tags', 'Servers', 'Security']);
		expect(element.textContent).toContain('/v1');
		expect(element.textContent).toContain('petstore_auth');
		expect(element.textContent).toContain('https://demo.froschbach.io/oauth/');
		expect(element.textContent).toContain('modify pets in your account');
		expect(element.querySelector('.edit-section')).toBeTruthy();
	});

	it('shows a minimal API (OAS3)', () => {
		const { element } = render(loadFixture('minimalOas3Yaml'));
		expect(element.querySelector('h1').textContent).toContain('Minimal OAS3');
		expect(headings(element)).toEqual(['Security']);
		expect(element.textContent).toContain('Security scheme: key');
		expect(element.textContent).toContain('X-Key');
	});

	it('shows the servers and security schemes (OAS3)', () => {
		const { element } = render(loadFixture('featuresOas3Yaml'));
		expect(headings(element)).toEqual(['Servers', 'Security']);
		expect(element.textContent).toContain('https://{env}.example.com/v1');
		expect(element.textContent).toContain('{env} default: api');
		expect(element.textContent).toContain('(api | staging)');
		expect(element.textContent).toContain('Main server');
		expect(element.textContent).toContain('bearer format');
		expect(element.textContent).toContain('JWT');
		expect(element.textContent).toContain('implicit');
		expect(element.textContent).toContain('https://example.com/auth');
		expect(element.textContent).toContain('read access');
		expect(element.textContent).toContain('write access');
		expect(element.textContent).toContain('OpenID Connect URL');
		expect(element.textContent).toContain('Default Security Requirements');
		expect(element.textContent).toContain('(none)');
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', (api: any) => delete api.securityDefinitions ],
		[ 'OAS3', 'petstoreOas3Yaml', (api: any) => delete api.components.securitySchemes ]
	] as const)('shows security requirements without definitions and optional security (%s)', (version, fixture, removeSchemes) => {
		const api = loadFixture(fixture);
		removeSchemes(api);
		api.security = [ { api_key: [] }, {} ];
		const { element } = render(api);
		expect(element.textContent).toContain('Default Security Requirements');
		expect(element.textContent).toContain('api_key');
		expect(element.textContent).toContain('(none)');
	});

	it('shows extensions', () => {
		const api = loadFixture('petstoreOas3Yaml');
		api['x-root'] = 'r';
		api.info['x-info'] = { a: 1 };
		const { element } = render(api);
		expect(headings(element)).toContain('Extensions');
		expect(element.textContent).toContain('x-root');
		expect(element.textContent).toContain('x-info');
	});

	it('hides the edit button in read-only mode', () => {
		const { fixture, apis, element } = render();
		apis.config.readOnly = true as any;
		fixture.detectChanges();
		expect(element.querySelector('.edit-section')).toBeNull();
	});

	it('opens the editor', () => {
		const { component } = render();
		const open = vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue({ result: new Promise(() => undefined) } as any);
		component.edit();
		expect(open).toHaveBeenCalled();
	});
});
