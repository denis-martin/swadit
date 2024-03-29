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

import { pull as _pull } from "lodash-es";

import { ApisService } from '../../shared/services';
import { PathEditComponent } from '../../shared/modules/editor-modals/path-edit/path-edit.component';
import { ResponseEditComponent } from '../../shared/modules/editor-modals/response-edit/response-edit.component';
import { ParameterEditComponent } from '../../shared/modules/editor-modals/parameter-edit/parameter-edit.component';

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

	editModal: NgbModalRef;

	constructor(public apis: ApisService, private modalService: NgbModal,
		private route: ActivatedRoute, private router: Router) 
	{
		this.apis.activePath = this.path;
		
		this.routeSubscription = this.route.params.subscribe(params => {
			this.path = params['path'];
			this.method = params['method'];
			if (!this.method) {
				const methods = this.getMethods();
				//console.log(this.apis.current['paths'], this.path, methods);
				if (methods.length > 0) {
					this.method = methods[0];
				} else {
					this.method = null;
				}
			}

			this.apis.activePath = this.path;
		});
		this.apis.eventApiChanged.subscribe(param => {
			if (!this.apis.current['paths'][this.path]) {
				this.path = "";
				this.method = "";
				if (this.router.url.startsWith("/path")) {
					this.router.navigate(['/api-info']);
				}
			} else if (this.method && !this.apis.current['paths'][this.path][this.method]) {
				const methods = this.getMethods();
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
			const methods = this.getMethods();
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
		const methods = this.apis.keys(this.apis.current['paths'][this.path]);
		_pull(methods, "parameters");
		return methods;
	}

	getParameters(path: string, method: string): Array<any> {
		const params: Array<any> = [];
		if (this.apis.current['paths'][path]['parameters']) {
			// eslint-disable-next-line prefer-spread
			params.push.apply(params, this.apis.current['paths'][path]['parameters']);
		}
		if (this.apis.current['paths'][path][method]['parameters']) {
			// eslint-disable-next-line prefer-spread
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
			this.path = result.path;
			this.method = result.method;
			console.info("editPath(): " + result);
			
        }, (reason) => {
			console.warn("editPath(): " + reason);

        });
	}

	editResponse(event, path, method, respKey) {
		console.log("editResponse()", respKey);
		if (event) event.stopPropagation();

		this.editModal = this.modalService.open(ResponseEditComponent, ResponseEditComponent.modalOptions);
		this.editModal.componentInstance.pathMode = true;
		this.editModal.componentInstance.parent = this.apis.current['paths'][path][method];
		this.editModal.componentInstance.key = respKey;
		this.editModal.componentInstance.obj = respKey ? this.apis.current['paths'][path][method]['responses'][respKey] : {};
		this.editModal.result.then((result) => {
			console.info("editResponse(): " + result);
			
        }, (reason) => {
			console.warn("editResponse(): " + reason);

        });
	}

	editParameter(event, paramObj = null, allMethods = false) {
		console.log("editParameter()", paramObj);
		if (event) event.stopPropagation();

		this.editModal = this.modalService.open(ParameterEditComponent, ParameterEditComponent.modalOptions);
		this.editModal.componentInstance.pathMode = true;
		this.editModal.componentInstance.allMethods = allMethods;
		this.editModal.componentInstance.key = null;
		this.editModal.componentInstance.obj = paramObj;
		this.editModal.result.then((result) => {
			console.info("editParameter(): " + result);
			// add new parameter
			if (!paramObj) {
				if (result.allMethods) {
					if (!this.apis.current['paths'][this.path]['parameters']) {
						this.apis.current['paths'][this.path]['parameters'] = [];
					}
					this.apis.current['paths'][this.path]['parameters'].push(result.obj);
				} else {
					if (!this.apis.current['paths'][this.path][this.method]['parameters']) {
						this.apis.current['paths'][this.path][this.method]['parameters'] = [];
					}
					this.apis.current['paths'][this.path][this.method]['parameters'].push(result.obj);
				}
			}
			// search previous location of existing parameter & delete parameter if desired
			let mi = -1;
			let pi = -1;
			if (this.apis.current['paths'][this.path][this.method]['parameters']) {
				this.apis.current['paths'][this.path][this.method]['parameters'].forEach((p, i) => {
					if (p == result.obj) {
						if (result.delete) {
							this.apis.current['paths'][this.path][this.method]['parameters'].splice(i, 1);
						} else {
							mi = i;
						}
					}
				});
			}
			if (this.apis.current['paths'][this.path]['parameters']) {
				this.apis.current['paths'][this.path]['parameters'].forEach((p, i) => {
					if (p == result.obj) {
						if (result.delete) {
							this.apis.current['paths'][this.path]['parameters'].splice(i, 1);
						} else {
							pi = i;
						}
					}
				});
			}
			if (!result.delete) {
				// change location of existing parameter if necessary
				if (result.allMethods && mi >= 0 && pi < 0) {
					this.apis.current['paths'][this.path][this.method]['parameters'].splice(mi, 1);
					if (!this.apis.current['paths'][this.path]['parameters']) {
						this.apis.current['paths'][this.path]['parameters'] = [];
					}
					this.apis.current['paths'][this.path]['parameters'].push(result.obj);
				} else if (!result.allMethods && mi < 0 && pi >= 0) {
					this.apis.current['paths'][this.path]['parameters'].splice(pi, 1);
					if (!this.apis.current['paths'][this.path][this.method]['parameters']) {
						this.apis.current['paths'][this.path][this.method]['parameters'] = [];
					}
					this.apis.current['paths'][this.path][this.method]['parameters'].push(result.obj);
				}
			}
			// clean up 'parameters' if necessary
			if (this.apis.current['paths'][this.path]['parameters'] && this.apis.current['paths'][this.path]['parameters'].length == 0) {
				delete this.apis.current['paths'][this.path]['parameters'];
			}
			if (this.apis.current['paths'][this.path][this.method]['parameters'] && this.apis.current['paths'][this.path][this.method]['parameters'].length == 0) {
				delete this.apis.current['paths'][this.path][this.method]['parameters'];
			}
			
        }, (reason) => {
			console.warn("editParameter(): " + reason);

        });
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

	generateExample(schema: any): any {
		return this.apis.toJson(this.apis.generateExample(schema, {}, false, true));
	}
}
