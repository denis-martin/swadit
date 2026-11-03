import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from './header.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('HeaderComponent', () => {
	const render = (api?: any) => renderComponent(HeaderComponent, {
		imports: [ NgbDropdownModule, RouterModule, TranslatePipe ],
		declarations: [ HeaderComponent ],
		api
	});
	const menuItems = (element: HTMLElement) =>
		Array.from(element.querySelectorAll('.dropdown-item')).map(e => e.textContent.trim());
	const menuItem = (element: HTMLElement, text: string) =>
		Array.from(element.querySelectorAll('.dropdown-item')).find(e => e.textContent.trim() == text) as HTMLElement;

	it('shows the title of the API with its major spec version', () => {
		const { element, fixture, apis } = render();
		expect(element.querySelector('.navbar-brand').textContent).toContain('Swagger Petstore');
		expect(element.querySelector('.spec-version').textContent).toBe('OAS3');
		expect(element.querySelector('.spec-version').getAttribute('title')).toBe('OpenAPI 3.0.3');
		apis.newFile('oas2');
		fixture.detectChanges();
		expect(element.querySelector('.spec-version').textContent).toBe('OAS2');
		expect(element.querySelector('.spec-version').getAttribute('title')).toBe('Swagger 2.0');
		expect(element.textContent).not.toContain('ALPHA');
	});

	it('shows the file menu (OAS2)', () => {
		const { element } = render(loadFixture('petstoreOas2Yaml'));
		expect(menuItems(element)).toEqual(['New (OAS3)', 'New (OAS2)', 'Open', 'Add', 'Download', 'Convert to OAS3', 'Source', 'Print Preview', 'Swagger UI']);
	});

	it('shows the file menu (OAS3)', () => {
		const { element } = render();
		expect(menuItems(element)).toEqual(['New (OAS3)', 'New (OAS2)', 'Open', 'Add', 'Download', 'Convert to OAS2', 'Source', 'Print Preview', 'Swagger UI']);
	});

	it('creates new OAS3 and OAS2 files', () => {
		const { apis, element } = render();
		vi.spyOn(apis, 'newFile');
		menuItem(element, 'New (OAS3)').click();
		expect(apis.newFile).toHaveBeenLastCalledWith('oas3');
		expect(apis.isOas3).toBe(true);
		menuItem(element, 'New (OAS2)').click();
		expect(apis.newFile).toHaveBeenLastCalledWith('oas2');
		expect(apis.isOas2).toBe(true);
	});

	it('converts between OAS2 and OAS3', () => {
		const { apis, element, fixture } = render();
		const toOas2 = vi.spyOn(apis, 'convertOas3To2').mockResolvedValue(undefined);
		menuItem(element, 'Convert to OAS2').click();
		expect(toOas2).toHaveBeenCalled();
		apis.newFile('oas2');
		fixture.detectChanges();
		const toOas3 = vi.spyOn(apis, 'convertOas2To3').mockImplementation(() => undefined);
		menuItem(element, 'Convert to OAS3').click();
		expect(toOas3).toHaveBeenCalled();
	});

	it('hides menu items and shows the catalog as configured', () => {
		const { fixture, apis, element } = render();
		apis.config.menu.hideItems.new = true;
		apis.config.menu.hideItems.convertOas3to2 = true;
		apis.config.catalog = [ { title: 'Other API', path: 'other.yaml' } ];
		fixture.detectChanges();
		expect(menuItems(element)).toEqual(['Other API', 'Open', 'Add', 'Download', 'Source', 'Print Preview', 'Swagger UI']);
		apis.config.menu.hideItems.convertOas2to3 = true;
		apis.newFile('oas2');
		fixture.detectChanges();
		expect(menuItems(element)).not.toContain('Convert to OAS3');
		vi.spyOn(apis, 'openFile').mockImplementation(() => undefined);
		(element.querySelector('.dropdown-item') as HTMLElement).click();
		expect(apis.openFile).toHaveBeenCalledWith('other.yaml');
	});

	it('toggles the sidebar', () => {
		const { component } = render();
		expect(component.isToggled()).toBe(false);
		component.toggleSidebar();
		expect(component.isToggled()).toBe(true);
		component.toggleSidebar();
	});
});
