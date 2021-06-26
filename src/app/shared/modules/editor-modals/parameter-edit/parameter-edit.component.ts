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

import { ApisService } from '../../../services';

@Component({
	selector: 'app-parameter-edit',
	templateUrl: './parameter-edit.component.html',
	styleUrls: ['../editor-modals.scss']
})
export class ParameterEditComponent implements OnInit 
{
	static readonly modalOptions: NgbModalOptions = {
		size: "lg"
	}

	pathMode: boolean = false;
	allMethods: boolean = false;

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
	}

	ok() 
	{
		console.log("ParameterEditComponent.ok()");

		if (!this.pathMode) {
			if (!this.key || !this.key.trim()) {
				this.errorStr = "Please enter a key name.";
				return;
			}
			this.key = this.key.trim();

			if (this.key != this.key_orig && 
				this.apis.current['parameters'] && 
				this.apis.current['parameters'][this.key]) 
			{
				this.errorStr = "Key name already exists.";
				return;
			}
		}

		if (!this.obj['$ref']) {
			if (this.obj['in'] == 'body') {
				const missing = this.apis.missingRequiredProperties(this.apis.schemas.parameterBody, this.obj);
				if (missing.length > 0) {
					this.errorStr = "Missing required properties: ";
					missing.forEach(p => {
						this.errorStr += p + " ";
					});
					return;
				}

			} else {
				const missing = this.apis.missingRequiredProperties(this.apis.schemas.parameterNonBody, this.obj);
				if (missing.length > 0) {
					this.errorStr = "Missing required properties: ";
					missing.forEach(p => {
						this.errorStr += p + " ";
					});
					return;
				}
			}

			if (this.obj['in'] == 'path' && !this.obj['required']) {
				this.errorStr = "Path parameter must be 'required'.";
				return;
			}
		}

		let o;
		if (!this.obj['$ref']) {
			o = _.cloneDeep(this.obj);
			if (o['in'] == "body") {
				this.apis.cleanUp(this.apis.schemas.parameterBody, o);
				this.apis.cleanUpSwaggerSchema(o['schema']);
			} else {
				this.apis.cleanUp(this.apis.schemas.parameterNonBody, o);
			}
		} else {
			o = {};
			o['$ref'] = this.obj['$ref'];
		}

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("parameter-edit", o);

		if (!this.pathMode) {
			if (!this.key_orig) {
				if (!this.apis.current['parameters']) {
					this.apis.current['parameters'] = {};
				}
				this.apis.current['parameters'][this.key] = this.obj_orig;
			} else if (this.key != this.key_orig) {
				this.apis.renameObjectKey(this.apis.current['parameters'], this.key_orig, this.key);
			}
		}

		this.errorStr = "";
		this.activeModal.close({ obj: this.obj_orig, allMethods: this.allMethods });
	}
	
	deleteParameter()
	{
		console.log("ParameterEditComponent.deleteParameter()");

		if (!this.pathMode) {
			if (!this.key_orig) return;
			delete this.apis.current['parameters'][this.key_orig];
		}
		this.activeModal.close({ obj: this.obj_orig, delete: true });
	}
}
