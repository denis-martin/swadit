import { Component, OnInit } from '@angular/core';
import { NgbModalOptions, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as FileSaver from 'file-saver';

@Component({
	selector: 'app-file-modal',
	templateUrl: './file-modal.component.html',
	styleUrls: ['./file-modal.component.scss']
})
export class FileModalComponent implements OnInit 
{
    static readonly modalOptions: NgbModalOptions = {
		//size: "sm"
	}
	
	dialogType: string = "fileOpen";
	addSource: boolean = false;
	blob: Blob;
	fileName: string;
	modalHint: string = "";
	files: FileList | null;
	validationErrors: boolean = null;

	get modalTitle(): string
	{
		if (this.dialogType == "fileOpen") {
			return "Open file...";
		} else if (this.dialogType == "fileDownload") {
			return "Download file...";
		} else if (this.dialogType == "fileAdd") {
			return "Add files...";
		} else {
			return "Unknown dialogType";
		}
	}

	constructor(public activeModal: NgbActiveModal) { }

	ngOnInit(): void {
		// nothing
	}

    ok(): void
    {
		if (this.dialogType == "fileOpen" || this.dialogType == "fileAdd") {
			console.log("fileModal addSource", this.addSource)
			this.activeModal.close({ files: this.files, addSource: this.addSource });
		} else {
			FileSaver.saveAs(this.blob, this.fileName);
			this.activeModal.close(this.fileName);
		}
	}
	
	onFileChange(event: Event): void
	{
		const element = event.target as HTMLInputElement;
		this.files = element.files;
	}
}
