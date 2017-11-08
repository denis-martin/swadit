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
	obj: any = null;
	obj_old: any = null;

	constructor(public activeModal: NgbActiveModal, public apis: ApisService)
	{	
	}

	ngOnInit() 
	{
		this.obj_old = this.obj;
		this.obj = _.cloneDeep(this.obj_old);
	}

	ok() {
		console.log("DefinitionEditComponent.ok()");


		this.activeModal.close('ok');
	}
	

}
