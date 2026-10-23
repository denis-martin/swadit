import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SchemaEditorModule } from './schema-editor.module';
import { ObjectEditorComponent } from './object-editor.component';
import { renderComponent } from 'testing/test-helpers';

@Component({
	template: `<swadit-object-editor [schema]="schema" [(obj)]="value" [id]="'o'"></swadit-object-editor>`,
	imports: [SchemaEditorModule]
})
class HostComponent {
	schema: any = {};
	value: any = {};
}

describe('ObjectEditorComponent', () => {
	const event = () => new Event('click');
	const render = (schema: any, value: any) => {
		const r = renderComponent(HostComponent, { props: { schema, value } });
		return { ...r, editor: r.fixture.debugElement.query(By.directive(ObjectEditorComponent)).componentInstance as ObjectEditorComponent };
	};
	const mapSchema = { type: 'object', additionalProperties: { type: 'string', description: 'Value' } };

	it('renders an editor for each property', () => {
		const { element } = render({ type: 'object', required: ['title'], properties: {
			title: { type: 'string' },
			termsOfService: { type: 'string' },
			hidden: { type: 'string', 'x-swadit-input-hidden': true }
		} }, { title: 'T' });
		const labels = Array.from(element.querySelectorAll('label')).map(l => l.textContent.replace(/\s+/g, ' ').trim());
		expect(labels).toEqual(['Title*', 'Terms Of Service']);
		expect(element.querySelectorAll('swadit-schema-editor').length).toBe(2);
	});

	it('initializes object and array properties', () => {
		const { component } = render({ type: 'object', properties: {
			a: { type: 'object', properties: {} },
			b: { type: 'array', items: { type: 'string' } },
			c: { type: 'string' }
		} }, {});
		expect(component.value).toEqual({ a: {}, b: [] });
	});

	it('renders a grid layout', () => {
		const { element } = render({
			type: 'object',
			'x-swadit-editor-grid': [ [ 'a', 'b' ] ],
			'x-swadit-editor-grid-cols': { a: 4 },
			properties: { a: { type: 'string' }, b: { type: 'string' } }
		}, {});
		expect(element.querySelector('.col-md-4')).toBeTruthy();
		expect(element.querySelector('.col-md-12')).toBeTruthy();
	});

	it('allows to remove and re-add optional object properties in a grid', () => {
		const { fixture, element, component } = render({
			type: 'object',
			'x-swadit-editor-grid': [ [ 'docs' ] ],
			properties: { docs: { type: 'object', properties: { url: { type: 'string' } } } }
		}, { docs: { url: 'u' } });
		const trash = element.querySelector('label .fa-trash');
		expect(trash).toBeTruthy();
		(trash.parentElement as HTMLElement).click();
		fixture.detectChanges();
		expect(component.value.docs).toBeUndefined();
		const add = element.querySelector('button') as HTMLButtonElement;
		expect(add.textContent).toBe('add');
		add.click();
		fixture.detectChanges();
		expect(component.value.docs).toEqual({});
	});

	it('adds, renames and deletes additional properties', () => {
		const { editor, component } = render(mapSchema, { a: '1' });
		editor.propertyToAdd = 'b';
		editor.addProperty(event());
		expect(component.value).toEqual({ a: '1', b: '' });
		editor.changeProperty('c', 'a');
		expect(Object.keys(component.value)).toEqual(['c', 'b']);
		expect(component.value.c).toBe('1');
		editor.deleteProperty(event(), 'b');
		expect(component.value).toEqual({ c: '1' });
	});

	it('does not overwrite existing properties', () => {
		const { editor, component } = render(mapSchema, { a: '1', b: '2' });
		editor.propertyToAdd = 'a';
		editor.addProperty(event());
		expect(editor.noItemToAdd).toBe(true);
		editor.changeProperty('b', 'a');
		expect(component.value).toEqual({ a: '1', b: '2' });
		expect(Object.keys(component.value)).toEqual(['a', 'b']);
	});

	it('requires a name for new properties', () => {
		const { editor, component } = render(mapSchema, {});
		editor.addProperty(event());
		expect(editor.noItemToAdd).toBe(true);
		expect(component.value).toEqual({});
	});

	it('deCamelizes property names', () => {
		const { editor } = render(mapSchema, {});
		expect(editor.deCamelize('termsOfService')).toBe('Terms Of Service');
	});
});
