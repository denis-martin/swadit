import { Component, OnInit } from '@angular/core';

import { ApisService } from '../../shared/services';

@Component({
	selector: 'app-swadoc',
	templateUrl: './swadoc.component.html',
	styleUrls: ['./swadoc.component.scss']
})
export class SwadocComponent implements OnInit {

	constructor(public apis: ApisService) 
	{
		window['Swadit'] = this.apis;

		this.apis.eventApiChanged.subscribe(param => {
			this.apis.createBlobUrl();
			let swadocFrame = document.getElementById("swadocFrame");
			swadocFrame['contentWindow']['Swadoc'].openFile(null, this.apis.blob);
		});
	}

	ngOnInit() 
	{
		this.apis.createBlobUrl();
	}

}
