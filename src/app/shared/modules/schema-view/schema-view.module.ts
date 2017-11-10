import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'angular2-markdown';
import { HighlightModule } from 'ngx-highlightjs';

import { SwaggerSchemaViewComponent } from './custom/swagger-schema-view.component';
import { ExtensionsViewComponent } from './custom/extensions-view.component';

@NgModule({
	imports: [
		CommonModule,
		NgbModule,
		MarkdownModule.forRoot(),
		HighlightModule.forRoot()
	],
	declarations: [
		SwaggerSchemaViewComponent,
		ExtensionsViewComponent
	],
	exports: [
		SwaggerSchemaViewComponent,
		ExtensionsViewComponent
	]
})
export class SchemaViewModule { }
