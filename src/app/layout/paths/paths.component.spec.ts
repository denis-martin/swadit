import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { PathsModule } from './paths.module';
import { PathsComponent } from './paths.component';
import { ModifyComponent } from '../../shared/modules/editor-modals/modify/modify.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('PathsComponent', () => {
	const render = (api?: any) => renderComponent(PathsComponent, { imports: [PathsModule], api });
	const paths = (element: HTMLElement) => Array.from(element.querySelectorAll('.path')).map(e => e.textContent.split(/\s+/).filter(s => s)[0]);

	it('lists the paths with their methods', () => {
		const { element } = render();
		expect(paths(element)).toEqual(['/pet', '/pet/findByStatus', '/pet/findByTags', '/pet/{petId}', '/pet/{petId}/uploadImage',
			'/store/inventory', '/store/order', '/store/order/{orderId}']);
		const methods = element.querySelectorAll('.path')[0].querySelectorAll('.methodKey');
		expect(Array.from(methods).map(m => m.classList.contains('methodUnset'))).toEqual([true, false, false, true]);
	});

	it('filters and selects paths', () => {
		const { fixture, component, apis, element } = render();
		component.filterText = 'store';
		fixture.detectChanges();
		expect(paths(element).length).toBe(3);
		(element.querySelector('.path input[type=checkbox]') as HTMLInputElement).click();
		fixture.detectChanges();
		expect(apis.selectedPaths).toEqual({ '/store/inventory': true });
		expect(element.textContent).toContain('(1 selected)');
	});

	it('opens a path on double click', () => {
		const { element } = render();
		element.querySelector('.path').dispatchEvent(new Event('dblclick'));
		expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/path', '/pet']);
	});

	it('hides editing functions for OAS3', () => {
		const { element } = render(loadFixture('minimalOas3Yaml'));
		expect(element.querySelector('.edit-section')).toBeNull();
		expect(paths(element)).toEqual(['/items/{id}']);
	});

	it('deprecates the operations of the selected paths', async () => {
		const api = loadFixture('petstoreYaml');
		// non-operation keys first
		api.paths['/pet'] = { 'x-ext': 'value', parameters: [], ...api.paths['/pet'] };
		const { component, apis } = render(api);
		vi.spyOn(ModifyComponent, 'open').mockResolvedValue({ deprecationSet: true, deprecationRemove: false });
		apis.selectPath('/pet', null);
		component.modify(null);
		await vi.waitFor(() => expect(apis.current.paths['/pet'].post.deprecated).toBe(true));
		expect(apis.current.paths['/pet'].put.deprecated).toBe(true);
		expect(apis.current.paths['/pet']['x-ext']).toBe('value');
		expect(apis.current.paths['/store/order'].post.deprecated).toBeUndefined();

		vi.spyOn(ModifyComponent, 'open').mockResolvedValue({ deprecationSet: false, deprecationRemove: true });
		component.modify(null);
		await vi.waitFor(() => expect(apis.current.paths['/pet'].post.deprecated).toBeUndefined());
	});
});
