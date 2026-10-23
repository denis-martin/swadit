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
		if (k.startsWith('x-')) {
			target[k] = _cloneDeep(src[k]);
		}
	}
}

function getMediaTypes(type: string, oas2root: any, path: string, method: string): string[]
{
	let result: string[];
	if (oas2root && path && method && (type in oas2root['paths'][path][method])) {
		result = _cloneDeep(oas2root['paths'][path][method][type]);
	} else if (oas2root && type in oas2root) {
		result = _cloneDeep(oas2root[type]);
	}
	return result;
}

/** Resolves a parameter reference (#/parameters/...) of the Swagger 2.0 document. */
function resolveParameter(src: any, api: any): any
{
	if (src && src['$ref'] && api && api['parameters']) {
		const name = src['$ref'].replace('#/parameters/', '');
		return api['parameters'][name];
	}
	return src;
}

function isBodyParameter(src: any, api: any): boolean
{
	const param = resolveParameter(src, api);
	return param != null && (param['in'] == 'body' || param['in'] == 'formData');
}

const copySchemaFields = ['type', 'format', 'items', 'default',
	'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength',
	'pattern', 'maxItems', 'minItems', 'uniqueItems', 'enum', 'multipleOf'
];

function convertSimpleSchema(src: any): any
{
	const schema = {};
	for (const field of copySchemaFields) {
		if (field in src) {
			schema[field] = _cloneDeep(src[field]);
		}
	}
	if (schema['items']) {
		// items of non-body parameters/headers may have a collectionFormat themselves, which has no OAS3 equivalent
		schema['items'] = convertSimpleSchema(schema['items']);
	}
	if (src['type'] == 'file') {
		schema['type'] = 'string';
		schema['format'] = 'binary';
	}
	return schema;
}

/** Converts a non-body (query, header, path) parameter or a header object. */
function convertParameterObject(src: any): any
{
	if ('$ref' in src) {
		return { '$ref': convertRef(src['$ref']) };
	}
	const copyFields = ['name', 'in', 'description', 'required', 'allowEmptyValue'];
	const target = {};
	for (const field of copyFields) {
		if (field in src) {
			target[field] = src[field];
		}
	}
	if (src['type'] == 'array') {
		const collectionFormat = src['collectionFormat'] || 'csv';
		if (src['in'] == 'query') {
			if (collectionFormat == 'csv') {
				target['style'] = 'form';
				target['explode'] = false;
			} else if (collectionFormat == 'multi') {
				target['style'] = 'form';
				target['explode'] = true;
			} else if (collectionFormat == 'ssv') {
				target['style'] = 'spaceDelimited';
			} else if (collectionFormat == 'pipes') {
				target['style'] = 'pipeDelimited';
			} else {
				console.warn("collectionFormat cannot be converted", src);
			}
		} else if (collectionFormat != 'csv') {
			console.warn("collectionFormat cannot be converted", src);
		}
	}
	if ('type' in src) {
		target['schema'] = convertSimpleSchema(src);
	}
	copyExtensions(target, src);
	return target;
}

/** Converts the body/formData parameters of an operation to a request body. */
function convertRequestBody(params: any[], api: any, path: string, method: string): any
{
	// a referenced body parameter becomes a referenced request body
	if (params.length == 1 && params[0]['$ref']) {
		const param = resolveParameter(params[0], api);
		if (param && param['in'] == 'body') {
			return { '$ref': params[0]['$ref'].replace('#/parameters', '#/components/requestBodies') };
		}
	}
	params = params.map(p => resolveParameter(p, api));

	const target = { 'content': {} };
	const body = params.find(p => p['in'] == 'body');
	if (body) {
		if ('description' in body) target['description'] = body['description'];
		if ('required' in body) target['required'] = body['required'];
		let mediaTypes = getMediaTypes('consumes', api, path, method);
		if (!mediaTypes) mediaTypes = [ '*/*' ];
		for (const mt of mediaTypes) {
			target['content'][mt] = {
				'schema': convertSchemaObject(body['schema'] || {})
			};
		}
		copyExtensions(target, body);
		return target;
	}

	// formData parameters are merged into the properties of one object schema
	const schema = { 'type': 'object', 'properties': {} };
	for (const param of params) {
		const property = convertSimpleSchema(param);
		if ('description' in param) {
			property['description'] = param['description'];
		}
		schema['properties'][param['name']] = property;
		if (param['required']) {
			if (!schema['required']) {
				schema['required'] = [];
			}
			schema['required'].push(param['name']);
			target['required'] = true;
		}
	}
	const formMediaTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
	let mediaTypes = (getMediaTypes('consumes', api, path, method) || []).filter(mt => formMediaTypes.includes(mt));
	if (mediaTypes.length == 0) {
		mediaTypes = params.some(p => p['type'] == 'file') ? ['multipart/form-data'] : ['application/x-www-form-urlencoded'];
	}
	for (const mt of mediaTypes) {
		target['content'][mt] = { 'schema': _cloneDeep(schema) };
	}
	return target;
}

