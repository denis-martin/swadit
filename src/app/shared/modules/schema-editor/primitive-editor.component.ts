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
