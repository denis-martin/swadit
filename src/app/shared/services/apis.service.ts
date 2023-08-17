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
import { Router } from '@angular/router';
import { HttpClient } from  "@angular/common/http";
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { OpenAPI } from 'openapi-types';
import * as SwaggerParser from '@apidevtools/swagger-parser';
import * as YAML from 'js-yaml';
import { clone as _clone, cloneDeep as _cloneDeep, pull as _pull, remove as _remove } from "lodash-es";

import { FileModalComponent } from '../components/file-modal/file-modal.component';
import { ConfirmComponent } from 'app/shared/modules/editor-modals/confirm/confirm.component';

import { convertOas2to3 } from './oas2to3';

import * as JsonSchemaDraft04 from '../schemas/json-schema/draft-04.json';

import * as Oas20Schema from '../schemas/oas2.0/swagger.json';
import * as Oas20SchemaInfo from '../schemas/oas2.0/swagger-info.json';
import * as Oas20SchemaContact from '../schemas/oas2.0/swagger-contact.json';
import * as Oas20SchemaLicense from '../schemas/oas2.0/swagger-license.json';
import * as Oas20SchemaExternalDocs from '../schemas/oas2.0/swagger-externalDocs.json';
import * as Oas20SchemaTags from '../schemas/oas2.0/swagger-tags.json';
import * as Oas20SchemaSecurityDefinitions from '../schemas/oas2.0/swagger-securityDefinitions.json';
import * as Oas20SchemaSecurity from '../schemas/oas2.0/swagger-security.json';
import * as Oas20SchemaSchema from '../schemas/oas2.0/swagger-schema.json';
import * as Oas20SchemaParameterBody from '../schemas/oas2.0/swagger-parameterBody.json';
import * as Oas20SchemaParameterNonBody from '../schemas/oas2.0/swagger-parameterNonBody.json';
import * as Oas20SchemaResponse from '../schemas/oas2.0/swagger-response.json';
import * as Oas20SchemaOperation from '../schemas/oas2.0/swagger-operation.json';
import * as Oas20SchemaHeader from '../schemas/oas2.0/swagger-header.json';

import * as Oas30Schema from '../schemas/oas3.0/schema.json';

const swaggerParserOptions: SwaggerParser.Options = {
	resolve: {
		file: false,
		http: false
	}
}

class CatalogItem
{
	title: string;
	path: string;
}

class MenuConfig
{
	title: string = "File";
	hideItems = {
		"new": false,
		"open": false,
		"add": false,
		"download": false,
		"source": false,
		"printPreview": false,
		"swaggerUi": false
	}
}

class SwaditConfig
{
	title: string;
	logo: boolean = true;
	menu: MenuConfig = new MenuConfig();
	catalog: Array<CatalogItem> = [];
	readOnly: false;
	licensesLink: string = "3rdpartylicenses.txt";
	termsOfUseLink: string = "#";
	imprintLink: string = "#";
	privacyPolicyLink: string = "#";
}

@Injectable()
export class ApisService 
{
	private readonly jsonSchemas = {
		"http://json-schema.org/draft-04/schema#": JsonSchemaDraft04['default']
	}

