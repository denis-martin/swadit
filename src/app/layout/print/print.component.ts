/*	
 * Copyright 2018 Denis Martin.  This file is part of swadit.
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
	selector: 'app-print',
	templateUrl: './print.component.html',
	styleUrls: ['../../../assets/swadoc/style.css', './print.component.scss']
})
export class PrintComponent implements OnInit
{
	api: any = null; // dereferenced API object
	err: any = null;

	constructor(public apis: ApisService)
	{
		this.apis.eventApiChanged.subscribe(param => {
			console.warn("PrintComponent: API changed event (nyi)");
		});
	}

	ngOnInit() {
		this.apis.validate(this.apis.current)
			.then(api => this.api = api)
			.catch(err => this.err = err);
	}

	print()
	{
		var contentToPrint = document.getElementById('contentToPrint').innerHTML;

		if (window) {
			var popup = window.open('', '_blank', 
				'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
			popup.window.focus();

			popup.document.open();
			popup.document.write('<!DOCTYPE html><html><head>' +
				'<link rel="stylesheet" href="/assets/swadoc/style.css">' +
				'</head><body onload="window.print()">' +
				contentToPrint + 
				'</html>');
			popup.document.close();

			popup.onabort = function (event) {
				popup.close();
			}

		} else {
			console.error("'window' is not defined")
		}

		return false; // prevent page reload
	}

	keys(obj: Object)
	{
		return Object.keys(obj);
	}

	getPathAnchor(path)
	{
		return path.replace(/\//g, "-");
	}
}
