import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SwadocComponent } from './swadoc.component';

const routes: Routes = [
    { path: '', component: SwadocComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SwadocRoutingModule { }
