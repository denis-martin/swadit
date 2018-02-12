import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SwaggerUiComponent } from './swaggerui.component';

const routes: Routes = [
    { path: '', component: SwaggerUiComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SwaggerUiRoutingModule { }
