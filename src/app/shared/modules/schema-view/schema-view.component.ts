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

import { Component, Input, OnInit, Directive } from '@angular/core';

import * as _ from "lodash";

import { ApisService } from '../../services';

@Directive({
	selector: '[swLet]',
	exportAs: 'swLet'
})
export class LetDirective {
	@Input() values: any = {};
}

@Component({
	selector: 'swadit-schema-view',
	templateUrl: './schema-view.component.html',
	styleUrls: ['./schema-view.component.scss']
})
export class SchemaViewComponent implements OnInit 
{
	@Input() schema: Object;
	@Input() obj: Object;
	@Input() skip: Array<string> = [];

	uncollapsed = {};

	constructor(public apis: ApisService) { }

	ngOnInit() 
	{
	}

	getKeys()
	{
		if (this.schema['additionalProperties'] === true) {
			return Object.keys(this.obj);
		} else {
			const schemaKeys = Object.keys(this.schema['properties']);
			const objKeys = Object.keys(this.obj);
			_.remove(schemaKeys, k => { return objKeys.indexOf(k) < 0; });
			_.remove(schemaKeys, k => { return this.doSkip(k); });
			return schemaKeys;
		}
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

	doSkip(property: string): boolean
	{
		return this.skip.indexOf(property) >= 0;
	}
}
