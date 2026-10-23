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
		it('starts with an empty Swagger 2.0 API', () => {
			expect(apis.isOas2).toBe(true);
			expect(apis.isOas3).toBe(false);
			expect(apis.current.paths).toEqual({});
		});

		it('loads the default API from assets/petstore.yaml', async () => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: provideApisServiceTesting() });
			const service = TestBed.inject(ApisService);
			const loaded = firstValueFrom(service.eventApiChanged);
			TestBed.inject(HttpTestingController).expectOne('assets/petstore.yaml').flush(fixtures.petstoreYaml);
			await loaded;
			expect(service.current.info.title).toBe('Swagger Petstore');
			expect(service.isOas2).toBe(true);
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
			apis.newFile();
			expect(apis.current.swagger).toBe('2.0');
			expect(apis.isOas2).toBe(true);
			expect(apis.isOas3).toBe(false);
			expect(apis.schemas.operation).toBeTruthy();
			expect(apis.selectedPaths).toEqual({});
			expect(apis.hasLoadingErrors).toBe(false);
			expect(changed).toHaveBeenCalled();
		});
	});

	describe('resolveRef', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreYaml')));

		it('resolves local refs in the current API', () => {
			expect(apis.resolveRef('#/definitions/Pet')).toBe(apis.current.definitions.Pet);
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
			expect(apis.resolveRef('#/definitions/DoesNotExist')).toBeFalsy();
			expect(apis.resolveRef('#/does/not/exist')).toBeNull();
		});
	});

	describe('resolveObj', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreYaml')));

		it('returns non-ref objects unchanged', () => {
			const o = { type: 'string' };
			expect(apis.resolveObj(o)).toBe(o);
			expect(apis.resolveObj(null)).toBeNull();
		});

		it('resolves $ref and keeps x-swadit annotations next to it', () => {
			const r = apis.resolveObj({ '$ref': '#/definitions/Tag', 'x-swadit-editor-collapse': true });
			expect(r.properties.name).toBeTruthy();
			expect(r['x-swadit-editor-collapse']).toBe(true);
			// the referenced object itself is not modified
			expect(apis.current.definitions.Tag['x-swadit-editor-collapse']).toBeUndefined();
		});

		it('merges allOf schemas', () => {
			const r = apis.resolveObj({ allOf: [
				{ '$ref': '#/definitions/Tag' },
				{ type: 'object', required: ['extra'], properties: { extra: { type: 'string' } } }
			] });
			expect(Object.keys(r.properties).sort()).toEqual(['extra', 'id', 'name']);
			expect(r.type).toBe('object');
		});
	});

	describe('generateExample', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreYaml')));

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

		it('expands nested refs to different definitions', () => {
			const pet = apis.generateExample({ '$ref': '#/definitions/Pet' }, {});
			expect(pet.category).toEqual({ id: 0, name: 'string' });
			expect(pet.tags).toEqual([{ id: 0, name: 'string' }]);
		});

		it('stops on recursive refs', () => {
			const api = loadFixture('petstoreYaml');
			api.definitions.Node = { type: 'object', properties: {
				name: { type: 'string' },
				child: { '$ref': '#/definitions/Node' }
			} };
			setCurrentApi(apis, api);
			expect(apis.generateExample({ '$ref': '#/definitions/Node' }, {}))
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

	describe('components', () => {
		it('getComponents maps OAS2 definitions to schemas', () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			expect(apis.getComponents('schemas')).toBe(apis.current.definitions);
			expect(apis.getComponents('definitions')).toBe(apis.current.definitions);
			expect(apis.getComponents('parameters')).toBeNull();
			expect(apis.getComponentsCount('definitions')).toBe(6);
			expect(apis.getComponentsCount('parameters')).toBe(0);
			expect(apis.getDefCategories()).toContain('definitions');
		});

		it('getComponents maps OAS2 securityDefinitions to securitySchemes', () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			expect(apis.getComponents('securitySchemes')).toBe(apis.current.securityDefinitions);
		});

		it('getComponents returns OAS3 components', () => {
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			expect(apis.getComponents('schemas')).toBe(apis.current.components.schemas);
			expect(apis.getComponents('securitySchemes')).toBe(apis.current.components.securitySchemes);
			expect(apis.getComponents('examples')).toBeNull();
			expect(apis.getComponentsCount('schemas')).toBe(2);
			expect(apis.getDefCategories()).toContain('schemas');
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

		it('updates nested references and escapes special characters', () => {
			const api = loadFixture('petstoreYaml');
			api.definitions.Other = { '$ref': '#/definitions/Pet/properties/category' };
			setCurrentApi(apis, api);
			apis.renameComponent('definitions', 'Pet', 'a/b~c');
			expect(apis.current.definitions.Other['$ref']).toBe('#/definitions/a~1b~0c/properties/category');
			expect(apis.resolveRef(apis.current.definitions.Other['$ref'])).toEqual({ '$ref': '#/definitions/Category' });
			// refs that only start with the same name are not changed
			apis.renameComponent('definitions', 'Tag', 'T');
			expect(apis.current.definitions.Pet).toBeUndefined();
		});

		it('ignores unknown components', () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			const before = JSON.stringify(apis.current);
			apis.renameComponent('definitions', 'Unknown', 'X');
			apis.renameComponent('parameters', 'Unknown', 'X');
			expect(JSON.stringify(apis.current)).toBe(before);
		});
	});

	describe('cleanUp', () => {
		it('removes empty optional values and keeps required ones', () => {
			const op = {
				summary: '',
				description: 'd',
				tags: [],
				externalDocs: {},
				parameters: [],
				responses: {}
			};
			apis.cleanUp(apis.schemas.operation, op);
			expect(op).toEqual({ description: 'd', responses: {} });
		});

		it('reduces $ref objects to the $ref', () => {
			const o = { '$ref': '#/definitions/Pet', type: 'object' };
			apis.cleanUp(apis.schemas.schema, o);
			expect(o).toEqual({ '$ref': '#/definitions/Pet' });
		});

		it('does not change a complete API document', () => {
			const api = loadFixture('petstoreYaml');
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
		});
	});

	describe('path selection', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreYaml')));

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
			setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			expect(apis.selectedPaths).toEqual({});
		});
	});

	describe('mergeSwagger', () => {
		beforeEach(() => setCurrentApi(apis, loadFixture('petstoreYaml')));

		it('adds and replaces paths and definitions', () => {
			apis.mergeSwagger({
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
			apis.current = { swagger: '2.0', info: { title: 't', version: '1' } };
			apis.mergeSwagger({ paths: { '/new': { get: { responses: {} } } } });
			expect(apis.current.paths['/new']).toBeTruthy();
		});

		it('merges OAS3 components', () => {
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

		it('swaggerLoaded flags invalid APIs and shows the source', async () => {
			const api = loadFixture('petstoreYaml');
			api.paths['/pet'].post.responses = 'invalid';
			setCurrentApi(apis, api);
			await vi.waitFor(() => expect(apis.hasLoadingErrors).toBe(true));
			expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/source']);
		});

		it('swaggerLoaded ignores validation results of a previously loaded API', async () => {
			const invalid = loadFixture('petstoreYaml');
			invalid.paths['/pet'].post.responses = 'invalid';
			setCurrentApi(apis, invalid);
			await setCurrentApi(apis, loadFixture('minimalOas3Yaml'));
			await new Promise(r => setTimeout(r, 50));
			expect(apis.hasLoadingErrors).toBe(false);
			expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
		});

		it('swaggerLoaded clears the error flag of a previous file', async () => {
			apis.hasLoadingErrors = true;
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			await vi.waitFor(() => expect(apis.hasLoadingErrors).toBe(false));
		});

		it('addFile merges files one after the other', async () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			apis.filesToAdd = [
				file(YAML.dump({ swagger: '2.0', info: { title: 'a', version: '1' }, paths: { '/a': {} } }), 'a.yaml'),
				file(YAML.dump({ swagger: '2.0', info: { title: 'b', version: '1' }, paths: { '/b': {} } }), 'b.yaml')
			];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			await vi.waitFor(() => expect(apis.current.paths['/b']).toBeTruthy());
			expect(apis.current.paths['/a']).toBeTruthy();
			expect(apis.current.paths['/pet']).toBeTruthy();
			expect(apis.filesToAdd).toEqual([]);
		});

		it('addFile keeps the current API if a file cannot be loaded', async () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			const before = YAML.dump(apis.current);
			apis.filesToAdd = [
				file('a: [', 'broken.yaml'),
				file(YAML.dump({ swagger: '2.0', info: { title: 'b', version: '1' }, paths: { '/b': {} } }), 'b.yaml')
			];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			// the remaining files are still added
			await vi.waitFor(() => expect(apis.current.paths['/b']).toBeTruthy());
			delete apis.current.paths['/b'];
			expect(YAML.dump(apis.current)).toBe(before);
			expect(apis.hasLoadingErrors).toBe(false);
			expect(ConfirmComponent.open).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('broken.yaml'), 'Ok', null);
		});

		it('addFile rejects files with a different spec version', async () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			apis.filesToAdd = [ file(fixtures.minimalOas3Yaml, 'mini.yaml') ];
			apis.filesToAddIndex = 0;
			apis.addFile(null, apis.filesToAdd[0]);
			await vi.waitFor(() => expect(ConfirmComponent.open).toHaveBeenCalled());
			expect(apis.current.paths['/items/{id}']).toBeUndefined();
			expect(apis.isOas2).toBe(true);
		});

		it('validateStr resolves with the (not dereferenced) API', async () => {
			const api: any = await apis.validateStr(fixtures.petstoreYaml);
			expect(api.paths['/pet'].post.parameters[0].schema).toEqual({ '$ref': '#/definitions/Pet' });
		});

		it('validateStr rejects YAML and validation errors', async () => {
			await expect(apis.validateStr('a: [')).rejects.toMatch(/^YAML Error/);
			await expect(apis.validateStr('swagger: "2.0"')).rejects.toBeTruthy();
			await expect(apis.validateStr('')).rejects.toBeTruthy();
		});

		it('validate does not modify the given API', async () => {
			const api = loadFixture('petstoreYaml');
			await apis.validate(api);
			expect(api).toEqual(loadFixture('petstoreYaml'));
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
			setCurrentApi(apis, loadFixture('petstoreYaml'));
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
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			vi.spyOn(ConfirmComponent, 'open').mockRejectedValue('cancel');
			apis.selectPath('/pet', null);
			apis.deleteSelectedPaths();
			await new Promise(r => setTimeout(r));
			expect(apis.current.paths['/pet']).toBeTruthy();
			expect(apis.selectedPaths).toEqual({ '/pet': true });
		});

		it('downloadFileModal offers the current API as YAML', async () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'));
			URL.createObjectURL = vi.fn(() => 'blob:x');
			URL.revokeObjectURL = vi.fn();
			const modalRef: any = { componentInstance: {}, result: new Promise(() => undefined) };
			vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(modalRef);
			apis.hasLoadingErrors = false;
			apis.downloadFileModal();
			expect(modalRef.componentInstance.fileName).toBe('swagger.yaml');
			expect(await modalRef.componentInstance.blob.text()).toBe(YAML.dump(apis.current));
			await vi.waitFor(() => expect(modalRef.componentInstance.validationErrors).toBe(false));
			expect(URL.revokeObjectURL).not.toHaveBeenCalled();
			apis.downloadFileModal();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
		});
	});

	describe('convertOas2To3', () => {
		it('converts the current API and updates the version flags', async () => {
			setCurrentApi(apis, loadFixture('petstoreYaml'), 'petstore.yaml');
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
	});
});
