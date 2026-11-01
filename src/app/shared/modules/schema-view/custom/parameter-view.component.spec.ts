import { SchemaViewModule } from '../schema-view.module';
import { ParameterViewComponent } from './parameter-view.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ParameterViewComponent', () => {
	const render = (obj: any, api?: any) => renderComponent(ParameterViewComponent, { imports: [SchemaViewModule], props: { obj }, api });

	it.each([
		[ 'OAS2', 'petstoreOas2Yaml', { type: 'integer' } ],
		[ 'OAS3', 'petstoreOas3Yaml', { schema: { type: 'integer' } } ]
	] as const)('shows parameters (%s)', async (version, api, type) => {
		const { fixture, element } = render({ name: 'petId', in: 'path', required: true, ...type, description: 'The ID' }, loadFixture(api));
		expect(element.querySelector('swadit-schema-view')).toBeTruthy();
		expect(element.textContent).toContain('petId');
		expect(element.textContent).toContain('integer');
		// markdown is rendered asynchronously
		await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain('The ID'));
	});

	it('shows body parameters with a generated example (OAS2)', () => {
		const { fixture, element } = render({ name: 'body', in: 'body', schema: { '$ref': '#/definitions/Tag' } }, loadFixture('petstoreOas2Yaml'));
		expect(element.textContent).toContain('Example (generated)');
		fixture.componentInstance.showGeneratedExample = false;
		fixture.detectChanges();
		expect(fixture.componentInstance.generateExample({ '$ref': '#/definitions/Tag' })).toBe('{\n  "id": 0,\n  "name": "string"\n}');
	});

	it('shows OAS3 parameters with content', () => {
		const { element } = render({
			name: 'filter', in: 'query',
			content: { 'application/json': { schema: { type: 'object' }, example: { a: 1 } } }
		}, loadFixture('minimalOas3Yaml'));
		expect(element.textContent).toContain('application/json');
		expect(element.textContent).toContain('Example:');
	});

	it('shows the examples of OAS3 parameters', () => {
		const api = loadFixture('featuresOas3Yaml');
		const { element } = render(api.paths['/items'].get.parameters[0], api);
		expect(element.textContent).toContain('Examples:');
		expect(element.textContent).toContain('simple:');
	});
});
