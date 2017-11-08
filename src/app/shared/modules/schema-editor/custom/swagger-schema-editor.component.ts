import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { ApisService } from '../../../services';

@Component({
	selector: 'swadit-swagger-schema-editor',
	templateUrl: './swagger-schema-editor.component.html',
	styleUrls: ['./swagger-schema-editor.component.scss']
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

	constructor(public apis: ApisService) { }

	ngOnInit() {
	}

	keys(obj) {
		return Object.keys(obj);
	}

}
