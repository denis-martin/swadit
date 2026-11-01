import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LayoutModule } from './layout.module';
import { LayoutComponent } from './layout.component';
import { renderComponent } from 'testing/test-helpers';

describe('LayoutComponent', () => {
	it('shows header and sidebar', () => {
		const { element } = renderComponent(LayoutComponent, { imports: [LayoutModule] });
		expect(element.querySelector('app-header')).toBeTruthy();
		expect(element.querySelector('app-sidebar')).toBeTruthy();
		expect(element.textContent).toContain('Swagger Petstore');
	});

	it('shows the API info by default', () => {
		const { fixture } = renderComponent(LayoutComponent, { imports: [LayoutModule], detectChanges: false });
		const router = TestBed.inject(Router);
		vi.spyOn(router, 'url', 'get').mockReturnValue('/');
		fixture.detectChanges();
		expect(router.navigate).toHaveBeenCalledWith(['/api-info']);
	});
});
