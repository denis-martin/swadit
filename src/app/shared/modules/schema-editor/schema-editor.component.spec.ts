import { SchemaEditorModule } from './schema-editor.module';
import { SchemaEditorComponent } from './schema-editor.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('SchemaEditorComponent', () => {
	const render = (schema: any, obj: any, api?: any) =>
		renderComponent(SchemaEditorComponent, { imports: [SchemaEditorModule], props: { schema, obj }, api });

	it.each([
		[{ type: 'string' }, '', 'swadit-primitive-editor'],
		[{ type: 'boolean' }, true, 'swadit-primitive-editor'],
		[{ type: 'array', items: { type: 'string' } }, [], 'swadit-array-editor'],
		[{ type: 'object', properties: {} }, {}, 'swadit-object-editor'],
		[{ 'x-swadit-swagger-schema': true }, {}, 'swadit-swagger-schema-editor']
	])('chooses the editor by type (%j)', (schema, obj, editor) => {
		expect(render(schema, obj).element.querySelector(editor)).toBeTruthy();
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', '#/definitions/info', 'Title', 'contact' ],
		[ 'OAS3', 'petstoreOas3Yaml', '#/definitions/Tag', 'Name', 'externalDocs' ]
	] as const)('resolves refs into the spec schema (%s)', (version, fixture, ref, label, objectProperty) => {
		const obj = {};
		const { element } = render({ '$ref': ref }, obj, loadFixture(fixture));
		expect(element.querySelector('swadit-object-editor')).toBeTruthy();
		expect(element.textContent).toContain(label);
		// referenced object properties are created, too
		expect(obj[objectProperty]).toEqual({});
	});

	it.each([
		[ 0, 'petstoreOas2Yaml' ], [ 1, 'petstoreOas2Yaml' ], [ 2, 'petstoreOas2Yaml' ],
		[ 0, 'petstoreOas3Yaml' ], [ 1, 'petstoreOas3Yaml' ], [ 2, 'petstoreOas3Yaml' ]
	] as const)('renders group %i of the operation editor for an existing operation (%s)', (group, api) => {
		const { apis, fixture, element } = renderComponent(SchemaEditorComponent,
			{ imports: [SchemaEditorModule], detectChanges: false, api: loadFixture(api) });
		Object.assign(fixture.componentInstance, { schema: apis.schemas.operation, obj: apis.current.paths['/pet'].post, group });
		fixture.detectChanges();
		expect(element.querySelectorAll('label').length).toBeGreaterThan(0);
	});
});
