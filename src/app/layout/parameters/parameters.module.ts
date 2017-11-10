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