	private readonly _schemas = 
	{
		"oas2.0": {
			root: Oas20Schema['default'],
			info: Oas20SchemaInfo['default'],
			contact: Oas20SchemaContact['default'],
			license: Oas20SchemaLicense['default'],
			externalDocs: Oas20SchemaExternalDocs['default'],
			tags: Oas20SchemaTags['default'],
			securityDefinitions: Oas20SchemaSecurityDefinitions['default'],
			security: Oas20SchemaSecurity['default'],
			schema: Oas20SchemaSchema['default'],
			parameterBody: Oas20SchemaParameterBody['default'],
			parameterNonBody: Oas20SchemaParameterNonBody['default'],
			response: Oas20SchemaResponse['default'],
			operation: Oas20SchemaOperation['default'],
			header: Oas20SchemaHeader['default'],
			_definitionCategories: [
				'definitions', 
				'parameters',
				'responses'
			]
		},
		"oas3.0": {
			root: Oas30Schema['default'],
			info: Oas30Schema['default']['definitions']['Info'],
			contact: Oas30Schema['default']['definitions']['Contact'],
			license: Oas30Schema['default']['definitions']['License'],
			externalDocs: Oas30Schema['default']['definitions']['ExternalDocumentation'],
			tags: Oas30Schema['default']['properties']['tags'],
			definitions: Oas30Schema['default']['definitions'],
			schema: Oas30Schema['default']['definitions']['Schema'],
			_definitionCategories: [
				'schemas', 
				'responses',
				'parameters',
				//'examples',
				//'requestBodies',
				//'headers',
				//'securitySchemes',
				//'links',
				//'callbacks'
			]
		}
	};

	get schemas(): any
	{
		if (this.isOas2) {
			return this._schemas["oas2.0"];
		} else if (this.isOas3) {
			if (this.specVersion.startsWith('3.0')) {
				return this._schemas["oas3.0"];
			}
		}
		return null;
	}

	public config: SwaditConfig = new SwaditConfig();

	public current: any = { 
		swagger: "2.0",
		info: { 
			title: "My new API",
			version: "1.0"
		},
		paths: {}
	}
	public currentFileName: string = "swagger.yaml";
	public lastLoaded: string;
	public hasLoadingErrors: boolean = false;

	public specVersion = '2.0';
	public isOas2 = true;
	public isOas3 = false;

	filesToAdd = [];
	filesToAddIndex = 0;

	private _eventApiChanged = new Subject<string>();
	eventApiChanged = this._eventApiChanged.asObservable();

	selectedPaths = {};
	activePath: string;

	closeResult: string;
	fileModal: NgbModalRef;
	blob: Blob;
	blobUrl: string;

	methodKeys = ["get", "post", "put", "delete", "options", "head", "patch" ];

	constructor(private modalService: NgbModal, private router: Router, private http: HttpClient) 
	{
		console.info("APIs service initialized");
		this.openFile("assets/petstore.yaml", null);
		this.loadConfig();
	}

	loadConfig(): void
	{
		this.http.get("assets/config.yaml", { observe: 'response', responseType: 'text' })
			.subscribe(resp => {
				if (resp.status == 200) {
					//this.config = YAML.load(resp.body);
					const config = YAML.load(resp.body);
					for (const k of Object.keys(config)) {
						this.config[k] = config[k];
					}
					console.info("Config loaded");
				} else {
					console.error("Unexpected status code", resp);
				}
				//this.config = resp.body;
			}, error => {
				if (error.status != 404) {
					console.error("Unexpected error code", error);
				}
			});
	}

	openFile(pathName: string, fobj: File): void
	{
		//Swadit.thinking = "Loading file...";
		const apis = this;
		if (pathName) {
			this.http.get(pathName, { observe: 'response', responseType: 'text' })
				.subscribe(resp => {
					if (resp.status == 200) {
						apis.lastLoaded = resp.body;
						try {
							SwaggerParser.parse(<OpenAPI.Document> YAML.load(resp.body), swaggerParserOptions)
								.then(api => { apis.swaggerLoaded(api); })
								.catch(err => { apis.swaggerLoadingError(err); });
						} catch (ex) {
							apis.swaggerLoadingError(ex, pathName);
						}
					} else {
						console.error("Unexpected status code", resp);
					}
				}, error => {
					if (error.status != 404) {
						console.error("Unexpected error code", error);
					}
				});
		} else {
			const reader = new FileReader();
			reader.onloadend = function(e) {
				apis.lastLoaded = reader.result.toString();
				try {
					SwaggerParser.parse(<OpenAPI.Document> YAML.load(reader.result.toString()), swaggerParserOptions)
						.then(api => { apis.swaggerLoaded(api, fobj.name); })
						.catch(err => { apis.swaggerLoadingError(err, fobj.name); });
				} catch (ex) {
					apis.swaggerLoadingError(ex, fobj.name);
				}
			}
			reader.readAsText(fobj);
		}
	}

