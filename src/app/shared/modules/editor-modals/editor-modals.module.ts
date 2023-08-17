import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SchemaEditorModule } from '../../modules/schema-editor/schema-editor.module';

import { DefinitionEditComponent } from './definition-edit/definition-edit.component';
import { ParameterEditComponent } from './parameter-edit/parameter-edit.component';
import { ResponseEditComponent } from './response-edit/response-edit.component';
import { PathEditComponent } from './path-edit/path-edit.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { ModifyComponent } from './modify/modify.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgbModule,
        SchemaEditorModule
    ],
    declarations: [
        DefinitionEditComponent,
        ParameterEditComponent,
        ResponseEditComponent,
        PathEditComponent,
        ConfirmComponent,
        ModifyComponent
    ],
    exports: [
        DefinitionEditComponent,
        ParameterEditComponent,
        ResponseEditComponent,
        PathEditComponent,
        ConfirmComponent,
        ModifyComponent
    ]
})
export class EditorModalsModule { }
