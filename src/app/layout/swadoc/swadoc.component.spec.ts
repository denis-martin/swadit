import { SwadocModule } from './swadoc.module';
import { SwadocComponent } from './swadoc.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('SwadocComponent', () => {
	const render = (api?: any) => renderComponent(SwadocComponent, { imports: [SwadocModule], api });

	const versions = [ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const;

	const operation = (component: SwadocComponent, path: string, method: string) =>
		component.paths.find(p => p.path == path).operations.find(o => o.method == method);

	it.each(versions)('renders the API info and the sorted list of paths (%s)', (api) => {
		const { component, element } = render(loadFixture(api));
		expect(element.querySelector('.swadoc h1').textContent).toContain('Swagger Petstore');
		expect(element.textContent).toContain('Contact: demo@froschbach.io');
		expect(element.textContent).toContain('License: Apache 2.0');
		expect(component.baseUrls).toEqual(['/v1']);

		const paths = [ '/pet', '/pet/findByStatus', '/pet/findByTags', '/pet/{petId}', '/pet/{petId}/uploadImage',
			'/store/inventory', '/store/order', '/store/order/{orderId}' ];
		expect(component.paths.map(p => p.path)).toEqual(paths);
		expect(element.querySelectorAll('.pathlist tr').length).toBe(paths.length);
		expect(element.querySelectorAll('.pathheading').length).toBe(paths.length);
		expect(element.querySelector('.pathheading').id).toBe('swadoc-pet');
	});

	it.each(versions)('shows the parameters of an operation (%s)', (api) => {
		const { component, element } = render(loadFixture(api));
		const op = operation(component, '/pet/findByStatus', 'get');
		expect(op.parameters).toEqual([expect.objectContaining({ name: 'status', in: 'query', required: true, type: 'array (string)' })]);
		expect(component.getEnum(op.parameters[0].schema)).toEqual(['available', 'pending', 'sold']);
		expect(element.textContent).toContain('Allowed values: "available", "pending", "sold"');
	});

	it.each(versions)('shows the request body with nested properties and an example (%s)', (api) => {
		const { component, element } = render(loadFixture(api));
		const body = operation(component, '/pet', 'post').body;
		expect(body.mediaTypes).toEqual(['application/json', 'application/xml']);
		expect(body.description).toBe('Pet object that needs to be added to the store');
		expect(body.schema.type).toBe('Pet');
		expect(body.schema.properties.map(p => [p.name, p.level, p.type, p.notes])).toEqual([
			['id', 0, 'integer (int64)', ''],
			['category', 0, 'Category', ''],
			['id', 1, 'integer (int64)', ''],
			['name', 1, 'string', ''],
			['name', 0, 'string', 'required'],
			['photoUrls', 0, 'array (string)', 'required'],
			['tags', 0, 'array (Tag)', ''],
			['id', 1, 'integer (int64)', ''],
			['name', 1, 'string', ''],
			['status', 0, 'string', '']
		]);
		expect(JSON.parse(body.schema.example)).toEqual(expect.objectContaining({ name: 'doggie', tags: [{ id: 0, name: 'string' }] }));
		expect(element.textContent).toContain('Request Body Example:');
	});

	it.each(versions)('shows the responses (%s)', (api) => {
		const { component } = render(loadFixture(api));
		const responses = operation(component, '/pet/findByStatus', 'get').responses;
		expect(responses.map(r => [r.code, r.description])).toEqual([['200', 'successful operation'], ['400', 'Invalid status value']]);
		expect(responses[0].schema.type).toBe('array (Pet)');
		expect(responses[0].mediaTypes).toEqual(['application/xml', 'application/json']);
		expect(JSON.parse(responses[0].schema.example)[0].name).toBe('doggie');
		expect(responses[1].schema).toBeNull();
		expect(responses[1].mediaTypes).toEqual([]);
	});

	it('shows servers, parameters, request bodies and responses (OAS3)', () => {
		const api = loadFixture('minimalOas3Yaml');
		api.servers = [ { url: 'https://example.com/api' } ];
		api.paths['/items/{id}'].put = {
			requestBody: {
				description: 'the new item',
				content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' }, example: { id: 'a' } } }
			},
			responses: { '204': { description: 'updated' } }
		};
		const { component, element } = render(api);
		expect(component.baseUrls).toEqual(['https://example.com/api']);

		const get = operation(component, '/items/{id}', 'get');
		expect(get.parameters.map(p => [p.name, p.in, p.type, p.required])).toEqual([
			['id', 'path', 'string', true], ['verbose', 'query', 'boolean', false]
		]);
		expect(get.responses.map(r => [r.code, r.description, r.mediaTypes])).toEqual([
			['200', 'ok', ['application/json']], ['default', 'error', []]
		]);
		expect(get.responses[0].schema.properties.map(p => [p.name, p.level, p.type])).toEqual([
			['id', 0, 'string'], ['tags', 0, 'array (Tag)'], ['name', 1, 'string']
		]);

		const put = operation(component, '/items/{id}', 'put');
		expect(put.body.description).toBe('the new item');
		expect(put.body.mediaTypes).toEqual(['application/json']);
		expect(JSON.parse(put.body.schema.example)).toEqual({ id: 'a' });
		expect(element.querySelectorAll('.methodheading').length).toBe(2);
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', (api: any) => api.definitions, '#/definitions/Category' ],
		[ 'OAS3', 'petstoreOas3Yaml', (api: any) => api.components.schemas, '#/components/schemas/Category' ]
	] as const)('does not expand recursive schemas endlessly (%s)', (version, fixture, schemas, ref) => {
		const api = loadFixture(fixture);
		schemas(api).Category.properties.parent = { $ref: ref };
		const { component } = render(api);
		const props = operation(component, '/pet', 'post').body.schema.properties;
		expect(props.filter(p => p.name == 'parent').map(p => [p.level, p.type])).toEqual([[1, 'Category']]);
	});

	it('updates when another API is loaded', () => {
		const { fixture, component, apis, element } = render();
		apis.newFile();
		fixture.detectChanges();
		expect(component.paths).toEqual([]);
		expect(element.querySelector('.swadoc h1').textContent).toContain('My new API');
	});

	it('prints with the API title as document title', () => {
		const { component } = render();
		document.title = 'Swadit';
		const print = vi.fn(() => expect(document.title).toBe('Swagger Petstore'));
		vi.stubGlobal('print', print);
		component.print();
		expect(print).toHaveBeenCalled();
		expect(document.title).toBe('Swadit');
		vi.unstubAllGlobals();
	});

	it('scrolls to the active path', async () => {
		const { component, apis, element } = render();
		document.body.appendChild(element);
		const scrollTo = vi.fn();
		vi.stubGlobal('scrollTo', scrollTo);
		const heading = element.querySelector('#swadoc-store-order');
		vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue({ top: 500 } as DOMRect);
		apis.activePath = '/store/order';
		component.ngAfterViewInit();
		await vi.waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 430, behavior: 'instant' }));
		vi.unstubAllGlobals();
		element.remove();
	});
});
