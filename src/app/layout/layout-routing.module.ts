import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
	{
		path: '', component: LayoutComponent,
		children: [
			{ path: 'source', loadChildren: () => import('./source/source.module').then(m => m.SourceModule) },
			{ path: 'swadoc', loadChildren: () => import('./swadoc/swadoc.module').then(m => m.SwadocModule) },
			{ path: 'swaggerui', loadChildren: () => import('./swaggerui/swaggerui.module').then(m => m.SwaggerUiModule) },
			
			{ path: 'api-info', loadChildren: () => import('./api-info/api-info.module').then(m => m.ApiInfoModule) },
			{ path: 'definitions', loadChildren: () => import('./definitions/definitions.module').then(m => m.DefinitionsModule) },
			{ path: 'paths', loadChildren: () => import('./paths/paths.module').then(m => m.PathsModule) },
			// path name (and optional method) are passed as query parameters (/path?name=%2Fpet&method=get),
			// because some web servers reject or decode %2F in the URL path
			{ path: 'path', loadChildren: () => import('./path/path.module').then(m => m.PathModule) },
		]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class LayoutRoutingModule { }
