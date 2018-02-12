import { Component, OnInit } from '@angular/core';

import { ApisService } from '../../shared/services';

import { SwaggerUIBundle } from 'swagger-ui-dist';
import { SwaggerUIStandalonePreset } from 'swagger-ui-dist';

@Component({
	selector: 'app-swaggerui',
	templateUrl: './swaggerui.component.html',
	styleUrls: ['./swaggerui.component.scss']
})
export class SwaggerUiComponent implements OnInit 
{
	swaggeruiFrame: any;
	swaggerUi: any;

	constructor(public apis: ApisService) 
	{
		this.apis.eventApiChanged.subscribe(param => {
			this.swaggerUi.getSystem().specActions.updateSpec(JSON.stringify(this.apis.current));
		});
	}

	ngOnInit() 
	{
		this.swaggerUi = new SwaggerUIBundle({
			dom_id: "#swaggerui",
			spec: this.apis.current,
			validatorUrl: null
			/*presets: [
				SwaggerUIBundle.presets.apis,
				SwaggerUIStandalonePreset
			],*/
		});
		window['swaggerUi'] = this.swaggerUi;
	}

}
