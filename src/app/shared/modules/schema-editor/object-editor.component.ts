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

import { SchemaEditorComponent } from './schema-editor.component';
import { PrimitiveEditorComponent } from './primitive-editor.component';
import { ArrayEditorComponent } from './array-editor.component';

@Component({
	selector: 'swadit-object-editor',
	templateUrl: './object-editor.component.html',
	styleUrls: ['./schema-editor.component.scss']
})
export class ObjectEditorComponent implements OnInit 
{
	@Input() schema: any;
	@Input() id: string;
	@Input() card: boolean = false;
	@Input() title: boolean = true;
	@Input() header: string;
	@Input() group: number = null;

	private _obj: any;
	@Input() 
	get obj() { 
		return this._obj; 
	};

	@Output() objChange = new EventEmitter<any>();
	set obj(val) 
	{
		this._obj = val;
		if (this._obj) {
			this.schemaProperties().forEach(p => {
				if (!this._obj[p]) {
					if (this.schema.properties[p]['type'] == 'object') {
						this._obj[p] = {};
					} else if (this.schema.properties[p]['type'] == 'array') {
						this._obj[p] = [];
					}
				}
			});
		}
		this.objChange.emit(this._obj);
	}

	public propertyToAdd: string = "";
	public noItemToAdd: boolean = false;
	public collapsed = {};

	constructor()
	{
		if (!this._obj) {
			this._obj = {};
		}
	}

	ngOnInit() 
	{
		if (!this.card && this.schema["x-swadit-editor-card"]) {
			this.card = true;
		}
		this.schemaProperties().forEach(p => {
			if (this.schema.properties[p]["x-swadit-editor-collapse"]) {
				this.collapsed[p] = true;
			} else {
				this.collapsed[p] = false;
			}
		});
		if (this.schema['additionalProperties'] && this.schema['additionalProperties']["x-swadit-editor-collapse"]) {
			Object.keys(this.obj).forEach(p => {
				this.collapsed[p] = true;
			});
		}
	}

	schemaProperties() 
	{
		if (!this.schema.properties) {
			return [];
		} else {
			return Object.keys(this.schema.properties);
		}
	}

	objectProperties()
	{
		if (!this.obj) {
			return [];
		} else {
			return Object.keys(this.obj);
		}
	}

	deCamelize(s: string)
	{
		let r = s.replace(/[A-Z]/g, " $&");
		r = r.replace(/^[a-z]/, r[0].toUpperCase());
		return r;
	}

	propertyIsRequired(schema: any, property: string): boolean
	{
		if (schema.required == null) return false;
		for (let rp of schema.required) {
			if (rp == property) return true;
		}
		return false;
	}

	addProperty(event: any)
	{
		event.preventDefault();
		console.log("addProperty", this.propertyToAdd);
		if (!this.propertyToAdd) {
			this.noItemToAdd = true;
			return
		}
		this.noItemToAdd = false;
		this.obj[this.propertyToAdd] = {};
		if (this.schema['additionalProperties']['type'] == 'object') {
			this.obj[this.propertyToAdd] = {};
		} else if (this.schema['additionalProperties']['type'] == 'array') {
			this.obj[this.propertyToAdd] = [];
		} else if (this.schema['additionalProperties']['type'] == 'string') {
			this.obj[this.propertyToAdd] = "";
		} else {
			this.obj[this.propertyToAdd] = null;
		}
		this.propertyToAdd = "";
	}

	deleteProperty(event: any, p: string)
	{
		event.stopPropagation();
		console.log("deleteProperty", p);
		delete this.obj[p];
	}

	changeProperty(newp: any, p: string)
	{
		if (newp != p) {
			this.collapsed[newp] = this.collapsed[p];
			Object.keys(this.obj).forEach(op => {
				let val = this.obj[op];
				delete this.obj[op];
				if (op == p) {
					this.obj[newp] = val;
				} else {
					this.obj[op] = val;
				}
			});
			console.log("changeProperty", newp, p, this.obj);
		}
	}

	trackByIndex(index: any, item: any) {
		return index;
	}

	getGrid(group: number = null): any
	{
		if (group == null) group = this.group;
		if (group == null || !this.schema['x-swadit-editor-groups']) {
			return this.schema['x-swadit-editor-grid'];
		} else {
			if (this.schema['x-swadit-editor-groups']) {
				return this.schema['x-swadit-editor-groups'][group]['x-swadit-editor-grid'];
			} else {
				return null;
			}
		}
	}

	getGridCols(group: number = null): any
	{
		if (group == null) group = this.group;
		if (group == null || !this.schema['x-swadit-editor-groups']) {
			return this.schema['x-swadit-editor-grid-cols'];
		} else {
			if (this.schema['x-swadit-editor-groups']) {
				return this.schema['x-swadit-editor-groups'][group]['x-swadit-editor-grid-cols'];
			} else {
				return null;
			}
		}
	}
}
