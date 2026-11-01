import { TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { EditorModalsModule } from '../editor-modals.module';
import { ConfirmComponent } from './confirm.component';
import { renderComponent } from 'testing/test-helpers';

describe('ConfirmComponent', () => {
	it('shows the text and buttons', () => {
		const { element } = renderComponent(ConfirmComponent, { imports: [EditorModalsModule],
			props: { text: 'Delete 2 paths?', okText: 'Yes', cancelText: 'No' } });
		expect(element.textContent).toContain('Delete 2 paths?');
		const buttons = Array.from(element.querySelectorAll('button')).map(b => b.textContent.trim());
		expect(buttons).toEqual(['Yes', 'No']);
	});

	it('hides the cancel button if there is no cancel text', () => {
		const { element } = renderComponent(ConfirmComponent, { imports: [EditorModalsModule],
			props: { text: 'Done', okText: 'Ok', cancelText: null } });
		expect(element.querySelectorAll('button').length).toBe(1);
	});

	it('closes with "ok"', () => {
		const { component } = renderComponent(ConfirmComponent, { imports: [EditorModalsModule] });
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
	});

	it('open() passes the texts to the modal', async () => {
		renderComponent(ConfirmComponent, { imports: [EditorModalsModule] });
		const modalRef: any = { componentInstance: {}, result: Promise.resolve('ok') };
		vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(modalRef);
		await expect(ConfirmComponent.open(TestBed.inject(NgbModal), 'Text', 'Ok', null)).resolves.toBe('ok');
		expect(modalRef.componentInstance).toEqual({ text: 'Text', okText: 'Ok', cancelText: null });
	});
});
