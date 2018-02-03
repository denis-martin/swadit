/*	
 * Copyright 2018 Denis Martin.  This file is part of swadit.
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

import { Component, OnInit, Input } from '@angular/core';

import { ApisService } from '../../../shared/services';

const maxLevel = 20;

@Component({
	selector: 'schema-print-view',
	templateUrl: './schema-print-view.component.html',
	styleUrls: ['./schema-print-view.component.scss']
})
export class SchemaPrintViewComponent implements OnInit 
{
	@Input() type: string;
	@Input() schema: Object; // assumes dereferenced schema
	flatProperties: Array<object> = [];
	example: string;

	constructor(public apis: ApisService) { }

	ngOnInit() 
	{
		this.flattenObject(this.schema, 0);
		this.example = '```json\n' + this.apis.toJson(this.apis.generateExample(this.schema)) + '\n```';
	}

	flattenObject = function(schema, level)
	{
		let _schema = schema;
		if (schema['type'] == 'array') {
			_schema = schema['items'];
		}
		if (_schema['type'] != 'object' || !_schema['properties']) {
			return;
		}
		if (level > maxLevel) {
			console.warn("schema-print-view:flattenObject(): exceeding max level (" + maxLevel + ")");
			return;
		}
		Object.keys(_schema['properties']).forEach(k => {
			let v = _schema['properties'][k];
			let required = _schema['required'] ? _schema['required'].indexOf(k)>-1 : false;
			this.flatProperties.push({ "prop": k, "def": v, "level": level, "required": required });
			if (v.type=='object') {
				this.flattenObject(v, level+1);
			} else if (v.type=='array' && v.items.type=='object') {
				this.flattenObject(v.items, level+1);
			}
		});
	}

	getCountArray(n)
	{
		return new Array(n);
	}
}
