import SwaggerParser from '@apidevtools/swagger-parser';

import { convertOas3to2 } from './oas3to2';
import { convertOas2to3 } from './oas2to3';
import { loadFixture } from 'testing/test-helpers';

const parserOptions: SwaggerParser.Options = { resolve: { file: false, http: false } };

const validate = (api: any) => SwaggerParser.validate(JSON.parse(JSON.stringify(api)), parserOptions);

/** a minimal OAS3 document with the given paths and components */
const oas3 = (paths: any, components: any = undefined, extra: any = {}) =>
	({ openapi: '3.0.3', info: { title: 't', version: '1' }, paths, ...(components ? { components } : {}), ...extra });

describe('convertOas3to2', () => {
	it('converts the default API (petstore) without warnings', async () => {
		const { target, warnings } = await convertOas3to2(loadFixture('petstoreOas3Yaml'));
		await expect(validate(target)).resolves.toBeTruthy();
		expect(warnings).toEqual([]);
		expect(target.swagger).toBe('2.0');
		expect(target.basePath).toBe('/v1');
		expect(Object.keys(target.paths)).toHaveLength(8);
		expect(Object.keys(target.definitions)).toEqual(['Order', 'Category', 'User', 'Tag', 'Pet', 'ApiResponse']);
		const addPet = target.paths['/pet'].post;
		expect(addPet.consumes).toEqual(['application/json', 'application/xml']);
		expect(addPet.parameters).toEqual([ {
			name: 'body', in: 'body', description: 'Pet object that needs to be added to the store', required: true,
			schema: { '$ref': '#/definitions/Pet' }
		} ]);
		// form request bodies become formData parameters, binary properties become files
		expect(target.paths['/pet/{petId}/uploadImage'].post.parameters.slice(1)).toEqual([
			{ name: 'additionalMetadata', in: 'formData', type: 'string', description: 'Additional data to pass to server' },
			{ name: 'file', in: 'formData', type: 'file', description: 'file to upload' }
		]);
		expect(target.paths['/pet/findByStatus'].get.parameters[0]).toMatchObject({ type: 'array', collectionFormat: 'multi' });
		expect(target.paths['/pet/findByStatus'].get.produces).toEqual(['application/xml', 'application/json']);
		expect(target.securityDefinitions.petstore_auth).toEqual({
			type: 'oauth2', flow: 'implicit', authorizationUrl: 'https://demo.froschbach.io/oauth/',
			scopes: { 'write:pets': 'modify pets in your account', 'read:pets': 'read your pets' }
		});
	});

	it('converts OAS2 → OAS3 → OAS2 without losing paths and definitions', async () => {
		const oas2 = loadFixture('featuresOas2Yaml');
		const { target: converted } = await convertOas2to3(oas2);
		const { target } = await convertOas3to2(converted);
		await expect(validate(target)).resolves.toBeTruthy();
		expect(Object.keys(target.paths)).toEqual(Object.keys(oas2.paths));
		expect(Object.keys(target.definitions)).toEqual(Object.keys(oas2.definitions));
	});

	it('converts all OAS3 features to a valid Swagger 2.0 document and reports what was lost', async () => {
		const { target, warnings } = await convertOas3to2(loadFixture('featuresOas3Yaml'));
		await expect(validate(target)).resolves.toBeTruthy();
		// the first server, with its variables replaced by their defaults
		expect(target.host).toBe('api.example.com');
		expect(target.basePath).toBe('/v1');
		expect(target.schemes).toEqual(['https']);
		// request body components become body parameters
		expect(target.paths['/items'].post.parameters).toEqual([ { '$ref': '#/parameters/Item' } ]);
		expect(target.parameters.Item).toMatchObject({ name: 'body', in: 'body', schema: { '$ref': '#/definitions/Item' } });
		// schemas
		expect(target.definitions.Item.properties.value).toEqual({ 'x-oneOf': [ { type: 'string' }, { type: 'integer' } ], 'x-nullable': true });
		expect(target.definitions.Pet).toMatchObject({ discriminator: 'name', required: ['name'] });
		// parameters, headers and examples
		expect(target.paths['/items'].get.parameters[0]).toEqual({ name: 'filter', in: 'query', type: 'string', 'x-nullable': true, 'x-example': 'name' });
		const ok = target.paths['/items'].get.responses['200'];
		expect(ok.headers['X-Rate-Limit']).toEqual({ description: 'Requests per hour', type: 'integer' });
		expect(ok.examples).toEqual({ 'application/json': { id: 'abc' } });
		// security
		expect(Object.keys(target.securityDefinitions)).toEqual(['key', 'basic', 'bearer', 'oauth']);
		expect(target.securityDefinitions.bearer).toEqual({ type: 'apiKey', name: 'Authorization', in: 'header' });
		expect(target.securityDefinitions.oauth.flow).toBe('implicit');
		expect(target.security).toEqual([ { oauth: ['read'] }, {} ]);
		expect(warnings).toEqual([
			'Swagger 2.0 has only one server: the first server was kept.',
			'HTTP authentication other than basic was converted to an API key in the Authorization header.',
			'Only the first OAuth flow of a security scheme was converted.',
			'OpenID Connect security schemes are not supported and were removed.',
			'Links are not supported and were removed.',
			'Callbacks are not supported and were removed.',
			'oneOf, anyOf and not are not supported and were kept as x-oneOf, x-anyOf and x-not.'
		]);
	});

	it('removes cookie parameters and security requirements using removed schemes', async () => {
		const { target, warnings } = await convertOas3to2(oas3({
			'/a': {
				parameters: [ { name: 'c', in: 'cookie', schema: { type: 'string' } }, { '$ref': '#/components/parameters/Session' } ],
				get: {
					security: [ { oidc: [] } ],
					responses: { default: { description: 'd' } }
				},
				trace: { responses: { default: { description: 'd' } } }
			}
		}, {
			parameters: { Session: { name: 's', in: 'cookie', schema: { type: 'string' } } },
			securitySchemes: { oidc: { type: 'openIdConnect', openIdConnectUrl: 'https://example.com' } }
		}, { security: [ { oidc: [] } ] }));
		await expect(validate(target)).resolves.toBeTruthy();
		expect(target.paths['/a']).toEqual({ get: { responses: { default: { description: 'd' } } } });
		expect(target.parameters).toBeUndefined();
		expect(target.security).toBeUndefined();
		expect(warnings).toContain('Cookie parameters are not supported and were removed.');
		expect(warnings).toContain('Security requirements using removed security schemes were removed.');
		expect(warnings).toContain('TRACE operations are not supported and were removed.');
	});

	it('converts parameter styles, complex parameters and responses', async () => {
		const { target, warnings } = await convertOas3to2(oas3({
			'/a/{ids}': {
				get: {
					parameters: [
						{ name: 'ids', in: 'path', required: true, schema: { type: 'array', items: { type: 'integer' } } },
						{ name: 'q', in: 'query', style: 'form', explode: false, schema: { type: 'array', items: { type: 'string' } } },
						{ name: 'p', in: 'query', style: 'pipeDelimited', schema: { type: 'array', items: { type: 'string' } } },
						{ name: 'o', in: 'query', schema: { '$ref': '#/components/schemas/Obj' } },
						{ name: 'j', in: 'query', content: { 'application/json': { schema: { type: 'object' } } } }
					],
					responses: {
						'200': { description: 'file', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
						'400': { $ref: '#/components/responses/Error' }
					}
				}
			}
		}, {
			schemas: { Obj: { type: 'object' } },
			responses: { Error: { description: 'e', content: { 'application/json': { schema: { type: 'object' } } } } }
		}, { servers: [ { url: 'http://localhost:8080/api/' }, { url: 'https://localhost:8080/api' } ] }));
		await expect(validate(target)).resolves.toBeTruthy();
		const op = target.paths['/a/{ids}'].get;
		expect(op.parameters.map(p => [p.name, p.type, p.collectionFormat])).toEqual([
			['ids', 'array', undefined], ['q', 'array', undefined], ['p', 'array', 'pipes'], ['o', 'string', undefined], ['j', 'string', undefined]
		]);
		expect(op.responses['200'].schema).toEqual({ type: 'file' });
		expect(op.responses['400']).toEqual({ '$ref': '#/responses/Error' });
		expect(op.produces).toEqual(['application/octet-stream', 'application/json']);
		expect(target.host).toBe('localhost:8080');
		expect(target.basePath).toBe('/api');
		expect(target.schemes).toEqual(['http', 'https']);
		expect(warnings).toEqual([
			'Complex schemas of parameters are not supported and were converted to strings.',
			'Parameters and headers with content (media types) were converted to strings.'
		]);
	});

	it('names body parameters of request bodies without conflicts', async () => {
		const { target } = await convertOas3to2(oas3({
			'/a': {
				post: { requestBody: { $ref: '#/components/requestBodies/Item' }, responses: { default: { description: 'd' } } },
				put: { parameters: [ { $ref: '#/components/parameters/Item' } ], responses: { default: { description: 'd' } } }
			}
		}, {
			parameters: { Item: { name: 'item', in: 'query', schema: { type: 'string' } } },
			requestBodies: { Item: { content: { 'text/plain': { schema: { type: 'string' } } } } }
		}));
		await expect(validate(target)).resolves.toBeTruthy();
		expect(Object.keys(target.parameters)).toEqual(['Item', 'ItemBody']);
		expect(target.paths['/a'].post.parameters).toEqual([ { '$ref': '#/parameters/ItemBody' } ]);
		expect(target.paths['/a'].put.parameters).toEqual([ { '$ref': '#/parameters/Item' } ]);
	});
});
