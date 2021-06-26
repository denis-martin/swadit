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
	@Input() allowComposite: boolean = true;

	private _obj: any;
	@Input() 
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	get obj() { 
		return this._obj; 
	}

	@Output() objChange = new EventEmitter<any>();
	// eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
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

	ngOnInit(): void
	{
		if (!this.schema) {
			this.schema = this.apis.schemas.schema;
		}
	}

	keys(obj): string[]
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	trackByIndex(index: number, item: any): number
	{
		return index;
	}

	addProperty(event: any): void
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

	deleteProperty(event: any, propKey: string): void
	{
		event.preventDefault();
		console.log("deleteProperty", propKey);
		delete this.obj['properties'][propKey];
	}

	changeProperty(newPropKey: any, propKey: any): void
	{
		if (newPropKey && newPropKey != propKey) {
			this.apis.renameObjectKey(this.obj['properties'], propKey, newPropKey);
		}
	}

	changePropertyKeyDown(event: any, propKey: any): void
	{
		event.preventDefault();
	}

	propertyIsRequired(propKey): boolean
	{
		return this.obj['required'] && this.obj['required'].indexOf(propKey) >= 0;
	}

	changePropertyIsRequired(propKey): void
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

	deleteAllOfItem(event: any, index: number): void
	{
		this.obj["allOf"].splice(index, 1);
	}

	convertToAllOf(obj: any): void
	{
		const items = [];
		const o = {};
		for (const k of Object.keys(obj)) {
			o[k] = obj[k];
			delete obj[k];
		}
		items.push(o);
		obj['allOf'] = items;
	}

	convertToSingleSchema(obj: any): void
	{
		let o = {};
		if (Array.isArray(obj['allOf']) && obj['allOf'].length > 0) {
			o = obj['allOf'][0];
		}
		delete obj['allOf'];
		for (const k of Object.keys(o)) {
			obj[k] = o[k];
		}
	}

	addToAllOf(obj: any): number
	{
		obj['allOf'].push({});
		return 0;
	}

	getType(obj: any): string
	{
		if (obj['type']) {
			return obj['type'];
		} else if (Array.isArray(obj['allOf']) && obj['allOf'].length > 0) {
			if (obj['allOf'][0]['type']) {
				return obj['allOf'][0]['type'] + "*";

			} else if (obj['allOf'][0]['$ref']) {
				return "$ref*";
			}
		}
		return "";
	}
}
