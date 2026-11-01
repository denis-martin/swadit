import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { ApiInfoModule } from '../api-info.module';
import { ApiInfoEditComponent } from './api-info-edit.component';
import { loadFixture, renderComponent } from 'testing/test-helpers';

describe('ApiInfoEditComponent', () => {
	const render = (api?: any) => renderComponent(ApiInfoEditComponent, { imports: [ApiInfoModule], api });

	it('renders the editors (OAS2)', () => {
		const { element } = render();
		expect(element.querySelectorAll('swadit-schema-editor, swadit-object-editor').length).toBeGreaterThan(0);
		expect(element.textContent).toContain('Title');
	});

	it('does not change the API if nothing has been changed (OAS2)', () => {
		const { component, apis } = render();
		const orig = _cloneDeep(apis.current);
		component.ok();
		expect(apis.current).toEqual(orig);
		expect(TestBed.inject(NgbActiveModal).close).toHaveBeenCalledWith('ok');
	});

	it('does not change the API if nothing has been changed (OAS3)', () => {
		const { component, apis } = render(loadFixture('minimalOas3Yaml'));
		const orig = _cloneDeep(apis.current);
		component.ok();
		expect(apis.current).toEqual(orig);
	});

	it('applies changes and removes empty values', async () => {
		const { component, apis } = render();
		component.api.info.title = 'Changed';
		component.api.info.contact = {};
		component.api.tags = [];
		component.api.info.description = '';
		component.ok();
		expect(apis.current.info.title).toBe('Changed');
		expect(apis.current.info.contact).toBeUndefined();
		expect(apis.current.info.description).toBeUndefined();
		expect(apis.current.tags).toBeUndefined();
		await expect(apis.validate(apis.current)).resolves.toBeTruthy();
	});
});
