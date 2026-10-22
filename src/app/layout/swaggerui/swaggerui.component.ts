import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { ApisService } from '../../shared/services';

// provided as globals by the swagger-ui-dist scripts in angular.json
declare const SwaggerUIBundle: any;
declare const SwaggerUIStandalonePreset: any;

@Component({
    selector: 'app-swaggerui',
    templateUrl: './swaggerui.component.html',
    styleUrls: ['./swaggerui.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
