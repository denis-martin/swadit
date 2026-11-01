import { PrintModule } from '../print.module';
import { SchemaPrintViewComponent } from './schema-print-view.component';
import { renderComponent } from 'testing/test-helpers';

describe('SchemaPrintViewComponent', () => {
	const schema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string' },
			category: { type: 'object', properties: { id: { type: 'integer' } } },
			tags: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' } } } }
		}
	};

	it('flattens nested properties', () => {
		const { component } = renderComponent(SchemaPrintViewComponent, { imports: [PrintModule], props: { schema, type: 'Request' } });
		expect(component.flatProperties.map(p => [p['prop'], p['level'], p['required']])).toEqual([
			['name', 0, true], ['category', 0, false], ['id', 1, false], ['tags', 0, false], ['label', 1, false]
		]);
		expect(component.example).toContain('"label": "string"');
	});

	it('flattens the items of arrays', () => {
		const { component } = renderComponent(SchemaPrintViewComponent, { imports: [PrintModule],
			props: { schema: { type: 'array', items: schema }, type: 'Response' } });
		expect(component.flatProperties.length).toBe(5);
	});
});
