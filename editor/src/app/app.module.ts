import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { RouterModule } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../environments/environment';

import {
  ClassParamsPipe,
  KeywordParamsPipe,
  OpcodePipe,
  GameTitlePipe,
  ParametrifyPipe,
  InputParamsPipe,
  OutputParamsPipe,
  SingleParamPipe,
  HlPropPipe,
} from './pipes';

// extensions state
import { extensionsReducer } from './state/extensions/reducer';
import { ExtensionsEffects } from './state/extensions/effects';

// snippets state
import { snippetsReducer } from './state/snippets/reducer';
import { SnippetsEffects } from './state/snippets/effects';

// auth state
import { authReducer } from './state/auth/reducer';
import { AuthEffects } from './state/auth/effects';

// changes state
import { changesReducer } from './state/changes/reducer';
import { ChangesEffects } from './state/changes/effects';

// ui state
import { uiReducer } from './state/ui/reducer';
import { UiEffects } from './state/ui/effects';

// game state
import { gameReducer } from './state/game/reducer';

// enums state
import { EnumsEffects } from './state/enums/effects';
import { enumsReducer } from './state/enums/reducer';

// classes state
import { ClassesEffects } from './state/classes/effects';
import { classesReducer } from './state/classes/reducer';

import { ConfigModule } from './config';
import { AuthGuard, RouteGuard } from './route.guard';
import { AppComponent } from './app.component';

import {
  IconComponent,
  ModalComponent,
  PaginationComponent,
  SelectorComponent,
} from './components/common';

import {
  CommandEditorComponent,
  CommandInfoComponent,
  CommandListComponent,
  CommandGamesComponent,
} from './components/commands';

import {
  FooterComponent,
  HeaderComponent,
  DownloadPanelComponent,
  FilterPanelComponent,
} from './components/layout';

import {
  EnumOverviewComponent,
  EnumEditorComponent,
  EnumGamesComponent,
  EnumListComponent,
} from './components/enums';

import {
  ClassOverviewComponent,
  ClassListComponent,
  ClassEditorComponent,
} from './components/classes';

import { HomePageComponent } from './components/home-page/home-page.component';
import { LibraryPageComponent } from './components/library-page/library-page.component';
import { KNOWN_LANGUAGES } from './models';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

export function loadTranslations(
  translate: TranslateService,
  cookies: CookieService
) {
  return () => {
    const lang = cookies.get('sblang');
    const knownLang = KNOWN_LANGUAGES.includes(lang) ? lang : 'en';
    return translate.use(knownLang).toPromise();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    CommandListComponent,
    ClassParamsPipe,
    KeywordParamsPipe,
    OpcodePipe,
    GameTitlePipe,
    ParametrifyPipe,
    InputParamsPipe,
    OutputParamsPipe,
    SingleParamPipe,
    HlPropPipe,
    CommandEditorComponent,
    HeaderComponent,
    CommandInfoComponent,
    HomePageComponent,
    FooterComponent,
    SelectorComponent,
    DownloadPanelComponent,
    FilterPanelComponent,
    LibraryPageComponent,
    ModalComponent,
    IconComponent,
    CommandGamesComponent,
    PaginationComponent,
    ClassOverviewComponent,
    EnumOverviewComponent,
    EnumEditorComponent,
    EnumGamesComponent,
    EnumListComponent,
    ClassListComponent,
    ClassEditorComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ConfigModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    RouterModule.forRoot(
      [
        {
          path: '',
          canActivate: [AuthGuard],
          children: [
            {
              path: '',
              pathMatch: 'full',
              component: HomePageComponent,
            },
            {
              path: '**',
              canActivate: [RouteGuard],
              component: LibraryPageComponent,
              runGuardsAndResolvers: 'always',
            },
          ],
        },
      ],
      { useHash: false, onSameUrlNavigation: 'reload' }
    ),
    StoreModule.forRoot({
      auth: authReducer,
      changes: changesReducer,
      enums: enumsReducer,
      extensions: extensionsReducer,
      game: gameReducer,
      snippets: snippetsReducer,
      ui: uiReducer,
      classes: classesReducer,
    }),
    EffectsModule.forRoot([
      AuthEffects,
      ChangesEffects,
      EnumsEffects,
      ExtensionsEffects,
      SnippetsEffects,
      UiEffects,
      ClassesEffects,
    ]),
    DragDropModule,

    environment.production
      ? []
      : StoreDevtoolsModule.instrument({
          maxAge: 50,
          logOnly: false,
        }),
  ],
  exports: [],
  providers: [
    CookieService,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: loadTranslations,
      deps: [TranslateService, CookieService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
