import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FormsModule } from '@angular/forms';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
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
import { localStorageSync } from 'ngrx-store-localstorage';

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
  SanitizePipe,
  LinkifyPipe,
  PropExtractPipe,
  OpcodeParamsPipe,
  FilterMethodsPipe,
  StripPunctuationPipe,
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

// tree state
import { treeReducer } from './state/tree/reducer';
import { TreeEffects } from './state/tree/effects';

import { ConfigModule } from './config';
import { AuthGuard, RouteGuard } from './route.guard';
import { AppComponent } from './app.component';

import {
  IconComponent,
  ModalComponent,
  PaginationComponent,
  SelectorComponent,
  IconButtonComponent,
  CopyButtonComponent,
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
} from './components/classes';

import { HomePageComponent } from './components/home-page/home-page.component';
import { LibraryPageComponent } from './components/library-page/library-page.component';
import { KNOWN_LANGUAGES } from './models';
import { DecisionTreeComponent } from './components/decision-tree/decision-tree.component';

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

export function localStorageSyncReducer(
  reducer: ActionReducer<any>
): ActionReducer<any> {
  return localStorageSync({
    keys: [
      {
        ui: [
          'isSearchHelpDismissed',
          'displayOpcodePresentation',
          'displayInlineMethodDescription',
          'isSidebarCollapsed',
        ],
      },
    ],
    rehydrate: true,
  })(reducer);
}
const metaReducers: Array<MetaReducer<any, any>> = [localStorageSyncReducer];

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
    SanitizePipe,
    LinkifyPipe,
    PropExtractPipe,
    OpcodeParamsPipe,
    FilterMethodsPipe,
    StripPunctuationPipe,
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
    IconButtonComponent,
    CopyButtonComponent,
    DecisionTreeComponent,
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
    StoreModule.forRoot(
      {
        auth: authReducer,
        changes: changesReducer,
        enums: enumsReducer,
        extensions: extensionsReducer,
        game: gameReducer,
        snippets: snippetsReducer,
        ui: uiReducer,
        tree: treeReducer,
      },
      { metaReducers }
    ),
    EffectsModule.forRoot([
      AuthEffects,
      ChangesEffects,
      EnumsEffects,
      ExtensionsEffects,
      SnippetsEffects,
      UiEffects,
      TreeEffects,
    ]),
    DragDropModule,
    ClipboardModule,
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
