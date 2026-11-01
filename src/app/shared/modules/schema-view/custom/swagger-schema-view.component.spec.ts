import { SchemaViewModule } from '../schema-view.module';
import { SwaggerSchemaViewComponent } from './swagger-schema-view.component';
import { renderComponent } from 'testing/test-helpers';

describe('SwaggerSchemaViewComponent', () => {
	const render = (obj: any, generateExample = false) =>
		renderComponent(SwaggerSchemaViewComponent, { imports: [SchemaViewModule], props: { obj, generateExample } });

	it('shows the properties of object schemas', () => {
		const { apis, fixture, element } = renderComponent(SwaggerSchemaViewComponent, { imports: [SchemaViewModule], detectChanges: false });
		fixture.componentInstance.obj = apis.current.definitions.Pet;
		fixture.detectChanges();
		const properties = Array.from(element.querySelectorAll('.property')).map(e => e.textContent.trim());
		expect(properties).toEqual(['id', 'category', 'name*', 'photoUrls*', 'tags', 'status']);
		const types = Array.from(element.querySelectorAll('.propertyType')).map(e => e.textContent.replace(/[\s:]+/g, ' ').trim());
		expect(types).toEqual(['integer (int64)', '#/definitions/Category', 'string', 'array (string)', 'array (#/definitions/Tag)', 'string']);
	});

	it('expands referenced properties', () => {
		const { apis, fixture, element } = renderComponent(SwaggerSchemaViewComponent, { imports: [SchemaViewModule], detectChanges: false });
		fixture.componentInstance.obj = apis.current.definitions.Pet;
		fixture.detectChanges();
		fixture.componentInstance.uncollapsed['category'] = true;
		fixture.detectChanges();
		expect(element.querySelectorAll('swadit-swagger-schema-view').length).toBe(1);
	});

	it('shows enums, formats, defaults and examples (also falsy ones)', () => {
		const { element } = render({ type: 'integer', format: 'int32', enum: [0, 1], default: 0, example: 0 });
		const rows = Array.from(element.querySelectorAll('tr'))
			.map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.replace(/\s+/g, ' ').trim()).join(' '));
		expect(rows).toEqual(['type integer', 'format int32', 'enum 0 | 1', 'default 0', 'example 0']);
	});

	it('shows a generated example on request', () => {
		const { fixture, element } = render({ type: 'object', properties: { a: { type: 'string' } } }, true);
		expect(element.textContent).toContain('Generated example');
		fixture.componentInstance['showGeneratedExample'] = true;
		fixture.detectChanges();
		expect(element.querySelector('markdown')).toBeTruthy();
	});

	it('creates type previews', () => {
		const { component } = render({ type: 'string' });
		expect(component.getTypePreview({ type: 'string', format: 'date', readOnly: true })).toBe('string (date) read only');
		expect(component.getTypePreview({ allOf: [ { '$ref': '#/definitions/Pet' }, {} ] })).toBe('#/definitions/Pet');
	});
});
