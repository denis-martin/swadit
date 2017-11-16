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
	selector: 'app-response-edit',
	templateUrl: './response-edit.component.html',
	styleUrls: ['./response-edit.component.scss']
})
export class ResponseEditComponent implements OnInit 
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
		if (!this.obj_orig) this.obj_orig = {};
		this.obj = _.cloneDeep(this.obj_orig);
		if (!this.obj['schema']) this.obj['schema'] = { type: 'object' };
	}

	ok() 
	{
		console.log("ResponseEditComponent.ok()");

		if (!this.key || !this.key.trim()) {
			this.errorStr = "Please enter a key name.";
			return;
		}
		this.key = this.key.trim();

		let missing = this.apis.missingRequiredProperties(this.apis.schemas.response, this.obj);
		if (missing.length > 0) {
			this.errorStr = "Missing required properties: ";
			missing.forEach(p => {
				this.errorStr += p + " ";
			});
			return;
		}

		let o = _.cloneDeep(this.obj);
		this.apis.cleanUp(this.apis.schemas.response, o);
		this.apis.cleanUpSwaggerSchema(o['schema']);

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("response-edit", o);

		if (!this.key_orig) {
			if (!this.apis.current['responses']) {
				this.apis.current['responses'] = {};
			}
			this.apis.current['responses'][this.key] = this.obj_orig;
		} else if (this.key != this.key_orig) {
			this.apis.renameObjectKey(this.apis.current['responses'], this.key_orig, this.key);
		}

		this.errorStr = "";
		this.activeModal.close('ok');
	}
	
	deleteResponse()
	{
		if (!this.key_orig) return;
		delete this.apis.current['responses'][this.key_orig];
		this.activeModal.close('ok');
	}
}
