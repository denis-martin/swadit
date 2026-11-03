import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as YAML from 'js-yaml';

import { ApisService } from './apis.service';
import { ConfirmComponent } from 'app/shared/modules/editor-modals/confirm/confirm.component';
import { createApisService, fixtures, loadFixture, provideApisServiceTesting, setCurrentApi } from 'testing/test-helpers';

describe('ApisService', () => {
	let apis: ApisService;

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		vi.spyOn(console, 'info').mockImplementation(() => undefined);
		TestBed.configureTestingModule({
			providers: provideApisServiceTesting()
		});
		apis = createApisService();
	});

	describe('startup', () => {
		it('starts with an empty OpenAPI 3.0 API', () => {
			expect(apis.isOas3).toBe(true);
			expect(apis.isOas2).toBe(false);
			expect(apis.specLabel).toBe('OAS3');
			expect(apis.current.paths).toEqual({});
			expect(apis.currentFileName).toBe('openapi.yaml');
		});

		it('loads the default API from assets/petstore.yaml', async () => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: provideApisServiceTesting() });
			const service = TestBed.inject(ApisService);
			const loaded = firstValueFrom(service.eventApiChanged);
			TestBed.inject(HttpTestingController).expectOne('assets/petstore.yaml').flush(fixtures.petstoreOas3Yaml);
			await loaded;
			expect(service.current.info.title).toBe('Swagger Petstore');
			expect(service.isOas3).toBe(true);
			expect(service.currentFileName).toBe('openapi.yaml');
			expect(Object.keys(service.current.paths)).toHaveLength(8);
		});
	});

	describe('swaggerLoaded', () => {
		it('detects OpenAPI 3.0', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			expect(apis.specVersion).toBe('3.0.3');
			expect(apis.isOas3).toBe(true);
			expect(apis.isOas2).toBe(false);
			expect(apis.schemas).toBeTruthy();
		});
	});

	describe('newFile', () => {
		it('creates a new Swagger 2.0 API, also after an OAS3 API was loaded', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			apis.selectAllPaths();
			apis.hasLoadingErrors = true;
			const changed = vi.fn();
			apis.eventApiChanged.subscribe(changed);
			apis.newFile('oas2');
			expect(apis.current.swagger).toBe('2.0');
			expect(apis.isOas2).toBe(true);
			expect(apis.isOas3).toBe(false);
			expect(apis.specLabel).toBe('OAS2');
			expect(apis.schemas.operation).toBeTruthy();
			expect(apis.selectedPaths).toEqual({});
			expect(apis.hasLoadingErrors).toBe(false);
			expect(changed).toHaveBeenCalled();
		});

		it('creates a new valid OpenAPI 3.0 API by default', async () => {
			apis.newFile('oas2');
			apis.newFile();
			expect(apis.current.openapi).toBe('3.0.3');
			expect(apis.isOas3).toBe(true);
			expect(apis.currentFileName).toBe('openapi.yaml');
			// OAS2 properties are not edited
			expect(apis.schemas.operation.properties.consumes).toBeUndefined();
			expect(apis.methodKeys).toContain('trace');
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
			apis.newFile('oas2');
			expect(apis.currentFileName).toBe('swagger.yaml');
			expect(apis.methodKeys).not.toContain('trace');
		});
	});

	describe('schemas', () => {
		it('provides the editor schemas for OAS2 and OAS3', () => {
			const keys = ['operation', 'response', 'schema', 'security', 'securitySchemes', 'servers', 'parameter', 'requestBody'];
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			keys.forEach(k => expect(apis.schemas[k], k).toBeTruthy());
			// the generic editors resolve refs against the root schema
			expect(apis.resolveObj(apis.schemas.parameter.properties.schema, apis.schemas.root)['x-swadit-swagger-schema']).toBe(true);
			expect(apis.resolveObj(apis.schemas.parameter.properties.schema, apis.schemas.root).properties.nullable).toBeTruthy();
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			['operation', 'response', 'schema', 'security', 'securityDefinitions'].forEach(k => expect(apis.schemas[k], k).toBeTruthy());
		});
	});

	describe('resolveRef', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreOas3Yaml')));

		it.each([
			[ 'petstoreOas2Yaml', '#/definitions/Pet', (api: any) => api.definitions.Pet ],
			[ 'petstoreOas3Yaml', '#/components/schemas/Pet', (api: any) => api.components.schemas.Pet ]
		] as const)('resolves local refs in the current API (%s)', (fixture, ref, pet) => {
			setCurrentApi(apis, loadFixture(fixture));
			expect(apis.resolveRef(ref)).toBe(pet(apis.current));
		});

		it('resolves refs against a given root schema', () => {
			const root = { definitions: { a: { type: 'string' } } };
			expect(apis.resolveRef('#/definitions/a', root)).toBe(root.definitions.a);
		});

		it('resolves global refs into the JSON schema draft-04', () => {
			const r = apis.resolveRef('http://json-schema.org/draft-04/schema#/definitions/positiveInteger');
			expect(r).toEqual({ type: 'integer', minimum: 0 });
		});

		it('decodes JSON pointer escapes (~1, ~0) and percent-encoding', () => {
			const root = { paths: { '/pets': { get: { operationId: 'x' } } }, definitions: { 'a~b': 1, 'Foo Bar': 2 } };
			expect(apis.resolveRef('#/paths/~1pets/get', root)).toBe(root.paths['/pets'].get);
			expect(apis.resolveRef('#/definitions/a~0b', root)).toBe(1);
			expect(apis.resolveRef('#/definitions/Foo%20Bar', root)).toBe(2);
		});

		it('returns null for unresolvable refs', () => {
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			expect(apis.resolveRef('#/components/schemas/DoesNotExist')).toBeFalsy();
			expect(apis.resolveRef('#/does/not/exist')).toBeNull();
		});
	});

	describe('resolveObj', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreOas3Yaml')));

		it('returns non-ref objects unchanged', () => {
			const o = { type: 'string' };
			expect(apis.resolveObj(o)).toBe(o);
			expect(apis.resolveObj(null)).toBeNull();
		});

		it('resolves $ref and keeps x-swadit annotations next to it', () => {
			const r = apis.resolveObj({ '$ref': '#/components/schemas/Tag', 'x-swadit-editor-collapse': true });
			expect(r.properties.name).toBeTruthy();
			expect(r['x-swadit-editor-collapse']).toBe(true);
			// the referenced object itself is not modified
			expect(apis.current.components.schemas.Tag['x-swadit-editor-collapse']).toBeUndefined();
		});

		it('merges allOf schemas', () => {
			const r = apis.resolveObj({ allOf: [
				{ '$ref': '#/components/schemas/Tag' },
				{ type: 'object', required: ['extra'], properties: { extra: { type: 'string' } } }
			] });
			expect(Object.keys(r.properties).sort()).toEqual(['extra', 'id', 'name']);
			expect(r.type).toBe('object');
		});
	});

	describe('generateExample', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreOas3Yaml')));

		it('generates primitive values', () => {
			expect(apis.generateExample({ type: 'string' }, {})).toBe('string');
			expect(apis.generateExample({ type: 'integer' }, {})).toBe(0);
			expect(apis.generateExample({ type: 'boolean' }, {})).toBe(false);
		});

		it('prefers examples and defaults, including falsy ones', () => {
			expect(apis.generateExample({ type: 'string', example: 'ex', default: 'def' }, {})).toBe('ex');
			expect(apis.generateExample({ type: 'string', default: 'def' }, {})).toBe('def');
			expect(apis.generateExample({ type: 'boolean', example: true }, {})).toBe(true);
			expect(apis.generateExample({ type: 'integer', example: 5, default: 7 }, {})).toBe(5);
			expect(apis.generateExample({ type: 'integer', example: 0, default: 7 }, {})).toBe(0);
			expect(apis.generateExample({ type: 'string', example: '', default: 'def' }, {})).toBe('');
		});

		it('generates arrays and objects', () => {
			expect(apis.generateExample({ type: 'array', items: { type: 'integer' } }, {})).toEqual([0]);
			expect(apis.generateExample({ type: 'object', properties: { a: { type: 'string' } } }, {}))
				.toEqual({ a: 'string' });
		});

		it.each([
			[ 'petstoreOas2Yaml', '#/definitions/Pet' ],
			[ 'petstoreOas3Yaml', '#/components/schemas/Pet' ]
		] as const)('expands nested refs to different definitions (%s)', (fixture, ref) => {
			setCurrentApi(apis, loadFixture(fixture));
			const pet = apis.generateExample({ '$ref': ref }, {});
			expect(pet.category).toEqual({ id: 0, name: 'string' });
			expect(pet.tags).toEqual([{ id: 0, name: 'string' }]);
		});

		it('stops on recursive refs', () => {
			const api = loadFixture('petstoreOas3Yaml');
			api.components.schemas.Node = { type: 'object', properties: {
				name: { type: 'string' },
				child: { '$ref': '#/components/schemas/Node' }
			} };
			setCurrentApi(apis, api);
			expect(apis.generateExample({ '$ref': '#/components/schemas/Node' }, {}))
				.toEqual({ name: 'string', child: null });
		});

		it('omits read-only properties if requested', () => {
			const schema = { type: 'object', properties: { id: { type: 'integer', readOnly: true }, name: { type: 'string' } } };
			expect(apis.generateExample(schema, {}, true)).toEqual({ name: 'string' });
			expect(apis.generateExample(schema, {}, false)).toEqual({ id: 0, name: 'string' });
		});

		it('ignores object examples if generation is forced', () => {
			const schema = { type: 'object', example: { a: 'x' }, properties: { a: { type: 'string' } } };
			expect(apis.generateExample(schema, {})).toEqual({ a: 'x' });
			expect(apis.generateExample(schema, {}, false, true)).toEqual({ a: 'string' });
		});
	});

	describe('small helpers', () => {
		it('filterList filters case-insensitively', () => {
			expect(apis.filterList(['/Pet', '/store', '/pet/{id}'], 'PET')).toEqual(['/Pet', '/pet/{id}']);
			expect(apis.filterList(['b', 'a'], null)).toEqual(['b', 'a']);
		});

		it('filterList sorts without modifying the input list', () => {
			const list = ['b', 'C', 'a'];
			expect(apis.filterList(list, null, true)).toEqual(['a', 'b', 'C']);
			expect(list).toEqual(['b', 'C', 'a']);
		});

		it('renameObjectKey keeps the key order', () => {
			const o = { a: 1, b: 2, c: 3 };
			expect(apis.renameObjectKey(o, 'b', 'x')).toBe(o);
			expect(Object.keys(o)).toEqual(['a', 'x', 'c']);
			expect(o['x']).toBe(2);
		});

		it('renameObjectKey does not overwrite other keys', () => {
			const o = { a: 1, b: 2 };
			apis.renameObjectKey(o, 'a', 'b');
			expect(o).toEqual({ a: 1, b: 2 });
		});

		it('getLength handles arrays, objects and empty values', () => {
			expect(apis.getLength([1, 2])).toBe(2);
			expect(apis.getLength({ a: 1 })).toBe(1);
			expect(apis.getLength(null)).toBe(0);
		});

		it('hasExtensions detects x- properties', () => {
			expect(apis.hasExtensions({ 'x-a': 1 })).toBe(true);
			expect(apis.hasExtensions({ a: 1 })).toBe(false);
			expect(apis.hasExtensions(null)).toBe(false);
		});

		it('missingRequiredProperties does not treat falsy values as missing', () => {
			const schema = { required: ['name', 'in', 'required'] };
			expect(apis.missingRequiredProperties(schema, { name: 'n', in: 'path', required: false })).toEqual([]);
			expect(apis.missingRequiredProperties(schema, { name: '', required: true })).toEqual(['name', 'in']);
		});

		it('converts to YAML and JSON', () => {
			expect(apis.toYaml({ a: 1 })).toBe('a: 1\n');
			expect(apis.toJson({ a: 1 })).toBe('{\n  "a": 1\n}');
		});
	});

	describe('paths, methods and parameters', () => {
		const api = {
			swagger: '2.0',
			info: { title: 't', version: '1' },
			consumes: ['application/json'],
			parameters: {
				Body: { name: 'body', in: 'body', schema: { type: 'string' } }
			},
			paths: {
				'/a/{id}': {
					parameters: [
						{ name: 'id', in: 'path', required: true, type: 'string' },
						{ name: 'q', in: 'query', type: 'string', description: 'path level' }
					],
					'x-ext': { a: 1 },
					get: {
						produces: ['text/plain'],
						parameters: [
							{ name: 'q', in: 'query', type: 'integer', description: 'operation level' }
						],
						responses: { default: { description: 'd' } }
					},
					post: {
						parameters: [ { '$ref': '#/parameters/Body' } ],
						responses: { default: { description: 'd' } }
					}
				}
			}
		};

		it('getMethods returns only operations', () => {
			expect(apis.getMethods('/a/{id}', api).map(m => m['key'])).toEqual(['get', 'post']);
			expect(apis.getMethods('/unknown', api)).toEqual([]);
		});

		it('getParameters lets operation parameters override path parameters', () => {
			const params = apis.getParameters(api, '/a/{id}', 'get');
			expect(params.map(p => p['name'])).toEqual(['id', 'q']);
			expect(params.find(p => p['name'] == 'q')['description']).toBe('operation level');
		});

		it('getParameters can exclude (referenced) body parameters', () => {
			setCurrentApi(apis, api);
			expect(apis.getParameters(api, '/a/{id}', 'post').length).toBe(3);
			expect(apis.getParameters(api, '/a/{id}', 'post', false).map(p => p['name'])).toEqual(['id', 'q']);
			expect(apis.getParameters(api, '/unknown', 'get')).toEqual([]);
		});

		it('getBodyParameter finds (referenced) body parameters', () => {
			setCurrentApi(apis, api);
			expect(apis.getBodyParameter(api, '/a/{id}', 'get')).toBeNull();
			expect(apis.getBodyParameter(api, '/a/{id}', 'post')).toEqual({ '$ref': '#/parameters/Body' });
		});

		it('getConsumes/getProduces fall back to the global values', () => {
			expect(apis.getConsumes(api, '/a/{id}', 'get')).toEqual(['application/json']);
			expect(apis.getProduces(api, '/a/{id}', 'get')).toEqual(['text/plain']);
			expect(apis.getProduces(api, '/a/{id}', 'post')).toBeNull();
		});
	});

	describe('paths, methods and parameters (OAS3)', () => {
		const api = {
			openapi: '3.0.3',
			info: { title: 't', version: '1' },
			components: {
				parameters: {
					Q: { name: 'q', in: 'query', schema: { type: 'integer' }, description: 'referenced' }
				}
			},
			paths: {
				'/a/{id}': {
					summary: 's',
					parameters: [
						{ name: 'id', in: 'path', required: true, schema: { type: 'string' } },
						{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'path level' },
						{ name: 'q', in: 'cookie', schema: { type: 'string' } }
					],
					servers: [ { url: '/' } ],
					get: {
						parameters: [ { '$ref': '#/components/parameters/Q' } ],
						responses: { default: { description: 'd' } }
					},
					trace: { responses: { default: { description: 'd' } } }
				}
			}
		};

		it('getMethods returns only operations, including trace', async () => {
			await setCurrentApi(apis, api);
			expect(apis.getMethods('/a/{id}', api).map(m => m['key'])).toEqual(['get', 'trace']);
			expect(apis.methodKeys).toContain('trace');
			apis.newFile('oas2');
			expect(apis.methodKeys).not.toContain('trace');
		});

		it('getParameters lets (referenced) operation parameters override path parameters of the same location', async () => {
			await expect(apis.validate(api)).resolves.toBeTruthy();
			setCurrentApi(apis, api);
			const params = apis.getParameters(api, '/a/{id}', 'get');
			expect(params).toEqual([
				api.paths['/a/{id}'].parameters[0], api.paths['/a/{id}'].parameters[2], { '$ref': '#/components/parameters/Q' }
			]);
			expect(apis.getParameters(api, '/a/{id}', 'trace')).toEqual(api.paths['/a/{id}'].parameters);
			expect(apis.getBodyParameter(api, '/a/{id}', 'get')).toBeNull();
		});
	});

	describe('components', () => {
		it('getComponents maps OAS2 definitions to schemas', () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			expect(apis.getComponents('schemas')).toBe(apis.current.definitions);
			expect(apis.getComponents('definitions')).toBe(apis.current.definitions);
			expect(apis.getComponents('parameters')).toBeNull();
			expect(apis.getComponentsCount('definitions')).toBe(6);
			expect(apis.getComponentsCount('parameters')).toBe(0);
			expect(apis.getDefCategories()).toContain('definitions');
		});

		it('getComponents maps OAS2 securityDefinitions to securitySchemes', () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			expect(apis.getComponents('securitySchemes')).toBe(apis.current.securityDefinitions);
		});

		it('getComponents returns OAS3 components', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			expect(apis.getComponents('schemas')).toBe(apis.current.components.schemas);
			expect(apis.getComponents('securitySchemes')).toBe(apis.current.components.securitySchemes);
			expect(apis.getComponents('examples')).toBeNull();
			expect(apis.getComponentsCount('schemas')).toBe(2);
			expect(apis.getDefCategories()).toContain('schemas');
			expect(apis.getDefCategories()).toContain('requestBodies');
		});

		it('componentRef returns version specific references', () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			expect(apis.componentRef('schemas', 'Pet')).toBe('#/definitions/Pet');
			expect(apis.componentRef('parameters', 'a/b~c')).toBe('#/parameters/a~1b~0c');
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			expect(apis.componentRef('schemas', 'Pet')).toBe('#/components/schemas/Pet');
			expect(apis.componentRef('requestBodies', 'Item')).toBe('#/components/requestBodies/Item');
		});

		it('getOrCreateComponents creates missing component objects', () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			expect(apis.getOrCreateComponents('schemas')).toBe(apis.current.definitions);
			apis.getOrCreateComponents('parameters')['p'] = { name: 'p', in: 'query', type: 'string' };
			expect(apis.current.parameters).toEqual({ p: { name: 'p', in: 'query', type: 'string' } });
			expect(apis.getOrCreateComponents('requestBodies')).toBeNull();

			const api = loadFixture('minimalOas3Yaml');
			delete api.components;
			setCurrentApi(apis, api);
			apis.getOrCreateComponents('requestBodies')['b'] = { content: {} };
			expect(apis.current.components).toEqual({ requestBodies: { b: { content: {} } } });
			expect(apis.getOrCreateComponents('schemas')).toBe(apis.current.components.schemas);
			expect(apis.getOrCreateComponents('unknown')).toBeNull();
		});

		it('cleanUpSecuritySchemes removes the properties of other types and adds required scopes', () => {
			const schemes: any = {
				key: { type: 'apiKey', name: 'k', in: 'header', scheme: 'basic', flows: {} },
				http: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', openIdConnectUrl: 'x', 'x-ext': 1 },
				oauth: { type: 'oauth2', name: 'n', flows: { password: { tokenUrl: 't' }, implicit: { authorizationUrl: 'a', scopes: { r: 'read' } } } },
				ref: { '$ref': '#/components/securitySchemes/key' }
			};
			apis.cleanUpSecuritySchemes(schemes);
			expect(schemes).toEqual({
				key: { type: 'apiKey', name: 'k', in: 'header' },
				http: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', 'x-ext': 1 },
				oauth: { type: 'oauth2', flows: { password: { tokenUrl: 't', scopes: {} }, implicit: { authorizationUrl: 'a', scopes: { r: 'read' } } } },
				ref: { '$ref': '#/components/securitySchemes/key' }
			});
			apis.cleanUpSecuritySchemes(null);
		});

		it('exampleValue returns the (referenced) value of OAS3 examples', () => {
			setCurrentApi(apis, loadFixture('featuresOas3Yaml'));
			expect(apis.exampleValue({ '$ref': '#/components/examples/Item' })).toEqual({ id: 'abc' });
			expect(apis.exampleValue({ summary: 's', value: 0 })).toBe(0);
			expect(apis.exampleValue({ externalValue: 'https://example.com/x.json' })).toEqual({ externalValue: 'https://example.com/x.json' });
			expect(apis.exampleValue('plain')).toBe('plain');
		});
	});

	describe('renameComponent', () => {
		it('renames OAS3 components and updates the references', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			apis.renameComponent('schemas', 'Tag', 'Label');
			expect(apis.current.components.schemas.Label).toBeTruthy();
			expect(apis.current.components.schemas.Item.properties.tags.items).toEqual({ '$ref': '#/components/schemas/Label' });
			apis.renameComponent('parameters', 'Verbose', 'Debug');
			expect(apis.current.paths['/items/{id}'].get.parameters[0]).toEqual({ '$ref': '#/components/parameters/Debug' });
		});

		it.each([
			[ 'petstoreOas2Yaml', '#/definitions/' ],
			[ 'petstoreOas3Yaml', '#/components/schemas/' ]
		] as const)('updates nested references and escapes special characters (%s)', (fixture, prefix) => {
			setCurrentApi(apis, loadFixture(fixture));
			const schemas = apis.getComponents('schemas');
			schemas.Other = { '$ref': prefix + 'Pet/properties/category' };
			apis.renameComponent('schemas', 'Pet', 'a/b~c');
			expect(schemas.Other['$ref']).toBe(prefix + 'a~1b~0c/properties/category');
			expect(apis.resolveRef(schemas.Other['$ref'])).toEqual({ '$ref': prefix + 'Category' });
			// refs that only start with the same name are not changed
			apis.renameComponent('schemas', 'Tag', 'T');
			expect(schemas.Pet).toBeUndefined();
		});

		it('ignores unknown components', () => {
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			const before = JSON.stringify(apis.current);
			apis.renameComponent('schemas', 'Unknown', 'X');
			apis.renameComponent('parameters', 'Unknown', 'X');
			expect(JSON.stringify(apis.current)).toBe(before);
		});
	});

	describe('cleanUp', () => {
		it.each([ 'oas2', 'oas3' ] as const)('removes empty optional values and keeps required ones (%s)', (version) => {
			const op = {
				summary: '',
				description: 'd',
				tags: [],
				externalDocs: {},
				parameters: [],
				responses: {}
			};
			apis.newFile(version);
			apis.cleanUp(apis.schemas.operation, op);
			if (version == 'oas2') {
				expect(op).toEqual({ description: 'd', responses: {} });
			} else {
				// in OAS3, parameters, request body, responses and security are edited (and cleaned up) separately
				expect(op).toEqual({ description: 'd', parameters: [], responses: {} });
			}
		});

		it('reduces $ref objects to the $ref', () => {
			const o = { '$ref': '#/components/schemas/Pet', type: 'object' };
			apis.cleanUp(apis.schemas.schema, o);
			expect(o).toEqual({ '$ref': '#/components/schemas/Pet' });
		});

		it('does not change a complete API document (OAS2)', () => {
			const api = loadFixture('petstoreOas2Yaml');
			setCurrentApi(apis, api);
			apis.cleanUp(apis.schemas.root, apis.current);
			expect(apis.current).toEqual(api);
		});

		it('cleanUpSwaggerSchema removes fields that do not fit the type', () => {
			const arr = { type: 'array', items: { type: 'string' }, properties: {}, format: 'x' };
			apis.cleanUpSwaggerSchema(arr);
			expect(arr).toEqual({ type: 'array', items: { type: 'string' } });
			const str = { type: 'string', items: { type: 'string' }, properties: { a: {} }, format: 'date' };
			apis.cleanUpSwaggerSchema(str);
			expect(str).toEqual({ type: 'string', format: 'date' });
			// schemas without type may have properties (e.g. in OAS3)
			const untyped = { properties: { a: { type: 'string' } } };
			apis.cleanUpSwaggerSchema(untyped);
			expect(untyped).toEqual({ properties: { a: { type: 'string' } } });
		});

		it.each([ 'petstoreOas3Yaml', 'featuresOas3Yaml' ] as const)('does not change a complete OAS3 document (%s)', (fixture) => {
			setCurrentApi(apis, loadFixture(fixture));
			const orig = YAML.dump(apis.current);
			const values = (o: any): any[] => Object.values(o || {}).filter((v: any) => !v['$ref']);
			// all parts of the document that are edited with the editor schemas
			for (const path of Object.keys(apis.current.paths)) {
				values(apis.current.paths[path].parameters).forEach(p => apis.cleanUp(apis.schemas.parameter, p));
				for (const { obj: op } of apis.getMethods(path) as any[]) {
					apis.cleanUp(apis.schemas.operation, op);
					values(op.parameters).forEach(p => apis.cleanUp(apis.schemas.parameter, p));
					values(op.requestBody ? [ op.requestBody ] : []).forEach(b => apis.cleanUp(apis.schemas.requestBody, b));
					values(op.responses).forEach(r => apis.cleanUp(apis.schemas.response, r));
				}
			}
			const components = apis.current.components || {};
			values(components.schemas).forEach(s => apis.cleanUp(apis.schemas.schema, s));
			values(components.parameters).forEach(p => apis.cleanUp(apis.schemas.parameter, p));
			values(components.requestBodies).forEach(b => apis.cleanUp(apis.schemas.requestBody, b));
			values(components.responses).forEach(r => apis.cleanUp(apis.schemas.response, r));
			apis.cleanUp(apis.schemas.securitySchemes, components.securitySchemes);
			apis.cleanUp(apis.schemas.servers, apis.current.servers);
			expect(YAML.dump(apis.current)).toBe(orig);
		});
	});

	describe('path selection', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreOas3Yaml')));

		it('selects, deselects and inverts paths', () => {
			const all = Object.keys(apis.current.paths);
			apis.selectPath('/pet', null);
			expect(Object.keys(apis.selectedPaths)).toEqual(['/pet']);
			apis.selectPath('/pet', null);
			expect(apis.selectedPaths).toEqual({});
			apis.inverseSelectedPaths();
			expect(Object.keys(apis.selectedPaths)).toEqual(all);
			apis.selectPath('/pet', null);
			apis.inverseSelectedPaths();
			expect(Object.keys(apis.selectedPaths)).toEqual(['/pet']);
			apis.selectAllPaths();
			apis.inverseSelectedPaths();
			expect(apis.selectedPaths).toEqual({});
		});

		it('resets the selection when another API is loaded', () => {
			apis.selectAllPaths();
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			expect(apis.selectedPaths).toEqual({});
		});
	});

	describe('mergeSwagger', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreOas3Yaml')));

		it('adds and replaces paths and definitions (OAS2)', () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'));
			apis.mergeSwagger({
				swagger: '2.0',
				paths: {
					'/pet': { get: { responses: { default: { description: 'replaced' } } } },
					'/new': { get: { responses: { default: { description: 'new' } } } }
				},
				definitions: { Pet: { type: 'string' }, New: { type: 'integer' } },
				parameters: { P: { name: 'p', in: 'query', type: 'string' } },
				responses: { R: { description: 'r' } }
			});
			expect(apis.current.paths['/pet'].get.responses.default.description).toBe('replaced');
			expect(apis.current.paths['/new']).toBeTruthy();
			expect(apis.current.paths['/store/inventory']).toBeTruthy();
			expect(apis.current.definitions.Pet).toEqual({ type: 'string' });
			expect(apis.current.definitions.New).toEqual({ type: 'integer' });
			expect(apis.current.definitions.Tag).toBeTruthy();
			expect(apis.current.parameters.P).toBeTruthy();
			expect(apis.current.responses.R).toBeTruthy();
			expect(Object.keys(apis.selectedPaths).sort()).toEqual(['/new', '/pet']);
		});

		it('adds the source to operation descriptions only', () => {
			apis.mergeSwagger({
				openapi: '3.0.3',
				paths: {
					'/new': {
						parameters: [],
						'x-ext': 'value',
						get: { description: 'Desc', responses: { default: { description: 'new' } } },
						put: { responses: { default: { description: 'new' } } }
					}
				}
			}, 'other.yaml', true);
			const path = apis.current.paths['/new'];
			expect(path.get.description).toBe('Source: other.yaml\n\nDesc');
			expect(path.put.description).toBe('Source: other.yaml\n\n');
			expect(path['x-ext']).toBe('value');
		});

		it('works if the current API has no paths', () => {
			apis.current = { openapi: '3.0.3', info: { title: 't', version: '1' } };
			apis.mergeSwagger({ openapi: '3.0.3', paths: { '/new': { get: { responses: {} } } } });
			expect(apis.current.paths['/new']).toBeTruthy();
		});

		it('adds and replaces paths and components (OAS3)', async () => {
			apis.mergeSwagger({
				openapi: '3.0.3',
				paths: {
					'/pet': { get: { responses: { default: { description: 'replaced' } } } },
					'/new': { get: { responses: { default: { description: 'new' } } } }
				},
				components: {
					schemas: { Pet: { type: 'string' }, New: { type: 'integer' } },
					parameters: { P: { name: 'p', in: 'query', schema: { type: 'string' } } },
					requestBodies: { B: { content: { 'text/plain': {} } } },
					securitySchemes: { basic: { type: 'http', scheme: 'basic' } }
				}
			});
			expect(apis.current.paths['/pet'].get.responses.default.description).toBe('replaced');
			expect(apis.current.paths['/new']).toBeTruthy();
			expect(apis.current.paths['/store/inventory']).toBeTruthy();
			expect(apis.current.components.schemas.Pet).toEqual({ type: 'string' });
			expect(apis.current.components.schemas.New).toEqual({ type: 'integer' });
			expect(apis.current.components.schemas.Tag).toBeTruthy();
			expect(apis.current.components.parameters.P).toBeTruthy();
			expect(apis.current.components.requestBodies.B).toBeTruthy();
			expect(Object.keys(apis.current.components.securitySchemes)).toEqual(['petstore_auth', 'api_key', 'basic']);
			expect(Object.keys(apis.selectedPaths).sort()).toEqual(['/new', '/pet']);
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('merges OAS3 components into existing component types', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			apis.mergeSwagger({
				openapi: '3.0.3',
				paths: {},
				components: { schemas: { New: { type: 'string' } }, responses: { NotFound: { description: 'nf' } } }
			});
			expect(apis.current.components.schemas.New).toEqual({ type: 'string' });
			expect(apis.current.components.schemas.Item).toBeTruthy();
			expect(apis.current.components.responses.NotFound).toBeTruthy();
			expect(apis.current.components.responses.Error).toBeTruthy();
		});
	});

	describe('loading files', () => {
		const file = (content: string, name = 'test.yaml') => new File([content], name);
		const nextApiChange = () => firstValueFrom(apis.eventApiChanged);

		beforeEach(() => {
			vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
		});

		it('openFile loads a file chosen by the user', async () => {
			const loaded = nextApiChange();
			apis.openFile(null, file(fixtures.minimalOas3Yaml, 'mini.yaml'));
			await loaded;
			expect(apis.currentFileName).toBe('mini.yaml');
			expect(apis.isOas3).toBe(true);
			expect(apis.current.info.title).toBe('Minimal OAS3');
			expect(apis.lastLoaded).toBe(fixtures.minimalOas3Yaml);
		});

		it('openFile reports YAML errors and shows the source', async () => {
			const loaded = nextApiChange();
			apis.openFile(null, file('a: [', 'broken.yaml'));
			await loaded;
			expect(apis.hasLoadingErrors).toBe(true);
			expect(apis.currentFileName).toBe('broken.yaml');
			expect(apis.lastLoaded).toBe('a: [');
			expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/source']);
		});

		it.each([ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const)('swaggerLoaded flags invalid APIs and shows the source (%s)', async (fixture) => {
			const api = loadFixture(fixture);
			api.paths['/pet'].post.responses = 'invalid';
			setCurrentApi(apis, api);
			await vi.waitFor(() => expect(apis.hasLoadingErrors).toBe(true));
			expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/source']);
		});

		it('swaggerLoaded ignores validation results of a previously loaded API', async () => {
			const invalid = loadFixture('petstoreOas3Yaml');
			invalid.paths['/pet'].post.responses = 'invalid';
			setCurrentApi(apis, invalid);
			await setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			await new Promise(r => setTimeout(r, 50));
			expect(apis.hasLoadingErrors).toBe(false);
			expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
		});

		it('swaggerLoaded clears the error flag of a previous file', async () => {
			apis.hasLoadingErrors = true;
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			await vi.waitFor(() => expect(apis.hasLoadingErrors).toBe(false));
		});

		const apiFile = (version: any, path: string) =>
			file(YAML.dump({ ...version, info: { title: path, version: '1' }, paths: { ['/' + path]: {} } }), path + '.yaml');
		const oas2 = { swagger: '2.0' };
		const oas3 = { openapi: '3.0.3' };

		it.each([
			[ 'petstoreOas2Yaml', oas2 ],
			[ 'petstoreOas3Yaml', oas3 ]
		] as const)('addFile merges files one after the other (%s)', async (fixture, version) => {
			setCurrentApi(apis, loadFixture(fixture));
			apis.filesToAdd = [ apiFile(version, 'a'), apiFile(version, 'b') ];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			await vi.waitFor(() => expect(apis.current.paths['/b']).toBeTruthy());
			expect(apis.current.paths['/a']).toBeTruthy();
			expect(apis.current.paths['/pet']).toBeTruthy();
			expect(apis.filesToAdd).toEqual([]);
		});

		it('addFile keeps the current API if a file cannot be loaded', async () => {
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			const before = YAML.dump(apis.current);
			apis.filesToAdd = [ file('a: [', 'broken.yaml'), apiFile(oas3, 'b') ];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			// the remaining files are still added
			await vi.waitFor(() => expect(apis.current.paths['/b']).toBeTruthy());
			delete apis.current.paths['/b'];
			expect(YAML.dump(apis.current)).toBe(before);
			expect(apis.hasLoadingErrors).toBe(false);
			expect(ConfirmComponent.open).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('broken.yaml'), 'Ok', null);
		});

		it.each([
			[ 'petstoreOas2Yaml', oas3 ],
			[ 'petstoreOas3Yaml', oas2 ]
		] as const)('addFile rejects files with a different spec version (%s)', async (fixture, otherVersion) => {
			setCurrentApi(apis, loadFixture(fixture));
			const before = YAML.dump(apis.current);
			apis.filesToAdd = [ apiFile(otherVersion, 'other') ];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			await vi.waitFor(() => expect(ConfirmComponent.open).toHaveBeenCalled());
			expect(apis.current.paths['/other']).toBeUndefined();
			expect(YAML.dump(apis.current)).toBe(before);
		});

		it.each([
			[ 'petstoreOas2Yaml', (api: any) => api.paths['/pet'].post.parameters[0].schema, '#/definitions/Pet' ],
			[ 'petstoreOas3Yaml', (api: any) => api.paths['/pet'].post.requestBody.content['application/json'].schema, '#/components/schemas/Pet' ]
		] as const)('validateStr resolves with the (not dereferenced) API (%s)', async (fixture, bodySchema, ref) => {
			const api: any = await apis.validateStr(fixtures[fixture]);
			expect(bodySchema(api)).toEqual({ '$ref': ref });
		});

		it('validateStr rejects YAML and validation errors', async () => {
			await expect(apis.validateStr('a: [')).rejects.toMatch(/^YAML Error/);
			await expect(apis.validateStr('swagger: "2.0"')).rejects.toBeTruthy();
			await expect(apis.validateStr('openapi: 3.0.3')).rejects.toBeTruthy();
			await expect(apis.validateStr('openapi: 3.0.3\ninfo: { title: t, version: "1" }')).rejects.toBeTruthy();
			await expect(apis.validateStr('')).rejects.toBeTruthy();
		});

		it.each([ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const)('validate does not modify the given API (%s)', async (fixture) => {
			const api = loadFixture(fixture);
			await apis.validate(api);
			expect(api).toEqual(loadFixture(fixture));
		});
	});

	describe('config', () => {
		const loadConfig = (config: string) => {
			apis.loadConfig();
			TestBed.inject(HttpTestingController).expectOne('assets/config.yaml').flush(config);
		};

		it('applies the configuration', () => {
			loadConfig('title: My APIs\nreadOnly: true\ncatalog:\n  - title: a\n    path: a.yaml\n');
			expect(apis.config.title).toBe('My APIs');
			expect(apis.config.readOnly).toBe(true);
			expect(apis.config.catalog).toEqual([{ title: 'a', path: 'a.yaml' }]);
			expect(apis.config.logo).toBe(true);
		});

		it('keeps defaults of nested settings that are not configured', () => {
			loadConfig('menu:\n  hideItems:\n    new: true\n');
			expect(apis.config.menu.hideItems.new).toBe(true);
			expect(apis.config.menu.hideItems.open).toBe(false);
			expect(apis.config.menu.title).toBe('File');
		});

		it('ignores empty and invalid configuration files', () => {
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			expect(() => loadConfig('')).not.toThrow();
			expect(() => loadConfig('a: [')).not.toThrow();
			expect(apis.config.menu.title).toBe('File');
		});
	});

	describe('modals', () => {
		it('deleteSelectedPaths deletes the selected paths after confirmation', async () => {
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
			apis.selectPath('/pet', null);
			apis.selectPath('/store/order', null);
			apis.deleteSelectedPaths();
			await vi.waitFor(() => expect(apis.current.paths['/pet']).toBeUndefined());
			expect(apis.current.paths['/store/order']).toBeUndefined();
			expect(apis.current.paths['/store/inventory']).toBeTruthy();
			expect(apis.selectedPaths).toEqual({});
		});

		it('deleteSelectedPaths does nothing if cancelled', async () => {
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			vi.spyOn(ConfirmComponent, 'open').mockRejectedValue('cancel');
			apis.selectPath('/pet', null);
			apis.deleteSelectedPaths();
			await new Promise(r => setTimeout(r));
			expect(apis.current.paths['/pet']).toBeTruthy();
			expect(apis.selectedPaths).toEqual({ '/pet': true });
		});

		it.each([
			[ 'petstoreOas2Yaml', 'swagger.yaml' ],
			[ 'petstoreOas3Yaml', 'openapi.yaml' ]
		] as const)('downloadFileModal offers the current API as YAML (%s)', async (fixture, fileName) => {
			setCurrentApi(apis, loadFixture(fixture));
			URL.createObjectURL = vi.fn(() => 'blob:x');
			URL.revokeObjectURL = vi.fn();
			const modalRef: any = { componentInstance: {}, result: new Promise(() => undefined) };
			vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(modalRef);
			apis.hasLoadingErrors = false;
			apis.downloadFileModal();
			expect(modalRef.componentInstance.fileName).toBe(fileName);
			expect(await modalRef.componentInstance.blob.text()).toBe(YAML.dump(apis.current));
			await vi.waitFor(() => expect(modalRef.componentInstance.validationErrors).toBe(false));
			expect(URL.revokeObjectURL).not.toHaveBeenCalled();
			apis.downloadFileModal();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
		});
	});

	describe('convertOas2To3', () => {
		it('converts the current API and updates the version flags', async () => {
			setCurrentApi(apis, loadFixture('petstoreOas2Yaml'), 'petstore.yaml');
			vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
			const changed = firstValueFrom(apis.eventApiChanged);
			apis.convertOas2To3();
			await changed;
			expect(apis.current.openapi).toBe('3.0.3');
			expect(apis.isOas3).toBe(true);
			expect(apis.isOas2).toBe(false);
			expect(apis.currentFileName).toBe('petstore.yaml');
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
		});

		it('changes the default file name with the version', async () => {
			apis.newFile('oas2');
			expect(apis.currentFileName).toBe('swagger.yaml');
			vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
			const changed = firstValueFrom(apis.eventApiChanged);
			apis.convertOas2To3();
			await changed;
			expect(apis.currentFileName).toBe('openapi.yaml');
		});
	});

	describe('convertOas3To2', () => {
		it('converts the current API, keeps its file name and reports what was lost', async () => {
			setCurrentApi(apis, loadFixture('featuresOas3Yaml'), 'features.yaml');
			const open = vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
			const changed = firstValueFrom(apis.eventApiChanged);
			await apis.convertOas3To2();
			await changed;
			expect(apis.current.swagger).toBe('2.0');
			expect(apis.isOas2).toBe(true);
			expect(apis.currentFileName).toBe('features.yaml');
			await expect(apis.validate(apis.current)).resolves.toBeTruthy();
			const text: string = open.mock.calls[0][1];
			expect(text).toContain('converted to Swagger 2.0');
			expect(text).toContain('• Callbacks are not supported and were removed.');
		});

		it('converts the default API without warnings and changes the default file name', async () => {
			setCurrentApi(apis, loadFixture('petstoreOas3Yaml'));
			expect(apis.currentFileName).toBe('openapi.yaml');
			const open = vi.spyOn(ConfirmComponent, 'open').mockResolvedValue('ok');
			await apis.convertOas3To2();
			expect(apis.currentFileName).toBe('swagger.yaml');
			expect(open.mock.calls[0][1]).not.toContain('does not support');
		});

		it('only converts OpenAPI 3.0', async () => {
			apis.newFile('oas2');
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			const open = vi.spyOn(ConfirmComponent, 'open');
			await apis.convertOas3To2();
			expect(apis.isOas2).toBe(true);
			expect(open).not.toHaveBeenCalled();
		});
	});
});