function parameterId(src: any, api: any): string
{
	const param = resolveParameter(src, api) || {};
	return param['in'] + ":" + param['name'];
}

function convertOperationObject(src: any, api: any, path: string, method: string): any
{
	const target = {};
	for (const k in src) {
		if (k == 'summary' || k == 'description' || k == 'operationId' || k == 'deprecated') {
			target[k] = src[k];

		} else if (k == 'tags' || k == 'externalDocs' || k == 'security') {
			target[k] = _cloneDeep(src[k]);

		} else if (k == 'parameters') {
			for (const param of src[k]) {
				if (!isBodyParameter(param, api)) {
					if (!(k in target)) {
						target[k] = [];
					}
					target[k].push(convertParameterObject(param));
				}
			}

		} else if (k == 'responses') {
			target[k] = {};
			for (const resp in src[k]) {
				target[k][resp] = convertResponseObject(src[k][resp], api, path, method);
			}

		} else if (k.startsWith('x-')) {
			target[k] = _cloneDeep(src[k]);
		}
		// TODO
		// oas2 schemes
		// oas3 callbacks, servers
	}

	// body and formData parameters (including the ones on path level) become the request body
	const operationParams: any[] = src['parameters'] || [];
	const operationParamIds = operationParams.map(p => parameterId(p, api));
	const pathParams: any[] = (api['paths'][path]['parameters'] || [])
		.filter(p => !operationParamIds.includes(parameterId(p, api)));
	const bodyParams = pathParams.concat(operationParams).filter(p => isBodyParameter(p, api));
	if (bodyParams.length > 0) {
		target['requestBody'] = convertRequestBody(bodyParams, api, path, method);
	}

	convertRefDeep(target);
	return target;
}

function convertSchemaObject(src: any): any
{
	const target = _cloneDeep(src);
	for (const k in target) {
		if (k == '$ref' && typeof target[k] == 'string') {
			target[k] = convertRef(target[k]);
		} else if (k == 'discriminator' && typeof target[k] == 'string') {
			target[k] = {
				'propertyName': target[k]
			}
		} else if (k == 'x-nullable' && typeof target[k] == 'boolean') {
			target['nullable'] = target[k];
			delete target[k];
		} else if (typeof target[k] == 'object') {
			target[k] = convertSchemaObject(target[k]);
		}
	}
	if (target['type'] == 'file') {
		target['type'] = 'string';
		target['format'] = 'binary';
	}
	return target;
}

function convertHeaderObject(src: any): any
{
	const target = convertParameterObject(src);
	delete target['style'];
	delete target['explode'];
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

	if ('schema' in src) {
		let mediaTypes = getMediaTypes('produces', api, path, method);
		if (!mediaTypes) mediaTypes = [ '*/*' ];
		target['content'] = {};
		for (const mt of mediaTypes) {
			target['content'][mt] = {
				'schema': convertSchemaObject(src['schema'])
			};
		}
	}
	// oas2 examples are keyed by media type
	if ('examples' in src) {
		if (!('content' in target)) {
			target['content'] = {};
		}
		for (const mt in src['examples']) {
			if (!(mt in target['content'])) {
				target['content'][mt] = 'schema' in src ? { 'schema': convertSchemaObject(src['schema']) } : {};
			}
			target['content'][mt]['example'] = _cloneDeep(src['examples'][mt]);
		}
	}

	// oas3 links: n/a
	copyExtensions(target, src);
	convertRefDeep(target);
	return target;
}

