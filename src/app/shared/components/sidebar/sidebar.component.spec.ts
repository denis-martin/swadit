import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { SidebarComponent } from './sidebar.component';
import { renderComponent } from 'testing/test-helpers';

describe('SidebarComponent', () => {
	const render = () => renderComponent(SidebarComponent, {
		imports: [ FormsModule, RouterModule, TranslatePipe ],
		declarations: [ SidebarComponent ]
	});
	const pathLinks = (element: HTMLElement) =>
		Array.from(element.querySelectorAll('a[style]')).map(e => e.textContent.trim());

	it('lists the paths sorted', () => {
		const { element, apis } = render();
		expect(pathLinks(element)).toEqual(Object.keys(apis.current.paths).sort());
		expect(element.querySelector('a[href="/path/%2Fpet"]')).toBeTruthy();
	});

	it('filters the paths', () => {
		const { fixture, component, element } = render();
		component.filterText = 'STORE';
		fixture.detectChanges();
		expect(pathLinks(element)).toEqual(['/store/inventory', '/store/order', '/store/order/{orderId}']);
	});

	it('expands and collapses the file menu', () => {
		const { fixture, component, element } = render();
		component.addExpandClass('file');
		fixture.detectChanges();
		expect(element.querySelector('.nested.expand')).toBeTruthy();
		component.addExpandClass('file');
		fixture.detectChanges();
		expect(element.querySelector('.nested.expand')).toBeNull();
	});

	it('shows only the configured footer links', () => {
		const { fixture, apis, element } = render();
		apis.config.termsOfUseLink = null;
		apis.config.privacyPolicyLink = null;
		apis.config.imprintLink = 'imprint.html';
		fixture.detectChanges();
		const links = Array.from(element.querySelectorAll('.footerLinks a')).map(e => e.textContent);
		expect(links).toEqual(['Support & Bug Reports', 'Licenses', 'Imprint']);
	});
});
