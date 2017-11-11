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
}