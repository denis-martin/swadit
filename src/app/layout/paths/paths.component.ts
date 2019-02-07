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
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

import { ApisService } from '../../shared/services';
import { ModifyComponent } from '../../shared/modules/editor-modals/modify/modify.component';
import { PathEditComponent } from '../../shared/modules/editor-modals/path-edit/path-edit.component';

@Component({
	selector: 'app-paths',
	templateUrl: './paths.component.html',
	styleUrls: ['./paths.component.scss']
})
export class PathsComponent implements OnInit 
{
	sortItems = true;
	filterText: string;

	readonly methods = [ 'get', 'post', 'put', 'delete' ];

	closeResult: string;
	editModal: NgbModalRef;

	constructor(public apis: ApisService, private modalService: NgbModal, private router: Router) 
	{
	}

	ngOnInit() 
	{
	}

	addPath(event)
	{
		console.log("addPath()");
		if (event) event.stopPropagation();

		this.editModal = this.modalService.open(PathEditComponent, PathEditComponent.modalOptions);
		this.editModal.componentInstance.pathKey = null;
		this.editModal.componentInstance.methodKey = null;
		this.editModal.componentInstance.obj = {};
		this.editModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			//this.path = result.path;
			//this.method = result.method;
			console.info("addPath(): " + this.closeResult);
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("addPath(): " + this.closeResult);

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

	modify(event)
	{
		let self = this;

		console.log("modify()");
		if (event) event.stopPropagation();

		ModifyComponent.open(this.modalService, this.apis.getLength(this.apis.selectedPaths))
			.then((result) => {
				console.info("modify()", result);
				if (result.deprecationSet) {
					for (let p in self.apis.selectedPaths) {
						if (self.apis.current['paths'][p]) {
							for (let m in self.apis.current['paths'][p]) {
								if (m != 'parameters') {
									self.apis.current['paths'][p][m]['deprecated'] = true;
								}
							}
						} else {
							delete self.apis.selectedPaths[p];
						}
					}

				} else if (result.deprecationRemove) {
					for (let p in self.apis.selectedPaths) {
						if (self.apis.current['paths'][p]) {
							for (let m in self.apis.current['paths'][p]) {
								if (m != 'parameters') {
									delete self.apis.current['paths'][p][m]['deprecated'];
								}
							}
						} else {
							delete self.apis.selectedPaths[p];
						}
					}

				}
				
			}, (reason) => {
				this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
				console.warn("modify(): " + this.closeResult);

			});
	}

	routeToPath(path: string)
	{
		this.router.navigate(['/path', path]);
	}
}
