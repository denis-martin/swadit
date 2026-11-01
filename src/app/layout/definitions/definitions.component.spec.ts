import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DefinitionsModule } from './definitions.module';
import { DefinitionsComponent } from './definitions.component';
import { DefinitionEditComponent } from '../../shared/modules/editor-modals/definition-edit/definition-edit.component';
import { RequestBodyEditComponent } from '../../shared/modules/editor-modals/request-body-edit/request-body-edit.component';
import { loadFixture, renderComponent, setCurrentApi } from 'testing/test-helpers';

describe('DefinitionsComponent', () => {
	const render = (api?: any) => renderComponent(DefinitionsComponent, { imports: [DefinitionsModule], api });
	const tabs = (element: HTMLElement) => Array.from(element.querySelectorAll('.nav-link')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
	const cards = (element: HTMLElement) => Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.trim().split(/\s+/)[0]);

	it('lists the definitions (OAS2)', () => {
		const { element, component } = render(loadFixture('petstoreOas2Yaml'));
		expect(component.defCat).toBe('definitions');
		expect(tabs(element)).toEqual(['definitions 6', 'parameters', 'responses']);
		expect(cards(element)).toEqual(['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse']);
	});

	it('lists the component schemas (OAS3)', () => {
		const { element, component } = render();
		expect(component.defCat).toBe('schemas');
		expect(tabs(element)).toEqual(['schemas 6', 'responses', 'parameters', 'requestBodies']);
		expect(cards(element)).toEqual(['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse']);
	});

	it('counts the components of each type (OAS3)', () => {
		const { element, component } = render(loadFixture('minimalOas3Yaml'));
		expect(component.defCat).toBe('schemas');
		expect(tabs(element)).toEqual(['schemas 2', 'responses 1', 'parameters 1', 'requestBodies']);
		expect(cards(element)).toEqual(['Item', 'Tag']);
		expect(element.querySelector('.edit-subsection')).toBeTruthy();
	});

	it('shows only the editable types of components (OAS3)', () => {
		const { fixture, component, element } = render(loadFixture('featuresOas3Yaml'));
		// headers, examples, links and callbacks can only be edited in the source view
		expect(tabs(element)).toEqual(['schemas 2', 'responses', 'parameters', 'requestBodies 1']);
		component.defCat = 'requestBodies';
		fixture.detectChanges();
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(cards(element)).toEqual(['Item']);
		expect(element.querySelector('swadit-request-body-view').textContent).toContain('#/components/schemas/Item');
		expect(element.querySelector('.edit-card')).toBeTruthy();
		expect(element.querySelector('.edit-subsection')).toBeTruthy();
	});

	it('opens the editor of the component type (OAS3)', () => {
		const { component } = render(loadFixture('featuresOas3Yaml'));
		const modal = TestBed.inject(NgbModal);
		const open = vi.spyOn(modal, 'open').mockReturnValue({ componentInstance: {}, result: new Promise(() => undefined) } as any);
		component.defCat = 'requestBodies';
		component.edit(null, 'Item');
		expect(open).toHaveBeenCalledWith(RequestBodyEditComponent, RequestBodyEditComponent.modalOptions);
		expect(open.mock.results[0].value.componentInstance).toEqual({ key: 'Item', obj: component.apis.current.components.requestBodies.Item });
		component.defCat = 'schemas';
		component.edit(null);
		expect(open).toHaveBeenLastCalledWith(DefinitionEditComponent, DefinitionEditComponent.modalOptions);
	});

	it('switches the category when another API is loaded', () => {
		const { fixture, component, apis } = render();
		setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
		fixture.detectChanges();
		expect(component.defCat).toBe('definitions');
		setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
		fixture.detectChanges();
		expect(component.defCat).toBe('schemas');
	});

	it('shows the details of a definition', () => {
		const { fixture, element } = render();
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-swagger-schema-view')).toBeTruthy();
	});

	it.each([
		[ 'OAS2', () => {
			const api = loadFixture('petstoreOas2Yaml');
			api.parameters = { Limit: { name: 'limit', in: 'query', type: 'integer' } };
			api.responses = { NotFound: { description: 'nf' } };
			return api;
		} ],
		[ 'OAS3', () => {
			const api = loadFixture('petstoreOas3Yaml');
			api.components.parameters = { Limit: { name: 'limit', in: 'query', schema: { type: 'integer' } } };
			api.components.responses = { NotFound: { description: 'nf' } };
			return api;
		} ]
	])('shows parameters and responses (%s)', (version, createApi) => {
		const { fixture, component, element } = render(createApi());
		component.defCat = 'parameters';
		fixture.detectChanges();
		expect(element.querySelector('.headerType').textContent).toContain('in query');
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-parameter-view')).toBeTruthy();
		component.defCat = 'responses';
		fixture.detectChanges();
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-response-view')).toBeTruthy();
	});

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', (api: any) => api.definitions ],
		[ 'OAS3', 'petstoreOas3Yaml', (api: any) => api.components.schemas ]
	] as const)('opens the editor for a definition (%s)', (version, fixture, schemas) => {
		const { component, apis } = render(loadFixture(fixture));
		const modalRef: any = { componentInstance: {}, result: new Promise(() => undefined) };
		const open = vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(modalRef);
		component.edit(null, 'Pet');
		expect(open).toHaveBeenCalledWith(DefinitionEditComponent, DefinitionEditComponent.modalOptions);
		expect(modalRef.componentInstance.obj).toBe(schemas(apis.current).Pet);
		expect(modalRef.componentInstance.key).toBe('Pet');
	});

	it('stops listening to API changes when destroyed', () => {
		const { fixture, component, apis } = render();
		const spy = vi.spyOn(component, 'initDefCat');
		fixture.destroy();
		apis.newFile();
		expect(spy).not.toHaveBeenCalled();
	});
});
