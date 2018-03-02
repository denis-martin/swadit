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
	selector: 'swadit-swagger-schema-view',
	templateUrl: './swagger-schema-view.component.html',
	styleUrls: ['./../schema-view.component.scss']
})
export class SwaggerSchemaViewComponent implements OnInit 
{
	@Input() obj: Object;
	@Input() generateExample: boolean = false;

	uncollapsed = {};

	constructor(public apis: ApisService) { }

	ngOnInit() 
	{
	}

	keys(obj: Object)
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	isComplex(obj: any): boolean
	{
		return !(typeof obj == 'number' || typeof obj == 'string' || typeof obj == 'boolean');
	}

	toJson(obj: any): string
	{
		return JSON.stringify(obj, null, 2);
	}

	propertyIsRequired(propKey)
	{
		return this.obj['required'] && this.obj['required'].indexOf(propKey) >= 0;
	}

	getTypePreview(obj: any): string
	{
		let tp: string = "";
		if (Array.isArray(obj["allOf"]) && obj["allOf"].length > 0) {
			obj = obj["allOf"][0];
		}
		
		tp = obj['type'] || obj['$ref'];
		if (obj['type'] == 'array' && obj['items']) {
			tp = tp + " (" + obj['items']['type'] || obj['items']['$ref'] + ")";
		}
		if (obj['format']) {
			tp = tp + " (" + obj['format'] + ")";
		}
		if (obj['readOnly']) {
			tp = tp + " read only";
		}
		return tp;
	}
}
