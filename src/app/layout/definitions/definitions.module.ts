import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'angular2-markdown';
import { HighlightModule } from 'ngx-highlightjs';

import { DefinitionsRoutingModule } from './definitions-routing.module';
import { DefinitionsComponent } from './definitions.component';
import { SwaggerSchemaViewComponent } from './../../shared/components/swagger-schema-view/swagger-schema-view.component';
import { DefinitionEditComponent } from './definition-edit/definition-edit.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule,
		MarkdownModule.forRoot(),
		HighlightModule.forRoot(),
		DefinitionsRoutingModule
	],
	declarations: [
		DefinitionsComponent, 
		SwaggerSchemaViewComponent, 
		DefinitionEditComponent],
	entryComponents: [DefinitionEditComponent]
})
export class DefinitionsModule { }
