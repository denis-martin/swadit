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

@Component({
	selector: 'swadit-extensions-view',
	templateUrl: './extensions-view.component.html',
	styleUrls: ['./../schema-view.component.scss']
})
export class ExtensionsViewComponent implements OnInit {
	@Input() obj: any;

	constructor() { }

	ngOnInit() {
	}

	getAdditionalKeys(obj: Object): Array<string>
	{
		if (obj == null) return null;
		const res: Array<string> = [];
		Object.keys(obj).forEach(k => {
			if (k.startsWith("x-")) {
				res.push(k);
			}
		});
		if (res.length > 0) {
			return res;
		} else {
			return null;
		}
	}

	isComplex(obj: any): boolean
	{
		return !(typeof obj == 'number' || typeof obj == 'string');
	}

	toYaml(obj: Object): string
	{
		return YAML.dump(obj);
	}
}
