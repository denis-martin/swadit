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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'ngx-markdown';

import { SchemaViewComponent, LetDirective } from './schema-view.component';
import { SwaggerSchemaViewComponent } from './custom/swagger-schema-view.component';
import { ResponseViewComponent } from './custom/response-view.component';
import { ParameterViewComponent } from './custom/parameter-view.component';
import { ExtensionsViewComponent } from './custom/extensions-view.component';

@NgModule({
	imports: [
		CommonModule,
		NgbModule,
		MarkdownModule.forChild()
	],
	declarations: [
		SchemaViewComponent,
		LetDirective,
		SwaggerSchemaViewComponent,
		ResponseViewComponent,
		ParameterViewComponent,
		ExtensionsViewComponent
	],
	exports: [
		SchemaViewComponent,
		LetDirective,
		SwaggerSchemaViewComponent,
		ResponseViewComponent,
		ParameterViewComponent,
		ExtensionsViewComponent
	]
})
export class SchemaViewModule { }
