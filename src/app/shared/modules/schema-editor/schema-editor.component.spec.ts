import { SchemaEditorModule } from './schema-editor.module';
import { SchemaEditorComponent } from './schema-editor.component';
import { renderComponent } from 'testing/test-helpers';

describe('SchemaEditorComponent', () => {
	const render = (schema: any, obj: any) => renderComponent(SchemaEditorComponent, { imports: [SchemaEditorModule], props: { schema, obj } });

	it.each([
		[{ type: 'string' }, '', 'swadit-primitive-editor'],
		[{ type: 'boolean' }, true, 'swadit-primitive-editor'],
		[{ type: 'array', items: { type: 'string' } }, [], 'swadit-array-editor'],
		[{ type: 'object', properties: {} }, {}, 'swadit-object-editor'],
		[{ 'x-swadit-swagger-schema': true }, {}, 'swadit-swagger-schema-editor']
	])('chooses the editor by type (%j)', (schema, obj, editor) => {
		expect(render(schema, obj).element.querySelector(editor)).toBeTruthy();
	});

	it('resolves refs into the spec schema', () => {
		const info = {};
		const { element } = render({ '$ref': '#/definitions/info' }, info);
		expect(element.querySelector('swadit-object-editor')).toBeTruthy();
		expect(element.textContent).toContain('Title');
		// referenced object properties are created, too
		expect(info['contact']).toEqual({});
	});

	it.each([0, 1, 2])('renders group %i of the operation editor for an existing operation', (group) => {
		const { apis, fixture, element } = renderComponent(SchemaEditorComponent, { imports: [SchemaEditorModule], detectChanges: false });
		Object.assign(fixture.componentInstance, { schema: apis.schemas.operation, obj: apis.current.paths['/pet'].post, group });
		fixture.detectChanges();
		expect(element.querySelectorAll('label').length).toBeGreaterThan(0);
	});
});
