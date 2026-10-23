import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { DefinitionEditComponent } from './definition-edit.component';
import { renderComponent } from 'testing/test-helpers';

describe('DefinitionEditComponent', () => {
	const render = (key: string = null) => {
		const r = renderComponent(DefinitionEditComponent, { imports: [EditorModalsModule], detectChanges: false });
		r.component.key = key;
		r.component.obj = key ? r.apis.current.definitions[key] : {};
		r.fixture.detectChanges();
		return r;
	};

	it('renders the schema editor for an existing definition', () => {
		const { element } = render('Pet');
		expect((element.querySelector('#definitionKey') as HTMLInputElement)).toBeTruthy();
		expect(element.querySelector('swadit-swagger-schema-editor')).toBeTruthy();
		expect(element.textContent).toContain('Delete');
	});

	it('adds a new definition', () => {
		const { component, apis } = render();
		component.key = ' New ';
		component.obj['type'] = 'string';
		component.ok();
		expect(apis.current.definitions.New).toEqual({ type: 'string' });
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
	});

	it('does not change a definition that is applied without modifications', () => {
		const { component, apis } = render('Pet');
		const orig = _cloneDeep(apis.current.definitions.Pet);
		component.ok();
		expect(component.errorStr).toBe('');
		expect(apis.current.definitions.Pet).toEqual(orig);
	});

	it('validates key and type', () => {
		const { component, apis } = render();
		component.ok();
		expect(component.errorStr).toBe('Please enter a key name.');
		component.key = 'Pet';
		component.ok();
		expect(component.errorStr).toBe('Key name already exists.');
		component.key = 'New';
		component.ok();
		expect(component.errorStr).toBe('Please enter a type or $ref.');
		expect(apis.current.definitions.New).toBeUndefined();
	});

	it('renames a definition and updates all references to it', () => {
		const { component, apis } = render('Category');
		component.key = 'PetCategory';
		component.ok();
		expect(apis.current.definitions.Category).toBeUndefined();
		expect(apis.current.definitions.PetCategory).toBeTruthy();
		expect(apis.current.definitions.Pet.properties.category).toEqual({ '$ref': '#/definitions/PetCategory' });
		expect(apis.resolveRef(apis.current.definitions.Pet.properties.category['$ref'])).toBe(apis.current.definitions.PetCategory);
	});

	it('deletes a definition', () => {
		const { component, apis } = render('Order');
		component.deleteDefinition();
		expect(apis.current.definitions.Order).toBeUndefined();
	});
});
