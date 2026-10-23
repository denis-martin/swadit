import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { PathEditComponent } from './path-edit.component';
import { renderComponent } from 'testing/test-helpers';

describe('PathEditComponent', () => {
	const render = (props: Partial<PathEditComponent>) => renderComponent(PathEditComponent, { imports: [EditorModalsModule], props });

	it('renders the operation editor', () => {
		const { element } = render({ pathKey: '/pet', methodKey: 'post', obj: {} });
		expect(element.querySelector('#methodKey')).toBeTruthy();
		expect(element.querySelector('#pathKey')).toBeTruthy();
		expect(element.querySelector('swadit-schema-editor')).toBeTruthy();
	});

	it('adds a new path with a default response', () => {
		const { component, apis } = render({ pathKey: null, methodKey: null, obj: {} });
		component.pathKey = ' /new ';
		component.methodKey = 'get';
		component.obj['summary'] = 'New';
		component.ok();
		expect(component.errorStr).toBe('');
		expect(apis.current.paths['/new']).toEqual({
			get: { summary: 'New', responses: { default: { description: 'Default' } } }
		});
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith({ path: '/new', method: 'get' });
	});

	it('does not change an operation that is applied without modifications', () => {
		const { component, apis } = render({});
		const orig = _cloneDeep(apis.current.paths['/pet'].post);
		component.pathKey = '/pet';
		component.methodKey = 'post';
		component.obj = apis.current.paths['/pet'].post;
		component.ngOnInit();
		component.ok();
		expect(component.errorStr).toBe('');
		// empty optional values are removed
		delete orig['description'];
		expect(apis.current.paths['/pet'].post).toEqual(orig);
	});

	it('adds a method to an existing path', () => {
		const { component, apis } = render({ pathKey: '/pet', methodKey: null, obj: {} });
		component.methodKey = 'get';
		component.ok();
		expect(apis.current.paths['/pet'].get).toBeTruthy();
		expect(apis.current.paths['/pet'].post).toBeTruthy();
	});

	it('renames a path and keeps its methods', () => {
		const { component, apis } = renderComponent(PathEditComponent, { imports: [EditorModalsModule], detectChanges: false });
		Object.assign(component, { pathKey: '/pet', methodKey: 'put', obj: apis.current.paths['/pet'].put });
		component.ngOnInit();
		component.pathKey = '/pets';
		component.ok();
		expect(apis.current.paths['/pet']).toBeUndefined();
		expect(Object.keys(apis.current.paths['/pets'])).toEqual(['post', 'put']);
	});

	it('validates the path and method', () => {
		const { component, apis } = render({ pathKey: null, methodKey: null, obj: {} });
		component.pathKey = '';
		component.methodKey = 'get';
		component.ok();
		expect(component.errorStr).toBe('Please enter a path.');
		component.pathKey = 'new';
		component.ok();
		expect(component.errorStr).toBe("Path must start with '/'.");
		component.pathKey = '/pet';
		component.ok();
		expect(component.errorStr).toBe('Path already exists.');
		component.pathKey = '/new';
		component.methodKey = null;
		component.ok();
		expect(component.errorStr).toBe('Please select an operation.');
		expect(apis.current.paths['/new']).toBeUndefined();
		expect(TestBed.inject(NgbActiveModal).close).not.toHaveBeenCalled();
	});

	it('does not allow to change a method to an existing one', () => {
		const { component, apis } = render({});
		Object.assign(component, { pathKey: '/pet', methodKey: 'put', obj: apis.current.paths['/pet'].put });
		component.ngOnInit();
		component.methodKey = 'post';
		component.ok();
		expect(component.errorStr).toBe('Method already exists for this path.');
	});

	it('deletes methods and paths', () => {
		const { component, apis } = render({});
		Object.assign(component, { pathKey: '/pet', methodKey: 'put', obj: apis.current.paths['/pet'].put });
		component.ngOnInit();
		component.deleteMethod();
		expect(Object.keys(apis.current.paths['/pet'])).toEqual(['post']);
		component.deletePath();
		expect(apis.current.paths['/pet']).toBeUndefined();
	});
});
