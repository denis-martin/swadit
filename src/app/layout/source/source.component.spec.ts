import * as YAML from 'js-yaml';

import { SourceModule } from './source.module';
import { SourceComponent } from './source.component';
import { fixtures, loadFixture, renderComponent } from 'testing/test-helpers';

/** minimal stand-in for the global Ace editor (loaded as a script in the app) */
class FakeAceEditor
{
	value = "";
	private listeners: Array<() => void> = [];
	session = { setValue: (v: string) => { this.value = v; }, setMode: vi.fn() };
	setOptions = vi.fn();
	setTheme = vi.fn();
	setReadOnly = vi.fn();
	destroy = vi.fn();
	getValue(): string { return this.value; }
	on(event: string, cb: () => void): void { this.listeners.push(cb); }
	type(value: string): void { this.value = value; this.listeners.forEach(cb => cb()); }
}

describe('SourceComponent', () => {
	let editor: FakeAceEditor;

	beforeEach(() => {
		editor = new FakeAceEditor();
		vi.stubGlobal('ace', { edit: () => editor });
	});

	afterEach(() => vi.unstubAllGlobals());

	const render = (api?: any) => renderComponent(SourceComponent, { imports: [SourceModule], api });
	const status = (element: HTMLElement) => element.querySelector('.editor-header .mt-1').textContent.trim();

	it.each([ 'petstoreOas2Yaml', 'petstoreOas3Yaml' ] as const)('shows the current API as YAML and validates it (%s)', async (api) => {
		const { fixture, apis, element } = render(loadFixture(api));
		expect(editor.value).toBe(YAML.dump(apis.current));
		await vi.waitFor(() => { fixture.detectChanges(); expect(status(element)).toBe('validation passed'); });
	});

	it('shows the loaded text if the API could not be loaded', () => {
		const { fixture, apis, component } = render();
		apis.lastLoaded = 'a: [';
		apis.hasLoadingErrors = true;
		component.revert();
		fixture.detectChanges();
		expect(editor.value).toBe('a: [');
	});

	it.each([
		[ 'OAS2 to OAS3', 'petstoreOas2Yaml', 'minimalOas3Yaml', true ],
		[ 'OAS3 to OAS2', 'petstoreOas3Yaml', 'petstoreOas2Yaml', false ]
	] as const)('applies valid changes and updates the spec version (%s)', async (direction, from, to, isOas3) => {
		const { fixture, apis, component, element, validated } = render(loadFixture(from));
		await validated;
		const changed = vi.fn();
		apis.eventApiChanged.subscribe(changed);
		editor.type(fixtures[to]);
		fixture.detectChanges();
		expect(component.text).toBe(fixtures[to]);
		component.apply();
		await vi.waitFor(() => expect(component.applied).toBe(true));
		expect(apis.current).toEqual(loadFixture(to));
		expect(apis.isOas3).toBe(isOas3);
		expect(apis.isOas2).toBe(!isOas3);
		expect(changed).toHaveBeenCalled();
		// the text of the user is kept
		expect(component.text).toBe(fixtures[to]);
		fixture.detectChanges();
		expect(status(element)).toBe('changes applied');
	});

	it('does not apply invalid changes', async () => {
		const { fixture, apis, component, element, validated } = render();
		await validated;
		const before = YAML.dump(apis.current);
		// swagger-parser logs documents without info and paths as errors
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		editor.type('openapi: 3.0.3\n');
		component.apply();
		await vi.waitFor(() => expect(component.validationPassed).toBe(false));
		fixture.detectChanges();
		expect(status(element)).toBe('validation failed');
		expect(element.querySelector('.alert-danger')).toBeTruthy();
		expect(YAML.dump(apis.current)).toBe(before);
	});

	it('shows only the result of the latest validation', async () => {
		const { fixture, apis, component, element, validated } = render();
		await validated;
		let resolveFirst: (api: any) => void;
		vi.spyOn(apis, 'validateStr')
			.mockReturnValueOnce(new Promise(resolve => resolveFirst = resolve))
			.mockReturnValueOnce(Promise.reject('invalid'));
		component.validate();
		component.apply();
		await vi.waitFor(() => expect(component.validationPassed).toBe(false));
		resolveFirst(apis.current);
		await new Promise(resolve => setTimeout(resolve));
		expect(component.validationPassed).toBe(false);
		fixture.detectChanges();
		expect(status(element)).toBe('validation failed');
	});

	it('keeps the changes of the user when the validation of the loaded API is done', async () => {
		const { component, validated } = render();
		editor.type('changed');
		await validated;
		expect(component.text).toBe('changed');
	});

	it('shows another API when it is loaded, even if the text has been changed', () => {
		const { apis, component } = render();
		editor.type('changed');
		apis.newFile();
		expect(component.text).toBe(YAML.dump(apis.current));
	});

	it('reverts to the current API', () => {
		const { apis, component } = render();
		editor.type('changed');
		component.revert();
		expect(component.text).toBe(YAML.dump(apis.current));
	});

	it('hides the apply button in read-only mode', () => {
		const { fixture, apis, element } = render();
		apis.config.readOnly = true as any;
		fixture.detectChanges();
		expect(Array.from(element.querySelectorAll('button')).map(b => b.textContent)).toEqual(['Validate', 'Revert']);
	});

	it('stops listening to API changes when destroyed', () => {
		const { fixture, apis, component } = render();
		const revert = vi.spyOn(component, 'revert');
		fixture.destroy();
		apis.newFile();
		expect(revert).not.toHaveBeenCalled();
		expect(editor.destroy).toHaveBeenCalled();
	});
});
