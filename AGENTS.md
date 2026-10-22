# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

**Swadit** is a visual editor for Swagger 2.0 / OpenAPI 3.0 files. It runs entirely in the browser (no backend); API definitions never leave the client. It is an Angular 22 single-page app (NgModule-based, zone.js change detection), originally scaffolded from the SB-Admin-BS4-Angular-4 template (the Angular project in `angular.json` is still named `sb-admin-angular4-bootstrap4`).

License: GPLv3. New source files carry the GPL header used in existing files (see `src/app/shared/services/apis.service.ts`).

## Commands

```sh
npm install                 # install dependencies (Node ^22.22.3 || ^24.15.0)
npm start                   # dev server on http://localhost:4201
npm run build               # production build into dist/ (dist/ is gitignored)
npm run lint                # eslint (flat config: eslint.config.mjs)
npm test                    # NOTE: this only runs `ng build`, not unit tests
npx ng test --watch=false   # Vitest unit tests (jsdom)
npm run e2e                 # Playwright smoke test (starts the dev server)
```

- Use `npm run build` as the main check that a change compiles. It currently succeeds with no warnings.
- `npm run lint` currently reports 0 errors and a few dozen warnings. Don't add errors; you don't need to fix existing warnings unless asked.
- Most `*.spec.ts` files are template stubs left over from scaffolding, so unit tests give little coverage. Many of them fail because they don't provide `ApisService` / `NgbActiveModal`.
- The production build uses the esbuild-based `@angular/build:application` builder. Node built-ins aren't polyfilled automatically. `util`, `process` and `buffer` are explicit dependencies for swagger-parser (see `src/polyfills.ts`).
- The print preview at `src/assets/swadoc/` is a separate package with its own `package.json`. Only run `npm install` inside it if you're working on swadoc.

## Architecture

```
src/app/
  app-routing.module.ts      root routes; everything lazy-loads LayoutModule
  layout/                    main UI shell + feature pages (each a lazy module)
    api-info/                API info view/edit
    paths/, path/            path list and single path/method editor
    definitions/             definitions (OAS2) / components (OAS3)
    source/                  raw YAML editor (Ace) with validation
    swaggerui/               embedded Swagger UI preview
    swadoc/                  print preview (wraps src/assets/swadoc)
    print/                   older print view (route disabled)
  shared/
    services/apis.service.ts central state + logic (see below)
    services/oas2to3.ts      Swagger 2.0 → OpenAPI 3.0 conversion
    schemas/                 JSON schemas for OAS 2.0 (split per object), OAS 3.0, draft-04
    modules/schema-editor/   generic JSON-schema-driven form editor (+ custom/ editors)
    modules/schema-view/     generic schema-driven read-only views
    modules/editor-modals/   modal dialogs (path/parameter/response/definition edit, confirm, ...)
    components/              header, sidebar, file-modal
  login/, signup/            template leftovers; AuthGuard is disabled in routing
```

### `ApisService` is the core

`src/app/shared/services/apis.service.ts` (~1200 lines) holds nearly all application state and logic:

- `current`: the loaded API document (a plain JS object, edited in place by components).
- `specVersion`, `isOas2`, `isOas3`: version flags. Many features are gated on these. Visual editing is complete for OAS 2.0 and partial for OAS 3.0 (some UI, such as "add", is OAS2-only).
- `schemas`: returns the JSON schema set for the current spec version. The editors are driven by these schemas.
- File I/O: `openFile`, `addFile` / `mergeSwagger`, `newFile`, `downloadFileModal`. Parsing and validation use `@apidevtools/swagger-parser` with file/http `$ref` resolution **disabled**. YAML goes through `js-yaml`.
- Helpers: `resolveRef`, `resolveObj`, `getComponents`, `getParameters`, `generateExample`, `validate`, and others.
- `eventApiChanged`: an observable that fires when a new API is loaded. Components subscribe to it to refresh.

When you add a feature, check first whether a helper for it already exists here. Handle both OAS2 and OAS3 shapes, for example `definitions` vs `components.schemas` and `securityDefinitions` vs `components.securitySchemes`. Use `getComponents` / `getDefCategories` rather than hardcoding paths.

### Runtime configuration

On startup the service loads `src/assets/petstore.yaml` as the default API. It then optionally loads `assets/config.yaml`, which is not committed. `src/assets/config-example.yaml` shows the format: title, menu items to hide, a catalog of preloaded APIs, and `readOnly`. The available keys are defined by the `SwaditConfig` class in `apis.service.ts`.

### i18n

`@ngx-translate`, with translations in `src/assets/i18n/*.json`. These are mostly template leftovers. Only the sidebar uses the `translate` pipe; the rest of the UI text is hardcoded English.

## Code style

- TypeScript with **tabs** for indentation in app code, even though `.editorconfig` says 4 spaces. Match the file you're editing.
- Brace style is mixed. Method braces often go on their own line (Allman style), while class braces sometimes stay on the same line. Follow the surrounding code.
- `any` is used freely (the lint rule is disabled) because API documents are handled as untyped objects.
- Use `lodash-es` with aliased imports (`cloneDeep as _cloneDeep`).
- Imports resolve from `src/` as `baseUrl`, so `app/shared/...` absolute imports work.
- Use NgModules, not standalone components. Each feature has a `*.module.ts` and a `*-routing.module.ts`, plus a lazy route in `layout/layout-routing.module.ts`.
- Styling: Bootstrap 5, ng-bootstrap, Font Awesome Free 7 (with v4 shims, so `fa fa-*` classes keep working), and SCSS in `src/styles/` using `@use` (not `@import`).

## Gotchas

- Global scripts (Ace, Prism, Swagger UI bundle) come in through `angular.json` `scripts`, not imports, and are referenced via `declare const ...`. Add new ones there as well.
- The Ace editor is wrapped by the local `shared/modules/ace-editor` component (`<ace>`); there is no third-party Angular wrapper.
- Templates use the built-in control flow (`@if`, `@for`). Components declare `standalone: false` and `ChangeDetectionStrategy.Eager` explicitly; keep that for new NgModule-declared components.
- TypeScript 6 runs with `strict: false` (set explicitly in `tsconfig.json`), and templates are compiled with `strictTemplates: false`.
- i18n uses `provideTranslateService()` / `TranslatePipe` (ngx-translate 18). There is no `TranslateModule`.
- Animations use native `animate.enter` / `animate.leave` with CSS classes (in `src/styles/app.scss`), not `@angular/animations`.
- `package.json` `overrides` pins `vite` to a patched version, because `@angular/build` pins a vulnerable one. Drop it once `@angular/build` ships a fixed vite.
- `marked-katex-extension` is listed in `externalDependencies` in `angular.json`. ngx-markdown lazily imports this optional add-on, and without that entry the dev server fails to resolve it. Install it and remove the entry only if math rendering (`katex`) is ever needed.
- `src/assets/swadoc/` is a separate legacy AngularJS 1.x / bower app that wasn't part of the Angular upgrade.
- `dist/` and `.angular/cache` are build outputs. Don't edit or commit them.
- `master` is the main branch.
