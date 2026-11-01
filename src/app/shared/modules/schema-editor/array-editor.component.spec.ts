import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SchemaEditorModule } from './schema-editor.module';
import { ArrayEditorComponent } from './array-editor.component';
import { renderComponent } from 'testing/test-helpers';

@Component({
	template: `<swadit-array-editor [schema]="schema" [(obj)]="value" [id]="'a'"></swadit-array-editor>`,
	imports: [SchemaEditorModule]
})
class HostComponent {
	schema: any = { type: 'array', items: { type: 'string' } };
	value: any;
}

describe('ArrayEditorComponent', () => {
	const event = () => new Event('click');
	const render = (schema: any, value: any) => {
		const r = renderComponent(HostComponent, { props: { schema, value } });
		return { ...r, editor: r.fixture.debugElement.query(By.directive(ArrayEditorComponent)).componentInstance as ArrayEditorComponent };
	};

	it('renders an input for each item and one to add an item', () => {
		const { element } = render({ type: 'array', items: { type: 'string' } }, ['a', 'b']);
		expect(element.querySelectorAll('input').length).toBe(3);
	});

	it('adds, moves and deletes items', () => {
		const { editor, component } = render({ type: 'array', items: { type: 'string' } }, ['a', 'b']);
		editor.itemToAdd = 'c';
		editor.addItem(event());
		expect(component.value).toEqual(['a', 'b', 'c']);
		editor.moveItemUp(event(), 2);
		expect(component.value).toEqual(['a', 'c', 'b']);
		editor.moveItemDown(event(), 0);
		expect(component.value).toEqual(['c', 'a', 'b']);
		editor.moveItemDown(event(), 2);
		expect(component.value).toEqual(['c', 'a', 'b']);
		editor.deleteItem(event(), 1);
		expect(component.value).toEqual(['c', 'b']);
	});

	it('does not add empty items', () => {
		const { editor, component } = render({ type: 'array', items: { type: 'string' } }, []);
		editor.addItem(event());
		expect(editor.noItemToAdd).toBe(true);
		expect(component.value).toEqual([]);
	});

	it('does not add duplicates to arrays with unique items', () => {
		const { editor, component } = render({ type: 'array', uniqueItems: true, items: { type: 'string' } }, ['a']);
		editor.itemToAdd = 'a';
		editor.addItem(event());
		expect(editor.noItemToAdd).toBe(true);
		expect(component.value).toEqual(['a']);
	});

	it('creates the array if there is none yet', () => {
		const { fixture, editor, component } = render({ type: 'array', items: { type: 'string' } }, undefined);
		fixture.detectChanges();
		editor.itemToAdd = 'a';
		editor.addItem(event());
		expect(component.value).toEqual(['a']);
	});

	it('resolves refs to the items schema', () => {
		const { editor } = render({ type: 'array', items: { '$ref': '#/definitions/tag' } }, []);
		expect(editor.itemsSchema['type']).toBe('object');
		expect(editor.itemToAdd).toEqual(expect.objectContaining({ externalDocs: expect.any(Object) }));
	});
});