	addFile(pathName: string, fobj: any = null, addSource = false): void
	{
		console.log("addFile", pathName, fobj, addSource);
		const apis = this;
		if (pathName) {
			this.http.get(pathName, { observe: 'response', responseType: 'text' })
				.subscribe(resp => {
					if (resp.status == 200) {
						apis.lastLoaded = resp.body;
						try {
							SwaggerParser.parse(<OpenAPI.Document> YAML.load(resp.body), swaggerParserOptions)
								.then(api => { apis.mergeSwagger(api, null, addSource); })
								.catch(err => { apis.swaggerLoadingError(err); });
						} catch (ex) {
							apis.swaggerLoadingError(ex, pathName);
						}
					} else {
						console.error("Unexpected status code", resp);
					}
				}, error => {
					if (error.status != 404) {
						console.error("Unexpected error code", error);
					}
				});
		} else {
			const reader = new FileReader();
			reader.onload = function(e) {
				apis.lastLoaded = reader.result.toString();
				try {
					SwaggerParser.parse(<OpenAPI.Document> YAML.load(reader.result.toString()), swaggerParserOptions)
						.then(api => { apis.mergeSwagger(api, fobj.name, addSource); })
						.catch(err => { apis.swaggerLoadingError(err, fobj.name); });
				} catch (ex) {
					apis.swaggerLoadingError(ex, fobj.name);
				}
			}
			reader.readAsText(fobj);
		}
	}

	swaggerLoaded(api: any, fileName: string = null): void
	{
		console.log("swaggerLoaded");
		this.current = api;
		this.currentFileName = fileName ? fileName : "swagger.yaml";

		if ('swagger' in this.current) {
			this.specVersion = this.current['swagger'];
		} else if ('openapi' in this.current) {
			this.specVersion = this.current['openapi'];
		} else {
			this.specVersion = "";
		}

		this.isOas2 = this.specVersion.startsWith('2.0');
		this.isOas3 = this.specVersion.startsWith('3.0');

		// if ('openapi' in api) {
		// 	ConfirmComponent.open(this.modalService, 
		// 		"OpenAPI 3.0 is not yet fully supported by Swadit. " +
		// 		"Visual editing is limited.", 
		// 		"Ok", null);
		// }

		const apiClone: any = _cloneDeep(this.current);
		SwaggerParser.validate(apiClone, swaggerParserOptions)
			.then((api) => {
				console.log("This API is a valid Swagger file.");
				this.hasLoadingErrors = false;
				this._eventApiChanged.next(this.currentFileName);
			})
			.catch((err) => {
				console.log("Swagger validation error: ", err.message);
				this.hasLoadingErrors = true;
				this._eventApiChanged.next(this.currentFileName);
				this.router.navigate(['/source']);
			});

		this._eventApiChanged.next(this.currentFileName);
	}

	swaggerLoadingError(err, fileName: string = null): void
	{
		console.log("error loading yaml: ", err);
		this.hasLoadingErrors = true;
		this.current = { 
			swagger: "2.0",
			info: { 
				title: "Loading Error",
				version: "1.0"
			},
			paths: {}
		}
		this.currentFileName = fileName ? fileName : "swagger.yaml";
		this._eventApiChanged.next(this.currentFileName);
		this.router.navigate(['/source']);
	}

