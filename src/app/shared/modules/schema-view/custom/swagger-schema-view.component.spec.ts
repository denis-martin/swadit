import { SchemaViewModule } from '../schema-view.module';
import { SwaggerSchemaViewComponent } from './swagger-schema-view.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('SwaggerSchemaViewComponent', () => {
	const render = (obj: any, generateExample = false) =>
		renderComponent(SwaggerSchemaViewComponent, { imports: [SchemaViewModule], props: { obj, generateExample } });

	const versions = [
		[ 'OAS2', 'petstoreOas2Yaml', '#/definitions/' ],
		[ 'OAS3', 'petstoreOas3Yaml', '#/components/schemas/' ]
	] as const;
	const renderPet = (api: typeof versions[number][1]) => {
		const r = renderComponent(SwaggerSchemaViewComponent, { imports: [SchemaViewModule], detectChanges: false, api: loadFixture(api) });
		r.fixture.componentInstance.obj = r.apis.getComponents('schemas').Pet;
		return r;
	};

	it.each(versions)('shows the properties of object schemas (%s)', (version, api, prefix) => {
		const { fixture, element } = renderPet(api);
		fixture.detectChanges();
		const properties = Array.from(element.querySelectorAll('.property')).map(e => e.textContent.trim());
		expect(properties).toEqual(['id', 'category', 'name*', 'photoUrls*', 'tags', 'status']);
		const types = Array.from(element.querySelectorAll('.propertyType')).map(e => e.textContent.replace(/[\s:]+/g, ' ').trim());
		expect(types).toEqual(['integer (int64)', prefix + 'Category', 'string', 'array (string)', `array (${prefix}Tag)`, 'string']);
	});

	it.each(versions)('expands referenced properties (%s)', (version, api) => {
		const { fixture, element } = renderPet(api);
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
		expect(component.getTypePreview({ allOf: [ { '$ref': '#/components/schemas/Pet' }, {} ] })).toBe('#/components/schemas/Pet');
	});

	it('shows OAS3 composites, nullable and discriminators', () => {
		const { element, component } = render({
			oneOf: [ { type: 'string' }, { '$ref': '#/components/schemas/Tag' } ],
			anyOf: [ { type: 'integer' } ],
			not: { type: 'boolean' },
			nullable: true,
			discriminator: { propertyName: 'kind' }
		});
		const labels = Array.from(element.querySelectorAll(':scope > table > tbody > tr > .label-text')).map(e => e.textContent.trim());
		expect(labels).toEqual(['one of', 'any of', 'not', 'discriminator', 'nullable']);
		expect(element.textContent).toContain('#/components/schemas/Tag');
		expect(element.textContent).toContain('kind');
		expect(component.getTypePreview({ oneOf: [], nullable: true })).toBe('oneOf nullable');
		expect(component.getTypePreview({ anyOf: [] })).toBe('anyOf');
		expect(component.getTypePreview({})).toBe('');
	});
});
