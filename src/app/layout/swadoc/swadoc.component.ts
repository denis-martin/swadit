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

import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApisService } from '../../shared/services';

const maxLevel = 20;
const headerHeight = 70; // fixed header of the layout (plus some space)

/** A (flattened) property of a schema, shown as a row of the property table. */
export interface DocProperty {
	name: string;
	level: number;
	required: boolean;
	notes: string; // e.g. "required, read-only"
	type: string;
	schema: any; // resolved property schema
}

export interface DocSchema {
	type: string;
	description: string;
	properties: Array<DocProperty>;
	example: string; // JSON, empty if there are no properties to show
}

export interface DocParameter {
	name: string;
	in: string;
	required: boolean;
	deprecated: boolean;
	type: string;
	description: string;
	schema: any; // object holding default, example and enum
}

export interface DocBody {
	description: string;
	mediaTypes: Array<string>;
	schema: DocSchema;
}

export interface DocResponse {
	code: string;
	description: string;
	mediaTypes: Array<string>;
	schema: DocSchema;
}

export interface DocOperation {
	method: string;
	deprecated: boolean;
	summary: string;
	description: string;
	parameters: Array<DocParameter>;
	body: DocBody;
	responses: Array<DocResponse>;
}

export interface DocPath {
	path: string;
	anchor: string;
	operations: Array<DocOperation>;
}

/**
 * Print preview: renders the current API as a document that can be printed (e.g. as PDF).
 */
@Component({
	selector: 'app-swadoc',
	templateUrl: './swadoc.component.html',
	styleUrls: ['./swadoc.component.scss'],
	// the print styles need to hide the header and sidebar of the layout
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.Eager,
	standalone: false
})
export class SwadocComponent implements OnInit, AfterViewInit
{
	info: any = {};
	baseUrls: Array<string> = [];
	paths: Array<DocPath> = [];
	docUrl: string; // URL of this page without fragment, for the links within the document

	constructor(public apis: ApisService, private title: Title)
	{
		this.apis.eventApiChanged.pipe(takeUntilDestroyed()).subscribe(() => this.update());
	}

	ngOnInit()
	{
		this.docUrl = window.location.href.split('#')[0];
		this.update();
	}

	ngAfterViewInit()
	{
		if (this.apis.activePath) {
			// wait for the (asynchronous) markdown rendering, which changes the positions
			const anchor = this.getPathAnchor(this.apis.activePath);
			setTimeout(() => this.scrollTo(anchor, 'instant'));
		}
	}

	print(): void
	{
		// the browser uses the title as default file name when saving as PDF
		const title = this.title.getTitle();
		if (this.info.title) {
			this.title.setTitle(this.info.title);
		}
		window.print();
		this.title.setTitle(title);
	}

