import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
		const { element } = render({ type: 'string' }, loadFixture('petstoreOas2Yaml'));
		expect(refOptions(element)).toEqual(['', ...['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse'].map(d => '#/definitions/' + d)]);
	});

	it('offers the component schemas as references (OAS3)', () => {
		const { element } = render({ type: 'string' });
		expect(refOptions(element)).toEqual(['', ...['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse'].map(d => '#/components/schemas/' + d)]);
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
		const { editor, component } = render({ '$ref': '#/components/schemas/Pet' });
		editor.convertToAllOf(component.value);
		expect(component.value).toEqual({ allOf: [ { '$ref': '#/components/schemas/Pet' } ] });
		expect(editor.getType(component.value)).toBe('$ref*');
		editor.addToAllOf(component.value);
		expect(component.value.allOf.length).toBe(2);
		editor.deleteAllOfItem(event(), 1);
		editor.convertToSingleSchema(component.value);
		expect(component.value).toEqual({ '$ref': '#/components/schemas/Pet' });
	});

	it('edits nullable only for OAS3', () => {
		expect(render({ type: 'string' }, loadFixture('petstoreOas2Yaml')).element.textContent).not.toContain('nullable');
		TestBed.resetTestingModule();
		const { element, editor, component, fixture } = render({ type: 'string' });
		const checkbox = element.querySelector('input[type=checkbox]') as HTMLInputElement;
		expect(checkbox.checked).toBe(false);
		checkbox.click();
		fixture.detectChanges();
		expect(component.value).toEqual({ type: 'string', nullable: true });
		editor.setNullable(false);
		expect(component.value).toEqual({ type: 'string' });
	});

	it('hints at OAS3 composites that cannot be edited', () => {
		const { element, editor } = render({ oneOf: [ { type: 'string' } ], not: { type: 'integer' } });
		expect(editor.oas3Composites()).toEqual(['oneOf', 'not']);
		expect(element.textContent).toContain('oneOf, not');
		expect(element.textContent).toContain('can only be edited in the source view');
	});
});
