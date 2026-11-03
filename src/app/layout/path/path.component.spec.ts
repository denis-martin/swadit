import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, map } from 'rxjs';

import { PathModule } from './path.module';
import { PathComponent } from './path.component';
import { RequestBodyEditComponent } from '../../shared/modules/editor-modals/request-body-edit/request-body-edit.component';
import { loadFixture, renderComponent, setCurrentApi } from 'testing/test-helpers';

describe('PathComponent', () => {
	let queryParams: BehaviorSubject<any>;
	const render = (path: string, method?: string, api?: any) => {
		queryParams = new BehaviorSubject(method ? { name: path, method } : { name: path });
		return renderComponent(PathComponent, {
			imports: [PathModule],
			providers: [ { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.pipe(map(convertToParamMap)) } } ],
			api
		});
	};
	const tabs = (element: HTMLElement) => Array.from(element.querySelectorAll('.nav-link'))
		.map(e => e.textContent.trim()).filter(t => t);
	const headings = (element: HTMLElement) => Array.from(element.querySelectorAll('h2')).map(e => e.textContent.trim());

	const versions = [ [ 'OAS2', 'petstoreOas2Yaml' ], [ 'OAS3', 'petstoreOas3Yaml' ] ] as const;

	it.each(versions)('shows the operations of the path and selects the first one (%s)', (version, api) => {
		const { component, element } = render('/pet', undefined, loadFixture(api));
		expect(component.method).toBe('post');
		expect(element.querySelector('h1').textContent).toBe('/pet');
		expect(tabs(element)).toEqual(['post', 'put']);
		expect(element.textContent).toContain('Add a new pet to the store');
		expect(headings(element)).toEqual(['Parameters', 'Responses', 'General Information', 'Security']);
	});

	it('shows the operation given in the route', () => {
		const { component, fixture, element } = render('/pet', 'put');
		expect(component.method).toBe('put');
		queryParams.next({ name: '/store/order' });
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

	it.each(versions)('shows path and operation parameters (%s)', (version, api) => {
		const { fixture, element } = render('/pet/{petId}', 'get', loadFixture(api));
		const cards = Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
		expect(cards[0]).toBe('petId* in path (integer) ID of pet to return');
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-parameter-view')).toBeTruthy();
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', '#/definitions/Pet' ],
		[ 'OAS3', 'petstoreOas3Yaml', '#/components/schemas/Pet' ]
	] as const)('shows responses with referenced schemas (%s)', (version, api, ref) => {
		const { fixture, element } = render('/pet/{petId}', 'get', loadFixture(api));
		const cards = Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
		expect(cards).toContain(`200 (${ref}) successful operation`);
		const header = Array.from(element.querySelectorAll('.card-header')).find(e => e.textContent.includes('successful operation')) as HTMLElement;
		header.click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-response-view')).toBeTruthy();
	});

	it('shows security requirements, documentation and extensions', () => {
		const api = loadFixture('petstoreOas3Yaml');
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
		const api = loadFixture('petstoreOas3Yaml');
		api.paths['/empty'] = {};
		const { component, element } = render('/empty', undefined, api);
		expect(component.method).toBeNull();
		expect(element.textContent).toContain('Add a method...');
	});

	it('leaves the page if the path does not exist in a newly loaded API', () => {
		const { apis, component } = render('/pet');
		const router = TestBed.inject(Router);
		vi.spyOn(router, 'url', 'get').mockReturnValue('/path?name=%2Fpet');
		setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
		expect(component.path).toBe('');
		expect(router.navigate).toHaveBeenCalledWith(['/api-info']);
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', { name: 'q', in: 'query', type: 'string' } ],
		[ 'OAS3', 'petstoreOas3Yaml', { name: 'q', in: 'query', schema: { type: 'string' } } ]
	] as const)('adds parameters for this operation or for all operations (%s)', async (version, api, param) => {
		const { component, apis } = render('/pet', 'post', loadFixture(api));
		const modal = TestBed.inject(NgbModal);
		const newParam: any = param;
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
		// the empty parameter list of the operation is removed
		await vi.waitFor(() => expect(apis.current.paths['/pet'].post.parameters || []).not.toContain(newParam));
	});

	it('stops listening to API changes when destroyed', () => {
		const { fixture, apis } = render('/pet');
		fixture.destroy();
		apis.newFile();
		expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
	});

	const cardHeaders = (element: HTMLElement) => Array.from(element.querySelectorAll('.card-header .preview'))
		.map(e => e.textContent.replace(/\s+/g, ' ').trim());

	it('shows the editing functions (OAS3)', () => {
		const { element } = render('/items/{id}', 'get', loadFixture('minimalOas3Yaml'));
		expect(element.querySelector('.edit-section')).toBeTruthy();
		expect(Array.from(element.querySelectorAll('.edit-subsection')).map(e => e.getAttribute('title'))).toEqual(['Add parameter', 'Add response']);
		// path parameter, operation parameter, two responses
		expect(element.querySelectorAll('.edit-card').length).toBe(4);
	});

	it('shows the schema types of parameters and responses (OAS3)', () => {
		const { element } = render('/items/{id}', 'get', loadFixture('minimalOas3Yaml'));
		expect(cardHeaders(element)).toEqual(['id* in path (string)', 'verbose in query (boolean)', '200 (#/components/schemas/Item) ok', 'default error']);
	});

	it('shows referenced request bodies (OAS3)', () => {
		const { fixture, component, element } = render('/items', 'post', loadFixture('featuresOas3Yaml'));
		expect(cardHeaders(element)[0]).toBe('Request Body (application/json) An item');
		component.uncollapsedParameter['x-swadit-requestBody'] = true;
		fixture.detectChanges();
		expect(element.textContent).toContain('Defined in #/components/requestBodies/Item:');
		expect(element.querySelector('swadit-request-body-view').textContent).toContain('#/components/schemas/Item');
		expect(element.textContent).not.toContain('Add a request body...');
	});

	it('offers to add a request body only to operations with request body semantics (OAS3)', () => {
		const api = loadFixture('featuresOas3Yaml');
		expect(render('/items', 'get', api).element.textContent).not.toContain('Add a request body...');
		TestBed.resetTestingModule();
		api.paths['/items'].patch = { responses: { default: { description: 'ok' } } };
		const { element } = render('/items', 'patch', api);
		expect(element.textContent).toContain('Add a request body...');
	});

	it('edits the request body (OAS3)', () => {
		const { component, apis } = render('/items/{id}', 'put', loadFixture('featuresOas3Yaml'));
		const modal = TestBed.inject(NgbModal);
		const open = vi.spyOn(modal, 'open').mockReturnValue({ componentInstance: {}, result: Promise.resolve('ok') } as any);
		component.editRequestBody(null);
		const operation = apis.current.paths['/items/{id}'].put;
		expect(open).toHaveBeenCalledWith(RequestBodyEditComponent, RequestBodyEditComponent.modalOptions);
		expect(open.mock.results[0].value.componentInstance).toEqual({ pathMode: true, parent: operation, obj: operation.requestBody });
	});

	it('determines the types of parameters and the schemas of responses', () => {
		const { component, apis } = render('/items/{id}', 'get', loadFixture('minimalOas3Yaml'));
		expect(component.paramType(null)).toBeNull();
		expect(component.paramType({ name: 'a', in: 'query', content: {} })).toBeNull();
		expect(component.paramType({ schema: { '$ref': '#/components/schemas/Tag' } })).toBe('#/components/schemas/Tag');
		expect(component.responseSchema({ description: 'no content' })).toBeNull();
		expect(component.responseSchema({ content: { 'text/plain': {}, 'application/json': { schema: { type: 'object' } } } })).toEqual({ type: 'object' });
		apis.newFile('oas2');
		expect(component.responseSchema({ schema: { type: 'string' } })).toEqual({ type: 'string' });
	});
});
