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

import { Component, OnInit } from '@angular/core';

import { ApisService } from '../../shared/services';

@Component({
	selector: 'app-source',
	templateUrl: './source.component.html',
	styleUrls: ['./source.component.scss']
})
export class SourceComponent implements OnInit 
{
	text: string = "";
	options: any = { printMargin: true };
	message: string = null;
	validationPassed: boolean = null;
	applied: boolean = null;
	skipReset: boolean = false;

	constructor(public apis: ApisService)
	{
		this.apis.eventApiChanged.subscribe(param => {
			this.revert();
		});
	}

	ngOnInit() 
	{
		this.revert();
	}

	onChange(text)
	{
		//console.log(text);
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
				self.apis.hasLoadingErrors = false;
				self.apis.current = api;
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
