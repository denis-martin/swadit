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
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'angular2-markdown';
import { HighlightModule } from 'ngx-highlightjs';

import { SchemaViewModule } from '../../shared/modules/schema-view/schema-view.module';
import { SchemaEditorModule } from '../../shared/modules/schema-editor/schema-editor.module';

import { ParametersRoutingModule } from './parameters-routing.module';
import { ParametersComponent } from './parameters.component';
import { ParameterEditComponent } from './parameter-edit/parameter-edit.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule,
		MarkdownModule.forRoot(),
		HighlightModule.forRoot(),
		SchemaViewModule,
		SchemaEditorModule,
		ParametersRoutingModule
	],
	declarations: [
		ParametersComponent,
		ParameterEditComponent
	],
	entryComponents: [ParameterEditComponent]
})
export class ParametersModule { }
