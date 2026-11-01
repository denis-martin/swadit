import { SchemaViewModule } from '../schema-view.module';
import { ResponseViewComponent } from './response-view.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ResponseViewComponent', () => {
	const render = (obj: any, api?: any) => renderComponent(ResponseViewComponent, { imports: [SchemaViewModule], props: { obj }, api });

	it('shows the schema, examples and headers (OAS2)', () => {
		const { element } = render({
			description: 'ok',
			schema: { '$ref': '#/definitions/Tag' },
			examples: { 'application/json': { id: 1 } },
			headers: { 'X-Rate': { type: 'integer' } }
		}, loadFixture('petstoreOas2Yaml'));
		expect(element.textContent).toContain('#/definitions/Tag');
		expect(element.textContent).toContain('application/json:');
		expect(element.textContent).toContain('Headers:');
		expect(element.querySelector('swadit-swagger-schema-view')).toBeTruthy();
	});

	it('shows the content (OAS3)', () => {
		const api = loadFixture('minimalOas3Yaml');
		const { element } = render(api.paths['/items/{id}'].get.responses['200'], api);
		expect(element.textContent).toContain('Response as application/json');
		expect(element.textContent).toContain('#/components/schemas/Item');
		expect(element.querySelector('swadit-swagger-schema-view')).toBeTruthy();
	});

	it('shows the headers (OAS3)', () => {
		const { fixture, element } = render({
			description: 'ok',
			content: { 'application/json': { schema: { '$ref': '#/components/schemas/Tag' } } },
			headers: { 'X-Rate': { schema: { type: 'integer' } } }
		});
		expect(element.textContent).toContain('Headers:');
		const markdown = fixture.debugElement.queryAll((d: any) => d.name == 'markdown').map((d: any) => d.componentInstance.data);
		expect(markdown.join()).toContain('X-Rate');
	});

	it('shows media types without schema and their examples (OAS3)', () => {
		const { element } = render({
			description: 'ok',
			content: {
				'text/plain': { example: 'hello' },
				'application/json': { examples: { one: { value: { a: 1 } } } }
			}
		}, loadFixture('minimalOas3Yaml'));
		expect(element.textContent).toContain('Response as text/plain');
		expect(element.textContent).toContain('Example:');
		expect(element.textContent).toContain('one:');
	});
});
