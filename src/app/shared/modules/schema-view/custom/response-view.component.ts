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

import { Component, Input, OnInit } from '@angular/core';

import * as YAML from 'js-yaml';

import { ApisService } from '../../../services';

@Component({
	selector: 'swadit-response-view',
	templateUrl: './response-view.component.html',
	styleUrls: ['./../schema-view.component.scss']
})
export class ResponseViewComponent implements OnInit {
	@Input() obj: any;

	showGeneratedExample = true;

	constructor(public apis: ApisService) { }

	ngOnInit() {
		this.showGeneratedExample = !this.obj['examples'];
	}

	generateExample(schema: any) {
		return this.apis.toJson(this.apis.generateExample(schema, {}, false, true));
	}
}
