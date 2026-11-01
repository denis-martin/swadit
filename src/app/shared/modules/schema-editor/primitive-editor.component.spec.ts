import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SchemaEditorModule } from './schema-editor.module';
import { PrimitiveEditorComponent } from './primitive-editor.component';
import { renderComponent } from 'testing/test-helpers';

@Component({
	template: `<swadit-primitive-editor [schema]="schema" [(obj)]="value" [id]="'p'"></swadit-primitive-editor>`,
	imports: [SchemaEditorModule]
})
class HostComponent {
	schema: any = { type: 'string' };
	value: any;
}

describe('PrimitiveEditorComponent', () => {
	const render = (schema: any, value: any) => {
		const r = renderComponent(HostComponent, { props: { schema, value } });
		return { ...r, editor: r.fixture.debugElement.query(By.directive(PrimitiveEditorComponent)).componentInstance };
	};

	it('edits strings', async () => {
		const { fixture, element, component } = render({ type: 'string', description: 'Name' }, 'a');
		await fixture.whenStable();
		const input = element.querySelector('input');
		expect(input.placeholder).toBe('Name');
		expect(input.value).toBe('a');
		input.value = 'b';
		input.dispatchEvent(new Event('input'));
		expect(component.value).toBe('b');
	});

	it('trims the entered value (TrimValueAccessor)', async () => {
		const { fixture, element, component } = render({ type: 'string' }, '');
		await fixture.whenStable();
		const input = element.querySelector('input');
		input.value = '  b  ';
		input.dispatchEvent(new Event('input'));
		expect(component.value).toBe('b');
		input.dispatchEvent(new Event('blur'));
		expect(input.value).toBe('b');
	});

	it('uses a textarea for multiline strings', () => {
		const { element } = render({ type: 'string', 'x-swadit-input-multiline': 3 }, '');
		expect(element.querySelector('textarea').rows).toBe(3);
	});

	it('uses a select for enums', () => {
		const { element } = render({ type: 'string', enum: ['http', 'https'] }, 'https');
		expect(Array.from(element.querySelectorAll('option')).map(o => o.textContent)).toEqual(['http', 'https']);
	});

	it('uses a highlighted input for values not in the enum', () => {
		const { element } = render({ type: 'string', enum: ['http', 'https'] }, 'ftp');
		expect(element.querySelector('select')).toBeNull();
		expect(element.querySelector('input').style.color).toBe('red');
	});

	it('edits booleans', async () => {
		const { fixture, element, component } = render({ type: 'boolean' }, undefined);
		await fixture.whenStable();
		const select = element.querySelector('select');
		expect(select.options.length).toBe(3);
		select.value = select.options[1].value;
		select.dispatchEvent(new Event('change'));
		expect(component.value).toBe(true);
	});

	it('shows the default of booleans without setting it', () => {
		const { element, component, editor } = render({ type: 'boolean', default: false }, undefined);
		expect(element.querySelector('select').options.length).toBe(2);
		expect(editor.obj).toBe(false);
		expect(component.value).toBeUndefined();
	});
});
