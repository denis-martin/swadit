/*	
 * Copyright 2026 Denis Martin.  This file is part of swadit.
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

import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { provideMarkdown } from 'ngx-markdown';
import { firstValueFrom, skip } from 'rxjs';
import * as YAML from 'js-yaml';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import { ApisService } from 'app/shared/services/apis.service';

import petstoreYaml from '../assets/petstore.yaml' with { loader: 'text' };
import minimalOas3Yaml from './fixtures/minimal-oas3.yaml' with { loader: 'text' };
import featuresOas2Yaml from './fixtures/features-oas2.yaml' with { loader: 'text' };

export const fixtures = {
	/** the default API shown on startup (Swagger 2.0) */
	petstoreYaml: petstoreYaml,
	minimalOas3Yaml: minimalOas3Yaml,
	/** Swagger 2.0 API using many features (for conversion tests) */
	featuresOas2Yaml: featuresOas2Yaml
};

/** Returns a fresh (deep-copied) parsed fixture. */
export function loadFixture(name: keyof typeof fixtures): any
{
	return _cloneDeep(YAML.load(fixtures[name]));
}

/**
 * Providers needed to instantiate ApisService (and most components that inject it)
 * without a backend. HTTP requests are captured by HttpTestingController.
 */
export function provideApisServiceTesting(): Array<Provider | EnvironmentProviders>
{
	return [
		ApisService,
		provideHttpClient(),
		provideHttpClientTesting(),
		provideRouter([]),
		provideTranslateService(),
		provideMarkdown()
	];
}

/** Provides an NgbActiveModal whose close/dismiss methods are spies (for testing modal components). */
export function provideActiveModalMock(): Provider
{
	return { provide: NgbActiveModal, useValue: { close: vi.fn(), dismiss: vi.fn() } };
}

/**
 * Answers the requests ApisService sends on construction (default API and optional config).
 * By default both are answered with 404, which leaves the initial (empty) API in place.
 */
export function flushStartupRequests(options: { petstore?: string, config?: string } = {}): void
{
	const http = TestBed.inject(HttpTestingController);
	const respond = (url: string, body: string) => {
		for (const req of http.match(url)) {
			if (body != null) {
				req.flush(body);
			} else {
				req.flush('', { status: 404, statusText: 'Not Found' });
			}
		}
	};
	respond('assets/petstore.yaml', options.petstore);
	respond('assets/config.yaml', options.config);
}

/** Creates the ApisService with startup requests answered with 404 and navigation stubbed. */
export function createApisService(): ApisService
{
	const apis = TestBed.inject(ApisService);
	flushStartupRequests();
	vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
	return apis;
}

/**
 * Sets the given API document as the current API (as if it had been loaded from a file).
 * The returned promise resolves once the (asynchronous) validation of the API is done.
 */
export function setCurrentApi(apis: ApisService, api: any, fileName: string = null): Promise<string>
{
	// swaggerLoaded() notifies once immediately and once after validation
	const validated = firstValueFrom(apis.eventApiChanged.pipe(skip(1)));
	apis.swaggerLoaded(_cloneDeep(api), fileName);
	return validated;
}

export interface RenderOptions<T>
{
	/** NgModules to import (usually the module declaring the component) */
	imports?: Array<any>;
	/** components to declare (if they are not declared by an imported module) */
	declarations?: Array<any>;
	providers?: Array<Provider | EnvironmentProviders>;
	/** API document to load before the component is created (default: petstore) */
	api?: any;
	/** properties/inputs to set before the first change detection */
	props?: Partial<T>;
	/** whether to run the first change detection (default: true) */
	detectChanges?: boolean;
}

/** Configures the testing module, loads an API and creates the given component. */
export function renderComponent<T>(type: Type<T>, options: RenderOptions<T> = {}): 
	{ fixture: ComponentFixture<T>, component: T, apis: ApisService, element: HTMLElement, validated: Promise<string> }
{
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
	TestBed.configureTestingModule({
		imports: options.imports || [],
		declarations: options.declarations || [],
		providers: [ ...provideApisServiceTesting(), provideActiveModalMock(), ...(options.providers || []) ]
	});
	const apis = createApisService();
	const validated = setCurrentApi(apis, options.api !== undefined ? options.api : loadFixture('petstoreYaml'));
	const fixture = TestBed.createComponent(type);
	Object.assign(fixture.componentInstance, options.props || {});
	if (options.detectChanges !== false) {
		fixture.detectChanges();
	}
	return { fixture, component: fixture.componentInstance, apis, element: fixture.nativeElement, validated };
}
