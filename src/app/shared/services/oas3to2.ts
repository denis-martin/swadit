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

/*
 * OpenAPI 3.0 → Swagger 2.0 conversion. Swagger 2.0 cannot express everything of OpenAPI 3.0,
 * so the conversion is lossy: the result is a valid Swagger 2.0 document, and everything that
 * could not be converted (exactly) is reported as a warning.
 */

import { cloneDeep as _cloneDeep } from "lodash-es";

export interface Oas3to2Result
{
	target: any;
	/** what could not be converted (exactly), without duplicates */
	warnings: string[];
}

const formMediaTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

/** the OAuth flows of OAS3 and their OAS2 counterparts (in the order of preference) */
const oauthFlows = {
	'implicit': 'implicit',
	'password': 'password',
	'clientCredentials': 'application',
	'authorizationCode': 'accessCode'
};

/** fields of simple (non-body) parameters, headers and their items */
const simpleSchemaFields = ['type', 'format', 'items', 'default',
	'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength',
	'pattern', 'maxItems', 'minItems', 'uniqueItems', 'enum', 'multipleOf'
];

const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

const operationFields = ['tags', 'summary', 'description', 'externalDocs', 'operationId',
	'consumes', 'produces', 'parameters', 'responses', 'deprecated', 'security'];

function copyExtensions(target: any, src: any): void
{
	for (const k in src) {
		if (k.startsWith('x-')) {
			target[k] = _cloneDeep(src[k]);
		}
	}
}

class Converter
{
	private readonly warnings = new Set<string>();
	/** names of the parameters (OAS2) the request body components became */
	private readonly requestBodyParameters: { [requestBody: string]: string } = {};
	/** component parameters and security schemes that could not be converted */
	private readonly droppedParameters = new Set<string>();
	private readonly droppedSecuritySchemes = new Set<string>();

	constructor(private readonly src: any) {}

	warn(warning: string): void
	{
		this.warnings.add(warning);
	}

	getWarnings(): string[]
	{
		return Array.from(this.warnings);
	}

	/** resolves a local reference (#/components/...) of the OAS3 document */
	private resolve(obj: any): any
	{
		let depth = 0;
		while (obj && typeof obj['$ref'] == 'string' && obj['$ref'].startsWith('#/') && depth++ < 20) {
			let result = this.src;
			for (const segment of obj['$ref'].substring(2).split('/')) {
				const key = decodeURIComponent(segment).replace(/~1/g, '/').replace(/~0/g, '~');
				result = result != null ? result[key] : undefined;
			}
			obj = result;
		}
		return obj;
	}

	private componentName(ref: string, type: string): string
	{
		const prefix = '#/components/' + type + '/';
		return typeof ref == 'string' && ref.startsWith(prefix) ? ref.substring(prefix.length) : null;
	}

	convertRef(ref: string): string
	{
		return ref
			.replace('#/components/schemas/', '#/definitions/')
			.replace('#/components/parameters/', '#/parameters/')
			.replace('#/components/responses/', '#/responses/');
	}

	// --- schemas

