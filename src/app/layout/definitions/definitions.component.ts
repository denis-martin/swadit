import { Component, OnInit } from '@angular/core';

import { ApisService } from '../../shared/services';

@Component({
	selector: 'app-definitions',
	templateUrl: './definitions.component.html',
	styleUrls: ['./definitions.component.scss']
})
export class DefinitionsComponent implements OnInit 
{
	uncollapsedDef = {};
	
	constructor(public apis: ApisService) 
	{
	}

	ngOnInit() 
	{
	}

	keys(obj: Object)
	{
		if (!obj) return [];
		return Object.keys(obj);
	}
}
