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
