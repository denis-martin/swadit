import SwaggerParser from '@apidevtools/swagger-parser';

import { fixtures, loadFixture } from 'testing/test-helpers';

// same options as the app: no resolution of external (file/http) references
const parserOptions: SwaggerParser.Options = { resolve: { file: false, http: false } };

describe('test fixtures', () => {
	it.each(Object.keys(fixtures))('%s is a valid API document', async (name: keyof typeof fixtures) => {
		const api = loadFixture(name);
		expect(api.swagger || api.openapi).toBeTruthy();
		await expect(SwaggerParser.validate(api, parserOptions)).resolves.toBeTruthy();
	});
});