	convertSchema(src: any): any
	{
		if (src == null || typeof src != 'object') return src;
		if (Array.isArray(src)) return src.map(s => this.convertSchema(s));
		const target = {};
		for (const k in src) {
			const v = src[k];
			if (k == '$ref' && typeof v == 'string') {
				target[k] = this.convertRef(v);
			} else if (k == 'nullable') {
				if (v) target['x-nullable'] = true;
			} else if (k == 'oneOf' || k == 'anyOf' || k == 'not') {
				if (k != 'not' && Array.isArray(v) && v.length == 1) {
					// a composite of one schema is the schema itself
					Object.assign(target, this.convertSchema(v[0]));
				} else {
					this.warn("oneOf, anyOf and not are not supported and were kept as x-oneOf, x-anyOf and x-not.");
					target['x-' + k] = this.convertSchema(v);
				}
			} else if (k == 'writeOnly' || k == 'deprecated') {
				if (v) target['x-' + k] = v;
			} else if (k == 'discriminator' && v && typeof v == 'object') {
				target[k] = v['propertyName'];
				if (v['mapping']) {
					this.warn("Discriminator mappings are not supported and were removed.");
				}
			} else if (k == 'properties' && v && typeof v == 'object') {
				target[k] = {};
				for (const p in v) {
					target[k][p] = this.convertSchema(v[p]);
				}
			} else if (k == 'example' || k == 'default' || k == 'enum' || k.startsWith('x-')) {
				target[k] = _cloneDeep(v);
			} else if (typeof v == 'object') {
				target[k] = this.convertSchema(v);
			} else {
				target[k] = v;
			}
		}
		// the discriminator property must be a required property in Swagger 2.0
		if (typeof target['discriminator'] == 'string' && target['properties'] && target['properties'][target['discriminator']]) {
			target['required'] = target['required'] || [];
			if (!target['required'].includes(target['discriminator'])) {
				target['required'].push(target['discriminator']);
			}
		}
		return target;
	}

	/** converts the schema of a non-body parameter, header or items (which must not be complex) */
	private convertSimpleSchema(src: any, what: string): any
	{
		const schema = this.resolve(src) || {};
		const target = {};
		for (const field of simpleSchemaFields) {
			if (field in schema) {
				target[field] = _cloneDeep(schema[field]);
			}
		}
		if (schema['nullable']) {
			target['x-nullable'] = true;
		}
		if (!target['type'] || target['type'] == 'object' || (target['type'] == 'array' && !target['items'])) {
			this.warn("Complex schemas of " + what + " are not supported and were converted to strings.");
			return { 'type': 'string' };
		}
		if (target['items']) {
			target['items'] = this.convertSimpleSchema(target['items'], what);
		}
		return target;
	}

	// --- parameters and headers

	private collectionFormat(param: any, schema: any): string
	{
		if (schema['type'] != 'array') return null;
		const style = param['style'] || (param['in'] == 'query' || param['in'] == 'formData' ? 'form' : 'simple');
		const explode = 'explode' in param ? param['explode'] : style == 'form';
		if (style == 'form') {
			return explode ? 'multi' : 'csv';
		} else if (style == 'spaceDelimited') {
			return 'ssv';
		} else if (style == 'pipeDelimited') {
			return 'pipes';
		} else if (style != 'simple') {
			this.warn("The parameter style '" + style + "' is not supported and was removed.");
		}
		return null;
	}

	/** the schema of a parameter or header, which may be defined by its content (one media type) */
	private parameterSchema(param: any, what: string): any
	{
		if (param['schema']) {
			return this.convertSimpleSchema(param['schema'], what);
		}
		if (param['content']) {
			this.warn("Parameters and headers with content (media types) were converted to strings.");
		}
		return { 'type': 'string' };
	}

	/** converts a non-body parameter; returns null if it cannot be converted (cookie parameters) */
	convertParameter(src: any): any
	{
		if (src['$ref']) {
			const name = this.componentName(src['$ref'], 'parameters');
			if (name != null && this.droppedParameters.has(name)) return null;
			return { '$ref': this.convertRef(src['$ref']) };
		}
		if (src['in'] == 'cookie') {
			this.warn("Cookie parameters are not supported and were removed.");
			return null;
		}
		const target = {};
		for (const field of ['name', 'in', 'description', 'required', 'allowEmptyValue']) {
			if (field in src) {
				target[field] = src[field];
			}
		}
		const schema = this.parameterSchema(src, "parameters");
		Object.assign(target, schema);
		const collectionFormat = this.collectionFormat(src, schema);
		if (collectionFormat && collectionFormat != 'csv') {
			if (collectionFormat == 'multi' && src['in'] != 'query') {
				this.warn("Exploded arrays are only supported for query parameters.");
			} else {
				target['collectionFormat'] = collectionFormat;
			}
		}
		const example = this.example(src);
		if (example !== undefined) {
			target['x-example'] = example;
		}
		if (src['deprecated']) {
			target['x-deprecated'] = true;
		}
		copyExtensions(target, src);
		return target;
	}

