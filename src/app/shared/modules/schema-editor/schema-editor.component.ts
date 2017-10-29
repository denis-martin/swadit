import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { PrimitiveEditorComponent } from './primitive-editor.component';
import { ObjectEditorComponent } from './object-editor.component';
import { ArrayEditorComponent } from './array-editor.component';

@Component({
	selector: 'swadit-schema-editor',
	templateUrl: './schema-editor.component.html',
	styleUrls: ['./schema-editor.component.scss']
})
export class SchemaEditorComponent implements OnInit 
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

	constructor() { }

	ngOnInit() {
	}

}
