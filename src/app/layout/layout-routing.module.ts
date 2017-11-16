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
            { path: 'paths', loadChildren: './paths/paths.module#PathsModule' },
            { path: 'path/:path', loadChildren: './path/path.module#PathModule' },
            { path: 'path/:path/:method', loadChildren: './path/path.module#PathModule' },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LayoutRoutingModule { }
