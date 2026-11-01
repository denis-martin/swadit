import { SchemaViewModule } from '../schema-view.module';
import { ContentViewComponent } from './content-view.component';
import { RequestBodyViewComponent } from './request-body-view.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ContentViewComponent', () => {
	const render = (content: any, label = '') =>
		renderComponent(ContentViewComponent, { imports: [SchemaViewModule], api: loadFixture('featuresOas3Yaml'), props: { content, label } });
	const markdownData = (fixture: any) => fixture.debugElement.queryAll((d: any) => d.name == 'markdown').map((d: any) => d.componentInstance.data);

	it('shows the media types with their schemas', () => {
		const { element } = render({
			'application/json': { schema: { '$ref': '#/components/schemas/Item' } },
			'text/plain': {}
		}, 'Body as ');
		const mediaTypes = Array.from(element.querySelectorAll('.mediaType > p:first-child')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
		expect(mediaTypes).toEqual(['Body as application/json: #/components/schemas/Item', 'Body as text/plain:']);
		expect(element.querySelectorAll('swadit-swagger-schema-view').length).toBe(1);
	});

	it('shows the value of (referenced) examples and generates examples on demand', () => {
		const { fixture, component, element } = render({
			'application/json': {
				schema: { '$ref': '#/components/schemas/Item' },
				examples: { one: { '$ref': '#/components/examples/Item' }, two: { value: { id: 'x' } } }
			},
			'text/plain': { schema: { type: 'string' } }
		});
		expect(element.textContent).toContain('one:');
		expect(element.textContent).toContain('#/components/examples/Item');
		expect(markdownData(fixture).join()).toContain('"id": "abc"');
		// the generated example is shown by default if there are no examples
		expect(component.showGeneratedExample('application/json')).toBe(false);
		expect(component.showGeneratedExample('text/plain')).toBe(true);
		component.toggleGeneratedExample('application/json');
		component.toggleGeneratedExample('text/plain');
		expect(component.showGeneratedExample('application/json')).toBe(true);
		expect(component.showGeneratedExample('text/plain')).toBe(false);
		expect(component.generateExample({ '$ref': '#/components/schemas/Item' })).toBe('{\n  "id": "string"\n}');
	});

	it('handles missing content', () => {
		const { element, component } = render(null);
		expect(element.textContent.trim()).toBe('');
		expect(component.mediaType('application/json')).toEqual({});
	});
});

describe('RequestBodyViewComponent', () => {
	it('shows the request body', () => {
		const api = loadFixture('featuresOas3Yaml');
		const { element } = renderComponent(RequestBodyViewComponent, {
			imports: [SchemaViewModule], api, props: { obj: api.paths['/items/{id}'].put.requestBody }
		});
		expect(element.textContent).toContain('The request body is required.');
		expect(element.textContent).toContain('application/json:');
		expect(element.textContent).toContain('#/components/schemas/Item');
	});
});