	mergeSwagger(api, sourceName: string = null, addSource = false): void
	{
		console.log("mergeSwagger", api, sourceName, addSource);
		const apis = this;

		const addedPath = [];
		const replacedPath = [];
		const addedParameters = [];
		const replacedParameters = [];
		const addedDefinitions = [];
		const replacedDefinitions = [];
		const addedResponses = [];
		const replacedResponses = [];
		
		if (api.hasOwnProperty('paths')) {
			Object.keys(api.paths).forEach(function(element) {
				if (apis.current['paths'].hasOwnProperty(element)) {
					// replace path
					console.log("Replacing " + element);
					apis.current['paths'][element] = api.paths[element];
					replacedPath.push(element);

				} else {
					// add new path
					console.log("Adding " + element);
					apis.current['paths'][element] = api.paths[element];
					addedPath.push(element);
				}
				if (addSource && sourceName) {
					for (const k of Object.keys(apis.current['paths'][element])) {
						if (k != "parameters") {
							if (!apis.current['paths'][element][k].description) {
								apis.current['paths'][element][k].description = "";
							}
							apis.current['paths'][element][k].description = "Source: " + sourceName + "\n\n" + 
								apis.current['paths'][element][k].description;
						}
					}
				}
				apis.selectedPaths[element] = true;
			});
			console.log("Replaced paths", replacedPath);
			console.log("Added paths", addedPath);
		}

		if (api.hasOwnProperty('parameters')) {
			if (!apis.current['parameters']) {
				apis.current['parameters'] = {};
			}
			Object.keys(api.parameters).forEach(function(element) {
				if (apis.current['parameters'].hasOwnProperty(element)) {
					// replace parameter
					console.log("Replacing " + element);
					apis.current['parameters'][element] = api.parameters[element];
					replacedParameters.push(element);

				} else {
					// add new parameter
					console.log("Adding " + element);
					apis.current['parameters'][element] = api.parameters[element];
					addedParameters.push(element);
				}
			});
			console.log("Replaced parameters", replacedParameters);
			console.log("Added parameters", addedParameters);
		}

		if (api.hasOwnProperty('definitions')) {
			if (!apis.current['definitions']) {
				apis.current['definitions'] = {};
			}
			Object.keys(api.definitions).forEach(function(element) {
				if (apis.current['definitions'].hasOwnProperty(element)) {
					// replace definitions
					console.log("Replacing " + element);
					apis.current['definitions'][element] = api.definitions[element];
					replacedDefinitions.push(element);

				} else {
					// add new definitions
					console.log("Adding " + element);
					apis.current['definitions'][element] = api.definitions[element];
					addedDefinitions.push(element);
				}
			});
			console.log("Replaced definitions", replacedDefinitions);
			console.log("Added definitions", addedDefinitions);
		}

		if (api.hasOwnProperty('responses')) {
			if (!apis.current['responses']) {
				apis.current['responses'] = {};
			}
			Object.keys(api.responses).forEach(function(element) {
				if (apis.current['responses'].hasOwnProperty(element)) {
					// replace response
					console.log("Replacing " + element);
					apis.current['responses'][element] = api.responses[element];
					replacedResponses.push(element);

				} else {
					// add new response
					console.log("Adding " + element);
					apis.current['responses'][element] = api.responses[element];
					addedResponses.push(element);
				}
			});
			console.log("Replaced responses", replacedResponses);
			console.log("Added responses", addedResponses);
		}
		
		this.filesToAddIndex++;
		if (this.filesToAddIndex < this.filesToAdd.length) {
			this.addFile(null, this.filesToAdd[this.filesToAddIndex], addSource);
			
		} else {
			this.filesToAdd = [];

		}
	}

	toYaml(obj: Object): string
	{
		return YAML.dump(obj);
	}

	toJson(obj: any): string
	{
		return JSON.stringify(obj, null, 2);
	}

	hasExtensions(obj: Object): boolean
	{
		if (obj == null) return false;
		for (const k of Object.keys(obj)) {
			if (k.startsWith("x-")) {
				return true;
			}
		}
		return false;
	}

	propertyIsRequired(schema: any, property: string): boolean
	{
		if (schema.required == null) return false;
		for (const rp of schema.required) {
			if (rp == property) return true;
		}
		return false;
	}

