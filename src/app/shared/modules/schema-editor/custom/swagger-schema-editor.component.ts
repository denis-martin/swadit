import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { ApisService } from '../../../services';

@Component({
	selector: 'swadit-swagger-schema-editor',
	templateUrl: './swagger-schema-editor.component.html',
	styleUrls: [
		'./../schema-editor.component.scss',
		'./swagger-schema-editor.component.scss'
	]
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

	itemsVisible = false;
	uncollapsed = [];
	propertyToAdd: string;
	addPropertyError = "";

	constructor(public apis: ApisService) { }

	ngOnInit() {
	}

	keys(obj) 
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	trackByIndex(index: any, item: any) 
	{
		return index;
	}

	addProperty(event: any)
	{
		event.preventDefault();
		console.log("addProperty", this.propertyToAdd);
		if (!this.propertyToAdd) {
			this.addPropertyError = "Please enter a property name";
			return;
		}
		if (!this.obj['properties']) {
			this.obj['properties'] = {};
		}
		if (this.obj['properties'].hasOwnProperty(this.propertyToAdd)) {
			this.addPropertyError = "Property already exists";
			return;
		}
		this.addPropertyError = "";
		
		this.obj['properties'][this.propertyToAdd] = { 'type': 'string' };
		this.propertyToAdd = null;
	}

	deleteProperty(event: any, propKey: string)
	{
		event.preventDefault();
		console.log("deleteProperty", propKey);
		delete this.obj['properties'][propKey];
	}

	changeProperty(newPropKey: any, propKey: string)
	{
		if (newPropKey && newPropKey != propKey) {
			this.apis.renameObjectKey(this.obj['properties'], propKey, newPropKey);
		}
	}

	propertyIsRequired(propKey)
	{
		return this.obj['required'] && this.obj['required'].indexOf(propKey) >= 0;
	}

	changePropertyIsRequired(propKey)
	{
		if (this.propertyIsRequired(propKey)) {
			this.obj['required'].splice(this.obj['required'].indexOf(propKey), 1);
		} else {
			if (!this.obj['required']) {
				this.obj['required'] = [];
			}
			this.obj['required'].push(propKey);
		}
	}
}
