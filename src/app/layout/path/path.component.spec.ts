import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { PathModule } from './path.module';
import { PathComponent } from './path.component';
import { loadFixture, renderComponent, setCurrentApi } from 'testing/test-helpers';

describe('PathComponent', () => {
	let params: BehaviorSubject<any>;
	const render = (path: string, method?: string, api?: any) => {
		params = new BehaviorSubject({ path, method });
		return renderComponent(PathComponent, {
			imports: [PathModule],
			providers: [ { provide: ActivatedRoute, useValue: { params } } ],
			api
		});
	};
	const tabs = (element: HTMLElement) => Array.from(element.querySelectorAll('.nav-link'))
		.map(e => e.textContent.trim()).filter(t => t);
	const headings = (element: HTMLElement) => Array.from(element.querySelectorAll('h2')).map(e => e.textContent.trim());

	it('shows the operations of the path and selects the first one', () => {
		const { component, element } = render('/pet');
		expect(component.method).toBe('post');
		expect(element.querySelector('h1').textContent).toBe('/pet');
		expect(tabs(element)).toEqual(['post', 'put']);
		expect(element.textContent).toContain('Add a new pet to the store');
		expect(headings(element)).toEqual(['Parameters', 'Responses', 'General Information', 'Security']);
	});

	it('shows the operation given in the route', () => {
		const { component, fixture, element } = render('/pet', 'put');
		expect(component.method).toBe('put');
		params.next({ path: '/store/order' });
		fixture.detectChanges();
		expect(component.method).toBe('post');
		expect(element.querySelector('h1').textContent).toBe('/store/order');
	});

	it('only shows operations as tabs', () => {
		const api = loadFixture('minimalOas3Yaml');
		api.paths['/items/{id}'] = { summary: 'Items', 'x-ext': 1, ...api.paths['/items/{id}'] };
		const { component, element } = render('/items/{id}', undefined, api);
		expect(component.method).toBe('get');
		expect(tabs(element)).toEqual(['get']);
	});

	it('shows path and operation parameters', () => {
		const { fixture, element } = render('/pet/{petId}', 'get');
		const cards = Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
		expect(cards[0]).toBe('petId* in path (integer) ID of pet to return');
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-parameter-view')).toBeTruthy();
	});

	it('shows responses with referenced schemas', () => {
		const { fixture, element } = render('/pet/{petId}', 'get');
		const cards = Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
		expect(cards).toContain('200 (#/definitions/Pet) successful operation');
		const header = Array.from(element.querySelectorAll('.card-header')).find(e => e.textContent.includes('successful operation')) as HTMLElement;
		header.click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-response-view')).toBeTruthy();
	});

	it('shows security requirements, documentation and extensions', () => {
		const api = loadFixture('petstoreYaml');
		Object.assign(api.paths['/pet'].post, {
			security: [ { api_key: [] }, {} ],
			externalDocs: { url: 'https://example.com' },
			'x-ext': 'e'
		});
		const { element } = render('/pet', 'post', api);
		expect(headings(element)).toEqual(['Parameters', 'Responses', 'General Information', 'Security', 'Documentation', 'Extensions']);
		expect(element.querySelector('a[href="https://example.com"]').textContent.trim()).toBe('More');
		expect(element.textContent).toContain('(none)');
	});

	it('shows the request body (OAS3)', () => {
		const api = loadFixture('minimalOas3Yaml');
		api.paths['/items/{id}'].get.requestBody = {
			required: true,
			content: {
				'application/json': { schema: { '$ref': '#/components/schemas/Item' }, example: { id: 'x' } },
				'text/plain': { examples: { one: { value: 'x' } } }
			}
		};
		const { fixture, component, element } = render('/items/{id}', 'get', api);
		expect(element.textContent).toContain('Request Body');
		component.uncollapsedParameter['x-swadit-requestBody'] = true;
		fixture.detectChanges();
		expect(element.textContent).toContain('#/components/schemas/Item');
		expect(element.textContent).toContain('Example:');
		expect(element.textContent).toContain('one:');
	});

	it('offers to add a method to a path without methods', () => {
		const api = loadFixture('petstoreYaml');
		api.paths['/empty'] = {};
		const { component, element } = render('/empty', undefined, api);
		expect(component.method).toBeNull();
		expect(element.textContent).toContain('Add a method...');
	});

	it('leaves the page if the path does not exist in a newly loaded API', () => {
		const { apis, component } = render('/pet');
		const router = TestBed.inject(Router);
		vi.spyOn(router, 'url', 'get').mockReturnValue('/path/%2Fpet');
		setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
		expect(component.path).toBe('');
		expect(router.navigate).toHaveBeenCalledWith(['/api-info']);
	});

	it('adds parameters for this operation or for all operations', async () => {
		const { component, apis } = render('/pet', 'post');
		const modal = TestBed.inject(NgbModal);
		const newParam = { name: 'q', in: 'query', type: 'string' };
		vi.spyOn(modal, 'open').mockReturnValue({ componentInstance: {}, result: Promise.resolve({ obj: newParam, allMethods: true }) } as any);
		component.editParameter(null);
		await vi.waitFor(() => expect(apis.current.paths['/pet'].parameters).toEqual([newParam]));

		// move it to the operation
		vi.spyOn(modal, 'open').mockReturnValue({ componentInstance: {}, result: Promise.resolve({ obj: newParam, allMethods: false }) } as any);
		component.editParameter(null, newParam);
		await vi.waitFor(() => expect(apis.current.paths['/pet'].parameters).toBeUndefined());
		expect(apis.current.paths['/pet'].post.parameters).toContain(newParam);

		// delete it
		vi.spyOn(modal, 'open').mockReturnValue({ componentInstance: {}, result: Promise.resolve({ obj: newParam, delete: true }) } as any);
		component.editParameter(null, newParam);
		await vi.waitFor(() => expect(apis.current.paths['/pet'].post.parameters).not.toContain(newParam));
	});

	it('stops listening to API changes when destroyed', () => {
		const { fixture, apis } = render('/pet');
		fixture.destroy();
		apis.newFile();
		expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
	});
});
