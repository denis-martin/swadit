import { Component, Input, OnInit } from '@angular/core';

import * as _ from "lodash";

import { ApisService } from '../../services';

@Component({
	selector: 'swadit-schema-view',
	templateUrl: './schema-view.component.html',
	styleUrls: ['./schema-view.component.scss']
})
export class SchemaViewComponent implements OnInit 
{
	@Input() schema: Object;
	@Input() obj: Object;

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
			let schemaKeys = Object.keys(this.schema['properties']);
			let objKeys = Object.keys(this.obj);
			_.remove(schemaKeys, k => { return objKeys.indexOf(k) < 0; });
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
}
