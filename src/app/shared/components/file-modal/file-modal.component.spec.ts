import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FileModalComponent } from './file-modal.component';
import { renderComponent } from 'testing/test-helpers';

describe('FileModalComponent', () => {
	const render = (props: Partial<FileModalComponent>) => renderComponent(FileModalComponent, {
		imports: [ FormsModule, RouterModule ],
		declarations: [ FileModalComponent ],
		props
	});
	const submit = (element: HTMLElement) => element.querySelector('button[type=submit]') as HTMLButtonElement;

	it('opens the chosen file', () => {
		const { fixture, component, element } = render({ dialogType: 'fileOpen' });
		expect(component.modalTitle).toBe('Open file...');
		expect(submit(element).disabled).toBe(true);
		const files = [ new File(['x'], 'x.yaml') ];
		component.onFileChange({ target: { files } } as any);
		fixture.detectChanges();
		expect(submit(element).disabled).toBe(false);
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({ files, addSource: false });
	});

	it('requires a file name for downloads and shows validation errors', () => {
		const { fixture, component, element } = render({ dialogType: 'fileDownload', fileName: 'swagger.yaml' });
		expect(component.modalTitle).toBe('Download file...');
		expect(submit(element).disabled).toBe(false);
		component.fileName = '';
		fixture.detectChanges();
		expect(submit(element).disabled).toBe(true);
		component.fileName = 'swagger.yaml';
		component.validationErrors = true;
		fixture.detectChanges();
		expect(element.textContent).toContain('There are validation errors.');
	});
});
