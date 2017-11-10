import { Component, OnInit } from '@angular/core';
import { NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as _ from "lodash";

import { ApisService } from '../../../shared/services';

@Component({
	selector: 'app-definition-edit',
	templateUrl: './definition-edit.component.html',
	styleUrls: ['./definition-edit.component.scss']
})
export class DefinitionEditComponent implements OnInit 
{
	static readonly modalOptions: NgbModalOptions = {
		size: "lg"
	}

	key: string = null;
	key_orig: string = null;
	obj: any = null;
	obj_orig: any = null;
	
	errorStr: string = null;

	constructor(public activeModal: NgbActiveModal, public apis: ApisService)
	{	
	}

	ngOnInit() 
	{
		this.key_orig = this.key;
		this.obj_orig = this.obj;
		this.obj = _.cloneDeep(this.obj_orig);
	}

	ok() 
	{
		console.log("DefinitionEditComponent.ok()");

		if (!this.key) {
			this.errorStr = "Please enter a name for this definition";
			return;
		}

		let o = _.cloneDeep(this.obj);
		this.apis.cleanUpSwaggerSchema(o);

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("definition-edit", o);

		if (this.key != this.key_orig) {
			this.apis.renameObjectKey(this.apis.current['definitions'], this.key_orig, this.key);
		}

		this.activeModal.close('ok');
	}
	
	deleteDefinition()
	{
		if (!this.key_orig) return;
		delete this.apis.current['definitions'][this.key_orig];
		this.activeModal.close('ok');
	}
}
