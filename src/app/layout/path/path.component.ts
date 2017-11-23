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

import { Component, OnInit, Directive } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import * as _ from "lodash";

import { ApisService } from '../../shared/services';
import { PathEditComponent } from '../../shared/modules/editor-modals/path-edit/path-edit.component';

@Component({
	selector: 'app-path',
	templateUrl: './path.component.html',
	styleUrls: ['./path.component.scss']
})
export class PathComponent implements OnInit {
	private routeSubscription: any;

	path: string;
	method: string;

	sortItems = true;
	filterText: string;
	uncollapsedResponse = {};
	uncollapsedParameter = {};

	closeResult: string;
	editModal: NgbModalRef;

	constructor(public apis: ApisService, private modalService: NgbModal,
		private route: ActivatedRoute, private router: Router) {
		this.routeSubscription = this.route.params.subscribe(params => {
			this.path = params['path'];
			this.method = params['method'];
			if (!this.method) {
				let methods = this.getMethods();
				//console.log(this.apis.current['paths'], this.path, methods);
				if (methods.length > 0) {
					this.method = methods[0];
				} else {
					this.method = null;
				}
			}
		});
		this.apis.eventApiChanged.subscribe(param => {
			if (!this.apis.current['paths'][this.path]) {
				this.path = "";
				this.method = "";
				if (this.router.url.startsWith("/path")) {
					this.router.navigate(['/api-info']);
				}
			} else if (this.method && !this.apis.current['paths'][this.path][this.method]) {
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

	ngOnInit() {
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

	getMethods(): Array<string> {
		if (!this.apis.current['paths']) return [];
		let methods = this.apis.keys(this.apis.current['paths'][this.path]);
		_.pull(methods, "parameters");
		return methods;
	}

	getParameters(path: string, method: string): Array<any> {
		let params: Array<any> = [];
		if (this.apis.current['paths'][path]['parameters']) {
			params.push.apply(params, this.apis.current['paths'][path]['parameters']);
		}
		if (this.apis.current['paths'][path][method]['parameters']) {
			params.push.apply(params, this.apis.current['paths'][path][method]['parameters']);
		}
		return params;
	}

	resolveObj(obj: any)
	{
		return new Promise((resolve, reject) => {
			resolve(this.apis.resolveObj(obj));
		});
	}

	editPath(event: any = null, path: string = null, method: string = null) {
		console.log("editPath()");
		if (event) event.stopPropagation();

		this.editModal = this.modalService.open(PathEditComponent, PathEditComponent.modalOptions);
		this.editModal.componentInstance.pathKey = path;
		this.editModal.componentInstance.methodKey = method;
		this.editModal.componentInstance.obj = path && method ? this.apis.current['paths'][path][method] : {};
		this.editModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			this.path = result.path;
			this.method = result.method;
			console.info("edit(): " + this.closeResult);
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("edit(): " + this.closeResult);

        });
	}

	editResponse(event, resp) {
		console.log("editResponse()", resp);
		if (event) event.stopPropagation();

		alert("Not yet implemented");
	}

	editParameter(event, paramObj) {
		console.log("editParameter()", paramObj);
		if (event) event.stopPropagation();

		alert("Not yet implemented");
	}

	private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return  `with: ${reason}`;
        }
	}
}
