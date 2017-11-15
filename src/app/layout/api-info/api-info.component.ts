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

import { ApiInfoEditComponent } from './api-info-edit/api-info-edit.component';

@Component({
	selector: 'app-api-info',
	templateUrl: './api-info.component.html',
	styleUrls: ['./api-info.component.scss']
})

export class ApiInfoComponent implements OnInit 
{
	closeResult: string;
	editModal: NgbModalRef;

	constructor(public apis: ApisService, private modalService: NgbModal) 
	{
	}

	ngOnInit() 
	{
	}

	edit()
	{
		console.log("edit()");
		this.editModal = this.modalService.open(ApiInfoEditComponent, ApiInfoEditComponent.modalOptions);
		this.editModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("edit(): " + this.closeResult);
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("edit(): " + this.closeResult);

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
	
	keys(obj: Object)
	{
		return Object.keys(obj);
	}
}
