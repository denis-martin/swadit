import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EditorModalsModule } from '../editor-modals.module';
import { ModifyComponent } from './modify.component';
import { renderComponent } from 'testing/test-helpers';

describe('ModifyComponent', () => {
	it('shows the number of paths', () => {
		const { element } = renderComponent(ModifyComponent, { imports: [EditorModalsModule], props: { pathCount: 3 } });
		expect(element.textContent).toContain('3');
	});

	it('closes with the chosen modification', () => {
		const { component } = renderComponent(ModifyComponent, { imports: [EditorModalsModule] });
		component.deprecate(true);
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({ deprecationSet: true, deprecationRemove: false });
		component.deprecate(false);
		expect(component.params).toEqual({ deprecationSet: false, deprecationRemove: true });
	});
});