	scrollTo(anchor: string, behavior: ScrollBehavior = 'smooth'): boolean
	{
		// keep the target below the fixed header of the layout
		const element = document.getElementById(anchor);
		if (element) {
			window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerHeight, behavior });
		}
		return false; // don't follow the link
	}

	getPathAnchor(path: string): string
	{
		return 'swadoc' + path.replace(/\//g, '-');
	}

	update(): void
	{
		const api = this.apis.current || {};
		this.info = api['info'] || {};
		this.baseUrls = this.getBaseUrls(api);
		this.paths = this.apis.filterList(this.apis.keys(api['paths']), null, true).map(path => ({
			path: path,
			anchor: this.getPathAnchor(path),
			operations: this.apis.getMethods(path, api).map(m => this.getOperation(api, path, m['key'], m['obj'] || {}))
		}));
	}

	private getBaseUrls(api: any): Array<string>
	{
		if (this.apis.isOas3) {
			return (api['servers'] || []).map(s => s['url']).filter(url => url);
		}
		if (!api['host']) {
			return api['basePath'] ? [ api['basePath'] ] : [];
		}
		const schemes: Array<string> = api['schemes'] && api['schemes'].length > 0 ? api['schemes'] : [ null ];
		return schemes.map(scheme => (scheme ? scheme + '://' : '//') + api['host'] + (api['basePath'] || ''));
	}

	private getOperation(api: any, path: string, method: string, op: any): DocOperation
	{
		return {
			method: method,
			deprecated: !!op['deprecated'],
			summary: op['summary'],
			description: op['description'],
			parameters: this.apis.getParameters(api, path, method, false)
				.map(p => this.getParameter(this.apis.resolveObj(p, api) || {})),
			body: this.apis.isOas3 ? this.getRequestBody(op) : this.getBodyParameter(api, path, method),
			responses: this.apis.keys(op['responses']).map(code => this.getResponse(api, path, method, code, op['responses'][code]))
		};
	}

	private getParameter(param: any): DocParameter
	{
		// OAS3 parameters describe their type with a schema, OAS2 parameters directly
		let schema = param;
		if (param['schema']) {
			schema = Object.assign({}, this.apis.resolveObj(param['schema']));
			if (param['example'] !== undefined) {
				schema['example'] = param['example'];
			}
		}
		return {
			name: param['name'],
			in: param['in'],
			required: !!param['required'],
			deprecated: !!param['deprecated'],
			type: this.getType(param['schema'] || param),
			description: param['description'],
			schema: schema || {}
		};
	}

	/** OAS2: the body parameter */
	private getBodyParameter(api: any, path: string, method: string): DocBody
	{
		const body = this.apis.resolveObj(this.apis.getBodyParameter(api, path, method), api);
		if (!body) {
			return null;
		}
		return {
			description: body['description'],
			mediaTypes: this.apis.getConsumes(api, path, method) || [],
			schema: this.getSchema(body['schema'])
		};
	}

	/** OAS3: the request body */
	private getRequestBody(op: any): DocBody
	{
		const body = this.apis.resolveObj(op['requestBody']);
		if (!body) {
			return null;
		}
		const content = this.getContent(body['content']);
		return {
			description: body['description'],
			mediaTypes: content.mediaTypes,
			schema: this.getSchema(content.schema, content.example)
		};
	}

	private getResponse(api: any, path: string, method: string, code: string, response: any): DocResponse
	{
		response = this.apis.resolveObj(response, api) || {};
		let mediaTypes: Array<string>;
		let schema: any;
		let example: any;
		if (this.apis.isOas3) {
			const content = this.getContent(response['content']);
			mediaTypes = content.mediaTypes;
			schema = content.schema;
			example = content.example;
		} else {
			schema = response['schema'];
			mediaTypes = schema ? this.apis.getProduces(api, path, method) || [] : [];
			const examples = response['examples'] || {};
			const mediaType = mediaTypes.find(m => examples[m] !== undefined) || this.apis.keys(examples)[0];
			example = mediaType ? examples[mediaType] : undefined;
		}
		return {
			code: code,
			description: response['description'],
			mediaTypes: mediaTypes,
			schema: this.getSchema(schema, example)
		};
	}

	/** OAS3: media types of a content object, and the schema and example of the first one having a schema */
	private getContent(content: any): { mediaTypes: Array<string>, schema: any, example: any }
	{
		const mediaTypes = this.apis.keys(content);
		const mediaType = mediaTypes.find(m => content[m] && content[m]['schema']);
		if (!mediaType) {
			return { mediaTypes, schema: null, example: undefined };
		}
		let example = content[mediaType]['example'];
		const examples = content[mediaType]['examples'];
		if (example === undefined && examples) {
			const first = this.apis.resolveObj(examples[this.apis.keys(examples)[0]]);
			example = first ? first['value'] : undefined;
		}
		return { mediaTypes, schema: content[mediaType]['schema'], example };
	}

	private getSchema(schema: any, example: any = undefined): DocSchema
	{
		const resolved = schema ? this.apis.resolveObj(schema) : null;
		if (!resolved) {
			return null;
		}
		const properties: Array<DocProperty> = [];
		this.flattenProperties(schema, 0, [], properties);
		if (example === undefined && properties.length > 0) {
			example = this.apis.generateExample(schema, {});
		}
		return {
			type: this.getType(schema),
			description: resolved['description'],
			properties: properties,
			example: properties.length > 0 && example !== undefined ? this.apis.toJson(example) : ''
		};
	}

	/**
	 * Resolves a schema, keeping track of the references passed on the way. Returns null for
	 * recursive references.
	 */
	private expand(schema: any, refs: Array<string>): { schema: any, refs: Array<string> }
	{
		if (!schema) {
			return null;
		}
		if (schema['$ref']) {
			if (refs.includes(schema['$ref'])) {
				return null;
			}
			refs = refs.concat(schema['$ref']);
		}
		const resolved = this.apis.resolveObj(schema);
		return resolved ? { schema: resolved, refs } : null;
	}

	/** Flattens the (nested) properties of an object schema or of the items of an array schema */
	private flattenProperties(schema: any, level: number, refs: Array<string>, result: Array<DocProperty>): void
	{
		if (level > maxLevel) {
			console.warn("swadoc: exceeding max level (" + maxLevel + ")");
			return;
		}
		let expanded = this.expand(schema, refs);
		if (expanded && expanded.schema['type'] == 'array') {
			expanded = this.expand(expanded.schema['items'], expanded.refs);
		}
		if (!expanded || !expanded.schema['properties']) {
			return;
		}
		const s = expanded.schema;
		this.apis.keys(s['properties']).forEach(name => {
			const property = s['properties'][name];
			const resolved = this.apis.resolveObj(property) || {};
			const required = Array.isArray(s['required']) && s['required'].includes(name);
			result.push({
				name: name,
				level: level,
				required: required,
				notes: [ required && 'required', resolved['readOnly'] && 'read-only', resolved['writeOnly'] && 'write-only' ]
					.filter(n => n).join(', '),
				type: this.getType(property),
				schema: resolved
			});
			this.flattenProperties(property, level + 1, expanded.refs, result);
		});
	}

	/** A short type description of a schema, e.g. "string (date-time)", "array (Pet)" */
	getType(schema: any, level = 0): string
	{
		if (!schema || level > maxLevel) {
			return '';
		}
		const refName = schema['$ref'] ? schema['$ref'].split('/').pop() : null;
		const s = this.apis.resolveObj(schema);
		if (!s) {
			return refName || '';
		}
		for (const k of ['oneOf', 'anyOf']) {
			if (Array.isArray(s[k])) {
				return k + ' (' + s[k].map(o => this.getType(o, level + 1)).join(' | ') + ')';
			}
		}
		const type = s['type'] || (s['properties'] ? 'object' : '');
		if (type == 'array') {
			return 'array (' + this.getType(s['items'], level + 1) + ')';
		}
		if (type == 'object' && refName) {
			return refName;
		}
		return type + (s['format'] ? ' (' + s['format'] + ')' : '');
	}

	/** Allowed values of a schema (or of the items of an array schema) */
	getEnum(schema: any): Array<any>
	{
		if (Array.isArray(schema['enum'])) {
			return schema['enum'];
		}
		const items = this.apis.resolveObj(schema['items']);
		return items && Array.isArray(items['enum']) ? items['enum'] : null;
	}

	/** Formats a default, example or enum value, e.g. "available" (quoted), 42, {"a":1} */
	formatValue(value: any): string
	{
		return JSON.stringify(value);
	}
}
