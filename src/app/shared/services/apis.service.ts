import { Injectable } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { Spec as Swagger } from 'swagger-schema-official';
import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'js-yaml';

import { FileModalComponent } from '../components/file-modal/file-modal.component';

import * as Swagger20SchemaRoot from '../schemas/2.0/swagger-root.json';
import * as Swagger20SchemaInfo from '../schemas/2.0/swagger-info.json';
import * as Swagger20SchemaContact from '../schemas/2.0/swagger-contact.json';
import * as Swagger20SchemaLicense from '../schemas/2.0/swagger-license.json';
import * as Swagger20SchemaExternalDocs from '../schemas/2.0/swagger-externalDocs.json';
import * as Swagger20SchemaTags from '../schemas/2.0/swagger-tags.json';
import * as Swagger20SecurityDefinitions from '../schemas/2.0/swagger-securityDefinitions.json';
import * as Swagger20Security from '../schemas/2.0/swagger-security.json';

@Injectable()
export class ApisService 
{
	private readonly _schemas = 
	{
		"2.0": {
			root: Swagger20SchemaRoot,
			info: Swagger20SchemaInfo,
			contact: Swagger20SchemaContact,
			license: Swagger20SchemaLicense,
			externalDocs: Swagger20SchemaExternalDocs,
			tags: Swagger20SchemaTags,
			securityDefinitions: Swagger20SecurityDefinitions,
			security: Swagger20Security
		}
	};

	get schemas()
	{
		if (this.current['swagger'] == "2.0") {
			return this._schemas["2.0"];
		}
		return null;
	}

	public current: Object = { 
		swagger: "2.0",
		info: { 
			title: "My new API",
			version: "1.0"
		},
		paths: {}
	}
	public currentFileName: string = "swagger.yaml";

	closeResult: string;
	fileModal: NgbModalRef;
	blob: Blob;
	blobUrl: string;

	constructor(private modalService: NgbModal) 
	{
		console.info("APIs service initialized");
		this.openFile("assets/petstore.yaml", null);
	}

	openFile(pathName: string, fobj)
	{
		//Swadit.thinking = "Loading file...";
		this.current = {};
		if (pathName) {
			SwaggerParser.parse(pathName)
				.then(api => { this.swaggerLoaded(api); })
				.catch(err => { this.swaggerLoadingError(err); });
		} else {
			let apis = this;
			let reader = new FileReader();
			reader.onloadend = function(e) {
				try {
					SwaggerParser.parse(YAML.load(reader.result))
						.then(api => { apis.swaggerLoaded(api, fobj.name); })
						.catch(err => { apis.swaggerLoadingError(err); });
				} catch (ex) {
					apis.swaggerLoadingError(ex);
				}
			}
			reader.readAsText(fobj);
		}
	}

	swaggerLoaded(api, fileName: string = null) 
	{
		console.log("swaggerLoaded");
		this.current = api;
		this.currentFileName = fileName ? fileName : "swagger.yaml";
	}

	swaggerLoadingError(err)
	{
		console.log("error loading yaml: ", err)
		alert("Error loading YAML: " + err);
	}

	toYaml(obj: Object): string
	{
		return YAML.dump(obj);
	}

	hasExtensions(obj: Object): boolean
	{
		if (obj == null) return false;
		for (let k of Object.keys(obj)) {
			if (k.startsWith("x-")) {
				return true;
			}
		}
		return false;
	}

	propertyIsRequired(schema: any, property: string): boolean
	{
		if (schema.required == null) return false;
		for (let rp of schema.required) {
			if (rp == property) return true;
		}
		return false;
	}

	cleanUp(schema: any, api: any)
	{
		if (!api) return;

		if (schema['type'] == 'object') {
			if (schema['properties']) {
				Object.keys(schema['properties']).forEach(p => {
					if (api[p] != null) {
						this.cleanUp(schema['properties'][p], api[p]);
						if (schema['properties'][p]['type'] == 'array') {
							if (api[p].length == 0 && !this.propertyIsRequired(schema, p)) {
								delete api[p];
							}
						}
						if (schema['properties'][p]['type'] == 'object') {
							if (Object.keys(api[p]).length == 0 && !this.propertyIsRequired(schema, p)) {
								delete api[p];
							}
						}
						if (schema['properties'][p]['type'] == 'string') {
							if (api[p] == "") {
								delete api[p];
							}
						}
					} else {
						delete api[p];
					}
				});
			} else if (schema['additionalProperties']) {
				Object.keys(api).forEach(p => {
					if (api[p] != null) {
						this.cleanUp(schema['additionalProperties'], api[p]);
						// we allow additional properties with empty values
					} else {
						delete api[p];
					}
				});
			}
		} else if (schema['type'] == 'array') {
			api.forEach(item => {
				this.cleanUp(schema['items'], item);
			});
		}
	}

	createBlobUrl()
	{
		let content = YAML.dump(this.current);
		this.blob = new Blob([ content ], { type : 'text/plain' });
		if (this.blobUrl != '') {
			window.URL.revokeObjectURL(this.blobUrl);
		}
		this.blobUrl = window.URL.createObjectURL(this.blob);
		console.log("Download URL: " + this.blobUrl);
	}

	newFile()
	{
		this.current = { 
			swagger: "2.0",
			info: { 
				title: "My new API",
				version: "1.0"
			},
			paths: {}
		}
		this.currentFileName = "swagger.yaml";
	}

	openFileModal()
	{
		console.log("openFileModal()");
		this.fileModal = this.modalService.open(FileModalComponent, FileModalComponent.modalOptions);
		this.fileModal.componentInstance.dialogType = "fileOpen";
		this.fileModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("openFileModal(): " + this.closeResult);
			if (result.length > 0) {
				this.openFile(null, result[0]);
			}
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("openFileModal(): " + this.closeResult);

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
	
	downloadFileModal()
	{
		console.log("downloadFileModal()");
		this.createBlobUrl();
		this.fileModal = this.modalService.open(FileModalComponent, FileModalComponent.modalOptions);
		this.fileModal.componentInstance.dialogType = "fileDownload";
		this.fileModal.componentInstance.blob = this.blob;
		this.fileModal.componentInstance.fileName = this.currentFileName;
		this.fileModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("downloadFileModal(): " + this.closeResult);
			this.currentFileName = result;
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("downloadFileModal(): " + this.closeResult);

        });
	}

	addFilesModal()
	{
		alert('Not yet implemented');
	}

	filterList(list: Array<string>, filterText: string, sorted: boolean = false): Array<string>
	{
		let filteredList = list;
		if (filterText) {
			let fl = filterText.toLowerCase();
			filteredList = list.filter(s => {
				let sl = s.toLowerCase();
				return sl.indexOf(fl) > -1;
			});
		}
		if (sorted) {
			return filteredList.sort();
		} else {
			return filteredList;
		}
	}

	// TODO
	resolveRef(ref: string)
	{
		if (ref.startsWith("#/definitions/")) {
			let refParts = ref.split('/');
			return this.current['definitions'][refParts[2]];
		}
		return null;
	}
}
