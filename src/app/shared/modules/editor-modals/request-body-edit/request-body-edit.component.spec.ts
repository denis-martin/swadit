import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { RequestBodyEditComponent } from './request-body-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('RequestBodyEditComponent', () => {
	const renderOperation = (path: string, method: string) => {
		const r = renderComponent(RequestBodyEditComponent, { imports: [EditorModalsModule], api: loadFixture('featuresOas3Yaml'), detectChanges: false });
		const operation = r.apis.current.paths[path][method];
		Object.assign(r.component, { pathMode: true, parent: operation, obj: operation.requestBody || {} });
		r.fixture.detectChanges();
		return { ...r, operation };
	};
	const renderComponentDef = (key: string) => {
		const r = renderComponent(RequestBodyEditComponent, { imports: [EditorModalsModule], api: loadFixture('featuresOas3Yaml'), detectChanges: false });
		Object.assign(r.component, { key, obj: key ? r.apis.current.components.requestBodies[key] : {} });
		r.fixture.detectChanges();
		return r;
	};

	it('renders the references and the editor in path mode', () => {
		const { element, component } = renderOperation('/items/{id}', 'put');
		const refs = Array.from(element.querySelectorAll('#refKey option')).map(o => o.getAttribute('value')).filter(v => v.startsWith('#'));
		expect(refs).toEqual(['#/components/requestBodies/Item']);
		expect(element.querySelector('swadit-object-editor')).toBeTruthy();
		expect(element.querySelector('swadit-swagger-schema-editor')).toBeTruthy();
		expect(component.exists).toBe(true);
		expect(element.textContent).toContain('Delete');
	});

	it('does not change a request body that is applied without modifications', () => {
		const { component, operation } = renderOperation('/items/{id}', 'put');
		const orig = _cloneDeep(operation.requestBody);
		component.ok();
		expect(component.errorStr).toBe('');
		expect(operation.requestBody).toEqual(orig);
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
	});

	it('adds a request body to an operation', async () => {
		const { component, operation, element, apis } = renderOperation('/items', 'get');
		expect(component.exists).toBe(false);
		expect(element.textContent).not.toContain('Delete');
		component.ok();
		expect(component.errorStr).toBe('Please add a media type to the content.');
		expect(operation.requestBody).toBeUndefined();

		component.obj['content'] = { 'application/json': { schema: { '$ref': '#/components/schemas/Item', type: 'object' } } };
		component.obj['description'] = '';
		component.ok();
		expect(component.errorStr).toBe('');
		expect(operation.requestBody).toEqual({ content: { 'application/json': { schema: { '$ref': '#/components/schemas/Item' } } } });
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('references a request body component and deletes it from the operation', async () => {
		const { component, operation, apis } = renderOperation('/items/{id}', 'put');
		component.obj['$ref'] = '#/components/requestBodies/Item';
		component.ok();
		expect(operation.requestBody).toEqual({ '$ref': '#/components/requestBodies/Item' });
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		component.deleteRequestBody();
		expect(operation.requestBody).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});

	it('adds, renames and deletes request body components', async () => {
		const r = renderComponentDef(null);
		expect(r.element.querySelector('#requestBodyKey')).toBeTruthy();
		r.component.ok();
		expect(r.component.errorStr).toBe('Please enter a key name.');
		r.component.key = 'Item';
		r.component.ok();
		expect(r.component.errorStr).toBe('Key name already exists.');
		r.component.key = 'Text';
		r.component.obj['content'] = { 'text/plain': {} };
		r.component.ok();
		expect(r.apis.current.components.requestBodies.Text).toEqual({ content: { 'text/plain': {} } });
		await expect(r.apis.validate(r.apis.current)).resolves.toBeTruthy();

		TestBed.resetTestingModule();
		const item = renderComponentDef('Item');
		item.component.key = 'NewItem';
		item.component.ok();
		expect(item.apis.current.components.requestBodies.NewItem).toBeTruthy();
		expect(item.apis.current.paths['/items'].post.requestBody).toEqual({ '$ref': '#/components/requestBodies/NewItem' });
		await expect(item.apis.validate(item.apis.current)).resolves.toBeTruthy();
		item.component.key_orig = 'NewItem';
		item.component.deleteRequestBody();
		expect(item.apis.current.components.requestBodies).toEqual({});
	});
});
