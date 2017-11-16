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
import { ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ApisService } from '../../shared/services';

@Component({
	selector: 'app-path',
	templateUrl: './path.component.html',
	styleUrls: ['./path.component.scss']
})
export class PathComponent implements OnInit 
{
	private routeSubscription: any;

	path: string;
	method: string;

	sortItems = true;
	filterText: string;

	readonly methods = [ 'get', 'post', 'put', 'delete' ];

	constructor(public apis: ApisService, private modalService: NgbModal, private route: ActivatedRoute) 
	{
		this.routeSubscription = this.route.params.subscribe(params => {
			this.path = params['path'];
			this.method = params['method'];
			if (!this.method) {
				let methods = this.getMethods();
				console.log(this.apis.current['paths'], this.path, methods);
				if (methods.length > 0) {
					this.method = methods[0];
				} else {
					this.method = null;
				}
			}
		});
	}

	ngOnInit() 
	{
		console.log("init", this.method);
		if (!this.method) {
			let methods = this.getMethods();
			console.log(this.apis.current['paths'], this.path, methods);
			if (methods.length > 0) {
				this.method = methods[0];
			} else {
				this.method = null;
			}
		}
	}

	getMethods()
	{
		if (!this.apis.current['paths']) return [];
		let methods = this.apis.keys(this.apis.current['paths'][this.path]);
		return methods;
	}
}
