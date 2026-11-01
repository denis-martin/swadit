import { SchemaViewModule } from './schema-view.module';
import { SchemaViewComponent } from './schema-view.component';
import { renderComponent } from 'testing/test-helpers';

describe('SchemaViewComponent', () => {
	const render = (schema: any, obj: any, skip: string[] = []) =>
		renderComponent(SchemaViewComponent, { imports: [SchemaViewModule], props: { schema, obj, skip } });

	it('shows the properties of the object that are defined in the schema', () => {
		const { element } = render(
			{ type: 'object', properties: { name: { type: 'string' }, in: { type: 'string' }, description: { type: 'string' } } },
			{ in: 'query', name: 'limit', description: 'd', other: 1 },
			['description']);
		const labels = Array.from(element.querySelectorAll('.label-text')).map(e => e.textContent);
		expect(labels).toEqual(['name', 'in']);
		expect(element.textContent).toContain('limit');
	});

	it('shows nested objects', () => {
		const { element } = render(
			{ type: 'object', properties: { info: { type: 'object', properties: { title: { type: 'string' } } } } },
			{ info: { title: 'T' } });
		expect(element.querySelectorAll('swadit-schema-view').length).toBe(1);
		expect(element.textContent).toContain('T');
	});

	it('shows all properties of maps', () => {
		const { element } = render(
			{ type: 'object', additionalProperties: { type: 'string' } },
			{ a: 'x', b: 'y' });
		expect(Array.from(element.querySelectorAll('.label-text')).map(e => e.textContent)).toEqual(['a', 'b']);
		expect(element.textContent).toContain('y');
	});

	it('shows the first schema of oneOf', () => {
		const { component } = render({ oneOf: [ { type: 'object', properties: {} }, { type: 'string' } ] }, {});
		expect(component.schema['type']).toBe('object');
	});

	it('renders the spec parameter schema for a petstore parameter', () => {
		const { apis, fixture, element } = renderComponent(SchemaViewComponent, { imports: [SchemaViewModule], detectChanges: false });
		Object.assign(fixture.componentInstance, { schema: apis.schemas.parameterNonBody, obj: apis.current.paths['/pet/{petId}'].get.parameters[0] });
		fixture.detectChanges();
		expect(element.textContent).toContain('petId');
		expect(element.textContent).toContain('int64');
	});
});
