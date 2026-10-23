import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiInfoModule } from './api-info.module';
import { ApiInfoComponent } from './api-info.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ApiInfoComponent', () => {
	const render = (api?: any) => renderComponent(ApiInfoComponent, { imports: [ApiInfoModule], api });
	const headings = (element: HTMLElement) => Array.from(element.querySelectorAll('h2')).map(e => e.textContent);

	it('shows the API info (OAS2)', () => {
		const { element } = render();
		expect(element.querySelector('h1').textContent).toContain('Swagger Petstore');
		expect(element.querySelector('h1').textContent).toContain('v1.0.0');
		expect(element.textContent).toContain('demo@froschbach.io');
		expect(element.textContent).toContain('License: Apache 2.0');
		expect(headings(element)).toEqual(['Tags', 'General Information', 'Security']);
		expect(element.textContent).toContain('petstore_auth');
		expect(element.querySelector('.edit-section')).toBeTruthy();
	});

	it('shows the API info (OAS3)', () => {
		const { element } = render(loadFixture('minimalOas3Yaml'));
		expect(element.querySelector('h1').textContent).toContain('Minimal OAS3');
		expect(headings(element)).toEqual([]);
	});

	it('shows security requirements without definitions and optional security', () => {
		const api = loadFixture('petstoreYaml');
		delete api.securityDefinitions;
		api.security = [ { api_key: [] }, {} ];
		const { element } = render(api);
		expect(element.textContent).toContain('Default Security Requirements');
		expect(element.textContent).toContain('api_key');
		expect(element.textContent).toContain('(none)');
	});

	it('shows extensions', () => {
		const api = loadFixture('petstoreYaml');
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
