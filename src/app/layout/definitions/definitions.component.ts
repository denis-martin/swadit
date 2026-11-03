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

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ApisService } from '../../shared/services';

import { DefinitionEditComponent } from '../../shared/modules/editor-modals/definition-edit/definition-edit.component';
import { ParameterEditComponent } from '../../shared/modules/editor-modals/parameter-edit/parameter-edit.component';
import { ResponseEditComponent } from '../../shared/modules/editor-modals/response-edit/response-edit.component';
import { RequestBodyEditComponent } from '../../shared/modules/editor-modals/request-body-edit/request-body-edit.component';

/** the edit dialogs of the component types (see ApisService.getDefCategories()) */
const editComponents = {
	'definitions': DefinitionEditComponent,
	'schemas': DefinitionEditComponent,
	'parameters': ParameterEditComponent,
	'responses': ResponseEditComponent,
	'requestBodies': RequestBodyEditComponent
};

@Component({
    selector: 'app-definitions',
    templateUrl: './definitions.component.html',
    styleUrls: ['./definitions.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DefinitionsComponent implements OnInit 
{
	uncollapsedDef = {};
	sortItems = false;
	filterText: string;

	closeResult: string;
	editModal: NgbModalRef;

	defCat = "schemas";
	
	constructor(public apis: ApisService, private modalService: NgbModal) 
	{
		this.apis.eventApiChanged.pipe(takeUntilDestroyed()).subscribe(() => {
			this.initDefCat();
		});
	}

	ngOnInit(): void
	{
		this.initDefCat();
	}

	initDefCat(): void
	{
		if (!this.apis.getDefCategories().includes(this.defCat)) {
			if (this.apis.isOas2) {
				this.defCat = "definitions";
			} else if (this.apis.isOas3) {
				this.defCat = "schemas";
			}
		}
	}

	keys(obj: Object): Array<string>
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	edit(event: any = null, def: string = null): void
	{
		console.log("edit()", def);
		if (event) event.stopPropagation();

		const editComponent = editComponents[this.defCat];
		if (!editComponent) {
			console.warn("Not yet implemented: edit for components of type " + this.defCat);
			return;
		}

		this.editModal = this.modalService.open(editComponent, editComponent.modalOptions);
		this.editModal.componentInstance.key = def;
		this.editModal.componentInstance.obj = def ? this.apis.getComponents(this.defCat)[def] : {};
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
