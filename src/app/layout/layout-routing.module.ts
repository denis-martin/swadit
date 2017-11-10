import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            { path: 'api-info', loadChildren: './api-info/api-info.module#ApiInfoModule' },
            { path: 'definitions', loadChildren: './definitions/definitions.module#DefinitionsModule' },
            { path: 'parameters', loadChildren: './parameters/parameters.module#ParametersModule' },
            { path: 'responses', loadChildren: './responses/responses.module#ResponsesModule' },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LayoutRoutingModule { }
