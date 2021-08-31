import { clone as _clone, cloneDeep as _cloneDeep, pull as _pull, remove as _remove } from "lodash-es";

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
			for (let k in src) {
				convertRefDeep(src[k]);
			}
		}
	}
}

function convertParameterObject(src: any): any
{
	let target = {};
	if (src['in'] == 'query' || src['in'] == 'header' || src['in'] == 'path') {
		target['parameter'] = {};
		const copyFields = ['name', 'in', 'description', 'required', 'allowEmptyValue'];
		const copySchemaFields = ['type', 'format', 'items', 
			'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength',
			'pattern', 'maxItems', 'minItems', 'uniqueItems', 'enum', 'multipleOf'
		]
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
		// TODO: x-tensions
	} else { // formData or body
		target['requestBody'] = {
			'content': {}
		}
		if ('required' in src) target['requestBody']['required'] = src['required'];
		if ('description' in src) target['requestBody']['description'] = src['description'];
		if ('schema' in src) {
			let mediaType = "application/json";
			target['requestBody']['content'][mediaType] = {
				'schema': convertSchemaObject(src['schema'])
			}
		}
	}
	convertRefDeep(target);
	return target;
}

function convertOperationObject(src: any): any
{
	let target = {};
	for (let k in src) {
		if (k == 'summary' || k == 'description' || k == 'operationId' || k == 'deprecated') {
			target[k] = src[k];

		} else if (k == 'tags' || k == 'externalDocs' /*|| k == 'security'*/) {
			target[k] = _cloneDeep(src[k]);

		} else if (k == 'parameters') {
			target[k] = [];
			for (let param of src[k]) {
				let paramObj = convertParameterObject(param);
				if ('parameter' in paramObj) {
					target[k].push(paramObj['parameter']);
				} else if ('requestBody' in paramObj) {
					target['requestBody'] = paramObj['requestBody'];
				}
			}
		} else if (k == 'responses') {
			target[k] = {};
			for (let resp in src[k]) {
				target[k][resp] = convertResponseObject(src[k][resp]);
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
	let target = _cloneDeep(src);
	convertRefDeep(target);
	return target;
}

function convertHeaderObject(src: any): any
{
	// TODO
	let target = _cloneDeep(src);
	convertRefDeep(target);
	return target;
}

function convertResponseObject(src: any): any
{
	let target = {
		'description': src['description']
	};
	if ('headers' in src) {
		target['headers'] = convertHeaderObject(src);
	}
	// TODO: get MediaType
	let mediaType = 'application/json';
	if ('schema' in src) {
		target['content'] = {};
		target['content'][mediaType] = {
			'schema': convertSchemaObject(src['schema'])
		};
	}
	if ('examples' in src) {
		if (!('content' in target)) {
			target['content'] = {};
			target['content'][mediaType] = {}
		}
		target['content'][mediaType]['examples'] = src['examples']
	}
	// oas3 links: n/a
	convertRefDeep(target);
	return target;
}

export async function convertOas2to3(src: any): Promise<any>
{
	let target = {};
	// openapi
	target['openapi'] = '3.0.3';
	// info
	target['info'] = _cloneDeep(src['info']);
	// servers: NYI
	// paths
	target['paths'] = {};
	for (let path in src['paths']) {
		target['paths'][path] = {}
		for (let method in src['paths'][path]) {
			if (method == '$ref') {
				target['paths'][path][method] = convertRef(src['paths'][path][method]);
			} else if (method == 'parameters') {
				target['paths'][path]['parameters'] = [];
				for (let param of target['paths'][path]['parameters']) {
					let paramObj = convertParameterObject(param);
					if ('parameter' in paramObj) {
						target['paths'][path]['parameters'].push(paramObj['parameter']);
					} else if ('requestBody' in paramObj) {
						// TODO
					}
				}
			} else {
				target['paths'][path][method] = convertOperationObject(src['paths'][path][method]);
			}
		}
	}
	// components
	if (src['definitions'] || src['parameters'] || src['responses']) {
		target['components'] = {}
		if (src['definitions']) {
			// components.schemas
			target['components']['schemas'] = {};
			for (let definition in src['definitions']) {
				target['components']['schemas'][definition] = convertSchemaObject(src['definitions'][definition]);
			}
		}
		if (src['parameters']) {
			// components.parameters
			target['components']['parameters'] = {};
			for (let parameter in src['parameters']) {
				target['components']['parameters'][parameter] = convertParameterObject(src['parameters'][parameter]);
			}
		}
		if (src['responses']) {
			// components.responses
			target['components']['responses'] = {};
			for (let response in src['responses']) {
				target['components']['responses'][response] = convertResponseObject(src['responses'][response]);
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
	for (let key in src) {
		if (key.startsWith('x-')) {
			target[key] = _cloneDeep(src[key]);
		}
	}
	// done
	return { target: target };
}
