/*	
 * Copyright 2017 Denis Martin.  This file is part of swadit.
 * 
 * swadit is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * swadit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with swadit.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { ApisService } from '../../../services';

/** Shows an OAS3 content object (media types with their schemas and examples). */
@Component({
    selector: 'swadit-content-view',
    templateUrl: './content-view.component.html',
    styleUrls: ['./../schema-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ContentViewComponent
{
	@Input() content: any;
	/** text shown in front of each media type */
	@Input() label: string = "";

	/** media types whose generated example has been shown/hidden by the user */
	generatedExampleToggled: { [mediaType: string]: boolean } = {};

	constructor(public apis: ApisService) { }

	mediaType(key: string): any
	{
		return (this.content && this.content[key]) || {};
	}

	/** the generated example is shown by default if there is no other example */
	showGeneratedExample(key: string): boolean
	{
		if (key in this.generatedExampleToggled) {
			return this.generatedExampleToggled[key];
		}
		const mediaType = this.mediaType(key);
		return mediaType['example'] == null && !mediaType['examples'];
	}

	toggleGeneratedExample(key: string): void
	{
		this.generatedExampleToggled[key] = !this.showGeneratedExample(key);
	}

	generateExample(schema: any): string
	{
		return this.apis.toJson(this.apis.generateExample(schema, {}, false, true));
	}
}
