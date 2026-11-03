import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { ResponseEditComponent } from './response-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ResponseEditComponent', () => {
	describe.each([
		[ 'OAS2', () => {
			const a = loadFixture('petstoreOas2Yaml');
			a.responses = { NotFound: { description: 'Not found' } };
			a.paths['/store/inventory'].get.responses['404'] = { '$ref': '#/responses/NotFound' };
			return a;
		} ],
		[ 'OAS3', () => {
			const a = loadFixture('petstoreOas3Yaml');
			a.components.responses = { NotFound: { description: 'Not found' } };
			a.paths['/store/inventory'].get.responses['404'] = { '$ref': '#/components/responses/NotFound' };
			return a;
		} ]
	])('%s', (version, api) => {
		const renderOperation = (key: string) => {
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
			const operation = r.apis.current.paths['/pet'].post;
			Object.assign(r.component, { pathMode: true, parent: operation, key, obj: key ? operation.responses[key] : {} });
			r.fixture.detectChanges();
			return { ...r, operation };
		};
		const renderDefinition = (key: string) => {
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
			Object.assign(r.component, { key, obj: key ? r.apis.getComponents('responses')[key] : {} });
			r.fixture.detectChanges();
			return r;
		};

		it('renders the status code selection in path mode', () => {
			const { element } = renderOperation('405');
			expect((element.querySelector('#responseKey') as HTMLSelectElement).options.length).toBeGreaterThan(10);
			expect(element.querySelector('#refKey')).toBeTruthy();
		});

		it('adds a response to an operation', () => {
			const { component, operation } = renderOperation(null);
			component.statusCodeChanged('200');
			expect(component.obj['description']).toBe('OK');
			component.ok();
			expect(component.errorStr).toBe('');
			expect(operation.responses['200']).toEqual({ description: 'OK' });
			expect(operation.responses['405']).toBeTruthy();
			expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
		});

		it('changes the status code of a response', () => {
			const { component, operation } = renderOperation('405');
			component.statusCodeChanged('400');
			component.ok();
			expect(Object.keys(operation.responses)).toEqual(['400']);
			expect(operation.responses['400'].description).toBe('Invalid input');
		});

		it('validates the response', () => {
			const { component, operation } = renderOperation(null);
			component.ok();
			expect(component.errorStr).toBe('Please enter a key name.');
			component.key = '405';
			component.ok();
			expect(component.errorStr).toBe('Response code already exists.');
			component.key = '500';
			component.ok();
			expect(component.errorStr).toContain('Missing required properties: description');
			expect(operation.responses['500']).toBeUndefined();
		});

		it('does not change a response that is applied without modifications', () => {
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
			const operation = r.apis.current.paths['/pet/findByStatus'].get;
			const orig = _cloneDeep(operation.responses['200']);
			Object.assign(r.component, { pathMode: true, parent: operation, key: '200', obj: operation.responses['200'] });
			r.fixture.detectChanges();
			r.component.ok();
			expect(operation.responses['200']).toEqual(orig);
		});

		it('renames a response definition and updates all references to it', async () => {
			const { component, apis } = renderDefinition('NotFound');
			component.key = 'Missing';
			component.ok();
			expect(apis.getComponents('responses').Missing).toEqual({ description: 'Not found' });
			expect(apis.current.paths['/store/inventory'].get.responses['404']).toEqual({ '$ref': apis.componentRef('responses', 'Missing') });
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('deletes a response', () => {
			const { component, operation } = renderOperation('405');
			component.deleteResponse();
			expect(operation.responses).toEqual({});
		});
	});

	describe('OAS3', () => {
		const renderOas3 = (pathMode: boolean, key: string, obj: any) => {
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: loadFixture('featuresOas3Yaml'), detectChanges: false });
			const operation = r.apis.current.paths['/items'].get;
			Object.assign(r.component, { pathMode, parent: pathMode ? operation : undefined, key, obj });
			r.fixture.detectChanges();
			return { ...r, operation };
		};

		it('offers the response components as references', () => {
			const api = loadFixture('minimalOas3Yaml');
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api, detectChanges: false });
			Object.assign(r.component, { pathMode: true, parent: r.apis.current.paths['/items/{id}'].get, key: '200', obj: {} });
			r.fixture.detectChanges();
			const refs = Array.from(r.element.querySelectorAll('#refKey option')).map(o => o.getAttribute('value')).filter(v => v.startsWith('#'));
			expect(refs).toEqual(['#/components/responses/Error']);
		});

		it('does not change a response with headers, links and examples that is applied without modifications', () => {
			const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: loadFixture('featuresOas3Yaml'), detectChanges: false });
			const operation = r.apis.current.paths['/items'].get;
			const orig = _cloneDeep(operation.responses['200']);
			Object.assign(r.component, { pathMode: true, parent: operation, key: '200', obj: operation.responses['200'] });
			r.fixture.detectChanges();
			expect(r.element.querySelector('swadit-swagger-schema-editor')).toBeTruthy();
			r.component.ok();
			expect(r.component.errorStr).toBe('');
			expect(operation.responses['200']).toEqual(orig);
		});

		it('adds a response with content to an operation', async () => {
			const { component, operation, apis } = renderOas3(true, null, {});
			component.statusCodeChanged('404');
			component.obj['content'] = {
				'application/json': { schema: { type: 'array', items: { type: 'string' }, properties: {} } },
				'text/plain': {}
			};
			component.ok();
			expect(component.errorStr).toBe('');
			expect(operation.responses['404']).toEqual({
				description: 'Not Found',
				content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } }, 'text/plain': {} }
			});
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('adds and deletes response components', async () => {
			const { component, apis } = renderOas3(false, null, {});
			component.key = 'Gone';
			component.obj['description'] = 'gone';
			component.ok();
			expect(apis.current.components.responses).toEqual({ Gone: { description: 'gone' } });
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
			component.key_orig = 'Gone';
			component.deleteResponse();
			expect(apis.current.components.responses).toEqual({});
		});
	});
});
