import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SchemaEditorModule } from '../schema-editor.module';
import { SwaggerSchemaEditorComponent } from './swagger-schema-editor.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

@Component({
	template: `<swadit-swagger-schema-editor [(obj)]="value" [id]="'s'"></swadit-swagger-schema-editor>`,
	imports: [SchemaEditorModule]
})
class HostComponent {
	value: any = {};
}

describe('SwaggerSchemaEditorComponent', () => {
	const event = () => new Event('click');
	const render = (value: any, api?: any) => {
		const r = renderComponent(HostComponent, { props: { value }, api });
		return { ...r, editor: r.fixture.debugElement.query(By.directive(SwaggerSchemaEditorComponent)).componentInstance as SwaggerSchemaEditorComponent };
	};
	const refOptions = (element: HTMLElement) =>
		Array.from(element.querySelector('select[title^="Reference"]').querySelectorAll('option')).map(o => o.value);

	it('renders the type and the properties of object schemas', () => {
		const { element } = render({ type: 'object', required: ['id'], properties: { id: { type: 'integer' }, name: { type: 'string' } } });
		expect((element.querySelector('#s_id') as HTMLInputElement)).toBeTruthy();
		expect(element.querySelector('.propertyIsRequired')).toBeTruthy();
		expect(element.textContent).toContain('create composite');
	});

	it('offers the definitions as references (OAS2)', () => {
		const { element } = render({ type: 'string' });
		expect(refOptions(element)).toContain('#/definitions/Pet');
	});

	it('offers the component schemas as references (OAS3)', () => {
		const { element } = render({ type: 'string' }, loadFixture('minimalOas3Yaml'));
		expect(refOptions(element)).toEqual(['', '#/components/schemas/Item', '#/components/schemas/Tag']);
	});

	it('adds, renames and deletes properties', () => {
		const { editor, component } = render({ type: 'object' });
		editor.propertyToAdd = 'a';
		editor.addProperty(event());
		expect(component.value.properties).toEqual({ a: { type: 'string' } });
		editor.propertyToAdd = 'a';
		editor.addProperty(event());
		expect(editor.addPropertyError).toBe('Property already exists');
		editor.changePropertyIsRequired('a');
		expect(component.value.required).toEqual(['a']);
		editor.changeProperty('b', 'a');
		expect(component.value.properties).toEqual({ b: { type: 'string' } });
		expect(component.value.required).toEqual(['b']);
		editor.deleteProperty(event(), 'b');
		expect(component.value.properties).toEqual({});
		expect(component.value.required).toBeUndefined();
	});

	it('does not overwrite properties when renaming', () => {
		const { editor, component } = render({ type: 'object', properties: { a: { type: 'string' }, b: { type: 'integer' } } });
		editor.changeProperty('b', 'a');
		expect(component.value.properties).toEqual({ a: { type: 'string' }, b: { type: 'integer' } });
	});

	it('converts to and from composite schemas', () => {
		const { editor, component } = render({ '$ref': '#/definitions/Pet' });
		editor.convertToAllOf(component.value);
		expect(component.value).toEqual({ allOf: [ { '$ref': '#/definitions/Pet' } ] });
		expect(editor.getType(component.value)).toBe('$ref*');
		editor.addToAllOf(component.value);
		expect(component.value.allOf.length).toBe(2);
		editor.deleteAllOfItem(event(), 1);
		editor.convertToSingleSchema(component.value);
		expect(component.value).toEqual({ '$ref': '#/definitions/Pet' });
	});
});
