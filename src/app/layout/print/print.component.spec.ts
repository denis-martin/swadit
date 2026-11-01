import { PrintModule } from './print.module';
import { PrintComponent } from './print.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('PrintComponent', () => {
	it('shows the dereferenced API', async () => {
		const { fixture, component, element } = renderComponent(PrintComponent, { imports: [PrintModule] });
		expect(element.textContent).toContain('Validating API');
		await vi.waitFor(() => expect(component.api).toBeTruthy());
		fixture.detectChanges();
		expect(element.querySelector('#contentToPrint h1').textContent).toContain('Swagger Petstore');
		expect(element.querySelectorAll('schema-print-view').length).toBeGreaterThan(0);
		// the dereferenced copy is used, the current API is not changed
		expect(component.api).not.toBe(component.apis.current);
	});

	it('shows validation errors', async () => {
		const api = loadFixture('petstoreYaml');
		api.paths['/pet'].post.responses = 'invalid';
		const { fixture, component, element } = renderComponent(PrintComponent, { imports: [PrintModule], api });
		await vi.waitFor(() => expect(component.err).toBeTruthy());
		fixture.detectChanges();
		expect(element.textContent).toContain('Swagger validation error');
	});

	it('creates anchors for paths', () => {
		const { component } = renderComponent(PrintComponent, { imports: [PrintModule] });
		expect(component.getPathAnchor('/pet/{petId}')).toBe('-pet-{petId}');
	});
});
