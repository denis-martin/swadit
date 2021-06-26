import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbModalRef, NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-modify',
	templateUrl: './modify.component.html',
	styleUrls: ['./modify.component.scss']
})
export class ModifyComponent implements OnInit
{
	static readonly modalOptions: NgbModalOptions = {
		size: "sm"
	}

	pathCount = 0;
	params = {
		deprecationSet: false,
		deprecationRemove: false
	}

	constructor(public activeModal: NgbActiveModal) { }

	ngOnInit() {
	}

	ok()
	{
		this.activeModal.close(this.params);
	}

	public static open(modalService: NgbModal, pathCount: number): any
	{
		const modal = modalService.open(ModifyComponent, ModifyComponent.modalOptions);
		modal.componentInstance.pathCount = pathCount;
		return modal.result;
	}

	deprecate(deprecate: boolean)
	{
		if (deprecate) {
			this.params.deprecationSet = true;
			this.params.deprecationRemove = false;
		} else {
			this.params.deprecationSet = false;
			this.params.deprecationRemove = true;
		}
	}
}
