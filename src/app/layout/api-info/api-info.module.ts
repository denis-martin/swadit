import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'angular2-markdown';
import { HighlightModule } from 'ngx-highlightjs';

import { ExtensionsViewComponent } from '../../shared/components/extensions-view/extensions-view.component';

import { SchemaEditorModule } from '../../shared/modules/schema-editor/schema-editor.module';

import { ApiInfoRoutingModule } from './api-info-routing.module';
import { ApiInfoComponent } from './api-info.component';
import { ApiInfoEditComponent } from './api-info-edit/api-info-edit.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule.forRoot(),
		MarkdownModule.forRoot(),
		HighlightModule.forRoot(),
		SchemaEditorModule,
		ApiInfoRoutingModule,
	],
	declarations: [
		ExtensionsViewComponent,
		ApiInfoComponent, 
		ApiInfoEditComponent
	],
	entryComponents: [ApiInfoEditComponent]
})
export class ApiInfoModule { }