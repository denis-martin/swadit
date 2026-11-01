import { SwaggerUiModule } from './swaggerui.module';
import { SwaggerUiComponent } from './swaggerui.component';
import { renderComponent } from 'testing/test-helpers';

describe('SwaggerUiComponent', () => {
	let updateSpec: ReturnType<typeof vi.fn>;
	let bundle: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		updateSpec = vi.fn();
		// global provided by swagger-ui-bundle.js in the app
		bundle = vi.fn(function () {
			return { getSystem: () => ({ specActions: { updateSpec } }) };
		});
		vi.stubGlobal('SwaggerUIBundle', bundle);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('shows the current API in Swagger UI', () => {
		const { apis } = renderComponent(SwaggerUiComponent, { imports: [SwaggerUiModule] });
		expect(bundle).toHaveBeenCalledWith(expect.objectContaining({ dom_id: '#swaggerui', spec: apis.current }));
	});

	it('updates Swagger UI when another API is loaded', () => {
		const { apis } = renderComponent(SwaggerUiComponent, { imports: [SwaggerUiModule] });
		apis.newFile();
		expect(updateSpec).toHaveBeenCalledWith(JSON.stringify(apis.current));
	});

	it('stops listening to API changes when destroyed', () => {
		const { fixture, apis } = renderComponent(SwaggerUiComponent, { imports: [SwaggerUiModule] });
		fixture.destroy();
		apis.newFile();
		expect(updateSpec).not.toHaveBeenCalled();
	});
});
