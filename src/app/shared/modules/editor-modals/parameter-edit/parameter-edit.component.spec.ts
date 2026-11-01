import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';

import { EditorModalsModule } from '../editor-modals.module';
import { ParameterEditComponent } from './parameter-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ParameterEditComponent', () => {
	const api = () => {
		const a = loadFixture('petstoreYaml');
		a.parameters = {
			Limit: { name: 'limit', in: 'query', type: 'integer' }
		};
		a.paths['/store/inventory'].get.parameters = [ { '$ref': '#/parameters/Limit' } ];
		return a;
	};
	const render = (props: Partial<ParameterEditComponent>) =>
		renderComponent(ParameterEditComponent, { imports: [EditorModalsModule], api: api(), props });

	it('renders the editor for non-body parameters', () => {
		const { element } = render({ obj: { name: 'q', in: 'query', type: 'string' } });
		expect(element.querySelector('#parameterKey')).toBeTruthy();
		expect(element.querySelector('swadit-object-editor')).toBeTruthy();
	});

	it('renders the reference selection in path mode', () => {
		const { element } = render({ pathMode: true, obj: {} });
		const options = Array.from(element.querySelectorAll('#refKey option')).map(o => o.textContent.trim());
		expect(options).toEqual(['(none)', 'Limit']);
	});

	it('adds a parameter definition', () => {
		const { component, apis } = render({ obj: {} });
		component.key = 'Offset';
		Object.assign(component.obj, { name: 'offset', in: 'query', type: 'integer', description: '' });
		component.ok();
		expect(component.errorStr).toBe('');
		expect(apis.current.parameters.Offset).toEqual({ name: 'offset', in: 'query', type: 'integer' });
	});

	it('validates required properties', () => {
		const { component, apis } = render({ obj: {} });
		component.key = 'Offset';
		Object.assign(component.obj, { in: 'query' });
		component.ok();
		expect(component.errorStr).toContain('Missing required properties: name');
		Object.assign(component.obj, { name: 'id', in: 'path', type: 'string' });
		component.ok();
		expect(component.errorStr).toBe("Path parameter must be 'required'.");
		component.key = 'Limit';
		component.ok();
		expect(component.errorStr).toBe('Key name already exists.');
		expect(apis.current.parameters.Offset).toBeUndefined();
	});

	it('cleans up body parameters', () => {
		const { component } = render({ pathMode: true, obj: {} });
		Object.assign(component.obj, { name: 'body', in: 'body', schema: { type: 'string', properties: {} } });
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({
			obj: { name: 'body', in: 'body', schema: { type: 'string' } },
			allMethods: false
		});
	});

	it('removes the properties of non-body parameters if the location is changed to body', () => {
		const { component } = render({ pathMode: true, obj: { name: 'p', in: 'query', type: 'string', format: 'date' } });
		Object.assign(component.obj, { in: 'body', schema: { type: 'string' }, 'x-ext': 1 });
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({
			obj: { name: 'p', in: 'body', schema: { type: 'string' }, 'x-ext': 1 },
			allMethods: false
		});
	});

	it('keeps only the $ref of referenced parameters', () => {
		const { component } = render({ pathMode: true, obj: {} });
		Object.assign(component.obj, { '$ref': '#/parameters/Limit', name: 'x' });
		component.ok();
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({
			obj: { '$ref': '#/parameters/Limit' },
			allMethods: false
		});
	});

	it('renames a parameter definition and updates all references to it', () => {
		const { component, apis } = renderComponent(ParameterEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
		component.key = 'Limit';
		component.obj = apis.current.parameters.Limit;
		component.ngOnInit();
		component.key = 'MaxItems';
		component.ok();
		expect(apis.current.parameters.Limit).toBeUndefined();
		expect(apis.current.parameters.MaxItems).toEqual({ name: 'limit', in: 'query', type: 'integer' });
		expect(apis.current.paths['/store/inventory'].get.parameters[0]).toEqual({ '$ref': '#/parameters/MaxItems' });
	});

	it('deletes a parameter definition', () => {
		const { component, apis } = render({});
		component.key_orig = 'Limit';
		component.deleteParameter();
		expect(apis.current.parameters.Limit).toBeUndefined();
	});
});
