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

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { ApisService } from '../../../services';

@Component({
	selector: 'swadit-swagger-schema-editor',
	templateUrl: './swagger-schema-editor.component.html',
	styleUrls: [
		'./../schema-editor.component.scss',
		'./swagger-schema-editor.component.scss'
	]
})
export class SwaggerSchemaEditorComponent implements OnInit 
{
	@Input() schema: any;
	@Input() id: string;

	private _obj: any;
	@Input() 
	get obj() { 
		return this._obj; 
	};

	@Output() objChange = new EventEmitter<any>();
	set obj(val) 
	{
		this._obj = val;
		this.objChange.emit(this._obj);
	}

	itemsVisible = false;
	uncollapsed = [];
	propertyToAdd: string;
	addPropertyError = "";

	constructor(public apis: ApisService) { }

	ngOnInit() 
	{
		if (!this.schema) {
			this.schema = this.apis.schemas.schema;
		}
	}

	keys(obj) 
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	trackByIndex(index: any, item: any) 
	{
		return index;
	}

	addProperty(event: any)
	{
		event.preventDefault();
		console.log("addProperty", this.propertyToAdd);
		if (!this.propertyToAdd) {
			this.addPropertyError = "Please enter a property name";
			return;
		}
		if (!this.obj['properties']) {
			this.obj['properties'] = {};
		}
		if (this.obj['properties'].hasOwnProperty(this.propertyToAdd)) {
			this.addPropertyError = "Property already exists";
			return;
		}
		this.addPropertyError = "";
		
		this.obj['properties'][this.propertyToAdd] = { 'type': 'string' };
		this.propertyToAdd = null;
	}

	deleteProperty(event: any, propKey: string)
	{
		event.preventDefault();
		console.log("deleteProperty", propKey);
		delete this.obj['properties'][propKey];
	}

	changeProperty(newPropKey: any, propKey: string)
	{
		if (newPropKey && newPropKey != propKey) {
			this.apis.renameObjectKey(this.obj['properties'], propKey, newPropKey);
		}
	}

	propertyIsRequired(propKey)
	{
		return this.obj['required'] && this.obj['required'].indexOf(propKey) >= 0;
	}

	changePropertyIsRequired(propKey)
	{
		if (this.propertyIsRequired(propKey)) {
			this.obj['required'].splice(this.obj['required'].indexOf(propKey), 1);
		} else {
			if (!this.obj['required']) {
				this.obj['required'] = [];
			}
			this.obj['required'].push(propKey);
		}
	}
}