	convertHeader(src: any): any
	{
		const header = this.resolve(src) || {};
		const target = {};
		if ('description' in header) {
			target['description'] = header['description'];
		}
		Object.assign(target, this.parameterSchema(header, "headers"));
		const example = this.example(header);
		if (example !== undefined) {
			target['x-example'] = example;
		}
		copyExtensions(target, header);
		return target;
	}

	/** the example of a parameter, header or media type (or the value of its first example) */
	private example(src: any): any
	{
		if (src['example'] !== undefined) {
			return _cloneDeep(src['example']);
		}
		const names = Object.keys(src['examples'] || {});
		if (names.length > 0) {
			if (names.length > 1) {
				this.warn("Only the first of several examples was kept.");
			}
			const example = this.resolve(src['examples'][names[0]]) || {};
			if (example['value'] !== undefined) {
				return _cloneDeep(example['value']);
			}
		}
		return undefined;
	}

	// --- request bodies

	/** the preferred media type with a schema (JSON first) */
	private preferredMediaType(content: any): string
	{
		const mediaTypes = Object.keys(content || {});
		const withSchema = mediaTypes.filter(mt => content[mt] && content[mt]['schema']);
		return withSchema.find(mt => /\bjson\b/.test(mt)) || withSchema[0] || mediaTypes[0];
	}

	private convertContentSchema(content: any): any
	{
		const mediaTypes = Object.keys(content || {});
		const preferred = this.preferredMediaType(content);
		if (!preferred || !content[preferred] || !content[preferred]['schema']) return null;
		const schema = JSON.stringify(content[preferred]['schema']);
		if (mediaTypes.some(mt => content[mt] && content[mt]['schema'] && JSON.stringify(content[mt]['schema']) != schema)) {
			this.warn("Swagger 2.0 has only one schema for all media types of a request or response: the schema of '" +
				preferred + "' was kept.");
		}
		return this.convertSchema(content[preferred]['schema']);
	}

	private isFormBody(requestBody: any): boolean
	{
		const mediaTypes = Object.keys(requestBody['content'] || {});
		return mediaTypes.length > 0 && mediaTypes.every(mt => formMediaTypes.includes(mt));
	}

	/** a (non-form) request body as body parameter */
	private bodyParameter(requestBody: any): any
	{
		const target = {
			'name': requestBody['x-codegen-request-body-name'] || 'body',
			'in': 'body'
		};
		if ('description' in requestBody) target['description'] = requestBody['description'];
		if (requestBody['required']) target['required'] = true;
		const content = requestBody['content'] || {};
		target['schema'] = this.convertContentSchema(content) || {};
		const preferred = content[this.preferredMediaType(content)];
		const example = preferred ? this.example(preferred) : undefined;
		if (example !== undefined) {
			target['x-example'] = example;
		}
		if (Object.keys(content).some(mt => formMediaTypes.includes(mt))) {
			this.warn("Request bodies with form and other media types were converted to body parameters.");
		}
		copyExtensions(target, requestBody);
		return target;
	}

	/** a form request body as formData parameters (one per property of its schema) */
	private formParameters(requestBody: any): any[]
	{
		const content = requestBody['content'];
		const mediaType = content[this.preferredMediaType(content)] || {};
		const schema = this.resolve(mediaType['schema']) || {};
		const params = [];
		for (const name in schema['properties'] || {}) {
			const property = this.resolve(schema['properties'][name]) || {};
			let param: any;
			if (property['type'] == 'string' && property['format'] == 'binary') {
				param = { 'name': name, 'in': 'formData', 'type': 'file' };
			} else {
				param = { 'name': name, 'in': 'formData', ...this.convertSimpleSchema(property, "form fields") };
				const collectionFormat = this.collectionFormat({ 'in': 'formData' }, param);
				if (collectionFormat && collectionFormat != 'csv') {
					param['collectionFormat'] = collectionFormat;
				}
			}
			if (property['description']) {
				param['description'] = property['description'];
			}
			if ((schema['required'] || []).includes(name)) {
				param['required'] = true;
			}
			params.push(param);
		}
		if (params.length == 0) {
			this.warn("Form request bodies without properties were removed.");
		}
		return params;
	}

