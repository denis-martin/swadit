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

@Component({
	selector: 'swadit-primitive-editor',
	templateUrl: './primitive-editor.component.html',
	styleUrls: ['./schema-editor.component.scss']
})
export class PrimitiveEditorComponent implements OnInit 
{
	@Input() schema: any;
	@Input() id: string;
	@Input() wrapClass: string;
	
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

	constructor() 
	{
		this.wrapClass = "";
	}

	ngOnInit() 
	{
		if (this.schema['type'] == "boolean" && this.schema['default'] != undefined && this.obj == undefined) {
			this._obj = this.schema['default']
		}
	}

	isInEnum(s: any): boolean
	{
		if (!s) return true;
		if (!this.schema['enum']) return false;
		let ret = false;
		this.schema['enum'].forEach(o => {
			if (o == s) {
				ret = true;
			}
		});
		return ret;
	}

}
