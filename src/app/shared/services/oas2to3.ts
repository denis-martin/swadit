import { cloneDeep as _cloneDeep } from "lodash-es";

function convertRef(ref: string): string
{
	ref = ref.replace('#/definitions', '#/components/schemas');
	ref = ref.replace('#/responses', '#/components/responses');
	ref = ref.replace('#/parameters', '#/components/parameters');
	return ref;
}

function convertRefDeep(src: any)
{
	if (typeof src === 'object' && src != null) {
		if ('$ref' in src) {
			src['$ref'] = convertRef(src['$ref']);
		} else {
			for (const k in src) {
				convertRefDeep(src[k]);
			}
		}
	}
}

function copyExtensions(target: any, src: any): void
{
	for (const k in src) {
		if (src[k].startsWith('x-')) {
			target[k] = _cloneDeep(src[k]);
		}
	}
}

function getMediaTypes(type: string, oas2root: any, path: string, method: string): string[]
{
	let result: string[];
	if (path && method && (type in oas2root['paths'][path][method])) {
		result = _cloneDeep(oas2root['paths'][path][method][type]);
	} else if (type in oas2root) {
		result = _cloneDeep(oas2root[type]);
	}
	return result;
}

function convertParameterObject(src: any, api: any, path: string, method: string): any
{
	const copyFields = ['name', 'in', 'description', 'required', 'allowEmptyValue'];
	const copySchemaFields = ['type', 'format', 'items', 
		'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength',
		'pattern', 'maxItems', 'minItems', 'uniqueItems', 'enum', 'multipleOf'
	]
	const target = {};
	if (src['in'] == 'query' || src['in'] == 'header' || src['in'] == 'path') {
		target['parameter'] = {};
		for (const field of copyFields) {
			if (field in src) {
				target['parameter'][field] = src[field];
			}
		}
		if ('type' in src) {
			target['parameter']['schema'] = {}
			for (const field of copySchemaFields) {
				if (field in src) {
					target['parameter']['schema'][field] = src[field];
				}
			}
		}
		// TODO: x-tensions, collectionFormat
	} else { // formData or body
		target['requestBody'] = {
			'content': {}
		}
		if (src['in'] != 'formData') {
			if ('required' in src) target['requestBody']['required'] = src['required'];
			if ('description' in src) target['requestBody']['description'] = src['description'];
		}
		if (src['in'] == 'body' && 'schema' in src) { // 'body'
			let mediaTypes = getMediaTypes('consumes', api, path, method);
			if (!mediaTypes) mediaTypes = [ '*/*' ];
			for (const mt of mediaTypes) {
				target['requestBody']['content'][mt] = {
					'schema': convertSchemaObject(src['schema'])
				}
			}
		} else if (src['in'] == 'formData') {
			let mediaTypes = getMediaTypes('consumes', api, path, method);
			if (!mediaTypes) mediaTypes = [ '*/*' ];
			for (const mt of mediaTypes) {
				target['requestBody']['content'][mt] = {
					'schema': {}
				}
				if (src['type'] == 'file' && !mt.includes('multipart')) {
					target['requestBody']['content'][mt]['schema']['type'] = 'string';
					target['requestBody']['content'][mt]['schema']['format'] = 'binary';
					
				} else {
					target['requestBody']['content'][mt]['schema']['type'] = 'object';
					target['requestBody']['content'][mt]['schema']['properties'] = {};
					target['requestBody']['content'][mt]['schema']['properties'][src['name']] = {};
					if (src['type'] == 'file') {
						target['requestBody']['content'][mt]['schema']['properties'][src['name']]['type'] = 'string';
						target['requestBody']['content'][mt]['schema']['properties'][src['name']]['format'] = 'binary';
					} else {
						for (const field of copySchemaFields) {
							if (field in src) {
								target['requestBody']['content'][mt]['schema']['properties'][src['name']][field] = src[field];
							}
						}
					}
					if ('description' in src) {
						target['requestBody']['content'][mt]['schema']['properties'][src['name']]['description'] = src['description'];
					}
					if (src['required']) {
						target['requestBody']['content'][mt]['schema']['required'] = [ src['name'] ];
					}
				}
			}
		}
		// TODO formData, type file
	}
	convertRefDeep(target);
	return target;
}

