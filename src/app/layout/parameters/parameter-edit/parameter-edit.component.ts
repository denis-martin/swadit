/*	
 * Copyright 2017 Denis Martin.  This file is part of swadit.
 * 
 * swadit is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * swadit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with swadit.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from '@angular/core';
import { NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as _ from "lodash";

import { ApisService } from '../../../shared/services';

@Component({
	selector: 'app-parameter-edit',
	templateUrl: './parameter-edit.component.html',
	styleUrls: ['./parameter-edit.component.scss']
})
export class ParameterEditComponent implements OnInit 
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
		console.log("ParameterEditComponent.ok()");

		if (!this.key) {
			this.errorStr = "Please enter a name for this parameter";
			return;
		}

		let o = _.cloneDeep(this.obj);
		this.apis.cleanUpSwaggerSchema(o);

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("parameter-edit", o);

		if (this.key != this.key_orig) {
			this.apis.renameObjectKey(this.apis.current['parameters'], this.key_orig, this.key);
		}

		this.activeModal.close('ok');
	}
	
	deleteParameter()
	{
		if (!this.key_orig) return;
		delete this.apis.current['parameters'][this.key_orig];
		this.activeModal.close('ok');
	}
}
