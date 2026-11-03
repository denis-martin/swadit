import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { DefinitionEditComponent } from './definition-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('DefinitionEditComponent', () => {
	describe.each([ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const)('%s', (api) => {
		const render = (key: string = null) => {
			const r = renderComponent(DefinitionEditComponent, { imports: [EditorModalsModule], api: loadFixture(api), detectChanges: false });
			r.component.key = key;
			r.component.obj = key ? r.apis.getComponents('schemas')[key] : {};
			r.fixture.detectChanges();
			return { ...r, schemas: () => r.apis.getComponents('schemas') };
		};

		it('renders the schema editor for an existing definition', () => {
			const { element } = render('Pet');
			expect((element.querySelector('#definitionKey') as HTMLInputElement)).toBeTruthy();
			expect(element.querySelector('swadit-swagger-schema-editor')).toBeTruthy();
			expect(element.textContent).toContain('Delete');
		});

		it('adds a new definition', async () => {
			const { component, apis, schemas } = render();
			component.key = ' New ';
			component.obj['type'] = 'string';
			component.ok();
			expect(schemas().New).toEqual({ type: 'string' });
			expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('does not change a definition that is applied without modifications', () => {
			const { component, schemas } = render('Pet');
			const orig = _cloneDeep(schemas().Pet);
			component.ok();
			expect(component.errorStr).toBe('');
			expect(schemas().Pet).toEqual(orig);
		});

		it('validates key and type', () => {
			const { component, schemas } = render();
			component.ok();
			expect(component.errorStr).toBe('Please enter a key name.');
			component.key = 'Pet';
			component.ok();
			expect(component.errorStr).toBe('Key name already exists.');
			component.key = 'New';
			component.ok();
			expect(component.errorStr).toBe('Please enter a type or $ref.');
			expect(schemas().New).toBeUndefined();
		});

		it('renames a definition and updates all references to it', async () => {
			const { component, apis, schemas } = render('Category');
			component.key = 'PetCategory';
			component.ok();
			expect(schemas().Category).toBeUndefined();
			expect(schemas().PetCategory).toBeTruthy();
			expect(schemas().Pet.properties.category).toEqual({ '$ref': apis.componentRef('schemas', 'PetCategory') });
			expect(apis.resolveRef(schemas().Pet.properties.category['$ref'])).toBe(schemas().PetCategory);
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('deletes a definition', () => {
			const { component, schemas } = render('Order');
			component.deleteDefinition();
			expect(schemas().Order).toBeUndefined();
		});
	});

	describe('OAS3', () => {
		const renderOas3 = (key: string = null) => {
			const r = renderComponent(DefinitionEditComponent, { imports: [EditorModalsModule], api: loadFixture('featuresOas3Yaml'), detectChanges: false });
			r.component.key = key;
			r.component.obj = key ? r.apis.current.components.schemas[key] : {};
			r.fixture.detectChanges();
			return r;
		};

		it('adds a schema component', async () => {
			const { component, apis } = renderOas3();
			component.key = 'Tag';
			component.obj['type'] = 'string';
			component.obj['nullable'] = true;
			component.ok();
			expect(component.errorStr).toBe('');
			expect(apis.current.components.schemas.Tag).toEqual({ type: 'string', nullable: true });
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('accepts composite schemas and keeps properties of schemas without type', async () => {
			const { component, apis } = renderOas3();
			component.key = 'Value';
			component.obj['oneOf'] = [ { type: 'string' }, { '$ref': '#/components/schemas/Item' } ];
			component.ok();
			expect(component.errorStr).toBe('');
			expect(apis.current.components.schemas.Value).toEqual({ oneOf: [ { type: 'string' }, { '$ref': '#/components/schemas/Item' } ] });
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();

			TestBed.resetTestingModule();
			const pet = renderOas3('Pet');
			const orig = _cloneDeep(pet.apis.current.components.schemas.Pet);
			pet.component.ok();
			expect(pet.component.errorStr).toBe('');
			expect(pet.apis.current.components.schemas.Pet).toEqual(orig);
		});

		it('renames schema components and updates the references', async () => {
			const { component, apis } = renderOas3('Item');
			component.key = 'Thing';
			component.ok();
			expect(apis.current.components.schemas.Item).toBeUndefined();
			expect(apis.current.components.schemas.Thing).toBeTruthy();
			expect(apis.current.components.requestBodies.Item.content['application/json'].schema).toEqual({ '$ref': '#/components/schemas/Thing' });
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
			component.key_orig = 'Thing';
			component.deleteDefinition();
			expect(apis.current.components.schemas.Thing).toBeUndefined();
		});

		it('does not allow to use an existing name', () => {
			const { component } = renderOas3();
			component.key = 'Pet';
			component.obj['type'] = 'object';
			component.ok();
			expect(component.errorStr).toBe('Key name already exists.');
		});
	});
});
