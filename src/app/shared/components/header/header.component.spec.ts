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
		Array.from(element.querySelectorAll('.dropdown-item')).map(e => e.textContent.replace('ALPHA', '').trim());

	it('shows the title of the API', () => {
		const { element } = render();
		expect(element.querySelector('.navbar-brand').textContent).toContain('Swagger Petstore');
	});

	it('shows the file menu (OAS2)', () => {
		const { element } = render();
		expect(menuItems(element)).toEqual(['New', 'Open', 'Add', 'Download', 'Convert to OAS 3', 'Source', 'Print Preview', 'Swagger UI']);
	});

	it('hides the functions that are not available for OAS3', () => {
		const { element } = render(loadFixture('minimalOas3Yaml'));
		expect(menuItems(element)).toEqual(['New', 'Open', 'Download', 'Source', 'Swagger UI']);
		expect(element.textContent).toContain('ALPHA');
	});

	it('hides menu items and shows the catalog as configured', () => {
		const { fixture, apis, element } = render();
		apis.config.menu.hideItems.new = true;
		apis.config.menu.hideItems.convertOas2to3 = true;
		apis.config.catalog = [ { title: 'Other API', path: 'other.yaml' } ];
		fixture.detectChanges();
		expect(menuItems(element)).toEqual(['Other API', 'Open', 'Add', 'Download', 'Source', 'Print Preview', 'Swagger UI']);
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
