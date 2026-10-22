import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './shared';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MarkdownModule } from 'ngx-markdown';

import { ApisService } from './shared';
import { FileModalComponent } from './shared/components/file-modal/file-modal.component';
import { EditorModalsModule } from './shared/modules/editor-modals/editor-modals.module';

@NgModule({
    declarations: [
        AppComponent,
        FileModalComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        NgbModule,
        MarkdownModule.forRoot(),
        EditorModalsModule
    ],
    providers: [
        AuthGuard,
        ApisService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideTranslateService({
            loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
            fallbackLang: 'en'
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