	/** converts the request body of an operation to body or formData parameters (and their media types) */
	private convertRequestBody(src: any): { parameters: any[], consumes: string[] }
	{
		const name = this.componentName(src['$ref'], 'requestBodies');
		const requestBody = this.resolve(src);
		if (!requestBody) return { parameters: [], consumes: [] };
		const consumes = Object.keys(requestBody['content'] || {});
		if (name != null && this.requestBodyParameters[name]) {
			return { parameters: [ { '$ref': '#/parameters/' + this.requestBodyParameters[name] } ], consumes };
		}
		if (this.isFormBody(requestBody)) {
			return { parameters: this.formParameters(requestBody), consumes };
		}
		return { parameters: [ this.bodyParameter(requestBody) ], consumes };
	}

	// --- responses

	convertResponse(src: any, produces: Set<string> = null): any
	{
		if (src['$ref']) {
			const response = this.resolve(src);
			Object.keys((response && response['content']) || {}).forEach(mt => produces && produces.add(mt));
			return { '$ref': this.convertRef(src['$ref']) };
		}
		const target = { 'description': src['description'] || '' };
		const content = src['content'] || {};
		Object.keys(content).forEach(mt => produces && produces.add(mt));
		const schema = this.convertContentSchema(content);
		if (schema) {
			// binary responses are files in Swagger 2.0
			target['schema'] = schema['type'] == 'string' && schema['format'] == 'binary' ? { 'type': 'file' } : schema;
		}
		for (const mt in content) {
			const example = content[mt] ? this.example(content[mt]) : undefined;
			if (example !== undefined) {
				target['examples'] = target['examples'] || {};
				target['examples'][mt] = example;
			}
		}
		if (src['headers']) {
			target['headers'] = {};
			for (const h in src['headers']) {
				target['headers'][h] = this.convertHeader(src['headers'][h]);
			}
		}
		if (src['links']) {
			this.warn("Links are not supported and were removed.");
		}
		copyExtensions(target, src);
		return target;
	}

	// --- operations and paths

	private convertParameters(params: any[]): any[]
	{
		return (params || []).map(p => this.convertParameter(p)).filter(p => p != null);
	}

	convertOperation(src: any): any
	{
		const target = {};
		for (const k of ['tags', 'summary', 'description', 'externalDocs', 'operationId']) {
			if (k in src) {
				target[k] = _cloneDeep(src[k]);
			}
		}
		const parameters = this.convertParameters(src['parameters']);
		if (src['requestBody']) {
			const requestBody = this.convertRequestBody(src['requestBody']);
			parameters.push(...requestBody.parameters);
			if (requestBody.consumes.length > 0) {
				target['consumes'] = requestBody.consumes;
			}
		}
		if (parameters.length > 0) {
			target['parameters'] = parameters;
		}
		const produces = new Set<string>();
		target['responses'] = {};
		for (const code in src['responses'] || {}) {
			target['responses'][code] = this.convertResponse(src['responses'][code], produces);
		}
		if (produces.size > 0) {
			target['produces'] = Array.from(produces);
		}
		if (src['deprecated']) {
			target['deprecated'] = true;
		}
		if (src['security']) {
			const security = this.convertSecurityRequirements(src['security']);
			if (security) {
				target['security'] = security;
			}
		}
		if (src['callbacks']) {
			this.warn("Callbacks are not supported and were removed.");
		}
		if (src['servers']) {
			this.warn("Servers of paths and operations are not supported and were removed.");
		}
		copyExtensions(target, src);
		// the usual order of the fields
		const ordered = {};
		for (const k of [...operationFields, ...Object.keys(target)]) {
			if (k in target && !(k in ordered)) {
				ordered[k] = target[k];
			}
		}
		return ordered;
	}

