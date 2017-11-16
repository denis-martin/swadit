import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PathsComponent } from './paths.component';

const routes: Routes = [
    { path: '', component: PathsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PathsRoutingModule { }
