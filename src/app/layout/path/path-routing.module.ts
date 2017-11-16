import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PathComponent } from './path.component';

const routes: Routes = [
    { path: '', component: PathComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PathRoutingModule { }