	convertPathItem(src: any): any
	{
		const target = {};
		for (const k in src) {
			if (k == '$ref') {
				target[k] = src[k];
			} else if (k == 'parameters') {
				const parameters = this.convertParameters(src[k]);
				if (parameters.length > 0) {
					target[k] = parameters;
				}
			} else if (methods.includes(k)) {
				target[k] = this.convertOperation(src[k]);
			} else if (k == 'trace') {
				this.warn("TRACE operations are not supported and were removed.");
			} else if (k == 'servers') {
				this.warn("Servers of paths and operations are not supported and were removed.");
			} else if (k == 'summary' || k == 'description') {
				this.warn("Summaries and descriptions of paths are not supported and were removed.");
			} else if (k.startsWith('x-')) {
				target[k] = _cloneDeep(src[k]);
			}
		}
		return target;
	}

	// --- security

	convertSecurityScheme(name: string, src: any): any
	{
		const scheme = this.resolve(src) || {};
		const target = {};
		if (scheme['type'] == 'apiKey') {
			if (scheme['in'] == 'cookie') {
				this.warn("API keys in cookies are not supported and were removed.");
				return null;
			}
			Object.assign(target, { 'type': 'apiKey', 'name': scheme['name'], 'in': scheme['in'] });
		} else if (scheme['type'] == 'http' && String(scheme['scheme']).toLowerCase() == 'basic') {
			target['type'] = 'basic';
		} else if (scheme['type'] == 'http') {
			this.warn("HTTP authentication other than basic was converted to an API key in the Authorization header.");
			Object.assign(target, { 'type': 'apiKey', 'name': 'Authorization', 'in': 'header' });
		} else if (scheme['type'] == 'oauth2') {
			const flows = Object.keys(oauthFlows).filter(f => scheme['flows'] && scheme['flows'][f]);
			if (flows.length == 0) return null;
			if (flows.length > 1) {
				this.warn("Only the first OAuth flow of a security scheme was converted.");
			}
			const flow = scheme['flows'][flows[0]];
			target['type'] = 'oauth2';
			target['flow'] = oauthFlows[flows[0]];
			if (flows[0] == 'implicit' || flows[0] == 'authorizationCode') {
				target['authorizationUrl'] = flow['authorizationUrl'];
			}
			if (flows[0] != 'implicit') {
				target['tokenUrl'] = flow['tokenUrl'];
			}
			target['scopes'] = _cloneDeep(flow['scopes'] || {});
		} else {
			this.warn("OpenID Connect security schemes are not supported and were removed.");
			return null;
		}
		if (scheme['description']) {
			target['description'] = scheme['description'];
		}
		copyExtensions(target, scheme);
		return target;
	}

	/**
	 * Removes the requirements that use security schemes that could not be converted (removing only
	 * the scheme could make security optional). Returns null if no requirement is left.
	 */
	convertSecurityRequirements(src: any[]): any[]
	{
		const target = src.filter(req => !Object.keys(req || {}).some(s => this.droppedSecuritySchemes.has(s)));
		if (target.length < src.length) {
			this.warn("Security requirements using removed security schemes were removed.");
		}
		return target.length > 0 || src.length == 0 ? _cloneDeep(target) : null;
	}

	// --- servers

