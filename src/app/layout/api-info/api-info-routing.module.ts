import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApiInfoComponent } from './api-info.component';

const routes: Routes = [
    { path: '', component: ApiInfoComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ApiInfoRoutingModule { }