function convertOperationObject(src: any, api: any, path: string, method: string): any
{
	const target = {};
	for (const k in src) {
		if (k == 'summary' || k == 'description' || k == 'operationId' || k == 'deprecated') {
			target[k] = src[k];

		} else if (k == 'tags' || k == 'externalDocs' /*|| k == 'security'*/) {
			target[k] = _cloneDeep(src[k]);

		} else if (k == 'parameters') {
			for (const param of src[k]) {
				const paramObj = convertParameterObject(param, api, path, method);
				if ('parameter' in paramObj) {
					if (!(k in target)) {
						target[k] = [];
					}
					target[k].push(paramObj['parameter']);
				} else if ('requestBody' in paramObj) {
					if (target['requestBody']) {
						let required = false;
						for (const mt in target['requestBody']['content']) {
							if (mt in paramObj['requestBody']['content']) {
								console.log(target['requestBody']['content'], paramObj['requestBody']['content']);
								if (('schema' in target['requestBody']['content'][mt]) && ('schema' in paramObj['requestBody']['content'][mt])) {
									// merge request body parameters
									if (target['requestBody']['content'][mt]['schema']['type'] == paramObj['requestBody']['content'][mt]['schema']['type'] && target['requestBody']['content'][mt]['schema']['type'] == 'object') {
										if ('properties' in target['requestBody']['content'][mt]['schema'] && 'properties' in paramObj['requestBody']['content'][mt]['schema']) {
											for (const p in paramObj['requestBody']['content'][mt]['schema']['properties']) {
												target['requestBody']['content'][mt]['schema']['properties'][p] = paramObj['requestBody']['content'][mt]['schema']['properties'][p];
												console.warn("Merging", path, method, target['requestBody'], p);
											}
											if ('required' in paramObj['requestBody']['content'][mt]['schema'] && paramObj['requestBody']['content'][mt]['schema']['required'].length > 0) {
												required = true;
												if (!('required' in target['requestBody']['content'][mt]['schema'])) {
													target['requestBody']['content'][mt]['schema']['required'] = [];
													for (const p of paramObj['requestBody']['content'][mt]['schema']['required']) {
														target['requestBody']['content'][mt]['schema']['required'].push(p);
													}
												}
											}
										} else {
											console.warn("Cannot merge properties of requestBodies", path, method, target['requestBody'], paramObj['requestBody']);
										}
									} else {
										console.warn("Cannot merge requestBodies", path, method, target['requestBody'], paramObj['requestBody']);
									}
								}
							} else {
								target['requestBody']['content'][mt] = paramObj['requestBody']['content'][mt];
							}
						}
						if (required) {
							target['requestBody']['required'] = true;
						}
					} else {
						target['requestBody'] = paramObj['requestBody'];
					}
				}
			}
		} else if (k == 'responses') {
			target[k] = {};
			for (const resp in src[k]) {
				target[k][resp] = convertResponseObject(src[k][resp], api, path, method);
			}
		}
		// TODO
		// oas2 consumes, produces, schemes
		// oas3 callbacks, servers
	}

	convertRefDeep(target);
	return target;
}

function convertSchemaObject(src: any): any
{
	const target = _cloneDeep(src);
	for (const k in target) {
		if (k == '$ref') {
			target[k] = convertRef(target[k]);
		} else if (k == 'discriminator' ) {
			target[k] = {
				'propertyName': target[k]
			}
		} else if (typeof target[k] == 'object') {
			target[k] = convertSchemaObject(target[k]);
		}
	}
	return target;
}

function convertHeaderObject(src: any): any
{
	// TODO
	let target = _cloneDeep(src);
	target['in'] = 'header';
	target = convertParameterObject(target, null, null, null)['parameter'];
	delete target['in'];
	convertRefDeep(target);
	return target;
}

function convertResponseObject(src: any, api: any, path: string, method: string): any
{
	const target = {};
	if ('$ref' in src) {
		target['$ref'] = convertRef(src['$ref']);
		return target;
	}

	target['description'] = src['description']
	if ('headers' in src) {
		target['headers'] = {};
		for (const h in src['headers']) {
			target['headers'][h] = convertHeaderObject(src['headers'][h]);
		}
	}

	let mediaTypes = getMediaTypes('produces', api, path, method);
	if (!mediaTypes) mediaTypes = [ '*/*' ];
	for (const mt of mediaTypes) {
		if ('schema' in src) {
			if (!('content' in target)) target['content'] = {};
			target['content'][mt] = {
				'schema': convertSchemaObject(src['schema'])
			};
		}
		if ('examples' in src) {
			if (!('content' in target)) {
				target['content'] = {};
				target['content'][mt] = {}
			}
			target['content'][mt]['examples'] = {};
			for (const exmt in src['examples']) {
				target['content'][mt]['examples'][exmt] = {
					'value': src['examples'][exmt]
				}
			}
		}
	}

	// oas3 links: n/a
	convertRefDeep(target);
	return target;
}

