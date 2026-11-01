import { SwadocModule } from './swadoc.module';
import { SwadocComponent } from './swadoc.component';
import { renderComponent } from 'testing/test-helpers';

describe('SwadocComponent', () => {
	beforeEach(() => {
		URL.createObjectURL = vi.fn(() => 'blob:x');
		URL.revokeObjectURL = vi.fn();
	});

	it('provides the current API to the print preview', () => {
		const { apis, element } = renderComponent(SwadocComponent, { imports: [SwadocModule] });
		expect(element.querySelector('iframe#swadocFrame')).toBeTruthy();
		expect(window['Swadit']).toBe(apis);
		expect(apis.blob).toBeTruthy();
	});

	it('sends a newly loaded API to the print preview', () => {
		const { apis, element } = renderComponent(SwadocComponent, { imports: [SwadocModule] });
		document.body.appendChild(element);
		const frame = element.querySelector('iframe') as HTMLIFrameElement;
		const openFile = vi.fn();
		frame.contentWindow['Swadoc'] = { openFile };
		apis.newFile();
		expect(openFile).toHaveBeenCalledWith(null, apis.blob);
		element.remove();
	});

	it('does not fail if the print preview is not loaded or has been closed', () => {
		const { fixture, apis } = renderComponent(SwadocComponent, { imports: [SwadocModule] });
		expect(() => apis.newFile()).not.toThrow();
		fixture.destroy();
		vi.mocked(URL.createObjectURL).mockClear();
		apis.newFile();
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});
});