	cleanUp(schema: any, api: any): void
	{
		if (!api) return;

		if (api['$ref']) {
			this.keys(api).forEach(k => {
				if (k != '$ref') {
					delete api[k];
				}
			});
		} else {
			schema = this.resolveObj(schema, this.schemas.root);
			if (schema['type'] == 'object') {
				if (schema['properties']) {
					this.keys(schema['properties']).forEach(p => {
						if (api[p] != null) {
							this.cleanUp(schema['properties'][p], api[p]);
							const propertySchema = this.resolveObj(schema['properties'][p], this.schemas.root);
							if (propertySchema['type'] == 'array') {
								if (api[p].length == 0 && !this.propertyIsRequired(schema, p)) {
									delete api[p];
								}
							}
							if (propertySchema['type'] == 'object') {
								if (this.keys(api[p]).length == 0 && !this.propertyIsRequired(schema, p)) {
									delete api[p];
								}
							}
							if (propertySchema['type'] == 'string') {
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
					// remove undefined properties
					this.keys(api).forEach(p => {
						if (!schema['properties'][p] && (api[p] === undefined || api[p] === null)) {
							delete api[p];
						}
					});
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

	cleanUpSwaggerSchema(obj: any): void
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

	createBlobUrl(): void
	{
		const content = YAML.dump(this.current);
		this.blob = new Blob([ content ], { type : 'text/plain' });
		if (this.blobUrl != '') {
			window.URL.revokeObjectURL(this.blobUrl);
		}
		this.blobUrl = window.URL.createObjectURL(this.blob);
		console.log("Download URL: " + this.blobUrl);
	}

	newFile(): void
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

	openFileModal(): void
	{
		console.log("openFileModal()");
		this.fileModal = this.modalService.open(FileModalComponent, FileModalComponent.modalOptions);
		this.fileModal.componentInstance.dialogType = "fileOpen";
		this.fileModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("openFileModal(): " + this.closeResult);
			const files: FileList | null = result.files;
			if (files && files.length > 0) {
				this.openFile(null, files[0]);
			}
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("openFileModal(): " + this.closeResult);

        });
	}
	
	addFilesModal(): void
	{
		console.log("addFileModal()");
		this.fileModal = this.modalService.open(FileModalComponent, FileModalComponent.modalOptions);
		this.fileModal.componentInstance.dialogType = "fileAdd";
		this.fileModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("addFileModal(): closed with ", result);
			if (result.files.length > 0) {
				this.filesToAddIndex = 0;
				this.filesToAdd = result.files;
				this.addFile(null, this.filesToAdd[this.filesToAddIndex], result.addSource);
			}
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("addFileModal(): dismissed with ", this.getDismissReason(reason));

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
	
	downloadFileModal(): void
	{
		console.log("downloadFileModal()");
		this.createBlobUrl();
		this.fileModal = this.modalService.open(FileModalComponent, FileModalComponent.modalOptions);
		this.fileModal.componentInstance.dialogType = "fileDownload";
		this.fileModal.componentInstance.blob = this.blob;
		this.fileModal.componentInstance.fileName = this.currentFileName;
		
		if (this.hasLoadingErrors) {
			this.fileModal.componentInstance.validationErrors = true;
		} else {
			const fileModal = this.fileModal;
			this.validate(this.current)
				.then(api => { fileModal.componentInstance.validationErrors = false })
				.catch(err => { fileModal.componentInstance.validationErrors = true });
		}

		this.fileModal.result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
			console.info("downloadFileModal(): " + this.closeResult);
			this.currentFileName = result;
			
        }, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			console.warn("downloadFileModal(): " + this.closeResult);

        });
	}

	filterList(list: Array<string>, filterText: string, sorted: boolean = false): Array<string>
	{
		let filteredList = list;
		if (filterText) {
			const fl = filterText.toLowerCase();
			filteredList = list.filter(s => {
				const sl = s.toLowerCase();
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
	resolveRef(ref: string, rootSchema: any = null): any
	{
		let source = rootSchema ? rootSchema : this.current;
		let _ref = ref;

		// check whether we have a global ref on a JSON Schema
		for (const k in this.jsonSchemas) {
			if (ref.startsWith(k)) {
				source = this.jsonSchemas[k];
				_ref = "#" + ref.replace(k, "");
				break;
			}
		}

		try {
			const refParts = _ref.split('/');
			refParts.forEach(p => {
				if (p != "#") {
					source = source[p];
				}
			});
			return source;
		} catch (err) {
			console.error("Exception resolving ref", err, ref, _ref, rootSchema, source);
		}
		return null;
	}

	resolveObj(obj: any, rootSchema: any = null): any
	{
		if (obj) {
			if (obj['$ref']) {
				obj = this.resolveRef(obj['$ref'], rootSchema);
			} 
			if (Array.isArray(obj['allOf'])) {
				const mergedObj = {};
				obj['allOf'].forEach(o => {
					o = this.resolveObj(o);
					if (o) {
						for (const key of Object.keys(o)) {
							if (!mergedObj[key]) {
								mergedObj[key] = _cloneDeep(o[key]);
							}
						}	
						if (o["properties"]) {
							if (!mergedObj["properties"]) {
								mergedObj["properties"] = {};
							}
							for (const p of Object.keys(o["properties"])) {
								// no recursive resolving
								mergedObj["properties"][p] = o["properties"][p];
							}
						}
						// TODO: additionalProperties? patternedProperties?
						if (mergedObj["type"] != o["type"]) {
							console.warn("allOf objects have different types");
						}
					}
				});
				obj = mergedObj;
			}
		}
		return obj;
	}

	renameObjectKey(obj: any, key: string, newKey: string): any
	{
		const newObj = _clone(obj);
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

	keys(obj: Object): string[]
	{
		if (!obj) return [];
		return Object.keys(obj);
	}

	getLength(obj: any): number
	{
		if (!obj) return 0;
		if (Array.isArray(obj)) return obj.length;
		if (typeof obj == "object") return Object.keys(obj).length;
		return null;
	}

	missingRequiredProperties(schema: any, obj: any): Array<string>
	{
		const missingFields = [];
		if (schema['required']) {
			schema['required'].forEach(p => {
				if (!obj[p]) {
					missingFields.push(p);
				}
			});
		}
		return missingFields;
	}

	selectPath(path: string, event: any): void
	{
		if (this.selectedPaths.hasOwnProperty(path)) {
			delete this.selectedPaths[path];
		} else { 
			this.selectedPaths[path] = true;
		}
	}

	selectAllPaths(): void
	{
		Object.keys(this.current['paths']).forEach(p => this.selectedPaths[p] = true);
	}

	deselectAllPaths(): void
	{
		this.selectedPaths = {};
	}

	deleteSelectedPaths(): void
	{
		const paths = Object.keys(this.selectedPaths);
		if (paths.length == 0) {
			ConfirmComponent.open(this.modalService, "Please select a path.", "Ok", null);
		} else {
			ConfirmComponent.open(this.modalService, "Delete " + paths.length + " paths?")
				.then((result) => {
					console.info("deleteSelectedPaths()", result);
					paths.forEach(p => delete this.current['paths'][p]);
					this.selectedPaths = {};
				})
				.catch((reason) => {});
		}
	}

	inverseSelectedPaths(): void
	{
		const paths = Object.keys(this.selectedPaths);
		if (paths.length == 0) {
			this.selectAllPaths();
		} else if (paths.length == Object.keys(this.current['paths']).length) {
			this.deselectAllPaths();
		} else {
			Object.keys(this.current['paths']).forEach(p => {
				if (this.selectedPaths[p]) {
					delete this.selectedPaths[p];
				} else {
					this.selectedPaths[p] = true;
				}
			});
		}
	}

	generateExample(schema: any, refStack: { [k: string]: boolean }, noReadOnly: boolean = false, forceGeneration: boolean = false): any
	{
		let res: any = undefined;
		if (schema['$ref']) {
			if (refStack['$ref']) {
				// recursion detected
				return null;
			} else {
				refStack['$ref'] = true;
			}
		}
		schema = this.resolveObj(schema);
		if (!schema) {
			return null;
		}
		if (!noReadOnly || !schema.readOnly) {
			if (schema.type == "string") {
				if (schema.example) {
					res = schema.example;
				} else if (schema.default) {
					res = schema.default;
				} else {
					res = "string";
				}
			} else if (schema.type == "boolean") {
				if (schema.example) {
					res = schema.example;
				} else if (schema.default) {
					res = schema.default;
				} else {
					res = false;
				}
			} else if (schema.type == "number" || schema.type == "integer") {
				if (schema.example) {
					res = schema.example;
				} else if (schema.default) {
					res = schema.default;
				} else {
					res = 0;
				}
			} else if (schema.type == "array") {
				if (schema.example && !forceGeneration) {
					res = schema.example;
				} else if (schema.default && !forceGeneration) {
					res = schema.default;
				} else {
					const r = this.generateExample(schema.items, refStack, noReadOnly);
					if (r !== undefined) {
						res = [ r ];
					}
				}
			} else if (schema.type == "object") {
				if (schema.example && !forceGeneration) {
					res = schema.example;
				} else if (schema.default && !forceGeneration) {
					res = schema.default;
				} else {
					res = {};
					this.keys(schema.properties).forEach(k => {
						const refStackCopy = _cloneDeep(refStack);
						const r = this.generateExample(schema.properties[k], refStackCopy, noReadOnly);
						if (r !== undefined) {
							res[k] = r;
						}
					});
				}
			}
		}
		return res;
	}

	validateStr(input: string): any
	{
		const apis = this;
		return new Promise((resolve, reject) => {
			let api;
			let apiClone;
			try {
				api = YAML.load(input);
				apiClone = _cloneDeep(api);
			} catch (ye) {
				reject("YAML Error: " + ye.message);
				return;
			}
			SwaggerParser.validate(api, swaggerParserOptions)
				.then(function(api) {
					console.log("This API is a valid Swagger file.");
					// 'api' is modified by SwaggerParser.validate (references are dereferenced)
					resolve(apiClone);
				})
				.catch(function(err) {
					console.log("Swagger validation error: ", err.message);
					reject(err.message);
				});
		});
	}
	
	validate(obj: any): any
	{
		const apis = this;
		return new Promise((resolve, reject) => {
			const apiClone = _cloneDeep(obj);
			SwaggerParser.validate(apiClone, swaggerParserOptions)
				.then(function(api) {
					console.log("This API is a valid Swagger file.");
					// 'apiClone' is modified by SwaggerParser.validate (references are dereferenced)
					resolve(apiClone);
				})
				.catch(function(err) {
					console.log("Swagger validation error: ", err.message);
					reject(err.message);
				});
		});
	}

	getMethods(path: string, api: any = null): Array<object>
	{
		if (!api) {
			api = this.current;
		}
		if (!api['paths']) return [];
		const methodKeys = this.keys(api['paths'][path]);
		_pull(methodKeys, "parameters");
		const methods: Array<object> = [];
		methodKeys.forEach(m => methods.push({ 
			key: m,
			obj: api['paths'][path][m] 
		}));
		return methods;
	}

	getParameters(api: any, path: string, method: string, includeBody: boolean = true): Array<object>
	{
		if (!api || !api['paths']) return [];
		if (!api['paths'][path]) return [];
		if (!api['paths'][path][method]) return [];

		let parameters: Array<object> = [];
		if (api['paths'][path]['parameters']) {
			parameters = parameters.concat(api['paths'][path]['parameters']);
		}
		if (api['paths'][path][method]['parameters']) {
			parameters = parameters.concat(api['paths'][path][method]['parameters']);
		}
		if (!includeBody) {
			_remove(parameters, p => { return p['in'] == 'body'; });
		}
		return parameters;
	}

	getBodyParameter(api: any, path: string, method: string): object
	{
		if (!api['paths']) return null;
		if (!api['paths'][path]) return null;
		if (!api['paths'][path][method]) return null;

		let body: object = null;
		if (api['paths'][path]['parameters']) {
			api['paths'][path]['parameters'].forEach(p => {
				if (p['in'] == 'body') {
					body = p;
				}
			});
		}
		if (api['paths'][path][method]['parameters']) {
			api['paths'][path][method]['parameters'].forEach(p => {
				if (p['in'] == 'body') {
					body = p;
				}
			});
		}
		return body;
	}

	getConsumes(api: any, path: string, method: string): any
	{
		if (!api['paths']) return null;
		if (!api['paths'][path]) return null;
		if (!api['paths'][path][method]) return null;

		if (api['paths'][path][method]['consumes']) {
			return api['paths'][path][method]['consumes'];
		} else if (api['consumes']) {
			return api['consumes'];
		}
		return null;
	}

	getProduces(api: any, path: string, method: string): any
	{
		if (!api['paths']) return null;
		if (!api['paths'][path]) return null;
		if (!api['paths'][path][method]) return null;

		if (api['paths'][path][method]['produces']) {
			return api['paths'][path][method]['produces'];
		} else if (api['produces']) {
			return api['produces'];
		}
		return null;
	}

	getComponents(type: string): any
	{
		if (this.isOas2) {
			if (type in this.current || type == 'schemas') {
				if (type == 'definitions' ||
					type == 'responses' ||
					type == 'parameters')
				{
					return this.current[type];
				} 
				else if (type == 'schemas') 
				{
					return this.current['definitions'];
				}
			}
		} else if (this.isOas3) {
			if ('components' in this.current && type in this.current['components']) {
				if (type == 'schemas' ||
					type == 'responses' ||
					type == 'parameters' ||
					type == 'examples' ||
					type == 'requestBodies' ||
					type == 'headers' ||
					type == 'securitySchemes' ||
					type == 'links' ||
					type == 'callbacks')
				{
					return this.current['components'][type];
				}
			}
		}
		return null;
	}

	getComponentsCount(type: string): number
	{
		const components = this.keys(this.getComponents(type));
		if (components && components.length > 0) {
			return components.length;
		} else {
			return 0;
		}
	}

	getDefCategories(): Array<string>
	{
		return this.schemas._definitionCategories;
	}

	convertOas2To3(): void
	{
		if (!this.isOas2) {
			console.error("Cannot convert non-Swagger 2.0 to OpenAPI 3.0");
			return;
		}
		convertOas2to3(this.current)
			.then((result) => {
				this.current = result.target;

				if ('swagger' in this.current) {
					this.specVersion = this.current['swagger'];
				} else if ('openapi' in this.current) {
					this.specVersion = this.current['openapi'];
				} else {
					this.specVersion = "";
				}
		
				this.isOas2 = this.specVersion.startsWith('2.0');
				this.isOas3 = this.specVersion.startsWith('3.0');
		
				if ('openapi' in this.current) {
					ConfirmComponent.open(this.modalService, 
						"OpenAPI 3.0 is not yet fully supported by Swadit. " +
						"Conversion may be incomplete and visual editing is limited. " +
						"Please review the resulting document carefully.", 
						"Ok", null);
				}

				this._eventApiChanged.next(this.currentFileName);
			})
			.catch((err) => {
				console.error("Error converting Swagger 2.0 file:", err);
				// TODO: Show hint to user
			});
	}
}
