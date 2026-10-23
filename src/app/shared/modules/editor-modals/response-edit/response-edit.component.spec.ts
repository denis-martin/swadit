import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { EditorModalsModule } from '../editor-modals.module';
import { ResponseEditComponent } from './response-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ResponseEditComponent', () => {
	const api = () => {
		const a = loadFixture('petstoreYaml');
		a.responses = { NotFound: { description: 'Not found' } };
		a.paths['/store/inventory'].get.responses['404'] = { '$ref': '#/responses/NotFound' };
		return a;
	};
	const renderOperation = (key: string) => {
		const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
		const operation = r.apis.current.paths['/pet'].post;
		Object.assign(r.component, { pathMode: true, parent: operation, key, obj: key ? operation.responses[key] : {} });
		r.fixture.detectChanges();
		return { ...r, operation };
	};
	const renderDefinition = (key: string) => {
		const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], api: api(), detectChanges: false });
		Object.assign(r.component, { parent: r.apis.current, key, obj: key ? r.apis.current.responses[key] : {} });
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
		const r = renderComponent(ResponseEditComponent, { imports: [EditorModalsModule], detectChanges: false });
		const operation = r.apis.current.paths['/pet/findByStatus'].get;
		const orig = _cloneDeep(operation.responses['200']);
		Object.assign(r.component, { pathMode: true, parent: operation, key: '200', obj: operation.responses['200'] });
		r.fixture.detectChanges();
		r.component.ok();
		expect(operation.responses['200']).toEqual(orig);
	});

	it('renames a response definition and updates all references to it', () => {
		const { component, apis } = renderDefinition('NotFound');
		component.key = 'Missing';
		component.ok();
		expect(apis.current.responses.Missing).toEqual({ description: 'Not found' });
		expect(apis.current.paths['/store/inventory'].get.responses['404']).toEqual({ '$ref': '#/responses/Missing' });
	});

	it('deletes a response', () => {
		const { component, operation } = renderOperation('405');
		component.deleteResponse();
		expect(operation.responses).toEqual({});
	});
});
