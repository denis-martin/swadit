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

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { cloneDeep as _cloneDeep } from "lodash-es";

import { ApisService } from '../../../services';

/** Edits an OAS3 request body, either of an operation (path mode) or a request body component. */
@Component({
    selector: 'app-request-body-edit',
    templateUrl: './request-body-edit.component.html',
    styleUrls: ['../editor-modals.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RequestBodyEditComponent implements OnInit 
{
	static readonly modalOptions: NgbModalOptions = {
		size: "lg"
	}

	pathMode: boolean = false;
	/** the operation of the request body (path mode only) */
	parent: any;

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
		this.obj = _cloneDeep(this.obj_orig);
	}

	/** whether an existing request body is edited */
	get exists(): boolean
	{
		return this.pathMode ? !!this.parent['requestBody'] : !!this.key_orig;
	}

	ok() 
	{
		console.log("RequestBodyEditComponent.ok()");

		if (!this.pathMode) {
			if (!this.key || !this.key.trim()) {
				this.errorStr = "Please enter a key name.";
				return;
			}
			this.key = this.key.trim();

			const requestBodies = this.apis.getComponents('requestBodies');
			if (this.key != this.key_orig && requestBodies && requestBodies[this.key]) {
				this.errorStr = "Key name already exists.";
				return;
			}
		}

		let o: any;
		if (this.obj['$ref']) {
			o = { '$ref': this.obj['$ref'] };
		} else {
			o = _cloneDeep(this.obj);
			this.apis.cleanUp(this.apis.schemas.requestBody, o);
			for (const mediaType of Object.values<any>(o['content'] || {})) {
				this.apis.cleanUpSwaggerSchema(mediaType && mediaType['schema']);
			}
			if (this.apis.getLength(o['content']) == 0) {
				this.errorStr = "Please add a media type to the content.";
				return;
			}
		}

		Object.keys(this.obj_orig).forEach(k => delete this.obj_orig[k]);
		Object.keys(o).forEach(k => this.obj_orig[k] = o[k]);
		console.log("request-body-edit", this.obj_orig);

		if (this.pathMode) {
			this.parent['requestBody'] = this.obj_orig;
		} else if (!this.key_orig) {
			this.apis.getOrCreateComponents('requestBodies')[this.key] = this.obj_orig;
		} else if (this.key != this.key_orig) {
			this.apis.renameComponent('requestBodies', this.key_orig, this.key);
		}

		this.errorStr = "";
		this.activeModal.close('ok');
	}
	
	deleteRequestBody()
	{
		console.log("RequestBodyEditComponent.deleteRequestBody()");
		if (this.pathMode) {
			delete this.parent['requestBody'];
		} else if (this.key_orig) {
			delete this.apis.getComponents('requestBodies')[this.key_orig];
		}
		this.activeModal.close('ok');
	}
}
