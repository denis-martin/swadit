import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './shared';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ApisService } from './shared';
import { FileModalComponent } from './shared/components/file-modal/file-modal.component';
import { EditorModalsModule } from './shared/modules/editor-modals/editor-modals.module';

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}
@NgModule({
    declarations: [
        AppComponent,
        FileModalComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        NgbModule,
        EditorModalsModule
    ],
    providers: [AuthGuard, ApisService],
    bootstrap: [AppComponent],
	entryComponents: [FileModalComponent]
})
export class AppModule {
}
