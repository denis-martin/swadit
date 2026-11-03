import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SchemaEditorModule } from '../schema-editor.module';
import { SecurityEditorComponent } from './security-editor.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

@Component({
	template: `<swadit-security-editor [schema]="schema" [(obj)]="value" [id]="'security'"
		[securityDefinitions]="securityDefinitions"></swadit-security-editor>`,
	imports: [SchemaEditorModule]
})
class HostComponent {
	schema: any = {};
	value: any;
	securityDefinitions: any;
}

describe('SecurityEditorComponent', () => {
	const event = () => new Event('click');
	const render = (value: any, api?: any) => {
		const r = renderComponent(HostComponent, { detectChanges: false, api });
		Object.assign(r.component, {
			schema: r.apis.schemas.security,
			// security definitions (OAS2) or security schemes (OAS3)
			securityDefinitions: r.apis.getComponents('securitySchemes'),
			value
		});
		r.fixture.detectChanges();
		return { ...r, editor: r.fixture.debugElement.query(By.directive(SecurityEditorComponent)).componentInstance as SecurityEditorComponent };
	};

	const versions = [ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const;

	it.each(versions)('renders the security requirements with their scopes (%s)', (api) => {
		const { element } = render([ { petstore_auth: ['write:pets'] }, { unknown: [] } ], loadFixture(api));
		const selects = element.querySelectorAll<HTMLSelectElement>('select#security');
		// one per known requirement + one to add a requirement
		expect(selects.length).toBe(2);
		expect(Array.from(selects[1].options).map(o => o.textContent)).toEqual(['petstore_auth', 'api_key']);
		// unknown requirements are shown in red
		expect((element.querySelector('input[type=text]') as HTMLInputElement).style.color).toBe('red');
		expect(element.querySelectorAll('swadit-array-editor').length).toBe(2);
	});

	it.each(versions)('offers the scopes of the security definition (%s)', (api) => {
		const { editor } = render([], loadFixture(api));
		expect(editor.scopes('petstore_auth')['items']['enum']).toEqual(['write:pets', 'read:pets']);
		expect(editor.scopes('api_key')['items']['enum']).toEqual([]);
		expect(editor.scopes('unknown')['items']['enum']).toEqual([]);
	});

	it('adds, renames and deletes requirements', () => {
		const { editor, component } = render([]);
		editor.propertyToAdd = 'api_key';
		editor.addProperty(event());
		expect(component.value).toEqual([ { api_key: [] } ]);
		editor.changeProperty('petstore_auth', 0, 'api_key');
		expect(component.value).toEqual([ { petstore_auth: [] } ]);
		editor.deleteItem(event(), 0);
		expect(component.value).toEqual([]);
	});

	it('creates the array if there is none yet', () => {
		const { editor, component } = render(undefined);
		editor.propertyToAdd = 'api_key';
		editor.addProperty(event());
		expect(component.value).toEqual([ { api_key: [] } ]);
	});

	it('offers the scopes of all OAuth flows of a security scheme (OAS3)', () => {
		const { editor, element } = render([], loadFixture('featuresOas3Yaml'));
		expect(editor.scopes('oauth')['items']['enum']).toEqual(['read', 'write']);
		expect(editor.scopes('key')['items']['enum']).toEqual([]);
		const options = Array.from(element.querySelector<HTMLSelectElement>('select#security').options).map(o => o.textContent);
		expect(options).toEqual(['key', 'basic', 'bearer', 'oauth', 'oidc']);
	});
});
