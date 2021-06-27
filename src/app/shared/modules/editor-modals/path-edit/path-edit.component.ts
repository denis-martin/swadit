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

import { cloneDeep as _cloneDeep } from "lodash-es";

import { ApisService } from '../../../services';

@Component({
	selector: 'app-path-edit',
	templateUrl: './path-edit.component.html',
	styleUrls: ['../editor-modals.scss']
})
export class PathEditComponent implements OnInit 
{
	static readonly modalOptions: NgbModalOptions = {
		size: "lg"
	}

	pathKey: string = null;
	pathKey_orig: string = null;
	methodKey: string = null;
	methodKey_orig: string = null;
	obj: any = null;
	obj_orig: any = null;
	
	errorStr: string = null;

	constructor(public activeModal: NgbActiveModal, public apis: ApisService)
	{	
	}

	ngOnInit() 
	{
		this.pathKey_orig = this.pathKey;
		this.methodKey_orig = this.methodKey;
		this.obj_orig = this.obj;
		if (!this.obj_orig) this.obj_orig = {};

		this.obj = _cloneDeep(this.obj_orig);
		if (!this.obj['consumes']) {
			this.obj['consumes'] = [];
		}
		if (!this.obj['produces']) {
			this.obj['produces'] = [];
		}
		if (!this.obj['tags']) {
			this.obj['tags'] = [];
		}
		if (!this.obj['security']) {
			this.obj['security'] = [];
		}
		if (!this.obj['externalDocs']) {
			this.obj['externalDocs'] = {};
		}
	}

	ok() 
	{
		console.log("PathEditComponent.ok()");

		if (!this.pathKey || !this.pathKey.trim()) {
			this.errorStr = "Please enter a path.";
			return;
		}
		this.pathKey = this.pathKey.trim();

		if (!this.pathKey.startsWith('/')) {
			this.errorStr = "Path must start with '/'.";
			return;
		}

		if (this.pathKey != this.pathKey_orig && 
			this.apis.current['paths'] && 
			this.apis.current['paths'][this.pathKey]) 
		{
			this.errorStr = "Path already exists.";
			return;
		}

		if (this.methodKey != this.methodKey_orig && 
			this.apis.current['paths'] && 
			this.apis.current['paths'][this.pathKey] &&
			this.apis.current['paths'][this.pathKey][this.methodKey])
		{
			this.errorStr = "Method already exists for this path.";
			return;
		}

		const o = _cloneDeep(this.obj);
		this.apis.cleanUp(this.apis.schemas.operation, o);
		if (o['externalDocs'] && !o['externalDocs']['url'] && !o['externalDocs']['description']) {
			delete o['externalDocs'];
		}
		if (o['security'] && o['security'].length == 0) {
			delete o['security'];
		}

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("path-edit", o);

		if (!this.pathKey_orig) {
			if (!this.apis.current['paths']) {
				this.apis.current['paths'] = {};
			}
			this.apis.current['paths'][this.pathKey] = {};
		} else if (this.pathKey != this.pathKey_orig) {
			this.apis.renameObjectKey(this.apis.current['paths'], this.pathKey_orig, this.pathKey);
		}

		if (!this.methodKey_orig) {
			this.apis.current['paths'][this.pathKey][this.methodKey] = this.obj_orig;
		} else if (this.methodKey != this.methodKey_orig) {
			this.apis.renameObjectKey(this.apis.current['paths'][this.pathKey], this.methodKey_orig, this.methodKey);
		}

		if (!this.apis.current['paths'][this.pathKey][this.methodKey]['responses']) {
			this.apis.current['paths'][this.pathKey][this.methodKey]['responses'] = {
				'default': {
					'description': "Default"
				}
			};
		}

		this.errorStr = "";
		this.activeModal.close({ path: this.pathKey, method: this.methodKey });
	}
	
	deletePath()
	{
		console.log("PathEditComponent.deletePath()");
		if (!this.pathKey_orig) return;
		delete this.apis.current['paths'][this.pathKey_orig];
		this.activeModal.close({});
	}

	deleteMethod()
	{
		console.log("PathEditComponent.deleteMethod()");
		if (!this.methodKey_orig) return;
		delete this.apis.current['paths'][this.pathKey_orig][this.methodKey_orig];
		this.activeModal.close({ path: this.pathKey });
	}
}
