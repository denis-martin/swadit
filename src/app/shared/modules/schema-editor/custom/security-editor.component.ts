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

import { cloneDeep as _cloneDeep } from "lodash-es";

@Component({
	selector: 'swadit-security-editor',
	templateUrl: './security-editor.component.html',
	styleUrls: ['../schema-editor.component.scss']
})
export class SecurityEditorComponent implements OnInit 
{
	@Input() schema: any;
	@Input() id: string;
	@Input() securityDefinitions: any;

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

	public securityRequirement = {
		"type": "array",
		"items": {
			"type": "string",
			"description": "Security requirement",
			"enum": []
		},
		"uniqueItems": true
	}

	public securityScope = {
		"type": "array",
		"items": {
			"type": "string",
			"description": "Oauth2 scope",
			"enum": []
		},
		"uniqueItems": true
	}

	public collapsed = {};
	public propertyToAdd = "";
	public noItemToAdd: boolean = false;

	ngOnInit(): void
	{
		this.keys(this.securityDefinitions).forEach(p => {
			this.collapsed[p] = true;
		});
	}

	keys(o): string[]
	{
		if (!o) {
			return [];
		} else {
			return Object.keys(o);
		}
	}

	scopes(secdef: string): any
	{
		if (!this.securityDefinitions || !this.securityDefinitions[secdef]) {
			return this.securityScope;
		}
		const s = _cloneDeep(this.securityScope);
		s['items']['enum'] = this.securityDefinitions[secdef]['scopes'] ? 
			this.keys(this.securityDefinitions[secdef]['scopes']) : [];
		return s;
	}

	addProperty(event: any): void
	{
		event.preventDefault();
		console.log("addProperty", this.propertyToAdd);
		if (!this.propertyToAdd) {
			this.noItemToAdd = true;
			return;
		}
		this.noItemToAdd = false;
		const req = {};
		req[this.propertyToAdd] = [];
		this.obj.push(req);
		this.propertyToAdd = "";
	}

	deleteItem(event: any, i: number): void
	{
		event.preventDefault();
		console.log("deleteItem", i);
		this.obj.splice(i, 1);
	}

	changeProperty(newp: any, i: number, p: string): void
	{
		if (newp != p) {
			const oldScopes = this.obj[i][p];
			this.obj[i] = {};
			this.obj[i][newp] = oldScopes;
			this.collapsed[newp] = this.collapsed[p];
			console.log("changeProperty", newp, p, this.obj);
		}
	}

	trackByIndex(index: number, item: any): number
	{
		return index;
	}

	isSecurityDefinition(p: string): boolean
	{
		let ret = false;
		this.keys(this.securityDefinitions).forEach(d => {
			if (p == d) {
				ret = true;
			}
		});
		return ret;
	}
}
