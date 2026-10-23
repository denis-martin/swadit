import SwaggerParser from '@apidevtools/swagger-parser';

import { convertOas2to3 } from './oas2to3';
import { loadFixture } from 'testing/test-helpers';

const parserOptions: SwaggerParser.Options = { resolve: { file: false, http: false } };

describe('convertOas2to3', () => {
	let src: any;
	let target: any;

	beforeEach(async () => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		src = loadFixture('featuresOas2Yaml');
		target = (await convertOas2to3(src)).target;
	});

	it('starts from a valid Swagger 2.0 fixture', async () => {
		await expect(SwaggerParser.validate(loadFixture('featuresOas2Yaml'), parserOptions)).resolves.toBeTruthy();
	});

	it('creates a valid OpenAPI 3.0 document', async () => {
		await expect(SwaggerParser.validate(target, parserOptions)).resolves.toBeTruthy();
		expect(target.openapi).toBe('3.0.3');
		expect(target.info).toEqual(src.info);
	});

	it('does not modify the source', () => {
		expect(src).toEqual(loadFixture('featuresOas2Yaml'));
	});

	it('converts petstore to a valid OpenAPI 3.0 document', async () => {
		const result = (await convertOas2to3(loadFixture('petstoreYaml'))).target;
		await expect(SwaggerParser.validate(result, parserOptions)).resolves.toBeTruthy();
	});

	it('converts host, basePath and schemes to servers', () => {
		expect(target.servers).toEqual([
			{ url: 'https://api.example.com/v1' },
			{ url: 'http://api.example.com/v1' }
		]);
	});

	it('converts definitions and their refs', () => {
		expect(target.components.schemas.Item.discriminator).toEqual({ propertyName: 'kind' });
		// a property that happens to be called "discriminator" is not a discriminator
		expect(target.components.schemas.Item.properties.discriminator).toEqual({ type: 'string' });
		expect(target.paths['/items'].get.responses['200'].content['application/json'].schema.items)
			.toEqual({ '$ref': '#/components/schemas/Item' });
	});

	it('converts security definitions and requirements', () => {
		expect(target.components.securitySchemes).toEqual({
			basicAuth: { type: 'http', scheme: 'basic' },
			key: { type: 'apiKey', name: 'X-Key', in: 'header', 'x-key-ext': 1 },
			oauth: { type: 'oauth2', flows: { authorizationCode: {
				authorizationUrl: 'https://example.com/auth',
				tokenUrl: 'https://example.com/token',
				scopes: { read: 'read access' }
			} } }
		});
		expect(target.security).toEqual([{ key: [] }]);
		expect(target.paths['/items'].get.security).toEqual([{ oauth: ['read'] }]);
	});

	it('keeps extensions', () => {
		expect(target['x-root-ext']).toBe('root');
		expect(target.paths['/items'].get['x-op-ext']).toBe('op');
	});

	it('converts path level parameters', () => {
		expect(target.paths['/items/{id}'].parameters).toEqual([
			{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }
		]);
	});

	it('converts referenced parameters', () => {
		expect(target.components.parameters.Limit).toEqual({ name: 'limit', in: 'query', schema: { type: 'integer' } });
		expect(target.paths['/items'].get.parameters[0]).toEqual({ '$ref': '#/components/parameters/Limit' });
	});

	it('converts referenced body parameters to request bodies', () => {
		expect(target.components.requestBodies.ItemBody).toEqual({
			required: true,
			content: { 'application/json': { schema: { '$ref': '#/components/schemas/Item' } } }
		});
		expect(target.paths['/items'].post.requestBody).toEqual({ '$ref': '#/components/requestBodies/ItemBody' });
		expect(target.paths['/items'].post.parameters).toBeUndefined();
	});

	it('converts collectionFormat to style/explode', () => {
		const params = target.paths['/items'].get.parameters;
		expect(params[1]).toEqual({ name: 'ids', in: 'query', style: 'form', explode: false,
			schema: { type: 'array', items: { type: 'string' } } });
		expect(params[2]).toEqual({ name: 'tags', in: 'query', style: 'form', explode: true,
			schema: { type: 'array', items: { type: 'string' } } });
	});

	it('merges form parameters into one request body', () => {
		const schema = target.paths['/items/{id}'].put.requestBody.content['application/x-www-form-urlencoded'].schema;
		expect(schema.properties).toEqual({ name: { type: 'string' }, size: { type: 'integer' } });
		expect(schema.required).toEqual(['name', 'size']);
		expect(target.paths['/items/{id}'].put.requestBody.required).toBe(true);
	});

	it('converts response examples per media type', () => {
		const content = target.paths['/items'].get.responses['200'].content;
		expect(content['application/json'].example).toEqual([{ kind: 'a' }]);
		const plain = target.paths['/plain'].get.responses['200'];
		expect(plain.content).toEqual({ 'text/plain': { example: 'hello' } });
	});

	it('converts response refs', () => {
		expect(target.paths['/items'].get.responses['404']).toEqual({ '$ref': '#/components/responses/NotFound' });
		expect(target.components.responses.NotFound).toEqual({ description: 'not found' });
	});
});
