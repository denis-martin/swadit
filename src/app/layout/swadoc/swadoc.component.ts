import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApisService } from '../../shared/services';

@Component({
    selector: 'app-swadoc',
    templateUrl: './swadoc.component.html',
    styleUrls: ['./swadoc.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SwadocComponent implements OnInit {

	constructor(public apis: ApisService) 
	{
		window['Swadit'] = this.apis;

		this.apis.eventApiChanged.pipe(takeUntilDestroyed()).subscribe(param => {
			this.apis.createBlobUrl();
			const swadocFrame = document.getElementById("swadocFrame");
			// the frame may not be loaded yet (it gets the current API on load)
			if (swadocFrame && swadocFrame['contentWindow'] && swadocFrame['contentWindow']['Swadoc']) {
				swadocFrame['contentWindow']['Swadoc'].openFile(null, this.apis.blob);
			}
		});
	}

	ngOnInit() 
	{
		this.apis.createBlobUrl();
	}

}
