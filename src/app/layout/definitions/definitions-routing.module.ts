import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefinitionsComponent } from './definitions.component';

const routes: Routes = [
    { path: '', component: DefinitionsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DefinitionsRoutingModule { }
