/*	
 * Copyright 2018 Denis Martin.  This file is part of swadit.
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

import { MarkdownModule } from 'ngx-markdown';

import { SchemaViewModule } from '../../shared/modules/schema-view/schema-view.module';
import { SchemaEditorModule } from '../../shared/modules/schema-editor/schema-editor.module';

import { PrintRoutingModule } from './print-routing.module';
import { PrintComponent } from './print.component';
import { SchemaPrintViewComponent } from './schema-print-view/schema-print-view.component';

@NgModule({
  imports: [
    CommonModule,
    MarkdownModule.forChild(),
    SchemaViewModule,
		SchemaEditorModule,
    PrintRoutingModule
  ],
  declarations: [PrintComponent, SchemaPrintViewComponent]
})
export class PrintModule { }
