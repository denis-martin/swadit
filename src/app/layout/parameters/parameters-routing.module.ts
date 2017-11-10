import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ParametersComponent } from './parameters.component';

const routes: Routes = [
    { path: '', component: ParametersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ParametersRoutingModule { }