function convertSecuritySchemeObject(src: any): any
{
	const target = {};
	if ('$ref' in src) {
		target['$ref'] = convertRef(src['$ref']);
	} else {
		if (src['type'] == 'basic') {
			target['type'] = 'http';
			target['scheme'] = 'basic';

		} else if (src['type'] == 'apiKey') {
			target['type'] = 'http';
			target['name'] = src['name'];
			target['in'] = src['in'];

		} else if (src['type'] == 'oauth2') {
			target['type'] = 'oauth2';
			target['flows'] = {};
			if (src['flow'] == 'implicit') {
				target['flows']['implicit'] = {
					'authorizationUrl': src['authorizationUrl'],
					'scopes': _cloneDeep(src['scopes']),
				};

			} else if (src['flow'] == 'password') {
				target['flows']['password'] = {
					'tokenUrl': src['tokenUrl'],
					'scopes': _cloneDeep(src['scopes']),
				};

			} else if (src['flow'] == 'application') {
				target['flows']['clientCredentials'] = {
					'tokenUrl': src['tokenUrl'],
					'scopes': _cloneDeep(src['scopes']),
				};

			} else if (src['flow'] == 'accessCode') {
				target['flows']['authorizationCode'] = {
					'authorizationUrl': src['authorizationUrl'],
					'tokenUrl': src['tokenUrl'],
					'scopes': _cloneDeep(src['scopes']),
				};

			} else {
				console.warn("invalid oauth2 flow type", src['flow']);
			}
		} else {
			console.warn("invalid security scheme type", src['type']);
		}
	}
	copyExtensions(target, src);
	return target;
}

export async function convertOas2to3(src: any): Promise<any>
{
	const target = {};
	// openapi
	target['openapi'] = '3.0.3';
	// info
	target['info'] = _cloneDeep(src['info']);
	// servers: NYI
	// paths
	target['paths'] = {};
	for (const path in src['paths']) {
		target['paths'][path] = {}
		for (const method in src['paths'][path]) {
			if (method == '$ref') {
				target['paths'][path][method] = convertRef(src['paths'][path][method]);
			} else if (method == 'parameters') {
				target['paths'][path]['parameters'] = [];
				for (const param of target['paths'][path]['parameters']) {
					const paramObj = convertParameterObject(param, src, path, null);
					if ('parameter' in paramObj) {
						target['paths'][path]['parameters'].push(paramObj['parameter']);
					} else if ('requestBody' in paramObj) {
						// TODO
					}
				}
			} else {
				target['paths'][path][method] = convertOperationObject(src['paths'][path][method], src, path, method);
			}
		}
	}
	// components
	if (src['definitions'] || src['parameters'] || src['responses']) {
		target['components'] = {}
		if (src['definitions']) {
			// components.schemas
			target['components']['schemas'] = {};
			for (const definition in src['definitions']) {
				target['components']['schemas'][definition] = convertSchemaObject(src['definitions'][definition]);
			}
		}
		if (src['parameters']) {
			// components.parameters
			target['components']['parameters'] = {};
			for (const parameter in src['parameters']) {
				const paramObj = convertParameterObject(src['parameters'][parameter], src, null, null);
				if ('parameter' in paramObj) {
					target['components']['parameters'][parameter] = paramObj['parameter'];
				} else {
					if (!('requestBodies' in target['components'])) {
						target['components']['requestBodies'] = {};
					}
					target['components']['requestBodies'][parameter] = paramObj['requestBody'];
				}
			}
		}
		if (src['responses']) {
			// components.responses
			target['components']['responses'] = {};
			for (const response in src['responses']) {
				target['components']['responses'][response] = convertResponseObject(src['responses'][response], src, null, null);
			}
		}
	}
	// security: NYI (depends on securityDefinitions)
	// if (src['security']) {
	// 	target['security'] = _cloneDeep(src['security']);
	// }
	// tags
	if (src['tags']) {
		target['tags'] = _cloneDeep(src['tags']);
	}
	// externalDocs
	if (src['externalDocs']) {
		target['externalDocs'] = _cloneDeep(src['externalDocs']);
	}
	// x-tensions
	for (const key in src) {
		if (key.startsWith('x-')) {
			target[key] = _cloneDeep(src[key]);
		}
	}
	// done
	return { target: target };
}
