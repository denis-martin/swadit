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

import { ApisService } from '../../shared/services';
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

	constructor(public apis: ApisService, private modalService: NgbModal) 
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
}