function convertSecuritySchemeObject(src: any): any
{
	const target = {};
	if ('$ref' in src) {
		target['$ref'] = convertRef(src['$ref']);
	} else {
		if ('description' in src) {
			target['description'] = src['description'];
		}
		if (src['type'] == 'basic') {
			target['type'] = 'http';
			target['scheme'] = 'basic';

		} else if (src['type'] == 'apiKey') {
			target['type'] = 'apiKey';
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

function convertServers(src: any): any[]
{
	const basePath = src['basePath'] || '';
	if (src['host']) {
		const schemes: string[] = src['schemes'] && src['schemes'].length > 0 ? src['schemes'] : [ 'https' ];
		return schemes.map(scheme => ({ 'url': scheme + '://' + src['host'] + basePath }));
	} else if (basePath) {
		return [ { 'url': basePath } ];
	}
	return null;
}

export async function convertOas2to3(src: any): Promise<any>
{
	const target = {};
	// openapi
	target['openapi'] = '3.0.3';
	// info
	target['info'] = _cloneDeep(src['info']);
	// servers
	const servers = convertServers(src);
	if (servers) {
		target['servers'] = servers;
	}
	// paths
	target['paths'] = {};
	for (const path in src['paths']) {
		target['paths'][path] = {}
		for (const method in src['paths'][path]) {
			if (method == '$ref') {
				target['paths'][path][method] = convertRef(src['paths'][path][method]);
			} else if (method == 'parameters') {
				// body and formData parameters are moved to the request bodies of the operations
				const params = src['paths'][path]['parameters'].filter(p => !isBodyParameter(p, src));
				if (params.length > 0) {
					target['paths'][path]['parameters'] = params.map(p => convertParameterObject(p));
				}
			} else if (method.startsWith('x-')) {
				target['paths'][path][method] = _cloneDeep(src['paths'][path][method]);
			} else {
				target['paths'][path][method] = convertOperationObject(src['paths'][path][method], src, path, method);
			}
		}
	}
	// components
	if (src['definitions'] || src['parameters'] || src['responses'] || src['securityDefinitions']) {
		target['components'] = {}
		if (src['definitions']) {
			// components.schemas
			target['components']['schemas'] = {};
			for (const definition in src['definitions']) {
				target['components']['schemas'][definition] = convertSchemaObject(src['definitions'][definition]);
			}
		}
		if (src['parameters']) {
			// components.parameters and components.requestBodies
			for (const parameter in src['parameters']) {
				if (isBodyParameter(src['parameters'][parameter], src)) {
					if (!('requestBodies' in target['components'])) {
						target['components']['requestBodies'] = {};
					}
					target['components']['requestBodies'][parameter] =
						convertRequestBody([ src['parameters'][parameter] ], src, null, null);
				} else {
					if (!('parameters' in target['components'])) {
						target['components']['parameters'] = {};
					}
					target['components']['parameters'][parameter] = convertParameterObject(src['parameters'][parameter]);
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
		if (src['securityDefinitions']) {
			// components.securitySchemes
			target['components']['securitySchemes'] = {};
			for (const scheme in src['securityDefinitions']) {
				target['components']['securitySchemes'][scheme] = convertSecuritySchemeObject(src['securityDefinitions'][scheme]);
			}
		}
	}
	// security
	if (src['security']) {
		target['security'] = _cloneDeep(src['security']);
	}
	// tags
	if (src['tags']) {
		target['tags'] = _cloneDeep(src['tags']);
	}
	// externalDocs
	if (src['externalDocs']) {
		target['externalDocs'] = _cloneDeep(src['externalDocs']);
	}
	// x-tensions
	copyExtensions(target, src);
	// done
	return { target: target };
}