	/** host, basePath and schemes from the (first) server */
	convertServers(target: any, servers: any[]): void
	{
		const parse = (server: any) => {
			let url: string = server['url'] || '';
			for (const v in server['variables'] || {}) {
				url = url.split('{' + v + '}').join(server['variables'][v]['default']);
			}
			const m = url.match(/^(?:([a-zA-Z][a-zA-Z0-9+.-]*):)?\/\/([^/]*)(.*)$/);
			const result = m ? { scheme: m[1], host: m[2], basePath: m[3] } : { scheme: null, host: null, basePath: url };
			result.basePath = result.basePath.replace(/\/+$/, '');
			return result;
		};
		const parsed = servers.map(parse);
		const first = parsed[0];
		if (first.host) {
			target['host'] = first.host;
		}
		if (first.basePath) {
			if (first.basePath.startsWith('/')) {
				target['basePath'] = first.basePath;
			} else {
				this.warn("Relative server URLs not starting with '/' are not supported and were removed.");
			}
		}
		const same = parsed.filter(s => s.host == first.host && s.basePath == first.basePath);
		const schemes = same.map(s => s.scheme).filter(s => s && ['http', 'https', 'ws', 'wss'].includes(s));
		if (schemes.length > 0) {
			target['schemes'] = Array.from(new Set(schemes));
		}
		if (same.length < parsed.length) {
			this.warn("Swagger 2.0 has only one server: the first server was kept.");
		}
	}

	// --- document

	convert(): any
	{
		const src = this.src;
		const components = src['components'] || {};
		const target = { 'swagger': '2.0' };
		target['info'] = _cloneDeep(src['info']);
		if (Array.isArray(src['servers']) && src['servers'].length > 0) {
			this.convertServers(target, src['servers']);
		}
		if (src['tags']) {
			target['tags'] = _cloneDeep(src['tags']);
		}

		// components that are needed to convert the paths
		const parameters = {};
		for (const name in components['parameters'] || {}) {
			const param = this.convertParameter(components['parameters'][name]);
			if (param) {
				parameters[name] = param;
			} else {
				this.droppedParameters.add(name);
			}
		}
		for (const name in components['requestBodies'] || {}) {
			const requestBody = this.resolve(components['requestBodies'][name]);
			// form request bodies (several formData parameters) are inlined where they are used
			if (requestBody && !this.isFormBody(requestBody)) {
				let paramName = name;
				for (let i = 2; paramName in parameters || paramName in (components['parameters'] || {}); i++) {
					paramName = name + 'Body' + (i > 2 ? i - 1 : '');
				}
				parameters[paramName] = this.bodyParameter(requestBody);
				this.requestBodyParameters[name] = paramName;
			}
		}
		const securityDefinitions = {};
		for (const name in components['securitySchemes'] || {}) {
			const scheme = this.convertSecurityScheme(name, components['securitySchemes'][name]);
			if (scheme) {
				securityDefinitions[name] = scheme;
			} else {
				this.droppedSecuritySchemes.add(name);
			}
		}

		target['paths'] = {};
		for (const path in src['paths'] || {}) {
			target['paths'][path] = this.convertPathItem(src['paths'][path]);
		}

		if (components['schemas']) {
			target['definitions'] = {};
			for (const name in components['schemas']) {
				target['definitions'][name] = this.convertSchema(components['schemas'][name]);
			}
		}
		if (Object.keys(parameters).length > 0) {
			target['parameters'] = parameters;
		}
		if (components['responses']) {
			target['responses'] = {};
			for (const name in components['responses']) {
				target['responses'][name] = this.convertResponse(components['responses'][name]);
			}
		}
		if (Object.keys(securityDefinitions).length > 0) {
			target['securityDefinitions'] = securityDefinitions;
		}
		if (src['security']) {
			const security = this.convertSecurityRequirements(src['security']);
			if (security) {
				target['security'] = security;
			}
		}
		if (components['links'] && Object.keys(components['links']).length > 0) {
			this.warn("Links are not supported and were removed.");
		}
		if (components['callbacks'] && Object.keys(components['callbacks']).length > 0) {
			this.warn("Callbacks are not supported and were removed.");
		}
		if (src['externalDocs']) {
			target['externalDocs'] = _cloneDeep(src['externalDocs']);
		}
		copyExtensions(target, src);
		return target;
	}
}

export async function convertOas3to2(src: any): Promise<Oas3to2Result>
{
	const converter = new Converter(src);
	const target = converter.convert();
	return { target: target, warnings: converter.getWarnings() };
}
