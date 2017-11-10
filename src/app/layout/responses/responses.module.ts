import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'angular2-markdown';
import { HighlightModule } from 'ngx-highlightjs';

import { SchemaViewModule } from '../../shared/modules/schema-view/schema-view.module';
import { SchemaEditorModule } from '../../shared/modules/schema-editor/schema-editor.module';

import { ResponsesRoutingModule } from './responses-routing.module';
import { ResponsesComponent } from './responses.component';
import { ResponseEditComponent } from './response-edit/response-edit.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule,
		MarkdownModule.forRoot(),
		HighlightModule.forRoot(),
		SchemaViewModule,
		SchemaEditorModule,
		ResponsesRoutingModule
	],
	declarations: [
		ResponsesComponent,
		ResponseEditComponent
	],
	entryComponents: [ResponseEditComponent]
})
export class ResponsesModule { }
