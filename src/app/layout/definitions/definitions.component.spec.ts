import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DefinitionsModule } from './definitions.module';
import { DefinitionsComponent } from './definitions.component';
import { DefinitionEditComponent } from '../../shared/modules/editor-modals/definition-edit/definition-edit.component';
import { loadFixture, renderComponent, setCurrentApi } from 'testing/test-helpers';

describe('DefinitionsComponent', () => {
	const render = (api?: any) => renderComponent(DefinitionsComponent, { imports: [DefinitionsModule], api });
	const tabs = (element: HTMLElement) => Array.from(element.querySelectorAll('.nav-link')).map(e => e.textContent.replace(/\s+/g, ' ').trim());
	const cards = (element: HTMLElement) => Array.from(element.querySelectorAll('.card-header .preview')).map(e => e.textContent.trim().split(/\s+/)[0]);

	it('lists the definitions (OAS2)', () => {
		const { element, component } = render();
		expect(component.defCat).toBe('definitions');
		expect(tabs(element)).toEqual(['definitions 6', 'parameters', 'responses']);
		expect(cards(element)).toEqual(['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse']);
	});

	it('lists the component schemas (OAS3)', () => {
		const { element, component } = render(loadFixture('minimalOas3Yaml'));
		expect(component.defCat).toBe('schemas');
		expect(tabs(element)).toEqual(['schemas 2', 'responses 1', 'parameters 1']);
		expect(cards(element)).toEqual(['Item', 'Tag']);
	});

	it('switches the category when another API is loaded', () => {
		const { fixture, component, apis } = render(loadFixture('minimalOas3Yaml'));
		setCurrentApi(apis, loadFixture('petstoreYaml'));
		fixture.detectChanges();
		expect(component.defCat).toBe('definitions');
	});

	it('shows the details of a definition', () => {
		const { fixture, element } = render();
		(element.querySelector('.card-header') as HTMLElement).click();
		fixture.detectChanges();
		expect(element.querySelector('swadit-swagger-schema-view')).toBeTruthy();
	});

	it('shows parameters and responses', () => {
		const api = loadFixture('petstoreYaml');
		api.parameters = { Limit: { name: 'limit', in: 'query', type: 'integer' } };
		api.responses = { NotFound: { description: 'nf' } };
		const { fixture, component, element } = render(api);
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

	it('opens the editor for a definition', () => {
		const { component, apis } = render();
		const modalRef: any = { componentInstance: {}, result: new Promise(() => undefined) };
		const open = vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(modalRef);
		component.edit(null, 'Pet');
		expect(open).toHaveBeenCalledWith(DefinitionEditComponent, DefinitionEditComponent.modalOptions);
		expect(modalRef.componentInstance.obj).toBe(apis.current.definitions.Pet);
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
