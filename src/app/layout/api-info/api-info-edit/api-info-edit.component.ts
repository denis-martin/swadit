import { Component, OnInit } from '@angular/core';
import { NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as _ from "lodash";

import { ApisService } from '../../../shared/services';

@Component({
	selector: 'app-api-info-edit',
	templateUrl: './api-info-edit.component.html',
	styleUrls: ['./api-info-edit.component.scss']
})
export class ApiInfoEditComponent implements OnInit 
{
	static readonly modalOptions: NgbModalOptions = {
		size: "lg"
	}

	public api: any;

	constructor(public activeModal: NgbActiveModal, public apis: ApisService) 
	{
		console.log(apis.current);
		this.api = _.cloneDeep(apis.current);
		if (!this.api['info']) {
			this.api['info'] = {};
		}
		if (!this.api['info']['contact']) {
			this.api['info']['contact'] = {};
		}
		if (!this.api['info']['license']) {
			this.api['info']['license'] = {};
		}
		if (!this.api['externalDocs']) {
			this.api['externalDocs'] = {};
		}
		if (!this.api['tags']) {
			this.api['tags'] = [];
		}
		if (!this.api['securityDefinitions']) {
			this.api['securityDefinitions'] = {};
		}
		if (!this.api['security']) {
			this.api['security'] = [];
		}
		Object.keys(this.apis.schemas.root['properties']).forEach(p => {
			if (this.apis.schemas.root['properties'][p]['type'] == 'object' && !this.api[p]) {
				this.api[p] = {};
			} else if (this.apis.schemas.root['properties'][p]['type'] == 'array' && !this.api[p]) {
				this.api[p] = [];
			}
		});
	}

	ngOnInit() 
	{
	}

	ok() 
	{
		console.log("ApiInfoEditComponent.ok()");

		let api = _.cloneDeep(this.api);

		// apply changes
		this.apis.current['info'] = api['info'];
		this.apis.current['externalDocs'] = api['externalDocs'];
		this.apis.current['tags'] = api['tags'];
		this.apis.current['securityDefinitions'] = api['securityDefinitions'];
		this.apis.current['security'] = api['security'];
		Object.keys(this.apis.schemas.root['properties']).forEach(p => {
			this.apis.current[p] = api[p];
		});

		// clean up
		this.apis.cleanUp(this.apis.schemas.contact, this.apis.current['info']['contact']);
		this.apis.cleanUp(this.apis.schemas.license, this.apis.current['info']['license']);
		this.apis.cleanUp(this.apis.schemas.info, this.apis.current['info']);
		this.apis.cleanUp(this.apis.schemas.externalDocs, this.apis.current['externalDocs']);
		this.apis.cleanUp(this.apis.schemas.tags, this.apis.current['tags']);
		this.apis.cleanUp(this.apis.schemas.securityDefinitions, this.apis.current['securityDefinitions']);
		this.apis.cleanUp(this.apis.schemas.security, this.apis.current['security']);
		this.apis.cleanUp(this.apis.schemas.root, this.apis.current);

		if (Object.keys(this.apis.current['info']['contact']).length == 0) {
			delete this.apis.current['info']['contact'];
		}
		if (Object.keys(this.apis.current['info']['license']).length == 0) {
			delete this.apis.current['info']['license'];
		}
		if (Object.keys(this.apis.current['externalDocs']).length == 0) {
			delete this.apis.current['externalDocs'];
		}
		if (this.apis.current['tags'].length == 0) {
			delete this.apis.current['tags'];
		}
		if (Object.keys(this.apis.current['securityDefinitions']).length == 0) {
			delete this.apis.current['securityDefinitions'];
		}
		if (this.apis.current['security'].length == 0) {
			delete this.apis.current['security'];
		}

		console.log(this.apis.current);

		// TODO: security & extension properties

		this.activeModal.close('ok');
	}
	
}
