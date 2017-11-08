import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SchemaEditorComponent } from './schema-editor.component';
import { PrimitiveEditorComponent } from './primitive-editor.component';
import { ObjectEditorComponent } from './object-editor.component';
import { ArrayEditorComponent } from './array-editor.component';
import { SecurityEditorComponent } from './custom/security-editor.component';
import { SwaggerSchemaEditorComponent } from './custom/swagger-schema-editor.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule
	],
	declarations: [
		SchemaEditorComponent,
		PrimitiveEditorComponent,
		ObjectEditorComponent,
		ArrayEditorComponent,
		SecurityEditorComponent,
		SwaggerSchemaEditorComponent
	],
	exports: [
		SchemaEditorComponent,
		PrimitiveEditorComponent,
		ObjectEditorComponent,
		ArrayEditorComponent,
		SecurityEditorComponent,
		SwaggerSchemaEditorComponent
	]
})
export class SchemaEditorModule { }
