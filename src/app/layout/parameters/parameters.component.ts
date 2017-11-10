import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ApisService } from '../../shared/services';

import { ParameterEditComponent } from './parameter-edit/parameter-edit.component';

@Component({
	selector: 'app-parameters',
	templateUrl: './parameters.component.html',
	styleUrls: ['./parameters.component.scss']
})
export class ParametersComponent implements OnInit 
{
	uncollapsed = {};
	sortItems = false;
	filterText: string;

	closeResult: string;
	editModal: NgbModalRef;
	
	constructor(public apis: ApisService, private modalService: NgbModal) 
	{
	}

	ngOnInit() 
	{
	}

	keys(obj: Object)
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	edit(event: any = null, def: string = null)
	{
		console.log("edit()", def);
		if (event) event.stopPropagation();

		this.editModal = this.modalService.open(ParameterEditComponent, ParameterEditComponent.modalOptions);
		this.editModal.componentInstance.key = def;
		this.editModal.componentInstance.obj = def ? this.apis.current['parameters'][def] : {};
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
}
