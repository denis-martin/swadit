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

import { Injectable } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs/Subject';

import { Spec as Swagger } from 'swagger-schema-official';
import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'js-yaml';
import * as _ from "lodash";

import { FileModalComponent } from '../components/file-modal/file-modal.component';

import * as Swagger20SchemaRoot from '../schemas/2.0/swagger-root.json';
import * as Swagger20SchemaInfo from '../schemas/2.0/swagger-info.json';
import * as Swagger20SchemaContact from '../schemas/2.0/swagger-contact.json';
import * as Swagger20SchemaLicense from '../schemas/2.0/swagger-license.json';
import * as Swagger20SchemaExternalDocs from '../schemas/2.0/swagger-externalDocs.json';
import * as Swagger20SchemaTags from '../schemas/2.0/swagger-tags.json';
import * as Swagger20SchemaSecurityDefinitions from '../schemas/2.0/swagger-securityDefinitions.json';
import * as Swagger20SchemaSecurity from '../schemas/2.0/swagger-security.json';
import * as Swagger20SchemaSchema from '../schemas/2.0/swagger-schema.json';
import * as Swagger20SchemaParameterBody from '../schemas/2.0/swagger-parameterBody.json';
import * as Swagger20SchemaParameterNonBody from '../schemas/2.0/swagger-parameterNonBody.json';
import * as Swagger20SchemaResponse from '../schemas/2.0/swagger-response.json';
import * as Swagger20SchemaOperation from '../schemas/2.0/swagger-operation.json';
import * as Swagger20SchemaHeader from '../schemas/2.0/swagger-header.json';

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
			securityDefinitions: Swagger20SchemaSecurityDefinitions,
			security: Swagger20SchemaSecurity,
			schema: Swagger20SchemaSchema,
			parameterBody: Swagger20SchemaParameterBody,
			parameterNonBody: Swagger20SchemaParameterNonBody,
			response: Swagger20SchemaResponse,
			operation: Swagger20SchemaOperation,
			header: Swagger20SchemaHeader
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

	private _eventApiChanged = new Subject<string>();
	eventApiChanged = this._eventApiChanged.asObservable();

	selectedPaths = {};
	activePath: string;

	closeResult: string;
	fileModal: NgbModalRef;
	blob: Blob;
	blobUrl: string;

	methodKeys = ["get", "post", "put", "delete", "options", "head", "patch" ];

	constructor(private modalService: NgbModal) 
	{
		console.info("APIs service initialized");
		this.openFile("/assets/petstore.yaml", null);
	}

	openFile(pathName: string, fobj)
	{
		//Swadit.thinking = "Loading file...";
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
		this._eventApiChanged.next(this.currentFileName);
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

		if (api['$ref']) {
			this.keys(api).forEach(k => {
				if (k != '$ref') {
					delete api[k];
				}
			});
		} else {
			if (schema['type'] == 'object') {
				if (schema['properties']) {
					this.keys(schema['properties']).forEach(p => {
						if (api[p] != null) {
							this.cleanUp(schema['properties'][p], api[p]);
							if (schema['properties'][p]['type'] == 'array') {
								if (api[p].length == 0 && !this.propertyIsRequired(schema, p)) {
									delete api[p];
								}
							}
							if (schema['properties'][p]['type'] == 'object') {
								if (this.keys(api[p]).length == 0 && !this.propertyIsRequired(schema, p)) {
									delete api[p];
								}
							}
							if (schema['properties'][p]['type'] == 'string') {
								if (api[p] == "" && !this.propertyIsRequired(schema, p)) {
									delete api[p];
								}
							}
						} else {
							delete api[p];
						}
					});
					/* TODO we have incomplete schemas, thus we may not remove additional properties
					if (!schema['additionalProperties']) {
						this.keys(api).forEach(p => {
							if (!p.startsWith("x-") && !schema['properties'][p]) {
								delete api[p];
							}
						});
					}
					*/
				// TODO: properties AND additionalProperties
				} else if (schema['additionalProperties']) {
					this.keys(api).forEach(p => {
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
	}

	cleanUpSwaggerSchema(obj: any)
	{
		if (!obj) return;

		this.cleanUp(this.schemas.schema, obj);

		if (obj['type'] == "array") {
			delete obj['properties'];
			delete obj['format'];

		} else if (obj['type'] == "object") {
			delete obj['items'];
			delete obj['format'];

		} else {
			delete obj['items'];
			delete obj['properties'];

		}
		// todo: check for additional optional attributes
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
		this._eventApiChanged.next(this.currentFileName);
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
			return filteredList.sort((a, b) => {
				a = a.toLowerCase();
				b = b.toLowerCase();
				if (a == b) return 0;
				if (a > b) return 1;
				return -1;
			});
		} else {
			return filteredList;
		}
	}

	// TODO
	resolveRef(ref: string): any
	{
		if (ref.startsWith("#/definitions/")) {
			let refParts = ref.split('/');
			return this.current['definitions'][refParts[2]];
		}
		if (ref.startsWith("#/parameters/")) {
			let refParts = ref.split('/');
			return this.current['parameters'][refParts[2]];
		}
		if (ref.startsWith("#/responses/")) {
			let refParts = ref.split('/');
			return this.current['responses'][refParts[2]];
		}
		return null;
	}

	resolveObj(obj: any): any
	{
		if (obj && obj['$ref']) {
			return this.resolveRef(obj['$ref']);
		}
		return obj;
	}

	renameObjectKey(obj: any, key: string, newKey: string) 
	{
		var newObj = _.clone(obj);
		Object.keys(obj).forEach(k => delete obj[k]);
		Object.keys(newObj).forEach(k => {
			if (k != key) {
				obj[k] = newObj[k];
			} else {
				obj[newKey] = newObj[key];
			}
		});
		return obj;
	}

	settingsModal()
	{
		alert('Not yet implemented');
	}

	keys(obj)
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	missingRequiredProperties(schema: any, obj: any): Array<string>
	{
		let missingFields = [];
		if (schema['required']) {
			schema['required'].forEach(p => {
				if (!obj[p]) {
					missingFields.push(p);
				}
			});
		}
		return missingFields;
	}

	selectPath(path: string, event: any)
	{
		if (this.selectedPaths.hasOwnProperty(path)) {
			delete this.selectedPaths[path];
		} else { 
			this.selectedPaths[path] = true;
		}
	}
}
