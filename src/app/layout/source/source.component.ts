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

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApisService } from '../../shared/services';

@Component({
    selector: 'app-source',
    templateUrl: './source.component.html',
    styleUrls: ['./source.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SourceComponent implements OnInit 
{
	text: string = "";
	// no Ace worker: the API is validated by swadit (and the worker scripts are not deployed)
	options: any = { printMargin: true, useWorker: false };
	message: string = null;
	validationPassed: boolean = null;
	applied: boolean = null;
	skipReset: boolean = false;
	// the API is changed by this component (keep the text as it is)
	private applying: boolean = false;
	// the API shown and whether the user has changed its text
	private shownApi: any = null;
	private modified: boolean = false;

	constructor(public apis: ApisService)
	{
		this.apis.eventApiChanged.pipe(takeUntilDestroyed()).subscribe(param => {
			// the event is also sent when the validation of a loaded API is done; keep the changes of the user then
			const sameApiModified = this.apis.current === this.shownApi && this.modified;
			if (!this.applying && !sameApiModified) {
				this.revert();
			}
		});
	}

	ngOnInit() 
	{
		this.revert();
	}

	onChange(text)
	{
		this.modified = true;
		if (!this.skipReset) {
			this.validationPassed = null;
			this.applied = null;
		} else {
			this.skipReset = false;
		}
	}

	revert()
	{
		if (this.apis.current) {
			this.shownApi = this.apis.current;
			this.modified = false;
			this.text = this.apis.hasLoadingErrors ? this.apis.lastLoaded : this.apis.toYaml(this.apis.current);
			this.skipReset = true;
			this.validate();
		}
	}

	apply()
	{
		const self = this;
		self.validationPassed = null;
		self.applied = null;
		this.apis.validateStr(this.text)
			.then(api => {
				self.message = null;
				self.validationPassed = true;
				self.applied = true;
				// updates the spec version and notifies the other components
				self.applying = true;
				self.apis.replaceCurrent(api);
				self.applying = false;
			})
			.catch(msg => {
				self.message = msg;
				self.validationPassed = false;
				self.applied = null;
			});
	}

	validate()
	{
		const self = this;
		self.validationPassed = null;
		self.applied = null;
		this.apis.validateStr(this.text)
			.then(api => {
				self.message = null;
				self.validationPassed = true;
			})
			.catch(msg => {
				self.message = msg;
				self.validationPassed = false;
			});
	}
}
